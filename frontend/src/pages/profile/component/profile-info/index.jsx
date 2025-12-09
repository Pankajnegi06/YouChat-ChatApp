import { getColor } from "@/pages/utils";
import { clearUserInfo, selectUser } from "@/store/userSlice";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FiEdit2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { IoPowerSharp } from "react-icons/io5";
import axios from "axios";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/apiConfig";

function ProfileInfo() {
  const user = useSelector(selectUser) 
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const handleLogout = async() => {
        try {
            const response = await axios.get(API_ENDPOINTS.user.logout, {withCredentials:true});
            
            if(response.status == 200){
                dispatch(clearUserInfo())
                console.log("Succesfully Logout")
                toast("User Logged Out.")
                navigate("/auth")
            }
            
        } catch (error) {
            console.log("Cannot logout user : ",error)
        }
    }
  return (
    <div className="absolute w-full bottom-0 flex items-center justify-center gap-5 bg-[#2a2b33] h-16 px-10">
      <div className="flex gap-3 items-center justify-center">
        <div className="h-12 w-12 relative">
          <Avatar className="h-12 w-12 rounded-full overflow-hidden">
            {user.image ? (
              <AvatarImage
                src={user.image}
                alt="profile"
                className="object-cover h-full rounded-full w-full bg-black"
              />
            ) : (
              <div
                className={`uppercase h-12 w-12  text-lg border-[1px] flex items-center justify-center rounded-full ${getColor(
                  user.color 
                )}`}
              >
                {user ? user.firstName?.charAt(0) : user.email.charAt(0)}
              </div>
            )}
          </Avatar>
        </div>
      </div>
      <div>
        {user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email}
      </div>
      <div className="flex gap-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
                <FiEdit2  className="text-purple-500 text-xl font-medium cursor-pointer"
                onClick={()=>navigate("/profile")}/>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Edit Profile</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
                <IoPowerSharp  className="text-purple-500 text-xl font-medium cursor-pointer"
                onClick={handleLogout}/>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c1b1e] border-none text-white">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export default ProfileInfo;
