import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import store from "./store/store.js"
import './index.css'
import App from './App.jsx'
import { Toaster } from "@/components/ui/sonner"
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { SocketProvider } from './socketContext/index.jsx'
createRoot(document.getElementById('root')).render(
<>
<BrowserRouter>

  
  <Provider store={store}>
  <SocketProvider>
  <App />
  <Toaster closeButton/>
  </SocketProvider>
  </Provider>

</BrowserRouter>
</>

)
