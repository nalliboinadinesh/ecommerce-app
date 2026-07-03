import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl, currency } from "../App";
import { assets } from "../assets/assets";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    if (!token) return;

    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        {
          headers: { token },
        }
      );

      if (response.data.success) {
        setOrders(response.data.orders);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const statusHandler = async(event,orderId)=>{
    try {

      const response = await axios.post(backendUrl+'/api/order/status',{orderId,status:event.target.value},{headers:{token}})
      if (response.data.success) {
        await fetchAllOrders()
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

  return (
    <div className="p-4">
      <h3 className="text-2xl font-semibold mb-4">Order Page</h3>

      <div>
        {orders.map((order) => (
          <div
            key={order._id}
            className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 border-gray-200 p-5 md:p-8 my-3 text-xs sm:text-sm text-gray-700"
          >
            {/* Parcel Icon */}
            <img
              className="w-12"
              src={assets.parcel_icon}
              alt="Parcel"
            />

            {/* Order Details */}
            <div>
              <div>
                {order.items.map((item, index) => (
                  <p key={index}>
                    {item.name} × {item.quantity}
                    <span className="text-gray-500"> ({item.size})</span>
                  </p>
                ))}
              </div>

              <p className="mt-3 mb-2 font-medium">
                {order.address.firstName} {order.address.lastName}
              </p>

              <div>
                <p>{order.address.street}</p>
                <p>
                  {order.address.city}, {order.address.state},{" "}
                  {order.address.country}, {order.address.zipcode}
                </p>
              </div>

              <p>{order.address.phone}</p>
            </div>

            {/* Order Info */}
            <div>
              <p className="text-small sm:text-[15px]">Items : {order.items.length}</p>
              <p className="mt-3">Method : {order.paymentMethod}</p>
              <p>Payment : {order.payment ? "Done" : "Pending"}</p>
              <p>
                Date :{" "}
                {new Date(order.date).toLocaleDateString("en-IN")}
              </p>
            </div>

            {/* Amount */}
            <div>
              <p className="text-sm sm:text-[15px]">
                {currency}
                {order.amount}
              </p>
            </div>

            {/* Order Status */}
            <div>
              <select
              onChange={(event)=>statusHandler(event,order._id)}
                defaultValue={order.status}
                className="p-2 font-semibold border rounded"
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">
                  Out for Delivery
                </option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;