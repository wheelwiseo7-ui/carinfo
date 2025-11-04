import React, { useState } from 'react';
export default function AdminCreateModal({isOpen,onClose}){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  if(!isOpen) return null;
  const handle=async(e)=>{e.preventDefault(); await fetch('/api/create-admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,password})}); onClose();}
  return (<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <form onSubmit={handle} style={{background:'#111827',padding:20,borderRadius:8}}>
      <h3>Create Admin</h3>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" /><br/>
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" /><br/>
      <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" /><br/>
      <button type="submit">Create</button>
      <button type="button" onClick={onClose}>Close</button>
    </form>
  </div>);
}