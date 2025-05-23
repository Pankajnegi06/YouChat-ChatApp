import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes/auth.js';
import { contacts } from './routes/contacts.js';
import { setupSocket } from './socket.js';
import messageRouter from './routes/message.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: "./.env" });

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Setup socket.io with server
setupSocket(server);

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173', 'https://youchat-chatapp.onrender.com', 'https://you-chat-chat-app.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin']
};

// Apply CORS middleware
app.use(cors(corsOptions));

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'https://youchat-chatapp.onrender.com', 'https://you-chat-chat-app.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Other middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/user", router);
app.use("/contacts", contacts);
app.use("/messages",messageRouter)

// API base route
app.get('/', (req, res) => {
  res.send('Chat App API is running!');
});

// Handle preflight
app.options('*', cors(corsOptions));

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
