"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { apiRequest, ApiRequestError } from "../../lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({ name:"", email:"", subject:"general", message:"" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subjects = [
    { value:"general",     label:"General question" },
    { value:"technical",   label:"Technical support" },
    { value:"privacy",     label:"Privacy / data request" },
    { value:"partnership", label:"Partnership" },
    { value:"feedback",    label:"Feedback" },
  ];

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please complete your name, email address, and message.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiRequest<{ id: string; status: string; createdAt: string }>("/contact", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setSent(true);
    } catch (cause) {
      setError(cause instanceof ApiRequestError || cause instanceof Error
        ? cause.message
        : "Your message could not be sent. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Navbar/>

      {/* HERO */}
      <section style={{ padding:"80px 0 64px", borderBottom:"1px solid var(--b)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-200, right:-100, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(45,232,200,0.07) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-100, left:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(124,106,255,0.08) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div className="wrap" style={{ position:"relative", maxWidth:760 }}>
          <p className="label" style={{ marginBottom:16 }}>Get in touch</p>
          <h1 style={{ fontSize:"clamp(36px,5vw,60px)", fontWeight:800, color:"var(--t1)", letterSpacing:"-2px", lineHeight:1.05, marginBottom:20 }}>
            We&apos;d love to <span className="grad-text-anim">hear from you.</span>
          </h1>
          <p className="body" style={{ maxWidth:480, lineHeight:1.8 }}>
            Send feedback or a question. Submissions are saved by the backend; this prototype does not send email notifications or promise a response time.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section style={{ padding:"72px 0 96px" }}>
        <div className="wrap" style={{ maxWidth:900 }}>
          <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:64, alignItems:"start" }}>

            {/* LEFT INFO */}
            <div>
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                {[
                  { icon:"M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label:"Contact", val:"Use the form", color:"var(--v2)" },
                  { icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label:"Response time", val:"No SLA configured", color:"var(--teal)" },
                  { icon:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z", label:"Project", val:"SignSync Lite prototype", color:"var(--green)" },
                ].map(({ icon, label, val, color }) => (
                  <div key={label} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                    <div style={{ width:38, height:38, borderRadius:10, background:`rgba(${color === "var(--v2)" ? "124,106,255" : color === "var(--teal)" ? "45,232,200" : "74,222,128"},0.1)`, border:`1px solid rgba(${color === "var(--v2)" ? "124,106,255" : color === "var(--teal)" ? "45,232,200" : "74,222,128"},0.18)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:14, color:"var(--t2)", fontWeight:500 }}>{val}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:40, padding:"20px", background:"var(--bg-2)", border:"1px solid var(--b)", borderRadius:"var(--r3)" }}>
                <p style={{ fontSize:12, fontWeight:700, color:"var(--teal)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Quick links</p>
                {[
                  { href:"/privacy", label:"Privacy Policy" },
                  { href:"/terms",   label:"Terms of Service" },
                  { href:"/about",   label:"About SignSync" },
                  { href:"/translate", label:"Try the Translator" },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} style={{ display:"block", fontSize:13, color:"var(--t3)", marginBottom:8, transition:"color 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.color="var(--v2)")}
                        onMouseLeave={e => (e.currentTarget.style.color="var(--t3)")}>
                    → {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* RIGHT FORM */}
            <div>
              {sent ? (
                <div style={{ padding:"48px 40px", background:"var(--bg-2)", border:"1px solid rgba(45,232,200,0.2)", borderRadius:"var(--r3)", textAlign:"center" }}>
                  <div style={{ width:56, height:56, borderRadius:"50%", background:"rgba(45,232,200,0.12)", border:"1px solid rgba(45,232,200,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h2 style={{ fontSize:22, fontWeight:700, color:"var(--t1)", marginBottom:10 }}>Message sent!</h2>
                  <p className="body" style={{ maxWidth:380, margin:"0 auto 28px" }}>Your message has been saved. This prototype does not send email notifications or guarantee a response time.</p>
                  <button onClick={() => { setSent(false); setForm({ name:"", email:"", subject:"general", message:"" }); }} className="btn btn-outline" style={{ fontSize:14 }}>
                    Send another message
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                  {error && <p role="alert" style={{ color:"var(--rose)", fontSize:13 }}>{error}</p>}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                    {[
                      { key:"name",  label:"Your name",     placeholder:"Jane Smith", type:"text" },
                      { key:"email", label:"Email address",  placeholder:"jane@example.com", type:"email" },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--t3)", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</label>
                        <input
                          type={type}
                          required
                          placeholder={placeholder}
                          value={form[key as keyof typeof form]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          style={{ width:"100%", padding:"11px 14px", background:"var(--bg-1)", border:"1px solid var(--b)", borderRadius:"var(--r)", fontSize:14, color:"var(--t1)", outline:"none", transition:"border-color 0.15s" }}
                          onFocus={e => e.target.style.borderColor="var(--v2)"}
                          onBlur={e => e.target.style.borderColor="var(--b)"}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--t3)", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.07em" }}>Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      style={{ width:"100%", padding:"11px 14px", background:"var(--bg-1)", border:"1px solid var(--b)", borderRadius:"var(--r)", fontSize:14, color:"var(--t1)", outline:"none", cursor:"pointer" }}>
                      {subjects.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display:"block", fontSize:12, fontWeight:600, color:"var(--t3)", marginBottom:7, textTransform:"uppercase", letterSpacing:"0.07em" }}>Message</label>
                    <textarea
                      placeholder="Tell us what's on your mind..."
                      rows={7}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      style={{ width:"100%", padding:"12px 14px", background:"var(--bg-1)", border:"1px solid var(--b)", borderRadius:"var(--r)", fontSize:14, color:"var(--t1)", outline:"none", resize:"vertical", lineHeight:1.7, transition:"border-color 0.15s" }}
                      onFocus={e => e.target.style.borderColor="var(--v2)"}
                      onBlur={e => e.target.style.borderColor="var(--b)"}
                    />
                  </div>

                  <button
                  type="button"
                  onClick={handleSubmit}
                    disabled={loading}
                    className="btn btn-v"
                    style={{ padding:"13px 28px", fontSize:15, opacity:loading ? 0.7 : 1, transition:"all 0.18s" }}>
                    {loading ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation:"glow 0.8s linear infinite" }}><circle cx="12" cy="12" r="10"/></svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Send message
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
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
            <Link href="/terms" className="footer-link">Terms</Link>
            <Link href="/contact" className="footer-link" style={{ color:"var(--teal)" }}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
