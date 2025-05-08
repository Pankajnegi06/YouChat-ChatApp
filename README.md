# YouChat - Real-time Chat Application

YouChat is a modern real-time chat application with user authentication, direct messaging, profile management, and real-time communication capabilities.

![YouChat App](https://placeholder-for-app-screenshot.com)

## Features

- 🔐 **User Authentication**: Secure signup and login system
- 👤 **Profile Management**: Customize your profile with name, avatar, and color themes
- 💬 **Direct Messaging**: Real-time messaging with other users
- 🔍 **Contact Search**: Find and connect with other users
- 🔄 **Real-time Updates**: Instant message delivery with Socket.IO
- 🌙 **Modern UI**: Sleek, responsive interface built with React and Tailwind CSS
- 🔒 **Secure Communication**: Token-based authentication and secure sessions

## Tech Stack

### Frontend
- **React**: UI library
- **Redux**: State management
- **Axios**: HTTP requests
- **Socket.IO-client**: Real-time communication
- **Tailwind CSS**: Styling
- **React Router**: Navigation
- **Radix UI**: UI components

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **Socket.IO**: Real-time communication
- **JWT**: Authentication
- **Cookies**: Session management

## Project Structure

```
Chat App/
├── frontend/                  # React frontend application
│   ├── public/                # Public assets
│   ├── src/
│   │   ├── assets/            # Images and static assets
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # Utilities and configuration
│   │   │   ├── axios.js       # Axios instance configuration
│   │   │   └── apiConfig.js   # API endpoints configuration
│   │   ├── pages/             # Application pages
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── chat/          # Chat interface
│   │   │   └── profile/       # Profile management
│   │   ├── socketContext/     # Socket.IO context provider
│   │   └── store/             # Redux store configuration
│   ├── .env.development       # Development environment variables
│   └── .env.production        # Production environment variables
│
└── server/                    # Node.js backend application
    ├── controllers/           # Request handlers
    ├── middlewares/           # Express middlewares
    ├── models/                # MongoDB database models
    ├── routes/                # API routes
    └── server.js              # Main server file
```

## Setup and Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Development: Edit `.env.development` with your local API URLs
   - Production: Edit `.env.production` with your production API URLs

4. Start the development server:
   ```
   npm run dev
   ```

### Backend Setup
1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with the following:
   ```
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. Start the development server:
   ```
   npm run dev
   ```

## Environment Configuration

### Frontend Environment Variables
- `VITE_API_BASE_URL`: Base URL for API requests (e.g., `http://localhost:8000` for development)
- `VITE_USER_API_PATH`: Path for user-related endpoints (usually `/user`)
- `VITE_SOCKET_URL`: URL for socket connection (same as API base URL in most cases)

### Backend Environment Variables
- `PORT`: Port number for the server
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `COOKIE_SECRET`: Secret for cookie signing

## Deployment

### Frontend Deployment
1. Update the `.env.production` file with your production API URLs.
2. Build the frontend:
   ```
   npm run build
   ```
3. The build output will be in the `dist` directory, which can be deployed to any static hosting service (Netlify, Vercel, etc.).

### Backend Deployment
1. Configure environment variables on your hosting platform.
2. Deploy your server code to a Node.js hosting platform (Heroku, Digital Ocean, AWS, etc.).
3. Ensure your MongoDB database is accessible from your hosting environment.

## Authentication Flow

1. **Registration**: Users create an account with email and password
2. **Login**: Users receive authentication tokens (JWT) stored in HTTP-only cookies
3. **Token Refresh**: Automatic token refresh for extended sessions
4. **Logout**: Clearing authentication tokens

## Messaging System

1. Direct messages between users are stored in the database
2. Socket.IO enables real-time message delivery
3. Users can search and add new contacts
4. Message history is loaded when opening a conversation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Created by [Your Name]
