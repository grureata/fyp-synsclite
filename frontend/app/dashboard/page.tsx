"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

const RECORDS = [
  {id:1,sentence:"Hello, how are you today?",          gloss:"HELLO HOW YOU",       conf:96,ctx:"Social", time:"10:32:14",dur:"0.8s"},
  {id:2,sentence:"I need help with this medication.",  gloss:"NEED HELP MEDICINE",   conf:91,ctx:"Medical",time:"10:32:51",dur:"1.2s"},
  {id:3,sentence:"Can you please repeat that slowly?", gloss:"PLEASE REPEAT SLOW",   conf:88,ctx:"Social", time:"10:33:22",dur:"1.5s"},
  {id:4,sentence:"Where is the nearest hospital?",     gloss:"WHERE HOSPITAL NEAR",  conf:94,ctx:"Medical",time:"10:34:05",dur:"0.9s"},
  {id:5,sentence:"Thank you for your assistance.",     gloss:"THANK YOU HELP",       conf:97,ctx:"Social", time:"10:34:38",dur:"0.7s"},
  {id:6,sentence:"I understand what you are saying.",  gloss:"UNDERSTAND YOU",       conf:89,ctx:"Legal",  time:"10:35:10",dur:"1.1s"},
  {id:7,sentence:"Please write it down for me.",       gloss:"PLEASE WRITE DOWN",    conf:92,ctx:"Social", time:"10:36:02",dur:"1.0s"},
  {id:8,sentence:"I am feeling much better now.",      gloss:"FEEL BETTER NOW",      conf:95,ctx:"Medical",time:"10:36:48",dur:"0.8s"},
];
const BARS=[72,79,75,88,91,87,94];
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function DashboardPage() {
  const [filter,setFilter]=useState("All");
  const shown = filter==="All" ? RECORDS : RECORDS.filter(r=>r.ctx===filter);

  const KPI = ({v,l,sub,c}:{v:string;l:string;sub:string;c:string}) => (
    <div className="card" style={{padding:"18px 18px"}}>
      <div style={{fontSize:26,fontWeight:800,color:c,letterSpacing:"-0.5px",lineHeight:1,marginBottom:6}}>{v}</div>
      <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:3}}>{l}</div>
      <div style={{fontSize:11,color:"var(--t4)"}}>{sub}</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"36px 40px"}}>

        {/* header */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:14}}>
          <div>
            <h1 style={{fontSize:26,fontWeight:800,color:"var(--t1)",letterSpacing:"-0.5px"}}>Dashboard</h1>
            <p style={{fontSize:13,color:"var(--t4)",marginTop:4}}>Session analytics, translation history, and system health.</p>
          </div>
          <Link href="/translate" className="btn btn-v" style={{fontSize:13,padding:"9px 18px"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            New Session
          </Link>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:18}}>
          <KPI v="94.2%" l="Avg Confidence"  sub="+2.1% this week"           c="var(--green)"/>
          <KPI v="1,284" l="Signs Detected"  sub="This session"               c="var(--v2)"/>
          <KPI v="148ms" l="Avg Latency"     sub="Target under 200ms ✓"       c="var(--teal)"/>
          <KPI v="30fps" l="Camera Rate"     sub="Optimal performance"         c="var(--amber)"/>
          <KPI v="8"     l="Translations"    sub="This session"               c="var(--v2)"/>
          <KPI v="3"     l="Context Modes"   sub="Social · Medical · Legal"   c="var(--t3)"/>
        </div>

        {/* charts row */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>

          {/* bar chart */}
          <div className="card" style={{padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>Recognition Confidence</p>
                <p style={{fontSize:12,color:"var(--t4)",marginTop:3}}>7-day daily average (%)</p>
              </div>
              <span className="badge bg">↑ +8.4%</span>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end",height:100}}>
              {BARS.map((v,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                  <span style={{fontSize:10,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace"}}>{v}%</span>
                  <div style={{width:"100%",borderRadius:"3px 3px 0 0",background:"linear-gradient(180deg,var(--v) 0%,var(--teal) 100%)",height:`${v}%`,maxHeight:76,minHeight:5,opacity:0.8}}/>
                  <span style={{fontSize:10,color:"var(--t4)"}}>{DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* context breakdown */}
          <div className="card" style={{padding:22}}>
            <p style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:4}}>Context Usage</p>
            <p style={{fontSize:12,color:"var(--t4)",marginBottom:20}}>This session</p>
            {[["Social","50","var(--v2)"],["Medical","33","var(--teal)"],["Legal","17","var(--rose)"]].map(([l,pct,c])=>(
              <div key={l} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:"var(--t2)"}}>{l}</span>
                  <span style={{fontSize:11,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span>
                </div>
                <div style={{height:5,background:"var(--bg-3)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* system health */}
        <div className="card" style={{padding:20,marginBottom:14}}>
          <p style={{fontWeight:700,fontSize:14,color:"var(--t1)",marginBottom:16}}>System Health</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
            {[
              {name:"MediaPipe",    status:"Operational",detail:"543 lm · 30fps",   c:"var(--v2)",  up:"99.8%"},
              {name:"DeepConvLSTM",status:"Operational",detail:"128 LSTM · 64 CNN", c:"var(--teal)",up:"99.5%"},
              {name:"LLM Engine",  status:"Operational",detail:"< 80ms/sentence",   c:"var(--green)",up:"98.9%"},
              {name:"WebSocket",   status:"Connected",  detail:"Full-duplex",       c:"var(--v2)",  up:"100%"},
              {name:"Speech API",  status:"Ready",      detail:"Web Speech API",    c:"var(--amber)",up:"99.1%"},
              {name:"Database",    status:"Connected",  detail:"PostgreSQL · live", c:"var(--t3)",  up:"99.9%"},
            ].map(({name,status,detail,c,up})=>(
              <div key={name} style={{padding:"12px 14px",background:"var(--bg-2)",borderRadius:"var(--r2)",border:"1px solid var(--b)"}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:c,display:"block",flexShrink:0}} className="pulse"/>
                  <span style={{fontSize:9,fontWeight:700,color:c,textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:"'JetBrains Mono',monospace",flex:1}}>{status}</span>
                  <span style={{fontSize:9,color:"var(--green)",fontFamily:"'JetBrains Mono',monospace"}}>{up}</span>
                </div>
                <p style={{fontSize:12,fontWeight:700,color:"var(--t1)",marginBottom:2}}>{name}</p>
                <p style={{fontSize:11,color:"var(--t4)"}}>{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* records table */}
        <div className="card" style={{overflow:"hidden",padding:0}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid var(--b)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>Translation Records</span>
              <span className="badge bv" style={{fontSize:10}}>{shown.length}</span>
            </div>
            <div style={{display:"flex",gap:6}}>
              {["All","Social","Medical","Legal"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:"var(--r)",border:"1px solid",borderColor:filter===f?"var(--v)":"var(--b)",background:filter===f?"var(--vs)":"var(--bg-2)",color:filter===f?"var(--v2)":"var(--t4)",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"var(--bg-2)"}}>
                  {["#","Sentence","Gloss","Confidence","Mode","Time","Dur"].map(h=>(
                    <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:"var(--t4)",letterSpacing:"0.08em",textTransform:"uppercase",borderBottom:"1px solid var(--b)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r,i)=>(
                  <tr key={r.id} style={{background:i%2===0?"var(--bg-1)":"var(--bg-2)",borderBottom:"1px solid var(--b)"}}>
                    <td style={{padding:"11px 16px",fontSize:11,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace"}}>{r.id}</td>
                    <td style={{padding:"11px 16px",fontSize:13,fontWeight:500,color:"var(--t2)",maxWidth:240}}>{r.sentence}</td>
                    <td style={{padding:"11px 16px",fontSize:11,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace"}}>{r.gloss}</td>
                    <td style={{padding:"11px 16px"}}><span className={`badge ${r.conf>=93?"bg":"ba"}`} style={{fontSize:10}}>{r.conf}%</span></td>
                    <td style={{padding:"11px 16px"}}><span className={`badge ${r.ctx==="Medical"?"bt":r.ctx==="Legal"?"br":"bv"}`} style={{fontSize:10}}>{r.ctx}</span></td>
                    <td style={{padding:"11px 16px",fontSize:11,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{r.time}</td>
                    <td style={{padding:"11px 16px",fontSize:11,color:"var(--t4)",fontFamily:"'JetBrains Mono',monospace"}}>{r.dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
