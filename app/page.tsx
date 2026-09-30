'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import A1RobotWidget, { type WidgetVariant } from "../components/A1RobotWidget";
import { clearMemory, loadMemory, memorySummary, saveMemory, type A1Memory } from "../lib/a1-memory";

type Message = { id:string; role:"user"|"assistant"; content:string; createdAt:number };
type Tab = "home" | "chat" | "tasks" | "me";

const starter:Message[]=[{id:"welcome",role:"assistant",content:"မင်္ဂလာပါ 👋 ကျွန်တော် A1 ပါ။ မေးခွန်းဖြေခြင်း၊ စာရေးခြင်း၊ ဘာသာပြန်ခြင်း၊ အစီအစဉ်ဆွဲခြင်း၊ coding နဲ့ နေ့စဉ်လုပ်ငန်းတွေမှာ ကူညီပေးနိုင်ပါတယ်။ ဘာလုပ်ပေးရမလဲ?",createdAt:Date.now()}];
const suggestions=["ဒီနေ့အတွက် အလုပ်အစီအစဉ်ဆွဲပေးပါ","ဒီစာကို မြန်မာလို ဘာသာပြန်ပေးပါ","business idea ၅ ခု ပေးပါ","ဒီ code ကို စစ်ပေးပါ"];

export default function Home(){
 const [tab,setTab]=useState<Tab>("home");
 const [messages,setMessages]=useState<Message[]>(starter),[input,setInput]=useState(""),[busy,setBusy]=useState(false),[listening,setListening]=useState(false),[speakingId,setSpeakingId]=useState<string|null>(null),[widgetVariant,setWidgetVariant]=useState<WidgetVariant>("robot"),[dark,setDark]=useState(true);
 const [tasks,setTasks]=useState<string[]>([]);
 const [memory,setMemory]=useState<A1Memory>({});
 const bottomRef=useRef<HTMLDivElement>(null),recognitionRef=useRef<any>(null),inputRef=useRef<HTMLTextAreaElement>(null);

 useEffect(()=>{const s=localStorage.getItem("a1-messages");if(s)try{setMessages(JSON.parse(s))}catch{};const v=localStorage.getItem("a1-widget-variant");if(v==="glass"||v==="robot")setWidgetVariant(v);setTasks(JSON.parse(localStorage.getItem("a1-tasks")||"[]"));setMemory(loadMemory());setDark(localStorage.getItem("a1-theme")!=="light")},[]);
 useEffect(()=>{localStorage.setItem("a1-messages",JSON.stringify(messages));if(tab==="chat")bottomRef.current?.scrollIntoView({behavior:"smooth"})},[messages,busy,tab]);
 useEffect(()=>{localStorage.setItem("a1-tasks",JSON.stringify(tasks))},[tasks]);
 useEffect(()=>{document.documentElement.dataset.theme=dark?"dark":"light";localStorage.setItem("a1-theme",dark?"dark":"light")},[dark]);
 const canSend=useMemo(()=>!!input.trim()&&!busy,[input,busy]);

 async function sendMessage(text=input){
  const value=text.trim();if(!value||busy)return;
  const user:Message={id:crypto.randomUUID(),role:"user",content:value,createdAt:Date.now()},next=[...messages,user];
  setMessages(next);setInput("");setBusy(true);setTab("chat");
  try{
   const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:next.slice(-20).map(({role,content})=>({role,content})), memory:memorySummary(memory)})});
   const data=await response.json();if(!response.ok)throw new Error(data?.error||"Request failed");
   setMessages(cur=>[...cur,{id:crypto.randomUUID(),role:"assistant",content:data.reply,createdAt:Date.now()}]);
  }catch(e){setMessages(cur=>[...cur,{id:crypto.randomUUID(),role:"assistant",content:"⚠️ "+(e instanceof Error?e.message:"ချိတ်ဆက်မှု မအောင်မြင်ပါ။"),createdAt:Date.now()}])}
  finally{setBusy(false)}
 }
 function updateMemory(patch:A1Memory){const next={...memory,...patch};setMemory(next);saveMemory(next)}
 function clearAllMemory(){if(!confirm("A1 မှတ်ထားတဲ့ personal preferences တွေကို ဖျက်မလား?"))return;clearMemory();setMemory({})}
 function clearChat(){if(!confirm("Conversation ကို ဖျက်မလား?"))return;setMessages(starter);localStorage.removeItem("a1-messages")}
 function focusAssistant(){setTab("chat");setTimeout(()=>inputRef.current?.focus(),40);bottomRef.current?.scrollIntoView({behavior:"smooth"})}
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
 function addTask(){const value=prompt("Task အသစ်ရေးပါ");if(value?.trim())setTasks(v=>[...v,value.trim()])}
 function quickTask(){setTab("tasks");setTimeout(addTask,40)}

 return <main className="app-shell">
  <header className="topbar">
   <button className="brand brand-button" onClick={()=>setTab("home")} aria-label="A1 Home"><div className="avatar">A1</div><div><strong>My Assistant A1</strong><span><i/> Online assistant</span></div></button>
   <button className="icon-btn" onClick={()=>setTab("me")} aria-label="Settings">⚙</button>
  </header>

  {tab==="home"&&<section className="home-page">
   <div className="home-greeting"><span className="eyebrow">PERSONAL AI ASSISTANT</span><h1>မင်္ဂလာပါ 👋<br/><em>ဒီနေ့ ဘာလုပ်ပေးရမလဲ?</em></h1><p>A1 ကို ရိုးရိုးရှင်းရှင်း ပြောလိုက်ပါ။</p></div>
   <div className="home-a1-card"><div className="home-a1-orb">✦</div><div><strong>A1 is ready</strong><span>မေးပါ၊ ရေးခိုင်းပါ၊ စီစဉ်ခိုင်းပါ</span></div><button onClick={focusAssistant}>Chat →</button></div>
   <div className="section-heading"><h2>Quick actions</h2><span>အမြန်စတင်ရန်</span></div>
   <div className="action-grid">{[["✍️","Write","စာရေးခြင်း"],["🌐","Translate","ဘာသာပြန်"],["💡","Ideas","အကြံဉာဏ်"],["📚","Learn","လေ့လာခြင်း"],["💻","Code","Coding"],["📊","Plan","စီမံကိန်း"]].map(([icon,title,sub])=><button className="action-card" key={title} onClick={()=>sendMessage(title==="Write"?"စာတစ်ပုဒ်ရေးပေးပါ":title==="Translate"?"ဒီစာကို ဘာသာပြန်ပေးပါ":title==="Ideas"?"business idea ၅ ခု ပေးပါ":title==="Learn"?"ဒီအကြောင်းကို ရှင်းပြပေးပါ":title==="Code"?"ဒီ code ကို စစ်ပေးပါ":"ဒီအတွက် အစီအစဉ်ဆွဲပေးပါ"}><b>{icon}</b><strong>{title}</strong><span>{sub}</span></button>)}</div>
   <div className="section-heading recent-heading"><h2>Recent</h2><span>{`${messages.length-1} messages`}</span></div>
   <div className="recent-list">{messages.filter(m=>m.id!=="welcome").slice(-3).reverse().map(m=><button key={m.id} onClick={focusAssistant}><span>◦</span><div><strong>{m.content.slice(0,48)}{m.content.length>48?"…":""}</strong><small>A1 conversation</small></div><b>›</b></button>)}{messages.length<=1&&<div className="empty-state">သင်စကားပြောပြီးတဲ့ conversation တွေ ဒီနေရာမှာ ပေါ်လာပါမယ်။</div>}</div>
  </section>}

  {tab==="chat"&&<section className="chat-page">
   <div className="chat-title"><div><span className="eyebrow">A1 ASSISTANT</span><h1>စကားပြောကြရအောင်</h1></div><button className="clear-btn" onClick={clearChat}>Clear</button></div>
   <div className="messages">{messages.map(m=><article key={m.id} className={m.role==="user"?"message user":"message"}><div className="bubble">{m.content}</div>{m.role==="assistant"&&m.id!=="welcome"&&<button className="speak-btn" onClick={()=>speak(m.id,m.content)}>{speakingId===m.id?"◼ Stop":"🔊 နားထောင်"}</button>}</article>)}{busy&&<article className="message"><div className="bubble typing"><span/><span/><span/></div></article>}<div ref={bottomRef}/></div>
  </section>}

  {tab==="tasks"&&<section className="simple-page"><div className="page-intro"><span className="eyebrow">PERSONAL WORKSPACE</span><h1>Tasks</h1><p>A1 နဲ့အတူ လုပ်စရာတွေကို ရိုးရှင်းစွာ စီမံပါ။</p></div><button className="primary-action" onClick={addTask}>＋ Add task</button><div className="task-list">{tasks.length?tasks.map((t,i)=><button key={i} onClick={()=>setTasks(v=>v.filter((_,n)=>n!==i))}><span>○</span><strong>{t}</strong><small>Done</small></button>):<div className="empty-card">ဒီနေ့လုပ်စရာတွေကို ထည့်လိုက်ပါ။</div>}</div></section>}

  {tab==="me"&&<section className="simple-page"><div className="profile-card"><div className="profile-avatar">A1</div><div><span className="eyebrow">YOUR ASSISTANT</span><h1>My Assistant A1</h1><p>Personal • Private • Helpful</p></div></div><div className="settings-card"><button onClick={()=>setDark(v=>!v)}><span>◐</span><div><strong>Appearance</strong><small>{dark?"Dark premium":"Light clean"}</small></div><b>{dark?"ON":"OFF"}</b></button><button onClick={()=>setWidgetVariant(v=>{const n=v==="robot"?"glass":"robot";localStorage.setItem("a1-widget-variant",n);return n})}><span>◇</span><div><strong>Assistant style</strong><small>{widgetVariant==="robot"?"Cute Robot":"Glassmorphism"}</small></div><b>›</b></button><button onClick={()=>{const name=prompt("A1 က သင့်ကို ဘယ်လိုခေါ်ရမလဲ?",memory.userName||"");if(name!==null)updateMemory({userName:name.trim().slice(0,80)||undefined})}}><span>◎</span><div><strong>Your name</strong><small>{memory.userName||"Not set"}</small></div><b>›</b></button><button onClick={()=>updateMemory({responseStyle:memory.responseStyle==="detailed"?"concise":"detailed"})}><span>≡</span><div><strong>Response style</strong><small>{memory.responseStyle==="detailed"?"Detailed":"Concise"}</small></div><b>›</b></button><button onClick={clearAllMemory}><span>⌫</span><div><strong>Clear A1 memory</strong><small>Remove saved preferences</small></div><b>›</b></button><button onClick={clearChat}><span>⌫</span><div><strong>Clear conversation</strong><small>Remove local chat history</small></div><b>›</b></button></div><div className="privacy-note">A1 ရဲ့ conversation history နဲ့ optional preferences တွေကို ဒီ browser ရဲ့ local storage မှာ သိမ်းထားပါတယ်။ Server ကို ပို့တဲ့ memory ကလည်း user preference အနည်းငယ်ပဲ ဖြစ်ပါတယ်။</div></section>}

  <A1RobotWidget state={busy?"thinking":listening?"listening":speakingId?"speaking":"idle"} variant={widgetVariant} onVariantChange={v=>{setWidgetVariant(v);localStorage.setItem("a1-widget-variant",v)}} onOpen={focusAssistant} onVoice={startVoice}/>

  <section className="composer-wrap">
   {tab==="chat"&&messages.length<=2&&<div className="suggestions">{suggestions.map(x=><button key={x} onClick={()=>sendMessage(x)}>{x}</button>)}</div>}
   {tab==="chat"&&<div className="composer"><button className={listening?"round-btn active":"round-btn"} onClick={startVoice}>🎙</button><textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}}} placeholder="A1 ကို မေးပါ..." rows={1} disabled={busy}/><button className="send-btn" disabled={!canSend} onClick={()=>sendMessage()}>➤</button></div>}
  </section>

  <nav className="bottom-nav" aria-label="Main navigation">
   {[["home","⌂","Home"],["chat","✦","Chat"],["tasks","✓","Tasks"],["me","•••","Me"]].map(([id,icon,label])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id as Tab)}><span>{icon}</span><small>{label}</small></button>)}
  </nav>
 </main>
}

declare global { interface Window { SpeechRecognition?:any; webkitSpeechRecognition?:any } }
