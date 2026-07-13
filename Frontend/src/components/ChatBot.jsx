import React, { useState, useRef, useEffect } from 'react'

const ChatBot = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi there! I am your shop assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const chatApiUrl = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:5000/chat'
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

  const [productThumbs, setProductThumbs] = useState({})
  const [modalProduct, setModalProduct] = useState(null)

  const parseProductItems = (text) => {
    // normalize markdown links [text](url) -> text | url
    let t = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 | $2')
    // normalize html anchors <a href="url">text</a>
    t = t.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 | $1')
    const lines = t.split('\n').map(l => l.trim()).filter(Boolean)
    let header = ''
    if (lines.length && /top|matching|available products?/i.test(lines[0])) {
      header = lines.shift()
    }

    const items = []
    let pending = null
    const urlRegex = /\/product\/[^)\s]+/i

    for (const line of lines) {
      // ignore lines that repeat the header or are generic prompts
      if (header && line === header) continue
      if (/specific item you would like to know|would you like more information|please let me know/i.test(line)) continue

      // if line contains a markdown-style 'text | url', split it
      if (line.includes(' | ')) {
        const parts = line.split(' | ').map(p => p.trim())
        const maybeUrl = parts.find(p => urlRegex.test(p))
        const textPart = parts.find(p => !urlRegex.test(p)) || parts[0]
        const url = maybeUrl || ''
        const priceMatch = textPart.match(/\$([0-9.,]+)/)
        const price = priceMatch ? priceMatch[1] : ''
        const name = price ? textPart.replace(/\$[0-9.,]+/, '').replace(/-\s*$/, '').trim() : textPart
        items.push({ name, price, url })
        pending = null
        continue
      }

      const urlMatch = line.match(urlRegex)
      if (urlMatch) {
        const url = urlMatch[0]
        if (pending) {
          pending.url = url
          items.push(pending)
          pending = null
        } else if (items.length) {
          items[items.length - 1].url = url
        } else {
          // standalone url line without a name; push with empty name
          items.push({ name: '', price: '', url })
        }
        continue
      }

      // clean markdown artifacts and view-product markers
      let clean = line.replace(/\*+/g, '').replace(/\(\[View Product\]\)/g, '').replace(/\[View Product\]/g, '').trim()

      // try to extract price
      const priceMatch = clean.match(/\$([0-9.,]+)/)
      const price = priceMatch ? priceMatch[1] : ''
      const name = price ? clean.replace(/\$[0-9.,]+/, '').replace(/-\s*$/, '').trim() : clean

      // avoid treating very short generic lines as items
      if (name.length < 4 && !price) continue

      pending = { name, price, url: '' }
    }

    if (pending) items.push(pending)
    return { header, items }
  }

  const suggestions = [
    'List all products',
    'Show shoes',
    'Show blue shirts'
  ]

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const normalizeBotText = (raw) => {
    if (raw == null) return ''
    if (typeof raw === 'string') return raw
    if (Array.isArray(raw)) {
      return raw.map(r => (r && typeof r === 'object' ? (r.text ?? JSON.stringify(r)) : String(r))).join('\n')
    }
    if (typeof raw === 'object') {
      if ('text' in raw && typeof raw.text === 'string') return raw.text
      if ('message' in raw && typeof raw.message === 'string') return raw.message
      if (raw.response) return normalizeBotText(raw.response)
      try { return JSON.stringify(raw) } catch (e) { return String(raw) }
    }
    return String(raw)
  }

  const sendMessage = async (text) => {
    const userMessage = { from: 'user', text }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: text })
      })

      const data = await response.json()
      const raw = data.success ? data.response : data.error || 'Something went wrong.'
      const botText = normalizeBotText(raw)
      setMessages((prev) => [...prev, { from: 'bot', text: botText }])
    } catch (error) {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Unable to reach chat server.' }])
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    setInput('')
    sendMessage(trimmed)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open ? (
        <div className="w-[320px] max-h-[50vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
            <span className="font-semibold">Chat with us</span>
            <button onClick={() => setOpen(false)} className="text-xl leading-none">×</button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto bg-slate-50 space-y-3">
            {messages.map((message, index) => {
              const isBot = message.from === 'bot'

                      // render product lists (returned by backend) as clickable links
                    if (isBot && typeof message.text === 'string' && message.text.includes('/product/')) {
                      const { header, items } = parseProductItems(message.text)

                // lazily fetch thumbnails for listed products
                items.forEach((it) => {
                  try {
                    const id = (it.url || '').split('/').pop()
                    if (id && !productThumbs[id]) {
                      fetch(`${backendUrl}/api/product/single?productId=${id}`)
                        .then((r) => r.json())
                        .then((json) => {
                          if (json && json.success && json.product && json.product.image && json.product.image[0]) {
                            setProductThumbs((prev) => ({ ...prev, [id]: json.product.image[0] }))
                          }
                        })
                        .catch(() => {})
                    }
                  } catch (e) {}
                })

                return (
                  <div key={index} className="max-w-[85%] rounded-2xl px-3 py-2 bg-slate-200 text-slate-900 self-start">
                    <div className="font-semibold mb-2">{header || message.text.split('\n')[0]}</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {items.map((it, i) => {
                        const id = (it.url || '').split('/').pop()
                        const thumb = id ? productThumbs[id] : null
                        return (
                          <li key={i} className="flex items-center gap-2">
                            {thumb ? <img src={thumb} alt={it.name} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-slate-100 rounded" />}
                            <div className="flex-1">
                              <a href={it.url || '#'} onClick={async (e) => {
                                e.preventDefault()
                                // fetch full product and open modal
                                const pid = (it.url || '').split('/').pop()
                                try {
                                  const r = await fetch(`${backendUrl}/api/product/single?productId=${pid}`)
                                  const json = await r.json()
                                  if (json && json.success && json.product) {
                                    setModalProduct(json.product)
                                  }
                                } catch (err) {
                                  console.error(err)
                                }
                              }} className="text-blue-600 underline">
                                {it.name}
                              </a>
                              {it.price ? <span className="ml-2 text-sm text-slate-600">(${it.price})</span> : null}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              }

              return (
                <div
                  key={index}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                    isBot
                      ? 'bg-slate-200 text-slate-900 self-start'
                      : 'bg-black text-white self-end'
                  }`}>
                  {typeof message.text === 'string' ? (
                    message.text
                  ) : Array.isArray(message.text) ? (
                    message.text.map((t, ii) => (
                      <div key={ii}>{typeof t === 'object' ? (t.text ?? JSON.stringify(t)) : String(t)}</div>
                    ))
                  ) : (message.text && message.text.text) ? (
                    message.text.text
                  ) : (
                    JSON.stringify(message.text)
                  )}
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => { setInput(s); sendMessage(s) }} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 min-w-[100px] text-center">
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 min-w-0 rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-black"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50 shrink-0"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
          {modalProduct ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" onClick={() => setModalProduct(null)} />
              <div className="relative w-[90%] max-w-md bg-white rounded-lg shadow-xl p-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{modalProduct.name}</h3>
                  <button onClick={() => setModalProduct(null)} className="text-xl">×</button>
                </div>
                <div className="mt-3">
                  {modalProduct.image && modalProduct.image[0] ? (
                    <img src={modalProduct.image[0]} alt={modalProduct.name} className="w-full h-48 object-cover rounded" />
                  ) : null}
                  <p className="mt-2 text-sm text-slate-700">{modalProduct.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-slate-900 font-medium">Price: ${modalProduct.price}</div>
                    <a href={`/product/${modalProduct._id}`} onClick={(e) => { e.preventDefault(); window.location.href = `/product/${modalProduct._id}` }} className="text-sm text-blue-600 underline">View product page</a>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-2xl"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
          <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
        </button>
      )}
    </div>
  )
}

export default ChatBot
