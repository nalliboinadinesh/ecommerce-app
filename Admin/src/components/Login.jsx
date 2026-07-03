import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Login = ({setToken}) => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    console.log(backendUrl + "/api/user/admin");

    try {
      const response = await axios.post(
        backendUrl + "/api/user/admin",
        
        {
          email,
          password,
        }
      );
      
      console.log(response);
      if (response.data.success) {
        setToken(response.data.token)
      }else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className="bg-white shadow-md rounded-lg px-8 py-6 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

        <form onSubmit={onSubmitHandler}>
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Password
            </p>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-2 bg-black text-white rounded-md cursor-pointer hover:bg-gray-800"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;