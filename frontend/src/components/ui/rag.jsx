import React, { useState } from 'react'
import axios from 'axios';
const Rag = () => {
    const [query,setQuery] = useState("");
    const [answer,setAnswer] = useState("");
    const [retrieved,setRetrieved] = useState([]);

    const handleAsk = async () => {
        const response = await axios.post("http://localhost:8000/search/ask",{query});
        setAnswer(response.data.answer);
        setRetrieved(response.data.retrieved);
        console.log(response,answer,retrieved,"hello");
    }
    
  return (
    <div className='bg-#1c1d25 h-[100%] w-[95%] flex gap-[5px] justify-center'>
        <input className="bg-[#2a2b33] text-white p-2 border-2 rounded-sm  w-md h-10  mt-[15px] " type="text" placeholder='Ask the AI about your chat history' value={query} onChange={(e)=>setQuery(e.target.value)} />
      <button onClick={handleAsk} className='bg-[#8417ff] rounded-sm border-2 w-[60px] h-[40px]  mt-[15px] '>Ask</button>
    </div>
  )
}

export default Rag
