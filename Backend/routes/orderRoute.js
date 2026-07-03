import express from 'express'
import {placeOrder, placeOrderStripe,placeOrderRazorpay,allOrders,userOrders,updateStatus} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authuser from '../middleware/auth.js'

const orderRouter = express.Router();

//adminRoutes
orderRouter.post('/list',adminAuth, allOrders);
orderRouter.post('/status',adminAuth, updateStatus);

//userRoutes
orderRouter.post('/place',authuser, placeOrder);
orderRouter.post('/stripe',authuser, placeOrderStripe);
orderRouter.post('/razorpay',authuser, placeOrderRazorpay);

orderRouter.post('/userorders', authuser, userOrders);

export default orderRouter

