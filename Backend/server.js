import express from "express"
import cors from 'cors'
import "dotenv/config" 
import connectionDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoutes.js";
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

connectionDB()
connectCloudinary().catch((error) => {
    console.error("Cloudinary initialization failed:", error.message);
});

app.use(express.json())
app.use(cors())

app.use('/api/user',userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter)

app.get('/',(request,response)=>{
    response.send("API IS WORKING");
})

app.listen(port,()=>{
    console.log("server is runnin in the PORT: "+ port);
})