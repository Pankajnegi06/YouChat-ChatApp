import { selectUser, setUserInfo } from "@/store/userSlice";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { colors, getColor } from "../utils";
import { FaTrash, FaPlus } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function Profile() {
  const user = useSelector(selectUser);
  const navigate = useNavigate()
  const [firstName, setfirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedcolor, setColor] = useState(0);
  const [image, setImage] = useState(null);
  const [Hovered, setHovered] = useState(false);
  const dispatch = useDispatch()

  const fileInputRef = useRef(null); // 👉 ref for file input

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // Store the actual file instead of URL
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleAvatarClick = () => {
    if (image) {
      removeImage();
    } else {
      fileInputRef.current.click(); // trigger file input
    }
  };
  
  const validateProfile = ()=>{
    if(!firstName){
      toast.error("first Name is missing.")
      return false;
    }
    if(!lastName){
      toast.error("last Name is missing.")
      return false;
    }
    return true;
  }

  const saveChanges = async () => {
    if(validateProfile()){
      try {
     
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
    
        if (image instanceof File) {
          // 📷 If image uploaded, append image only
          formData.append("image", image);
        } else {
          // 🎨 If no image, use color index
          formData.append("color", selectedcolor.toString());
        }
    
        const response = await axios.post(
          "http://localhost:8000/user/ProfileSetup",
          formData,
          {
            withCredentials: true,
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }

        );
        console.log(response)
        if(response.status == 200 && response.data){
          dispatch(setUserInfo(response.data.user))
        }
        console.log(response.data.user)
        
        if(user.profileSetup){
          navigate("/chat")
        }
        
        toast.success("Profile updated successfully!");
      } catch (error) {
        
        toast.error(error.response?.data?.msg || "Couldn't update profile.");
      }
    }
    
  };
  
 

  // For preview only
  const imagePreview = image instanceof File ? URL.createObjectURL(image) : null;

  return (
    <div className="h-[100vh] bg-[#1b1c24] flex flex-col gap-10 justify-center items-center">
      {/* Back Arrow */}
      <div className="w-[80vw] md:w-[640px] flex relative">
        <IoArrowBack  onClick={()=>navigate("/chat")} className="absolute left-0 text-white/90 text-3xl md:text-4xl cursor-pointer" />
      </div>

      <div className="flex flex-col items-center gap-10 w-[80vw] md:w-[640px]">
        <div className="grid grid-cols-2 gap-10 items-center w-full">
          {/* Avatar Upload */}
          <div
            className="h-full w-32 md:w-48 md:h-48 relative flex justify-center items-center"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleAvatarClick} // ✅ add click handler
          >
            <Avatar className="h-32 w-32 md:w-48 md:h-48 rounded-full overflow-hidden">
              {imagePreview ? (
                <AvatarImage
                  src={imagePreview}
                  alt="profile"
                  className="object-cover h-full w-full bg-black"
                />
              ) : ( 
                <div
                  className={`uppercase h-32 w-32 md:w-48 md:h-48 text-5xl border-[1px] flex items-center justify-center rounded-full ${getColor(
                    selectedcolor
                  )}`}
                >
                  {firstName ? firstName.charAt(0) : user.email.charAt(0)}
                </div>
              )}
            </Avatar>
            {Hovered && (
              <div className="inset-0 absolute flex justify-center items-center rounded-full bg-black/50 cursor-pointer">
                {image ? (
                  <FaTrash className="text-white text-3xl" />
                ) : (
                  <FaPlus className="text-white text-3xl" />
                )}
              </div>
            )}
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-5 text-white items-center justify-center w-full">
            <input
              placeholder="Email"
              type="email"
              disabled
              value={user.email}
              className="rounded-lg p-6 bg-[#2c2e3b] border-none w-full"
            />
            <input
              placeholder="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setfirstName(e.target.value)}
              className="rounded-lg p-6 bg-[#2c2e3b] border-none w-full"
            />
            <input
              placeholder="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-lg p-6 bg-[#2c2e3b] border-none w-full"
            />
            <div className="w-full flex gap-5">
              {colors.map((color, index) => (
                <div
                  key={index}
                  onClick={() => setColor(index)}
                  className={`${color} h-8 w-8 rounded-full cursor-pointer transition-all ${
                    selectedcolor === index ? "outline-white/50 outline-1" : ""
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="w-full">
          <Button
            className="h-16 w-full bg-purple-700 cursor-pointer hover:bg-purple-900 transition-all duration-300"
            onClick={saveChanges}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Profile;