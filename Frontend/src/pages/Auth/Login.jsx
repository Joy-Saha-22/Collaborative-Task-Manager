import React, { useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from "../../context/userContext";
import { connectSocket } from '../../utils/socket';
import { disconnectSocket } from "../../utils/socket";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();
  // handle form submit
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter the password.");
      return;
    }
    setError("");
    //Login API Call
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email, password
      });
      const { token, role } = response.data;
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        connectSocket();
        // Ridirect based on role
         navigate(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again");
      }
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    disconnectSocket(); 
    navigate("/login");
  };
  return (

    <AuthLayout>
      <div className='lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center'>
        <h3 className='text-xl font-semibold text-black'>Welcome</h3>
        <p className='text-xs text-slate-700 mt-1.25 mb-6'>Please Enter your Credentials</p>
        <form onSubmit={handleLogin}>
          <Input value={email} onChange={({ target }) => setEmail(target.value)} label="Email Address" placeholder="joy@example.com" type="text" />
          <Input value={password} onChange={({ target }) => setPassword(target.value)} label="Password (Atleast 8 Characters)" placeholder=".........." type="password" />
          {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}
          <button type='submit' className='btn-primary'>LOGIN</button>
          <p className='text-[13px] text-slate-800 mt-3'>
            New User?{" "}
            <Link className="font-medium text-white underline" to="/signup">Register Now</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default Login;

