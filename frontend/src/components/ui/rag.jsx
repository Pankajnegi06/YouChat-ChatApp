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
    <div className='bg-black'>
        <input className="bg-white text-black" type="text" value={query} onChange={(e)=>setQuery(e.target.value)} />
      <button onClick={handleAsk}>Ask</button>
    </div>
  )
}

export default Rag
