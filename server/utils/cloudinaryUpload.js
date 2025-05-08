import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

import dotenv from 'dotenv';

dotenv.config();
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET,
});

const fileUpload = async (localPath) => {
  try {
  
    
    if (!localPath) return;

    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    console.log("File successfully uploaded:", response.secure_url);

 
    fs.unlinkSync(localPath);

    return response.secure_url;
  } catch (error) {
    fs.unlinkSync(localPath);
    console.error("Cloudinary upload failed:", error);
    throw error;
  }
};

export { fileUpload}
