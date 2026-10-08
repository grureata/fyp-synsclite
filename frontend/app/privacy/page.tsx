import Link from "next/link";
import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      body: `When you create an account, SignSync stores your username, email address, and a password hash. Contact form submissions are stored by the backend. Calibration profiles, session metadata, and accepted static-letter recognition records are associated with your account. When you explicitly request recognition, one still camera frame is sent to the backend and inference service for processing. The application code does not store the camera frame.`,
    },
    {
      title: "How AI Processing Works",
      body: `The prototype recognizes a limited set of isolated static ASL fingerspelling handshapes and returns English letter labels. The captured frame is processed by the configured inference service; confidence below a validation-selected threshold is shown as uncertain. J and Z, which require movement, and all continuous signing, words, phrases, facial grammar, and sentence translation are unsupported. This is not an interpreter and must not be relied upon for consequential communication.`,
    },
    {
      title: "Session History",
      body: `When signed in, session metadata, calibration values, and translation records created through the API are stored in the configured PostgreSQL database. The dashboard can export the records it displays. Contact the project maintainers to request account-data changes or deletion; the application does not currently provide account deletion.`,
    },
    {
      title: "Cookies & Analytics",
      body: `Signing in sets an HttpOnly authentication cookie. The current application does not implement analytics or advertising cookies. The backend also writes HTTP request metadata to its configured application logs; operators should protect and retain those logs according to their deployment policy.`,
    },
    {
      title: "Your Rights",
      body: `For questions about account or contact-form data, use the Contact page to reach the project maintainers. The current application has no self-service account deletion or data-retention controls, so deployment operators must handle requests directly.`,
    },
    {
      title: "Children's Privacy",
      body: `The prototype does not verify a user's age. Operators should establish and communicate appropriate age requirements before deployment.`,
    },
    {
      title: "Changes to This Policy",
      body: `When this policy changes, the revised version may be posted here with an updated date. The current application does not send email notifications about policy changes.`,
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
            This policy describes the data flows currently implemented in the SignSync Lite prototype.
          </p>
          <p style={{ marginTop:16, fontSize:12, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace" }}>Reviewed: October 8, 2026</p>
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
              Questions about this policy? Use the{" "}
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
          <p style={{ fontSize:12, color:"var(--t4)" }}>© 2026 SignSync Lite prototype.</p>
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
