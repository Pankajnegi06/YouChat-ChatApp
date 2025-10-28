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
      try {
        console.log("Login attempt with:", API_ENDPOINTS.user.Login, {email, password});
        const response = await axios.post(API_ENDPOINTS.user.Login, {email, password}, {withCredentials: true});
        console.log("Login response:", response);
        
        if (response.data && response.data.user) {
          dispatch(setUserInfo(response.data.user));
          toast.success("Login successful!");
          if(response.data.user.profileSetup) navigate("/chat");
          else navigate("/profile");
        } else {
          toast.error("Invalid response from server");
          console.error("Invalid response format:", response);
        }
      } catch (error) {
        console.error("Login error:", error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Error response:", error.response.data);
          toast.error(error.response.data.msg || "Login failed. Please check your credentials.");
        } else if (error.request) {
          // The request was made but no response was received
          console.error("No response received:", error.request);
          toast.error("Cannot connect to the server. Please try again later.");
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Request error:", error.message);
          toast.error("An error occurred. Please try again.");
        }
      }
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
    <div className="flex justify-center items-center h-[100vh] w-[100vw] p-4">
      <div className="relative w-full max-w-[980px]">
        <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-purple-600/30 via-fuchsia-500/20 to-indigo-500/20 blur-2xl" aria-hidden/>
        <div className="relative rounded-3xl border border-white/10 bg-[oklch(0.17_0.03_265_/0.6)] backdrop-blur-xl shadow-[0_10px_50px_-10px_rgba(0,0,0,0.6)] px-8 py-10 bg-noise">
          <div className="flex justify-center items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Welcome</h1>
            <img src={Victory} alt="Victory Emoji" className="h-[64px] md:h-[80px] opacity-90" />
          </div>
          <p className="text-sm text-muted-foreground mt-2 text-center">Fill in the details to get started with your chat experience</p>
          <div className="flex justify-center items-center w-full mt-6">
            <Tabs defaultValue="Login" className="w-full max-w-[560px]">
              <TabsList className="bg-transparent rounded-xl w-full grid grid-cols-2 gap-2 p-1 border border-white/10">
                <TabsTrigger value="Login" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-foreground data-[state=active]:shadow-inner py-2 transition-all">Login</TabsTrigger>
                <TabsTrigger value="Signup" className="rounded-lg data-[state=active]:bg-white/5 data-[state=active]:text-foreground data-[state=active]:shadow-inner py-2 transition-all">Signup</TabsTrigger>
              </TabsList>
              <TabsContent value="Login" className="mt-6 space-y-4">
                <Input type="email" className="rounded-xl h-11" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input type="password" className="rounded-xl h-11" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <button className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 text-white font-medium hover:brightness-110 active:brightness-95 transition-all shadow-[0_8px_30px_-10px_rgba(139,92,246,0.7)]" onClick={handleLogin}>Continue</button>
              </TabsContent>
              <TabsContent value="Signup" className="mt-6 space-y-4">
                <Input type="email" className="rounded-xl h-11" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                <Input type="password" className="rounded-xl h-11" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                <Input type="password" className="rounded-xl h-11" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                <button className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 text-white font-medium hover:brightness-110 active:brightness-95 transition-all shadow-[0_8px_30px_-10px_rgba(139,92,246,0.7)]" onClick={handleSignup}>Create account</button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
