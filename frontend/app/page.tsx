"use client";
import Link from "next/link";
import Navbar from "./components/Navbar";

export default function Home() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "88px 0 96px" }}>
        <div className="mesh-bg"/>
        <div className="orb"      style={{ width: 700, height: 700, top: -220, right: -160, opacity: 0.8 }}/>
        <div className="orb-teal" style={{ width: 420, height: 420, bottom: -120, left: -90, opacity: 0.6 }}/>

        <div className="wrap" style={{ position: "relative" }}>
          <div className="hero-grid">

            {/* LEFT */}
            <div>
              <div className="u0" style={{ marginBottom: 24 }}>
                <span className="badge bt">
                  <span className="dot pulse" style={{ background: "var(--teal)" }}/>
                  Prototype · Static-letter recognition
                </span>
              </div>

              <h1 className="hero-title u1" style={{ marginBottom: 24 }}>
                Communication<br/>
                <span className="grad-text-anim">without barriers</span><br/>
                starts with access.
              </h1>

              <p className="body u2" style={{ maxWidth: 460, marginBottom: 40, fontSize: 16, lineHeight: 1.8 }}>
                SignSync Lite is an API-backed prototype for accounts, calibration, and session history,
                with on-demand recognition of isolated static ASL fingerspelling.
              </p>

              <div className="u3 cta-btns" style={{ marginBottom: 52 }}>
                <Link href="/translate" className="btn btn-v" style={{ padding: "14px 30px", fontSize: 15 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  Open Translator
                </Link>
                <Link href="/about" className="btn btn-outline" style={{ padding: "14px 22px", fontSize: 15 }}>
                  How it works
                </Link>
              </div>

              <div className="u4 stats-strip">
                {[
                  { v: "Local",      l: "Camera preview" },
                  { v: "API-backed", l: "Accounts & sessions" },
                  { v: "One frame",  l: "Sent on capture" },
                  { v: "Static",     l: "Letters only" },
                ].map(({ v, l }) => (
                  <div key={l} className="stat-item">
                    <div className="grad-text" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 4, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — preview card */}
            <div className="hero-float float">
              <div className="card-glass" style={{ overflow: "hidden", boxShadow: "0 24px 64px rgba(26,23,48,0.13), 0 0 0 1px rgba(127,119,221,0.15)" }}>
                <div style={{ background: "#100e22", aspectRatio: "4/3", position: "relative", overflow: "hidden" }}>
                  <svg width="100%" height="100%" viewBox="0 0 300 220" style={{ position: "absolute", inset: 0 }}>
                    {[[68,162,93,136],[93,136,110,110],[110,110,124,86],[124,86,132,64],[93,136,106,106],[106,106,118,80],[118,80,127,57],[93,136,100,112],[100,112,108,86],[108,86,114,62],[93,136,81,120],[81,120,73,97],[73,97,66,75]].map(([x1,y1,x2,y2],i) => (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9890e6" strokeWidth="1.4" opacity="0.5"/>
                    ))}
                    {[[68,162],[93,136],[110,110],[124,86],[132,64],[106,106],[118,80],[127,57],[100,112],[108,86],[114,62],[81,120],[73,97],[66,75]].map(([cx,cy],i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.5" fill="#9890e6" opacity="0.9">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.2+i*0.1}s`} repeatCount="indefinite"/>
                        <animate attributeName="r" values="2.5;4;2.5" dur={`${1.6+i*0.08}s`} repeatCount="indefinite"/>
                      </circle>
                    ))}
                    {[[218,156,197,130],[197,130,180,106],[180,106,166,83],[166,83,156,61]].map(([x1,y1,x2,y2],i) => (
                      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1aacab" strokeWidth="1.4" opacity="0.45"/>
                    ))}
                    {[[218,156],[197,130],[180,106],[166,83],[156,61]].map(([cx,cy],i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.5" fill="#1aacab" opacity="0.85">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.4+i*0.09}s`} repeatCount="indefinite"/>
                      </circle>
                    ))}
                    <line x1="0" y1="0" x2="300" y2="0" stroke="url(#scanGrad)" strokeWidth="1.5" opacity="0.7">
                      <animateTransform attributeName="transform" type="translate" from="0 0" to="0 220" dur="2.6s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" values="0;0.6;0" dur="2.6s" repeatCount="indefinite"/>
                    </line>
                    <defs>
                      <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="transparent"/>
                        <stop offset="50%" stopColor="#7f77dd"/>
                        <stop offset="100%" stopColor="transparent"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 6 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(16,14,34,0.85)", border: "1px solid rgba(26,172,171,0.28)", borderRadius: 100, padding: "3px 9px" }}>
                      <span className="dot pulse" style={{ background: "#22c55e", width: 6, height: 6 }}/>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", fontFamily: "'JetBrains Mono',monospace" }}>DEMO</span>
                    </span>
                    <span style={{ background: "rgba(16,14,34,0.85)", border: "1px solid rgba(152,144,230,0.28)", borderRadius: 100, padding: "3px 9px", fontSize: 10, fontWeight: 700, color: "#b8b2f0", fontFamily: "'JetBrains Mono',monospace" }}>ILLUSTRATIVE</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 14px", background: "linear-gradient(transparent,rgba(10,8,24,0.97))" }}>
                    <div style={{ fontSize: 9, color: "rgba(220,216,255,0.3)", fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>SAMPLE GLOSS · NOT RECOGNIZED</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#dcd8ff", fontFamily: "'JetBrains Mono',monospace" }}>HELLO · HOW · YOU</div>
                  </div>
                </div>
                <div style={{ padding: "14px 16px", borderTop: "1px solid var(--b)", background: "var(--bg-1)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--teal)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>ILLUSTRATIVE SAMPLE ONLY</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)", lineHeight: 1.35 }}>&quot;Hello, how are you?&quot;</div>
                </div>
                <div style={{ padding: "10px 14px", borderTop: "1px solid var(--b)", background: "var(--bg-1)" }}>
                  <Link href="/translate" className="btn btn-v" style={{ width: "100%", padding: "10px 0", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    Try it yourself →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ borderTop: "1px solid var(--b)", borderBottom: "1px solid var(--b)", padding: "14px 0", overflow: "hidden", background: "var(--bg-2)" }}>
        <div style={{ display: "flex", gap: 40, whiteSpace: "nowrap", animation: "scroll 22s linear infinite", width: "max-content" }}>
          {[...Array(2)].map((_,r) =>
            ["API-backed accounts","PostgreSQL sessions","Local camera preview","Context presets","Calibration settings","CSV export","Static-letter inference"].map((t,i) => (
              <span key={`${r}-${i}`} style={{ fontSize: 12, color: "var(--t3)", fontFamily: "'JetBrains Mono',monospace" }}>
                <span style={{ color: "var(--v)", marginRight: 14 }}>◆</span>{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "88px 0", borderBottom: "1px solid var(--b)", position: "relative", overflow: "hidden" }}>
        <div className="orb" style={{ width: 400, height: 400, top: -100, left: -100, opacity: 0.35 }}/>
        <div className="wrap" style={{ position: "relative" }}>
          <div className="hiw-grid">
            <div className="hiw-sticky" style={{ position: "sticky", top: 88 }}>
              <p className="label" style={{ marginBottom: 14 }}>How It Works</p>
              <h2 className="section-title" style={{ marginBottom: 16 }}>Three steps.<br/>Zero friction.</h2>
              <p className="body" style={{ marginBottom: 28 }}>Explore on-demand static-letter recognition, account-backed settings, and session history.</p>
              <Link href="/translate" className="btn btn-v">Start Now →</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { n: "01", c: "var(--v)",    cRaw: "127,119,221", title: "Sign in",               body: "Create an account to use the authenticated dashboard, calibration settings, and session endpoints." },
                { n: "02", c: "var(--teal)", cRaw: "26,172,171",  title: "Capture one handshape",  body: "The browser sends one still frame only when you request recognition. The private inference service classifies a held static handshape." },
                { n: "03", c: "var(--green)",cRaw: "26,150,80",   title: "Review saved data",      body: "Accepted letter predictions are saved to your session and appear in the dashboard. Uncertain results are not saved." },
              ].map(({ n, c, cRaw, title, body }) => (
                <div key={n} className="card" style={{ padding: "22px 24px", display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(${cRaw},0.10)`, border: `1px solid rgba(${cRaw},0.22)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: c }}>{n}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c, fontWeight: 700, letterSpacing: "0.08em" }}>STEP {n}</span>
                      <span className="card-title">{title}</span>
                    </div>
                    <p className="body" style={{ fontSize: 14 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "88px 0", borderBottom: "1px solid var(--b)", background: "var(--bg-2)" }}>
        <div className="wrap">
          <div style={{ marginBottom: 48 }}>
            <p className="label" style={{ marginBottom: 12 }}>Features</p>
            <h2 className="section-title" style={{ marginBottom: 12, maxWidth: 440 }}>Everything you need.<br/>Nothing extra.</h2>
            <p className="body" style={{ maxWidth: 380 }}>The workflows currently available in this prototype.</p>
          </div>
          <div className="features-grid">
            {[
              { c: "var(--v)",    cR: "127,119,221", title: "Account-backed sessions", body: "Sign-in uses an HttpOnly authentication cookie and private session endpoints." },
              { c: "var(--teal)", cR: "26,172,171",  title: "Context presets",         body: "Social, Medical, and Legal presets are loaded from PostgreSQL." },
              { c: "var(--green)",cR: "26,150,80",   title: "On-demand recognition",   body: "Only an explicitly captured still frame is sent for classification; video is not streamed." },
              { c: "var(--amber)",cR: "201,122,10",  title: "Calibration profile",    body: "Enter and save calibration settings in your account; they are not automatically measured." },
              { c: "var(--rose)", cR: "212,83,126",  title: "Limited static classifier", body: "Selected static letters only; words, phrases, and continuous signing are unsupported." },
              { c: "var(--v)",    cR: "127,119,221", title: "Saved records",           body: "View and export translation records returned by the backend." },
            ].map(({ c, cR, title, body }) => (
              <div key={title} className="card" style={{ padding: "24px 20px", transition: "all 0.22s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 36px rgba(${cR},0.14)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${cR},0.10)`, border: `1px solid rgba(${cR},0.20)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: c }}/>
                </div>
                <p className="card-title" style={{ marginBottom: 8 }}>{title}</p>
                <p className="body" style={{ fontSize: 14 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section style={{ padding: "88px 0", borderBottom: "1px solid var(--b)", position: "relative", overflow: "hidden" }}>
        <div className="orb-teal" style={{ width: 500, height: 500, top: -100, right: -100, opacity: 0.3 }}/>
        <div className="wrap-sm" style={{ position: "relative" }}>
          <div style={{ marginBottom: 44 }}>
            <p className="label" style={{ marginBottom: 12 }}>Why SignSync</p>
            <h2 className="section-title" style={{ maxWidth: 360 }}>Current project<br/>capabilities.</h2>
          </div>
          <div className="comparison-table-wrap" style={{ border: "1px solid var(--b2)", borderRadius: "var(--r3)", overflow: "hidden", boxShadow: "0 4px 24px rgba(26,23,48,0.08)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead>
                <tr style={{ background: "var(--bg-2)" }}>
                  <th style={{ padding: "13px 20px", textAlign: "left",   fontSize: 10, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--b)", fontFamily: "'JetBrains Mono',monospace" }}>Feature</th>
                  <th style={{ padding: "13px 20px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--t3)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--b)", fontFamily: "'JetBrains Mono',monospace" }}>Status</th>
                  <th style={{ padding: "13px 20px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--v)",    letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--b)", fontFamily: "'JetBrains Mono',monospace", background: "rgba(127,119,221,0.06)" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Account registration and login", "Available", "HttpOnly auth cookie"],
                  ["Session and calibration APIs", "Available", "PostgreSQL-backed"],
                  ["Contact form", "Available", "Submissions saved by the backend"],
                  ["On-demand static-letter recognition", "Limited", "One captured frame; selected labels only"],
                  ["Continuous signing or sentence translation", "Unavailable", "No phrase recognition or translation"],
                  ["Speech recognition and synthesis", "Unavailable", "No speech service is configured"],
                ].map(([feat, bad, good], i) => (
                  <tr key={feat} style={{ background: i%2===0 ? "var(--bg-1)" : "var(--bg-2)", borderBottom: "1px solid var(--b)" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 500, color: "var(--t2)" }}>{feat}</td>
                    <td style={{ padding: "12px 20px", textAlign: "center" }}>
                      <span className="badge br" style={{ fontSize: 11 }}>{bad}</span>
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "center", background: "rgba(127,119,221,0.04)" }}>
                      <span className="badge bv" style={{ fontSize: 11 }}>{good}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "88px 0", position: "relative", overflow: "hidden", background: "var(--bg-2)" }}>
        <div className="orb"      style={{ width: 800, height: 500, top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.55 }}/>
        <div className="orb-teal" style={{ width: 400, height: 400, top: "50%", left: "65%", transform: "translate(-50%,-50%)", opacity: 0.35 }}/>
        <div className="mesh-bg"/>
        <div className="wrap" style={{ position: "relative" }}>
          <div style={{ maxWidth: 560 }}>
            <p className="label" style={{ marginBottom: 16 }}>Get Started</p>
            <h2 className="section-title" style={{ marginBottom: 16 }}>
              Break the barrier.<br/>
              <span className="grad-text">Start today.</span>
            </h2>
            <p className="body" style={{ maxWidth: 400, marginBottom: 36 }}>
              Create an account to try the prototype. Recognition requires the locally configured inference service.
            </p>
            <div className="cta-btns">
              <Link href="/translate" className="btn btn-teal" style={{ padding: "14px 32px", fontSize: 15 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Open Translator
              </Link>
              <Link href="/about" className="btn btn-outline" style={{ padding: "14px 24px", fontSize: 15 }}>Learn more</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--b)", padding: "32px 0", background: "var(--bg-3)" }}>
        <div className="wrap footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,var(--v),#534ab7)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(127,119,221,0.35)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--t1)", letterSpacing: "-0.5px" }}>Sign<span style={{ color: "var(--v)" }}>Sync</span></span>
          </div>
          <p style={{ fontSize: 12, color: "var(--t4)" }}>© 2026 SignSync Lite prototype.</p>
          <div style={{ display: "flex", gap: 22 }}>
            <Link href="/privacy" className="footer-link">Privacy</Link>
            <Link href="/terms"   className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
