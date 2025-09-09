import React from 'react'
import ChatHeader from '../chat-header/index.jsx'
import MessageContainer from '../message-container/index.jsx'
import MessageBar from '../message-bar/index.jsx'
import Rag from '@/components/ui/rag.jsx'

function ChatContainer() {
  return (
    <div className='fixed top-0 h-[100vh] w-[100vw] bg-[#1c1d25] flex flex-col md:static md:flex-1'>
      <ChatHeader/>
      <MessageContainer/>
      <MessageBar/>
      <Rag/>
    </div>
  )
}

export default ChatContainer
