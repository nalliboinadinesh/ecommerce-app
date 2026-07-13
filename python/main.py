import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent
from langchain.tools import tool
import requests
import os

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:4000")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "google_genai:gemini-flash-lite-latest")
THREAD_ID = "product_search_session"
SYSTEM_PROMPT = (
    "You are ShopAssist, a friendly ecommerce shopping assistant. "
    "Use the product_search tool when the user asks for product recommendations, product matches, or shopping help. "
    "If the user asks about products, return concise, useful results with the most relevant product names, prices, and product links. "
    "If the user asks for general information, answer clearly and politely without invoking the tool unnecessarily."
)

print("Using GEMINI_MODEL:", GEMINI_MODEL)
print("GOOGLE_API_KEY configured:", bool(GOOGLE_API_KEY))

checkpointer = InMemorySaver()
model = init_chat_model(
    GEMINI_MODEL,
    api_key=GOOGLE_API_KEY
)


def fetch_products():
    try:
        response = requests.get(f"{BACKEND_URL}/api/product/list", timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        return {"success": False, "message": str(exc)}


def tokenize(text: str) -> list[str]:
    if not text:
        return []
    return re.findall(r"\w+", text.lower())


def normalize_term(term: str) -> str:
    term = term.lower().strip()
    if term.endswith("s") and len(term) > 2:
        term = term[:-1]
    term = term.replace("tshirt", "shirt")
    term = term.replace("t-shirt", "shirt")
    term = term.replace("tops", "top")
    return term


def get_aliases(term: str) -> list[str]:
    aliases = {
        "shirt": ["shirt", "top", "t-shirt", "tshirt"],
        "top": ["top", "shirt", "t-shirt", "tshirt"],
        "tshirt": ["shirt", "top", "t-shirt", "tshirt"],
        "dress": ["dress"],
        "trouser": ["trouser", "pants", "jeans"],
        "jeans": ["jeans", "denim", "trouser", "pants"],
        "shoe": ["shoe", "shoes", "sneaker", "sneakers"],
        "sneaker": ["sneaker", "sneakers", "shoe", "shoes"],
    }
    return aliases.get(term, [term])


def score_product(product, query):
    raw_tokens = tokenize(query)
    query_terms = [normalize_term(token) for token in raw_tokens if token]
    if not query_terms:
        return 0

    score = 0
    fields = [
        ("name", 5),
        ("description", 3),
        ("category", 2),
        ("subCategory", 1),
    ]

    for field, weight in fields:
        value = product.get(field, "")
        if not isinstance(value, str):
            continue

        field_text = value.lower()
        matched_terms = set()
        for term in query_terms:
            for alias in get_aliases(term):
                if alias in field_text:
                    matched_terms.add(term)
                    break

        score += len(matched_terms) * weight

    return score


def _search_products(query: str) -> str:
    if not query or not query.strip():
        return "Please provide a search query to find matching products."

    normalized_query = query.lower().strip()
    if normalized_query in ["list all products", "show all products", "all products", "list products", "products"]:
        result = fetch_products()
        if not result.get("success"):
            return f"Unable to fetch products: {result.get('message', 'unknown error')}"

        products = result.get("products", [])
        if not products:
            return "No products are currently available."

        lines = ["All available products:"]
        for product in products[:20]:
            lines.append(f"- {product.get('name')} (${product.get('price')}) | /product/{product.get('_id')}")
        if len(products) > 20:
            lines.append(f"...and {len(products) - 20} more products.")
        return "\n".join(lines)

    result = fetch_products()
    if not result.get("success"):
        return f"Unable to fetch products: {result.get('message', 'unknown error')}"

    products = result.get("products", [])
    scored = []

    for product in products:
        score = score_product(product, query)
        if score > 0:
            scored.append({
                "score": score,
                "name": product.get("name"),
                "price": product.get("price"),
                "id": product.get("_id"),
                "url": f"/product/{product.get('_id')}",
                "image": product.get("image", [None])[0],
            })

    if not scored:
        return "No matching products were found for your query."

    scored.sort(key=lambda item: item["score"], reverse=True)
    top_results = scored[:5]
    lines = ["Top 5 matching products:"]

    for item in top_results:
        lines.append(
            f"- {item['name']} (${item['price']}) | {item['url']}"
        )

    return "\n".join(lines)


@tool(
    "product_search",
    return_direct=True,
    description=(
        "Search the product catalog and return the top 5 matching product names, prices, and app URLs. "
        "Use this tool when the user asks for product recommendations, shopping suggestions, or product matches."
    )
)
def product_search(query: str) -> str:
    return _search_products(query)

agent = create_agent(
    model=model,
    tools=[product_search],
    checkpointer=checkpointer
)

app = Flask(__name__)
CORS(app, expose_headers=["X-Tool-Used"])


@app.route("/chat", methods=["POST"])
def chat():
    payload = request.get_json(silent=True) or {}
    query = payload.get("query", "").strip()

    if not query:
        return jsonify({"success": False, "error": "Missing query field."}), 400

    if not GOOGLE_API_KEY:
        return jsonify({"success": False, "error": "GOOGLE_API_KEY is not configured."}), 500

    config = {"configurable": {"thread_id": THREAD_ID}}
    try:
        response = agent.invoke(
            {
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": query}
                ]
            },
            config=config
        )
        output = response["messages"][-1].content if response and response.get("messages") else str(response)
        return jsonify({"success": True, "query": query, "response": output})
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"success": True, "status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
