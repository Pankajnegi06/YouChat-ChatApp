import React, { useState } from "react";
import Background from "@/assets/login2.png";
import Victory from "@/assets/victory.svg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/store/userSlice";
import { setUserInfo } from "@/store/userSlice.js";
import { API_ENDPOINTS } from "@/lib/apiConfig";

function Auth() {
 
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  };

  const validateSignup = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!isValidEmail(email)) {
      toast.error("Invalid email. Use a valid Gmail address.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    if (isStrongPassword(password)) {
      toast.error("Password must be at least 8 characters, include an uppercase letter, lowercase letter, a number, and a special character.");
      return false;
    }
    if (!confirmPassword.length) {
      toast.error("Confirmation Password is required");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("Confirmation Password should be same as password");
      return false;
    }
    return true;
  };

  const validateLogin = () => {
    if (!email.length) {
      toast.error("Email is required");
      return false;
    }
    if (!isValidEmail(email)) {
      toast.error("Invalid email. Use a valid Gmail address.");
      return false;
    }
    if (!password.length) {
      toast.error("Password is required");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (validateLogin()) {
      console.log(API_ENDPOINTS.user.login,email,password)
      const response = await axios.post(API_ENDPOINTS.user.login, {email,password}, {withCredentials:true})
      console.log(response)
      dispatch(setUserInfo(response.data.user))
      if(response.data.user.profileSetup) navigate("/chat")
      else navigate("/profile")
    }
  };

  const handleSignup = async () => {
    if (validateSignup()) {
      const response = await axios.post(API_ENDPOINTS.user.signup, {email,password}, {withCredentials:true})
     
      if(response.status == 200) {
        
        dispatch(setUserInfo(response.data.newUser))
        navigate("/profile")
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-[100vh] w-[100vw]">
      <div className="border-2 rounded-3xl shadow-2xl h-[80vh] bg-white text-opacity-90 w-[80vw] border-white md:w-[90w] lg:w-[70vw] xl:w-[60vw] xl:grid-cols-2">
        <div className="flex justify-center items-center flex-col h-[100%]">
          <div className="flex justify-center items-center">
            <h1 className="text-5xl font-bold md:text-6xl">Welcome</h1>
            <img src={Victory} alt="Victory Emoji" className="h-[100px]" />
          </div>
          <p>Fill in the details to get started with the best chat application</p>
          <div className="flex justify-center items-center w-full m-2">
            <Tabs defaultValue="Login" className="w-3/4">
              <TabsList className="bg-transparent rounded-none w-full">
                <TabsTrigger value="Login" className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300">Login</TabsTrigger>
                <TabsTrigger value="Signup" className="data-[state=active]:bg-transparent text-black text-opacity-90 border-b-2 rounded-none w-full data-[state=active]:text-black data-[state=active]:font-semibold data-[state=active]:border-b-purple-500 p-3 transition-all duration-300">Signup</TabsTrigger>
              </TabsList>
              <TabsContent value="Login">
                <Input type="email" className="flex flex-col gap-6 mt-5 rounded-full" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input type="password" className="flex flex-col gap-6 mt-5 rounded-full" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
                <Input type="submit" className="bg-purple-800 text-white font-semibold rounded-full text-6xl mt-5" onClick={handleLogin} />
              </TabsContent>
              <TabsContent value="Signup">
                <Input type="email" className="flex flex-col gap-6 mt-5 rounded-full" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input type="password" className="flex flex-col gap-6 mt-5 rounded-full" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
                <Input type="password" className="flex flex-col gap-6 mt-5 rounded-full" placeholder="confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <Input type="submit" className="bg-purple-800 text-white font-semibold rounded-full text-6xl mt-5" onClick={handleSignup} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
