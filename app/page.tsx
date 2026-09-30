'use client';

import { useEffect, useMemo, useRef, useState } from "react";

type Message = { id:string; role:"user"|"assistant"; content:string; createdAt:number };
const starter:Message[]=[{id:"welcome",role:"assistant",content:"မင်္ဂလာပါ 👋 ကျွန်တော် A1 ပါ။ မေးခွန်းဖြေခြင်း၊ စာရေးခြင်း၊ ဘာသာပြန်ခြင်း၊ အစီအစဉ်ဆွဲခြင်း၊ coding နဲ့ နေ့စဉ်လုပ်ငန်းတွေမှာ ကူညီပေးနိုင်ပါတယ်။ ဘာလုပ်ပေးရမလဲ?",createdAt:Date.now()}];
const suggestions=["ဒီနေ့အတွက် အလုပ်အစီအစဉ်ဆွဲပေးပါ","ဒီစာကို မြန်မာလို ဘာသာပြန်ပေးပါ","business idea ၅ ခု ပေးပါ","ဒီ code ကို စစ်ပေးပါ"];

export default function Home(){
 const [messages,setMessages]=useState<Message[]>(starter),[input,setInput]=useState(""),[busy,setBusy]=useState(false),[listening,setListening]=useState(false),[speakingId,setSpeakingId]=useState<string|null>(null);
 const bottomRef=useRef<HTMLDivElement>(null),recognitionRef=useRef<any>(null);
 useEffect(()=>{const s=localStorage.getItem("a1-messages");if(s)try{setMessages(JSON.parse(s))}catch{}},[]);
 useEffect(()=>{localStorage.setItem("a1-messages",JSON.stringify(messages));bottomRef.current?.scrollIntoView({behavior:"smooth"})},[messages,busy]);
 const canSend=useMemo(()=>!!input.trim()&&!busy,[input,busy]);
 async function sendMessage(text=input){
  const value=text.trim();if(!value||busy)return;
  const user:Message={id:crypto.randomUUID(),role:"user",content:value,createdAt:Date.now()},next=[...messages,user];
  setMessages(next);setInput("");setBusy(true);
  try{
   const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-20).map(({role,content})=>({role,content}))})});
   const data=await response.json();if(!response.ok)throw new Error(data?.error||"Request failed");
   setMessages(cur=>[...cur,{id:crypto.randomUUID(),role:"assistant",content:data.reply,createdAt:Date.now()}]);
  }catch(e){setMessages(cur=>[...cur,{id:crypto.randomUUID(),role:"assistant",content:"⚠️ "+(e instanceof Error?e.message:"ချိတ်ဆက်မှု မအောင်မြင်ပါ။"),createdAt:Date.now()}])}
  finally{setBusy(false)}
 }
 function clearChat(){if(!confirm("Conversation ကို ဖျက်မလား?"))return;setMessages(starter);localStorage.removeItem("a1-messages")}
 function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert("ဒီ browser မှာ voice input မထောက်ပံ့သေးပါ။ Chrome/Edge ကို အသုံးပြုကြည့်ပါ။");return}
  if(listening){recognitionRef.current?.stop();setListening(false);return}
  const r=new SR();r.lang="my-MM";r.interimResults=true;r.continuous=false;r.onstart=()=>setListening(true);
  r.onresult=(e:any)=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;setInput(t)};
  r.onend=()=>setListening(false);r.onerror=()=>setListening(false);recognitionRef.current=r;r.start();
 }
 function speak(id:string,text:string){
  if(!("speechSynthesis" in window))return;
  if(speakingId===id){speechSynthesis.cancel();setSpeakingId(null);return}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="my-MM";u.onend=()=>setSpeakingId(null);u.onerror=()=>setSpeakingId(null);setSpeakingId(id);speechSynthesis.speak(u);
 }
 return <main className="app-shell">
  <header className="topbar"><div className="brand"><div className="avatar">A1</div><div><strong>My Assistant A1</strong><span><i/> Online assistant</span></div></div><button className="icon-btn" onClick={clearChat}>⌫</button></header>
  <section className="chat"><div className="hero"><div className="hero-orb">✦</div><h1>A1 Assistant</h1><p>သင်လိုချင်တာကို ရိုးရိုးရှင်းရှင်း ပြောပါ။</p></div>
   <div className="messages">{messages.map(m=><article key={m.id} className={m.role==="user"?"message user":"message"}><div className="bubble">{m.content}</div>{m.role==="assistant"&&m.id!=="welcome"&&<button className="speak-btn" onClick={()=>speak(m.id,m.content)}>{speakingId===m.id?"◼ Stop":"🔊 နားထောင်"}</button>}</article>)}{busy&&<article className="message"><div className="bubble typing"><span/><span/><span/></div></article>}<div ref={bottomRef}/></div>
  </section>
  <section className="composer-wrap">{messages.length<=2&&<div className="suggestions">{suggestions.map(x=><button key={x} onClick={()=>sendMessage(x)}>{x}</button>)}</div>}
   <div className="composer"><button className={listening?"round-btn active":"round-btn"} onClick={startVoice}>🎙</button><textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="A1 ကို မေးပါ..." rows={1} disabled={busy}/><button className="send-btn" disabled={!canSend} onClick={()=>sendMessage()}>➤</button></div>
   <small>A1 can make mistakes. Verify important information.</small>
  </section>
 </main>
}
declare global { interface Window { SpeechRecognition?:any; webkitSpeechRecognition?:any } }
