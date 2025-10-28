import { selectUser } from '@/store/userSlice'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import EmptyChat from './components/emptychat_component/index.jsx'
import ContactContainer from './components/contactcontainer_component/index.jsx'
import ChatContainer from './components/chatcontainer_component/index.jsx'
import { chatData } from '@/store/chatSlice'

function Chat() {
  const user = useSelector(selectUser)
  const { selectedChatData } = useSelector(chatData)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user?.profileSetup) {
      toast("Please complete profile to continue.")
      navigate("/profile")
    }
  }, [user, navigate])

  return (
    <div className='flex h-[100vh] text-white overflow-hidden bg-transparent'>
      <ContactContainer />
      {!selectedChatData ? <EmptyChat /> : <ChatContainer />} 
    </div>
  )
}

export default Chat
