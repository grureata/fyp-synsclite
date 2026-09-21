"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

const SENTENCES = [
  "Hello, how are you today?",
  "I need help with this medication.",
  "Can you please repeat that slowly?",
  "Thank you for your assistance.",
  "Where is the nearest hospital?",
  "I understand what you are saying.",
  "Please write it down for me.",
  "I am feeling much better now.",
];
const GLOSSES = [
  ["HELLO","HOW","YOU"],["NEED","HELP","MEDICINE"],["PLEASE","REPEAT","SLOW"],
  ["THANK","YOU","HELP"],["WHERE","HOSPITAL","NEAR"],["UNDERSTAND","YOU"],
  ["PLEASE","WRITE","DOWN"],["FEEL","BETTER","NOW"],
];
interface Rec { id:number; sentence:string; gloss:string; conf:number; ctx:string; ts:string; }

export default function TranslatePage() {
  const [cam,setCam]               = useState(false);
  const [mic,setMic]               = useState(false);
  const [running,setRunning]       = useState(false);
  const [ctx,setCtx]               = useState("Social");
  const [showCalib,setShowCalib]   = useState(false);
  const [calibStep,setCalibStep]   = useState(0);
  const [calibrated,setCalibrated] = useState(false);
  const [conf,setConf]             = useState(0);
  const [fps,setFps]               = useState(0);
  const [latency,setLatency]       = useState(0);
  const [sentence,setSentence]     = useState("");
  const [gloss,setGloss]           = useState("");
  const [speech,setSpeech]         = useState("");
  const [recs,setRecs]             = useState<Rec[]>([]);
  const [lm,setLm]                 = useState<{x:number;y:number}[]>([]);
  const [pipe,setPipe]             = useState({ mp:false, lstm:false, llm:false });

  const vidRef  = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const fpsRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const idRef   = useRef(0);

  useEffect(() => {
    if (running) {
      setTimeout(() => setPipe(p => ({...p, mp:true})),   400);
      setTimeout(() => setPipe(p => ({...p, lstm:true})), 900);
      setTimeout(() => setPipe(p => ({...p, llm:true})),  1500);
      let i = 0;
      loopRef.current = setInterval(() => {
        const s = SENTENCES[i % SENTENCES.length];
        const c = 83 + Math.floor(Math.random()*16);
        const l = 110 + Math.floor(Math.random()*80);
        setSentence(s);
        setGloss(GLOSSES[i%GLOSSES.length].join(" · "));
        setConf(c); setLatency(l);
        setLm(Array.from({length:21},(_,k)=>({
          x:12+Math.sin(k*1.1+Date.now()*0.002)*42+Math.random()*5,
          y:12+Math.cos(k*0.9+Date.now()*0.002)*42+Math.random()*5,
        })));
        setRecs(r => [{
          id:++idRef.current, sentence:s,
          gloss:GLOSSES[i%GLOSSES.length].join(" "),
          conf:c, ctx, ts:new Date().toLocaleTimeString(),
        }, ...r].slice(0,30));
        i++;
      }, 3200);
      fpsRef.current = setInterval(() => setFps(28+Math.floor(Math.random()*4)), 700);
    } else {
      loopRef.current && clearInterval(loopRef.current);
      fpsRef.current  && clearInterval(fpsRef.current);
      setPipe({mp:false,lstm:false,llm:false}); setLm([]);
    }
    return () => {
      loopRef.current && clearInterval(loopRef.current);
      fpsRef.current  && clearInterval(fpsRef.current);
    };
  }, [running, ctx]);

  const toggleCam = async () => {
    if (!cam) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({video:true});
        if (vidRef.current) { vidRef.current.srcObject = s; vidRef.current.play(); }
      } catch {}
      setCam(true);
    } else {
      if (vidRef.current?.srcObject)
        (vidRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      if (vidRef.current) vidRef.current.srcObject = null;
      setCam(false); setRunning(false);
    }
  };

  const doCalib = () => {
    if (calibStep < 3) setCalibStep(s => s+1);
    else { setCalibrated(true); setShowCalib(false); setCalibStep(0); }
  };

  const exportCSV = () => {
    const c = ["ID,Sentence,Gloss,Confidence,Mode,Time",
      ...recs.map(r=>`${r.id},"${r.sentence}","${r.gloss}",${r.conf}%,${r.ctx},${r.ts}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv,"+encodeURIComponent(c);
    a.download = "signsync_session.csv"; a.click();
  };

  /* ── small reusable pipe chip ── */
  const PipeChip = ({label,active,color}:{label:string;active:boolean;color:string}) => (
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"6px 12px", borderRadius:"var(--r)",
      background:active?`${color}14`:"var(--bg-2)",
      border:`1px solid ${active?color:"var(--b)"}`,
      transition:"all 0.35s",
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:active?color:"var(--b2)",display:"block",flexShrink:0}} className={active?"pulse":""}/>
      <span style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:active?color:"var(--t4)"}}>{label}</span>
    </div>
  );

  /* ── icon helpers ── */
  const CopyIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
  const TrashIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
  const DlIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column" }}>
      <Navbar />

      {/* ── TOP BAR ── */}
      <div style={{ background:"var(--bg-1)", borderBottom:"1px solid var(--b)" }}>
        <div className="wrap" style={{ height:52, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:15, fontWeight:700, color:"var(--t1)" }}>Live Translator</span>
            <span style={{ width:1, height:16, background:"var(--b)", display:"block" }}/>
            <span style={{ fontSize:12, color:"var(--t4)" }}>Sign → AI → Speech &nbsp;·&nbsp; Speech → Text</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* context */}
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"var(--bg-2)", border:"1px solid var(--b)", borderRadius:"var(--r)", padding:"5px 12px" }}>
              <span style={{ fontSize:10, fontWeight:700, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace" }}>MODE</span>
              <select value={ctx} onChange={e=>setCtx(e.target.value)} style={{ background:"none", border:"none", color:"var(--v2)", fontWeight:700, fontSize:13, cursor:"pointer", outline:"none" }}>
                {["Social","Medical","Legal"].map(c=><option key={c} style={{background:"var(--bg-2)"}}>{c}</option>)}
              </select>
            </div>
            {/* calibrate */}
            <button onClick={()=>setShowCalib(true)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:"var(--r)", border:"1px solid", cursor:"pointer", fontSize:12, fontWeight:600, transition:"all 0.2s", borderColor:calibrated?"var(--teal)":"var(--b)", background:calibrated?"var(--teal-s)":"var(--bg-2)", color:calibrated?"var(--teal)":"var(--t3)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              {calibrated ? "Calibrated ✓" : "Calibrate"}
            </button>
            {/* status */}
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:"var(--r)", background:"var(--bg-2)", border:"1px solid var(--b)", fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:running?"var(--green)":"var(--t4)" }}>
              <span style={{width:6,height:6,borderRadius:"50%",background:running?"var(--green)":"var(--b2)",display:"block"}} className={running?"pulse":""}/>
              {running ? "LIVE" : "IDLE"}
            </div>
            {running && (
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"var(--v2)", background:"var(--vs)", padding:"5px 10px", borderRadius:"var(--r)", border:"1px solid rgba(109,87,252,0.2)" }}>
                {fps}fps · {latency}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── CALIBRATION MODAL ── */}
      {showCalib && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }}>
          <div className="card" style={{ width:460, padding:32 }}>
            <h2 style={{ fontSize:20, fontWeight:800, color:"var(--t1)", marginBottom:6 }}>Calibration Wizard</h2>
            <p style={{ fontSize:13, color:"var(--t3)", marginBottom:24 }}>60-second setup to personalise recognition for your signing style.</p>
            {/* progress */}
            <div style={{ display:"flex", gap:6, marginBottom:24 }}>
              {["Arm Length","Hand Scale","Speed","Done"].map((s,i) => (
                <div key={s} style={{ flex:1 }}>
                  <div style={{ height:2, borderRadius:2, background:i<=calibStep?"var(--v)":"var(--b)", marginBottom:6, transition:"background 0.3s" }}/>
                  <div style={{ fontSize:10, color:i<=calibStep?"var(--v2)":"var(--t4)", fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"var(--vs)", border:"1px solid rgba(109,87,252,0.2)", borderRadius:"var(--r2)", padding:18, marginBottom:22 }}>
              {calibStep===0 && <><p style={{fontWeight:700,color:"var(--v2)",marginBottom:6,fontSize:14}}>Step 1 — Arm Length</p><p style={{fontSize:13,color:"var(--t2)"}}>Stretch both arms out horizontally and hold for 3 seconds.</p></>}
              {calibStep===1 && <><p style={{fontWeight:700,color:"var(--v2)",marginBottom:6,fontSize:14}}>Step 2 — Hand Scale</p><p style={{fontSize:13,color:"var(--t2)"}}>Hold both open palms facing the camera at shoulder width.</p></>}
              {calibStep===2 && <><p style={{fontWeight:700,color:"var(--v2)",marginBottom:6,fontSize:14}}>Step 3 — Signing Speed</p><p style={{fontSize:13,color:"var(--t2)"}}>Sign the letters A through E at your natural pace.</p></>}
              {calibStep===3 && <><p style={{fontWeight:700,color:"var(--green)",marginBottom:6,fontSize:14}}>✓ Calibration complete</p><p style={{fontSize:13,color:"var(--t2)"}}>Your profile is saved. Recognition is now tuned to your style.</p></>}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{setShowCalib(false);setCalibStep(0);}} className="btn btn-outline" style={{flex:1,padding:"10px 0"}}>Cancel</button>
              <button onClick={doCalib} className="btn btn-v" style={{flex:2,padding:"10px 0"}}>{calibStep<3?`Next (${calibStep+1}/3)`:"Save Profile"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex:1, padding:"20px 40px", maxWidth:1440, width:"100%", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, alignItems:"start" }}>

        {/* ═══ LEFT PANEL ═══ */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Camera card */}
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            {/* card header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid var(--b)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{width:7,height:7,borderRadius:"50%",background:cam?"var(--green)":"var(--b2)",display:"block"}} className={cam?"pulse":""}/>
                <span style={{ fontWeight:700, fontSize:13, color:"var(--t1)" }}>Camera Feed</span>
                {cam && <span className="badge bt" style={{fontSize:10}}>LIVE</span>}
              </div>
              {running && <span className="badge bv" style={{fontSize:10}}>AI ACTIVE</span>}
            </div>

            {/* video */}
            <div style={{ position:"relative", background:"#050608", aspectRatio:"16/9" }}>
              <video ref={vidRef} style={{ width:"100%", height:"100%", objectFit:"cover", display:cam?"block":"none" }}/>
              {!cam && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
                  <div style={{ width:64, height:64, borderRadius:"50%", border:"1.5px dashed var(--b2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </div>
                  <p style={{ fontSize:13, color:"var(--t4)" }}>Enable camera to start</p>
                </div>
              )}

              {/* landmarks */}
              {running && lm.length > 0 && (
                <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {lm.slice(0,20).map((p,i) => <line key={i} x1={p.x} y1={p.y} x2={lm[i+1].x} y2={lm[i+1].y} stroke="#8b78fd" strokeWidth="0.5" opacity="0.4"/>)}
                  {lm.map((p,i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.2" fill="#8b78fd" opacity="0.9">
                      <animate attributeName="r" values="0.9;1.8;0.9" dur="1.5s" repeatCount="indefinite"/>
                    </circle>
                  ))}
                </svg>
              )}

              {/* live overlays */}
              {running && (
                <>
                  <div style={{ position:"absolute", top:10, left:10, display:"flex", gap:6 }}>
                    <span style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(5,6,8,0.85)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:100, padding:"3px 8px", fontSize:10, fontWeight:700, color:"var(--green)" }}>{conf}% conf</span>
                    <span style={{ background:"rgba(5,6,8,0.85)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:100, padding:"3px 8px", fontSize:10, fontWeight:700, color:"var(--v2)" }}>{fps} FPS</span>
                  </div>
                  <div style={{ position:"absolute", top:10, right:10 }}>
                    <span style={{ background:"rgba(5,6,8,0.85)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:100, padding:"3px 8px", fontSize:10, fontWeight:700, color:"var(--t2)" }}>{ctx}</span>
                  </div>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 14px", background:"linear-gradient(transparent,rgba(5,6,8,0.94))" }}>
                    <div style={{ fontSize:9, color:"rgba(244,244,246,0.3)", fontFamily:"'JetBrains Mono',monospace", marginBottom:3 }}>GLOSS</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--t1)", fontFamily:"'JetBrains Mono',monospace" }}>{gloss || "—"}</div>
                  </div>
                </>
              )}
            </div>

            {/* controls */}
            <div style={{ display:"flex", gap:8, padding:"12px 14px", borderTop:"1px solid var(--b)" }}>
              <button onClick={toggleCam} style={{ flex:1, padding:"9px 0", borderRadius:"var(--r)", border:"1px solid", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:12, fontWeight:600, transition:"all 0.18s", borderColor:cam?"var(--green)":"var(--b)", background:cam?"var(--green-s)":"var(--bg-2)", color:cam?"var(--green)":"var(--t3)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                {cam ? "Camera On" : "Camera"}
              </button>
              <button onClick={()=>setMic(v=>!v)} style={{ flex:1, padding:"9px 0", borderRadius:"var(--r)", border:"1px solid", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:12, fontWeight:600, transition:"all 0.18s", borderColor:mic?"var(--amber)":"var(--b)", background:mic?"var(--amber-s)":"var(--bg-2)", color:mic?"var(--amber)":"var(--t3)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                {mic ? "Mic On" : "Mic"}
              </button>
              <button onClick={()=>setRunning(v=>!v)} className={running?"":"btn btn-v"} style={{ flex:3, padding:"9px 0", borderRadius:"var(--r)", border:"1px solid", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontSize:13, fontWeight:700, transition:"all 0.18s", borderColor:running?"var(--rose)":"transparent", background:running?"var(--rose-s)":undefined, color:running?"var(--rose)":undefined }}>
                {running
                  ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Stop Session</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Start Translating</>
                }
              </button>
            </div>
          </div>

          {/* AI Translation output */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <span style={{width:7,height:7,borderRadius:"50%",background:running?"var(--v2)":"var(--b2)",display:"block"}} className={running?"pulse":""}/>
                <span style={{ fontWeight:700, fontSize:13, color:"var(--t1)" }}>AI Translation Output</span>
              </div>
              {sentence && (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>navigator.clipboard?.writeText(sentence)} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:"var(--r)", border:"1px solid var(--b)", background:"var(--bg-2)", color:"var(--t3)", fontSize:11, cursor:"pointer" }}><CopyIcon/> Copy</button>
                  <button style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:"var(--r)", border:"1px solid var(--b)", background:"var(--bg-2)", color:"var(--t3)", fontSize:11, cursor:"pointer" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    Speak
                  </button>
                </div>
              )}
            </div>
            <div style={{ minHeight:78, padding:"16px 18px", background:sentence?"var(--vs)":"var(--bg-2)", borderRadius:"var(--r2)", border:`1px solid ${sentence?"rgba(109,87,252,0.25)":"var(--b)"}`, transition:"all 0.3s" }}>
              {sentence
                ? <p style={{ fontSize:19, fontWeight:700, color:"var(--t1)", lineHeight:1.4 }}>"{sentence}"</p>
                : <p style={{ fontSize:13, color:"var(--t4)", fontStyle:"italic" }}>Translation appears here once you start signing...</p>
              }
            </div>
            {sentence && (
              <div style={{ display:"flex", gap:16, marginTop:10 }}>
                <span style={{ fontSize:12, color:"var(--t4)" }}>Mode: <strong style={{color:"var(--v2)"}}>{ctx}</strong></span>
                <span style={{ fontSize:12, color:"var(--t4)" }}>Conf: <strong style={{color:"var(--green)"}}>{conf}%</strong></span>
                <span style={{ fontSize:12, color:"var(--t4)" }}>Latency: <strong style={{color:"var(--v2)"}}>{latency}ms</strong></span>
              </div>
            )}
          </div>

          {/* Pipeline status */}
          <div className="card" style={{ padding:"14px 16px" }}>
            <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", marginBottom:10 }}>AI Pipeline</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
              <PipeChip label="MediaPipe"  active={pipe.mp}   color="var(--v2)"/>
              <PipeChip label="ConvLSTM"   active={pipe.lstm} color="var(--teal)"/>
              <PipeChip label="LLM"        active={pipe.llm}  color="var(--green)"/>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Speech input */}
          <div className="card" style={{ padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={mic?"var(--amber)":"var(--t4)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                <span style={{ fontWeight:700, fontSize:13, color:"var(--t1)" }}>Hearing User — Speech Input</span>
              </div>
              {mic && (
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div className="waveform">{[0,1,2,3,4,5].map(i=><span key={i}/>)}</div>
                  <span className="badge ba" style={{fontSize:10}}>Listening</span>
                </div>
              )}
            </div>
            <textarea
              value={speech}
              onChange={e=>setSpeech(e.target.value)}
              rows={4}
              placeholder="Hearing user's speech is transcribed here for the Deaf user to read in real time..."
              style={{ width:"100%", padding:"12px 14px", background:"var(--bg-2)", border:"1px solid var(--b)", borderRadius:"var(--r2)", color:"var(--t1)", fontSize:14, resize:"none", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.65, transition:"border-color 0.2s", display:"block" }}
              onFocus={e => e.target.style.borderColor="rgba(109,87,252,0.5)"}
              onBlur={e  => e.target.style.borderColor="var(--b)"}
            />
            <p style={{ fontSize:11, color:"var(--t4)", marginTop:7, fontFamily:"'JetBrains Mono',monospace" }}>Powered by Web Speech API · Real-time STT</p>
          </div>

          {/* History */}
          <div className="card" style={{ overflow:"hidden", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--b)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontWeight:700, fontSize:13, color:"var(--t1)" }}>Translation History</span>
                {recs.length > 0 && <span className="badge bv" style={{fontSize:10}}>{recs.length}</span>}
              </div>
              {recs.length > 0 && (
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:"var(--r)", border:"1px solid var(--b)", background:"var(--bg-2)", color:"var(--t3)", fontSize:11, cursor:"pointer" }}><DlIcon/> Export</button>
                  <button onClick={()=>setRecs([])} style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 9px", borderRadius:"var(--r)", border:"1px solid var(--b)", background:"var(--rose-s)", color:"var(--rose)", fontSize:11, cursor:"pointer" }}><TrashIcon/> Clear</button>
                </div>
              )}
            </div>
            <div style={{ overflowY:"auto", maxHeight:360, padding:12, display:"flex", flexDirection:"column", gap:8 }}>
              {recs.length === 0 ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:"44px 0" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--b2)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                  <p style={{ fontSize:13, color:"var(--t4)" }}>Translations appear here during a session</p>
                </div>
              ) : recs.map((r,i) => (
                <div key={r.id} style={{ padding:"12px 14px", background:i===0?"var(--vs)":"var(--bg-2)", borderRadius:"var(--r2)", border:`1px solid ${i===0?"rgba(109,87,252,0.25)":"var(--b)"}` }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8, marginBottom:6 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:"var(--t1)", lineHeight:1.4, flex:1 }}>{r.sentence}</p>
                    <button onClick={()=>navigator.clipboard?.writeText(r.sentence)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--t4)", padding:2, flexShrink:0 }}><CopyIcon/></button>
                  </div>
                  <div style={{ fontSize:11, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", marginBottom:8 }}>{r.gloss}</div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span className="badge bg" style={{fontSize:10}}>{r.conf}%</span>
                    <span className={`badge ${r.ctx==="Medical"?"bt":r.ctx==="Legal"?"br":"bv"}`} style={{fontSize:10}}>{r.ctx}</span>
                    <span style={{ fontSize:11, color:"var(--t4)", marginLeft:"auto", fontFamily:"'JetBrains Mono',monospace" }}>{r.ts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session stats */}
          {recs.length > 0 && (
            <div className="card" style={{ padding:"14px 16px" }}>
              <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace", marginBottom:12 }}>Session Stats</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {[
                  { v:recs.length,                                                                   l:"Signs",   c:"var(--v2)"  },
                  { v:`${Math.round(recs.reduce((s,r)=>s+r.conf,0)/recs.length)}%`,                  l:"Avg Conf",c:"var(--green)"},
                  { v:`${latency}ms`,                                                                l:"Latency", c:"var(--teal)"},
                  { v:fps>0?`${fps}fps`:"—",                                                        l:"FPS",     c:"var(--amber)"},
                ].map(({v,l,c}) => (
                  <div key={l} style={{ textAlign:"center", padding:"10px 8px", background:"var(--bg-2)", borderRadius:"var(--r)", border:"1px solid var(--b)" }}>
                    <div style={{ fontSize:18, fontWeight:800, color:c, letterSpacing:"-0.5px" }}>{v}</div>
                    <div style={{ fontSize:10, color:"var(--t4)", marginTop:3, fontFamily:"'JetBrains Mono',monospace" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
