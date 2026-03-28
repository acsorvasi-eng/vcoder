import { useState, useRef, useEffect, useCallback } from "react";
const API = "/api/claude";
const SYS = `Output ONLY raw JSON: {"code":"<!DOCTYPE html>...</html>","explanation":"magyar szöveg"}. No markdown, nothing outside JSON.`;

async function gen(cmd: string, existing: string) {
  const r = await fetch(API, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4096, system: SYS,
      messages: [{ role: "user", content: existing ? `Existing:\n${existing}\n\nCommand: ${cmd}` : `Command: ${cmd}` }] })
  });
  const d = await r.json();
  const t = d.content?.map((b: any) => b.text || "").join("") || "";
  const m = t.replace(/```json\s*/gi,"").replace(/```/g,"").trim().match(/\{[\s\S]*\}/);
if (!m) throw new Error(t.slice(0, 200));
  return JSON.parse(m[0]);
}

export default function App() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle");
  const [code, setCode] = useState("");
  const [expl, setExpl] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("input");
  const iref = useRef<HTMLIFrameElement>(null);

  useEffect(() => { if (code && iref.current) iref.current.srcdoc = code; }, [code]);

  const run = useCallback(async (cmd?: string) => {
    const t = (cmd || input).trim(); if (!t || status === "thinking") return;
    setStatus("thinking"); setErr("");
    try {
      const r = await gen(t, code);
      setCode(r.code); setExpl(r.explanation);
      setInput(""); setTab("preview"); setStatus("done");
    } catch(e: any) { setErr(e.message); setStatus("error"); }
  }, [input, code, status]);

  const ac = status === "thinking" ? "#00cfff" : status === "error" ? "#ff4444" : "#c8ff00";

  return (
    <div style={{fontFamily:"monospace",background:"#080808",minHeight:"100vh",color:"#d0d0d0",display:"flex",flexDirection:"column"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}button{cursor:pointer;border:none;background:none;}textarea{resize:none;outline:none;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{padding:"14px 20px",borderBottom:"1px solid #181818",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#080808",zIndex:10}}>
        <b style={{color:"#fff",letterSpacing:"0.2em",fontSize:15}}>VCODER</b>
        <span style={{fontSize:9,color:ac,letterSpacing:"0.1em"}}>{({idle:"KÉSZEN",thinking:"GENERÁL...",done:"KÉSZ",error:"HIBA"} as any)[status]}</span>
      </div>
      <div style={{display:"flex",borderBottom:"1px solid #181818"}}>
        {[["input","PARANCS"],["preview","PREVIEW"],["history",""]].map(([id,label])=>(
          <button key={id} onClick={()=>id!=="preview"||code?setTab(id):null}
            style={{flex:1,padding:"12px 0",fontSize:9,letterSpacing:"0.12em",color:tab===id?ac:id==="preview"&&!code?"#282828":"#444",borderBottom:tab===id?`2px solid ${ac}`:"2px solid transparent"}}>
            {id==="preview"?"PREVIEW":label}
          </button>
        ))}
      </div>
      {tab==="input"&&<div style={{flex:1,padding:20,display:"flex",flexDirection:"column",gap:12}}>
        {expl&&<div style={{padding:"10px 14px",background:"#0d1a0d",border:"1px solid #1a2e1a",borderRadius:4,fontSize:12,color:"#00ff88"}}>✓ {expl}</div>}
        {err&&<div style={{padding:"10px 14px",background:"#1a0d0d",border:"1px solid #2e1a1a",borderRadius:4,fontSize:11,color:"#ff6666"}}>⚠ {err}</div>}
        <div style={{border:`1px solid ${status==="thinking"?"#00cfff44":"#222"}`,borderRadius:6,overflow:"hidden"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} rows={4}
            placeholder={code?'Módosítsd... pl. "Csináld sötétre"':'Írd le az appot... pl. "Todo lista"'}
            style={{width:"100%",background:"#0f0f0f",color:"#e0e0e0",fontSize:14,lineHeight:1.6,padding:"14px 16px",fontFamily:"monospace",border:"none"}}/>
          <button onClick={()=>run()} disabled={!input.trim()||status==="thinking"}
            style={{width:"100%",padding:"14px",background:input.trim()&&status!=="thinking"?ac:"#111",color:input.trim()&&status!=="thinking"?"#000":"#333",fontSize:11,fontWeight:700,letterSpacing:"0.15em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {status==="thinking"?<><div style={{width:14,height:14,border:"2px solid #00cfff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>GENERÁL...</>:code?"↺ MÓDOSÍT":"⚡ GENERÁL"}
          </button>
        </div>
        {!code&&<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {["Todo app","Login form","Számológép","Időjárás widget"].map(ex=>(
            <button key={ex} onClick={()=>setInput(ex)} style={{padding:"8px 12px",border:"1px solid #1e1e1e",borderRadius:3,fontSize:11,color:"#555",background:"#0d0d0d",fontFamily:"monospace"}}>{ex}</button>
          ))}
        </div>}
        {code&&<button onClick={()=>{setCode("");setExpl("");setStatus("idle");}} style={{fontSize:10,color:"#333",padding:"8px 0",borderTop:"1px solid #181818"}}>✕ ÚJ APP</button>}
      </div>}
      {tab==="preview"&&<div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <iframe ref={iref} style={{flex:1,border:"none",background:"#fff",minHeight:"65vh"}} sandbox="allow-scripts allow-same-origin" title="preview"/>
        <div style={{padding:"12px 20px",borderTop:"1px solid #181818",display:"flex",gap:10}}>
          <button onClick={()=>setTab("input")} style={{flex:1,padding:"12px",border:"1px solid #222",borderRadius:4,fontSize:10,color:"#555"}}>← MÓDOSÍT</button>
          <button onClick={()=>{const b=new Blob([code],{type:"text/html"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="app.html";a.click();}}
            style={{flex:1,padding:"12px",background:ac,borderRadius:4,fontSize:10,color:"#000",fontWeight:700}}>↓ EXPORT</button>
        </div>
      </div>}
    </div>
  );
}
