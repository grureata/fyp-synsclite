import Link from "next/link";
import Navbar from "../components/Navbar";

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      body: "By accessing or using SignSync, you agree to these Terms of Service. If you do not agree, please do not use the platform. We may update these terms; continued use constitutes acceptance of the revised version.",
    },
    {
      title: "Permitted Use",
      body: "SignSync Lite is a software prototype. Its recognition feature classifies one explicitly captured, held static ASL fingerspelling handshape at a time. It does not recognize words, phrases, or continuous signing and is not an interpreter. Do not rely on it for medical, legal, emergency, or other consequential communication.",
    },
    {
      title: "Prohibited Conduct",
      body: "You agree not to use SignSync to: transmit harmful, abusive, or illegal content; attempt to circumvent rate limits or authentication; interfere with other users' access to the service; harvest data from the platform; or use the service in any way that violates applicable law.",
    },
    {
      title: "Intellectual Property",
      body: "The repository includes recognition-service code and training tooling; trained weights, source images, and the separate MediaPipe model asset are not included. Review the dataset and dependency licenses before distributing derived artifacts.",
    },
    {
      title: "Service Availability",
      body: "This prototype is provided for evaluation and has no uptime or availability guarantee. Features may be unavailable, incomplete, or changed. It is not a substitute for a qualified interpreter.",
    },
    {
      title: "Limitation of Liability",
      body: "The prototype has not been validated for accuracy, accessibility certification, or production use. Do not rely on it as the sole means of communication in a high-stakes setting.",
    },
    {
      title: "Governing Law",
      body: "This project does not specify a governing jurisdiction or provide legal advice. Consult the project maintainers for deployment-specific terms before using it beyond evaluation.",
    },
  ];

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Navbar/>

      {/* HERO */}
      <section style={{ padding:"80px 0 64px", borderBottom:"1px solid var(--b)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-200, left:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,106,255,0.08) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div className="wrap" style={{ position:"relative", maxWidth:760 }}>
          <p className="label" style={{ marginBottom:16 }}>Legal</p>
          <h1 style={{ fontSize:"clamp(36px,5vw,60px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-2px", lineHeight:1.05, marginBottom:20 }}>
            Terms of <span className="grad-text">Service</span>
          </h1>
          <p className="body" style={{ maxWidth:520, lineHeight:1.8 }}>
            These terms describe use of this prototype. Its static-letter recognition has not been validated for consequential communication.
          </p>
          <p style={{ marginTop:16, fontSize:12, color:"var(--t4)", fontFamily:"'JetBrains Mono',monospace" }}>Effective: January 1, 2026 · Last updated: October 8, 2026</p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding:"72px 0 96px" }}>
        <div className="wrap" style={{ maxWidth:760 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:40 }}>
            {sections.map(({ title, body }, i) => (
              <div key={title} style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:40 }}>
                <div>
                  <div style={{ width:28, height:28, borderRadius:8, background:"rgba(45,232,200,0.1)", border:"1px solid rgba(45,232,200,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:12 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:"var(--teal)" }}>0{i+1}</span>
                  </div>
                  <h2 style={{ fontSize:16, fontWeight:700, color:"var(--t1)", lineHeight:1.3, letterSpacing:"-0.3px" }}>{title}</h2>
                </div>
                <p className="body" style={{ lineHeight:1.85 }}>{body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop:56, padding:"24px", background:"var(--bg-2)", border:"1px solid var(--b2)", borderRadius:"var(--r3)" }}>
            <p style={{ fontSize:14, color:"var(--t2)", lineHeight:1.75 }}>
              Questions about these terms? Contact us at{" "}
              <Link href="/contact" style={{ color:"var(--teal)", textDecoration:"underline", textUnderlineOffset:3 }}>Contact page</Link>
              {" "}or visit our{" "}
              <Link href="/about" style={{ color:"var(--teal)", textDecoration:"underline", textUnderlineOffset:3 }}>About page</Link>.
            </p>
          </div>
        </div>
      </section>

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
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms" className="footer-link" style={{ color:"var(--teal)" }}>Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
