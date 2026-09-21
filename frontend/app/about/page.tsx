import Link from "next/link";
import Navbar from "../components/Navbar";

export default function AboutPage() {
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      <Navbar/>

      {/* HERO */}
      <section style={{padding:"88px 0 80px",borderBottom:"1px solid var(--b)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-200,right:-100,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(109,87,252,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className="wrap" style={{position:"relative"}}>
          <div style={{maxWidth:680}}>
            <span className="badge bv" style={{marginBottom:22,display:"inline-flex"}}>About SignSync</span>
            <h1 style={{fontSize:"clamp(40px,6vw,72px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-2.5px",lineHeight:1.0,marginBottom:22}}>
              Communication<br/>
              <span style={{color:"var(--v2)"}}>without barriers.</span>
            </h1>
            <p className="body" style={{maxWidth:520,marginBottom:36,lineHeight:1.85}}>
              SignSync is an AI-powered real-time sign language translation platform. It bridges
              Deaf and hearing people through a standard camera — no gloves, no hardware, no friction.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Link href="/translate" className="btn btn-v" style={{padding:"12px 26px",fontSize:14}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Try It Free
              </Link>
              <Link href="/dashboard" className="btn btn-outline" style={{padding:"12px 22px",fontSize:14}}>View Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section style={{padding:"80px 0",borderBottom:"1px solid var(--b)"}}>
        <div className="wrap">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:72,alignItems:"center"}}>
            <div>
              <p className="label" style={{marginBottom:14}}>Our Mission</p>
              <h2 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:20}}>
                Make every conversation<br/>
                <span style={{color:"var(--v2)"}}>fully accessible.</span>
              </h2>
              <p className="body" style={{marginBottom:16,lineHeight:1.85}}>
                Over 70 million people worldwide rely on sign language as their primary language.
                Yet most hearing people cannot understand it — creating barriers in hospitals, courts,
                schools, and everyday life.
              </p>
              <p className="body" style={{lineHeight:1.85}}>
                We built SignSync to close that gap. AI-driven, real-time, and completely free.
                Open a browser, point your camera, and start communicating.
              </p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {n:"70M+",   l:"Deaf people worldwide rely on sign language",         c:"var(--v2)"},
                {n:"< 1%",   l:"Of hearing people understand sign language",          c:"var(--rose)"},
                {n:"$0",     l:"Cost to use SignSync — free, always",                 c:"var(--green)"},
                {n:"< 200ms",l:"End-to-end latency, gesture to translated sentence",  c:"var(--teal)"},
              ].map(({n,l,c})=>(
                <div key={n} className="card" style={{padding:"16px 20px",display:"flex",gap:18,alignItems:"center"}}>
                  <div style={{fontSize:24,fontWeight:800,color:c,minWidth:72,flexShrink:0,letterSpacing:"-1px"}}>{n}</div>
                  <p style={{fontSize:13,color:"var(--t3)",lineHeight:1.5}}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:"80px 0",borderBottom:"1px solid var(--b)"}}>
        <div className="wrap">
          <div style={{marginBottom:48}}>
            <p className="label" style={{marginBottom:12}}>Under the Hood</p>
            <h2 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-1.5px",marginBottom:12}}>Four AI layers. One experience.</h2>
            <p className="body" style={{maxWidth:420}}>All working together in under 200 milliseconds.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative"}}>
            <div style={{position:"absolute",top:48,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,var(--v),var(--teal),var(--green))",opacity:0.25,borderRadius:1}}/>
            {[
              {n:"01",name:"Perception", desc:"MediaPipe Holistic tracks 543 body landmarks per frame — hands, face, and posture — at 30 FPS on any camera.", c:"var(--v2)",  bg:"var(--vs)"},
              {n:"02",name:"Recognition",desc:"DeepConvLSTM analyses a 30-frame sliding window to classify gesture sequences into sign glosses with confidence scores.", c:"var(--teal)", bg:"var(--teal-s)"},
              {n:"03",name:"Translation",desc:"An LLM receives the gloss sequence and produces a grammatically correct, context-aware English sentence instantly.", c:"var(--amber)", bg:"var(--amber-s)"},
              {n:"04",name:"Output",     desc:"The sentence displays for the hearing user. Their spoken reply is transcribed for the Deaf user in real time.", c:"var(--green)", bg:"var(--green-s)"},
            ].map(({n,name,desc,c,bg})=>(
              <div key={n} style={{padding:"0 20px",textAlign:"center"}}>
                <div style={{width:64,height:64,borderRadius:"50%",background:bg,border:`1.5px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",position:"relative",zIndex:1}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:12,color:c}}>{n}</span>
                </div>
                <p style={{fontSize:10,fontWeight:700,color:c,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.08em",marginBottom:8}}>LAYER {n}</p>
                <h3 style={{fontSize:16,fontWeight:700,color:"var(--t1)",marginBottom:10}}>{name}</h3>
                <p style={{fontSize:13,color:"var(--t3)",lineHeight:1.75}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"80px 0",borderBottom:"1px solid var(--b)"}}>
        <div className="wrap">
          <div style={{marginBottom:44}}>
            <p className="label" style={{marginBottom:12}}>Features</p>
            <h2 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-1.5px",maxWidth:420}}>Built for real conversations.</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {c:"var(--v2)",   title:"Bidirectional",        body:"Sign to speech for hearing users. Speech to text for Deaf users. Full equal conversation in both directions."},
              {c:"var(--teal)", title:"Context modes",         body:"Social, Medical, and Legal presets tune the AI vocabulary to match your exact situation."},
              {c:"var(--green)",title:"Zero hardware",         body:"Any webcam or phone camera. No sensor gloves, depth cameras, or expensive equipment."},
              {c:"var(--amber)",title:"Personal calibration",  body:"A 60-second wizard learns your hand size, arm span, and pace for noticeably better accuracy."},
              {c:"var(--rose)", title:"Privacy by design",     body:"Only skeletal landmark coordinates processed. Raw video never leaves your device."},
              {c:"var(--v2)",   title:"Session history",       body:"Every translation logged with confidence scores and timestamps. Export to CSV anytime."},
            ].map(({c,title,body})=>(
              <div key={title} className="card" style={{padding:"20px 18px"}}>
                <div style={{width:30,height:30,borderRadius:8,background:`${c}18`,border:`1px solid ${c}25`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:c}}/>
                </div>
                <p style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:8}}>{title}</p>
                <p style={{fontSize:13,color:"var(--t3)",lineHeight:1.75}}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section style={{padding:"80px 0",borderBottom:"1px solid var(--b)"}}>
        <div className="wrap">
          <div style={{marginBottom:44}}>
            <p className="label" style={{marginBottom:12}}>Our Values</p>
            <h2 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-1.5px",maxWidth:340}}>What drives us</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {[
              {c:"var(--v2)",   title:"Accessibility first",body:"Every decision starts with one question: does this make communication more accessible for Deaf people?"},
              {c:"var(--teal)", title:"Privacy always",      body:"We process only skeletal landmarks. Raw video and audio never leave your device, ever."},
              {c:"var(--green)",title:"Always improving",    body:"We improve the model, expand vocabulary, and listen to users. Better translation with every update."},
            ].map(({c,title,body})=>(
              <div key={title} style={{padding:"26px 22px",background:"var(--bg-2)",borderRadius:"var(--r3)",border:"1px solid var(--b)"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:`${c}14`,border:`1px solid ${c}28`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:c}}/>
                </div>
                <p style={{fontSize:15,fontWeight:700,color:"var(--t1)",marginBottom:10}}>{title}</p>
                <p style={{fontSize:13,color:"var(--t3)",lineHeight:1.75}}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"88px 0",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:700,height:350,borderRadius:"50%",background:"radial-gradient(circle,rgba(109,87,252,0.1) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <div className="wrap" style={{position:"relative"}}>
          <div style={{maxWidth:500}}>
            <p className="label" style={{marginBottom:16}}>Get Started</p>
            <h2 style={{fontSize:"clamp(32px,5vw,56px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-2px",lineHeight:1.05,marginBottom:18}}>
              Start signing today.
            </h2>
            <p className="body" style={{maxWidth:380,marginBottom:34}}>Free. No account. No downloads. Open SignSync and start communicating right now.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <Link href="/translate" className="btn btn-white" style={{padding:"12px 32px",fontSize:14}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Open Translator
              </Link>
              <Link href="/dashboard" className="btn btn-outline" style={{padding:"12px 22px",fontSize:14}}>View Dashboard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid var(--b)",padding:"26px 0"}}>
        <div className="wrap" style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:7,background:"var(--v)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </div>
            <span style={{fontWeight:800,fontSize:14,color:"var(--t1)"}}>SignSync</span>
          </div>
          <p style={{fontSize:12,color:"var(--t4)"}}>© 2026 SignSync. Making communication accessible for everyone.</p>
          <div style={{display:"flex",gap:20}}>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
