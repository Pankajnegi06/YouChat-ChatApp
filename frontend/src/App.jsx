import { Button } from "@/components/ui/button"
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom"
import Auth from "./pages/auth/index.jsx"
import Profile from "./pages/profile/index.jsx"
import Chat from "./pages/chat/index.jsx"
import { useDispatch, useSelector } from "react-redux"
import { selectUser, setUserInfo, clearUserInfo } from "./store/userSlice.js"
import { useEffect, useState } from "react"
import api from "./lib/axios.js"
import { toast } from "sonner"
import axios from "axios"


function App() {
  const dispatch = useDispatch()
  const user = useSelector(selectUser)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  const PRIVATE_ROUTE = ({children}) => {
    const user = useSelector(selectUser)
    const isAuthenticated = user
    return isAuthenticated ? children : <Navigate to="/auth"/>
  }

  const AUTH_ROUTE = ({children}) => {
    const user = useSelector(selectUser)
    const isAuthenticated = user
    return isAuthenticated ? <Navigate to="/chat"/> : children
  }

  const getUserInfo = async () => {
    try {
      const response = await axios.get("http://localhost:8000/user/getUserInfo",{withCredentials:true});
      
      if (response.data.success) {
        dispatch(setUserInfo(response.data.user));
      } else {
        dispatch(clearUserInfo());
        navigate("/auth");
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      dispatch(clearUserInfo());
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await api.get("/logout");
      dispatch(clearUserInfo());
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(clearUserInfo());
      navigate("/auth");
    }
  };

  useEffect(() => {
    if (!user) {
      getUserInfo();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return <h1>Loading...</h1>
  }

  return (
    <Routes>
      <Route path="/auth" element={
        <AUTH_ROUTE>
          <Auth/>
        </AUTH_ROUTE>
      }/>
      <Route path="/profile" element={
        <PRIVATE_ROUTE>
          <Profile/>
        </PRIVATE_ROUTE>
      }/>
      <Route path="/chat" element={
        <PRIVATE_ROUTE>
          <Chat/>
        </PRIVATE_ROUTE>
      }/>
      
      <Route path="*" element={<Navigate to="/auth"/>}/>
    </Routes>
  )
}

export default App
