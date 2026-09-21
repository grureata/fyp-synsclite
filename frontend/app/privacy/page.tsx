import Link from "next/link";
import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      body: `SignSync is built with privacy as a core principle, not an afterthought. When you use our translator, your camera captures video locally on your device. We process this into skeletal landmark coordinates — 543 numbered points tracking your hands, face, and posture. Raw video frames are never transmitted to our servers. The only data that leaves your device is anonymized landmark coordinates used for real-time inference.`,
    },
    {
      title: "How AI Processing Works",
      body: `Landmark data is sent over an encrypted WebSocket connection to our inference API, processed to produce a translation, and the result is returned to your browser. We do not store landmark sequences or translation outputs. Each session is ephemeral — when you close the tab, all data is discarded. We do not build user profiles from your signing patterns.`,
    },
    {
      title: "Session History",
      body: `If you enable session history, translations are stored locally in your browser's storage. This data never leaves your device unless you explicitly export it. You can clear your local session history at any time from the Dashboard. SignSync servers hold no copy of your conversation history.`,
    },
    {
      title: "Cookies & Analytics",
      body: `We use a single first-party analytics cookie to understand aggregate usage patterns — pages visited, session duration, and feature engagement. We do not use third-party advertising cookies. We do not sell, share, or monetize user data in any form. You can opt out of analytics in Settings → Privacy.`,
    },
    {
      title: "Your Rights",
      body: `You have the right to access, correct, or delete any data we hold about you. Since we retain minimal data by design, most requests resolve immediately. For questions or deletion requests, contact privacy@signsync.app. We respond to all privacy requests within 7 business days.`,
    },
    {
      title: "Children's Privacy",
      body: `SignSync does not knowingly collect information from children under 13. If you believe a child has used our service, contact us and we will take immediate steps to remove any associated data. Our service is intended for users 13 and older.`,
    },
    {
      title: "Changes to This Policy",
      body: `When we update this policy, we will post the revised version here with an updated effective date and notify registered users by email. Continued use of SignSync after changes means you accept the updated terms.`,
    },
  ];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Navbar/>

      {/* HERO */}
      <section style={{ padding:"80px 0 64px", borderBottom:"1px solid var(--b)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-200, right:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(45,232,200,0.08) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div className="wrap" style={{ position:"relative", maxWidth:760 }}>
          <p className="label" style={{ marginBottom:16 }}>Legal</p>
          <h1 style={{ fontSize:"clamp(36px,5vw,60px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-2px", lineHeight:1.05, marginBottom:20 }}>
            Privacy <span className="grad-text">Policy</span>
          </h1>
          <p className="body" style={{ maxWidth:520, lineHeight:1.8 }}>
            SignSync is designed to protect your privacy at every layer. This policy explains what we collect, how we use it, and the choices you have — in plain language.
          </p>
          <p style={{ marginTop:16, fontSize:12, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace" }}>Effective: January 1, 2026 · Last updated: May 31, 2026</p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding:"72px 0 96px" }}>
        <div className="wrap" style={{ maxWidth:760 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:40 }}>
            {sections.map(({ title, body }, i) => (
              <div key={title} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:40 }}>
                <div>
                  <div style={{ width:28, height:28, borderRadius:8, background:"rgba(124,106,255,0.12)", border:"1px solid rgba(124,106,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"var(--v2)" }}>0{i+1}</span>
                  </div>
                  <h2 style={{ fontSize:16, fontWeight:700, color:"var(--t1)", lineHeight:1.3, letterSpacing:"-0.3px" }}>{title}</h2>
                </div>
                <div>
                  <p className="body" style={{ lineHeight:1.85 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:56, padding:"24px", background:"var(--bg-2)", border:"1px solid var(--b2)", borderRadius:"var(--r3)" }}>
            <p style={{ fontSize:14, color:"var(--t2)", lineHeight:1.75 }}>
              Questions about this policy? Reach us at{" "}
              <Link href="/contact" style={{ color:"var(--teal)", textDecoration:"underline", textUnderlineOffset:3 }}>privacy@signsync.app</Link>
              {" "}or visit our{" "}
              <Link href="/contact" style={{ color:"var(--teal)", textDecoration:"underline", textUnderlineOffset:3 }}>Contact page</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid var(--b)", padding:"32px 0" }}>
        <div className="wrap" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--v),#5a4de6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </div>
            <span style={{ fontWeight:800, fontSize:15, color:"var(--t1)" }}>Sign<span style={{ color:"var(--teal)" }}>Sync</span></span>
          </Link>
          <p style={{ fontSize:12, color:"var(--t4)" }}>© 2026 SignSync. Making communication accessible for everyone.</p>
          <div style={{ display:"flex", gap:22 }}>
            <Link href="/privacy" className="footer-link" style={{ color:"var(--teal)" }}>Privacy</Link>
            <Link href="/terms" className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
