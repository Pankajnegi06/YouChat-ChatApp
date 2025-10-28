import React, { useState } from 'react'
import ChatHeader from '../chat-header/index.jsx'
import MessageContainer from '../message-container/index.jsx'
import MessageBar from '../message-bar/index.jsx'
import Rag from '@/components/ui/rag.jsx'
import RagSidebar from '../rag-sidebar/index.jsx'

function ChatContainer() {
  const [showRag, setShowRag] = useState(false)
  return (
    <div className='fixed top-0 h-[100vh] w-[100vw] flex flex-col md:static md:flex-1 bg-[oklch(0.14_0.03_265_/0.7)] backdrop-blur-xl'>
      <ChatHeader/>
      <MessageContainer/>
      <img
        width="48px"
        height="48px"
        className="absolute bottom-[88px] left-[32px] cursor-pointer z-10"
        src="https://img.icons8.com/pulsar-gradient/48/why-us-female.png"
        alt="why-us-female"
        onClick={() => setShowRag(!showRag)}
      />
      <MessageBar/>
      <RagSidebar open={showRag} onClose={() => setShowRag(false)} />
      
    </div>
  )
}

export default ChatContainer
