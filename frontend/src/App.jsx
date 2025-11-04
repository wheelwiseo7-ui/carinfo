import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

export default function App(){
  const [parts,setParts]=useState([]);
  useEffect(()=>{ fetch('/api/parts').then(r=>r.json()).then(setParts).catch(()=>{}); },[]);
  return (<div style={{background:'#0f1724',color:'#fff',minHeight:'100vh',padding:20}}>
    <h1>CarInfo — Parts Marketplace</h1>
    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}>
      {parts.map(p=>(<div key={p._id} style={{background:'#111827',padding:12,borderRadius:8}}>
        <h3>{p.name}</h3><p style={{color:'#fbbf24'}}>${p.price}</p>
        <div dangerouslySetInnerHTML={{__html: marked.parse(p.installGuide||'') }} />
      </div>))}
    </div>
  </div>); }
