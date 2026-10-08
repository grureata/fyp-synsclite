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
              SignSync Lite is a prototype web application with account-backed sessions, calibration
              settings, and a model-backed classifier for isolated static ASL fingerspelling.
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
                The current classifier accepts one explicitly captured camera frame at a time.
                It does not interpret words or continuous signing and is not a substitute for an interpreter.
              </p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {n:"API",    l:"Express backend and account authentication", c:"var(--v2)"},
                {n:"SQL",    l:"PostgreSQL persistence through Prisma", c:"var(--rose)"},
                {n:"ASL",    l:"Static fingerspelling inference service", c:"var(--green)"},
                {n:"Local",  l:"Camera preview stays in the browser until capture", c:"var(--teal)"},
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
            <h2 style={{fontSize:"clamp(26px,3.5vw,40px)",fontWeight:800,color:"var(--t1)",letterSpacing:"-1.5px",marginBottom:12}}>Current project components.</h2>
            <p className="body" style={{maxWidth:420}}>            These are the implemented application surfaces and their data flow.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,position:"relative"}}>
            <div style={{position:"absolute",top:48,left:"12.5%",right:"12.5%",height:1,background:"linear-gradient(90deg,var(--v),var(--teal),var(--green))",opacity:0.25,borderRadius:1}}/>
            {[
              {n:"01",name:"Accounts", desc:"Registration and login issue an HttpOnly cookie. Public registration cannot choose an administrator role.", c:"var(--v2)",  bg:"var(--vs)"},
              {n:"02",name:"Persistence",desc:"Prisma stores users, context presets, calibration profiles, sessions, records, and contact messages.", c:"var(--teal)", bg:"var(--teal-s)"},
              {n:"03",name:"Web client",desc:"The dashboard, contact form, calibration settings, and session metadata use backend API requests.", c:"var(--amber)", bg:"var(--amber-s)"},
              {n:"04",name:"Inference",desc:"The backend forwards an explicitly captured frame to the private Python classifier; accepted letters are saved to the session.", c:"var(--green)", bg:"var(--green-s)"},
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
              {c:"var(--v2)",   title:"Account-backed API", body:"Users sign in with an HttpOnly cookie to access their sessions and profiles."},
              {c:"var(--teal)", title:"Context modes", body:"Social, Medical, and Legal presets are stored in PostgreSQL and loaded by the client."},
              {c:"var(--green)",title:"On-demand capture", body:"Video remains local until the user explicitly captures one frame for inference."},
              {c:"var(--amber)",title:"Calibration settings", body:"Users can save numeric calibration values to their account profile."},
              {c:"var(--rose)", title:"Limited static recognition", body:"A classifier recognizes selected held letters; it does not recognize words or continuous signing."},
              {c:"var(--v2)",   title:"Session history", body:"The dashboard displays and exports records supplied by the backend."},
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
              {c:"var(--teal)", title:"Privacy always",      body:"Camera frames are sent for inference only after capture and are not stored by the application."},
              {c:"var(--green)", title:"Honest capabilities", body:"The interface reports uncertain predictions and clearly explains the classifier's limitations."},
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
              Explore the prototype.
            </h2>
            <p className="body" style={{maxWidth:380,marginBottom:34}}>Sign in to try session and calibration workflows, plus on-demand static-letter recognition.</p>
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
          <p style={{fontSize:12,color:"var(--t4)"}}>© 2026 SignSync Lite prototype.</p>
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
