"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiRequest, User } from "../../lib/api";

export default function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<User>("/auth/me")
      .then((currentUser) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  async function signOut() {
    try {
      await apiRequest<null>("/auth/logout", { method: "POST" });
      setUser(null);
      setAuthError("");
    } catch (cause) {
      setAuthError(cause instanceof Error ? cause.message : "Unable to sign out.");
    }
  }

  const links = [
    { href: "/",          label: "Home" },
    { href: "/translate", label: "Translator" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/about",     label: "About" },
  ];

  return (
    <>
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(240,238,254,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(80,70,180,0.10)" : "1px solid transparent",
        transition: "all 0.25s",
      }}>
        <div className="wrap" style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, var(--v) 0%, #534ab7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(127,119,221,0.40)",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--t1)", letterSpacing: "-0.5px" }}>
              Sign<span style={{ color: "var(--v)" }}>Sync</span>
            </span>
          </Link>

          <div className="nav-links-desktop">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} style={{
                padding: "6px 14px", borderRadius: "var(--r)",
                fontSize: 14,
                fontWeight: path === href ? 600 : 400,
                color: path === href ? "var(--v)" : "var(--t3)",
                background: path === href ? "var(--vs)" : "transparent",
                border: path === href ? "1px solid rgba(127,119,221,0.18)" : "1px solid transparent",
                transition: "all 0.15s",
              }}>
                {label}
              </Link>
            ))}
          </div>

          <div className="nav-cta-desktop">
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--t3)" }}>{user.username}</span>
                <button type="button" onClick={() => { void signOut(); }} className="btn btn-outline" style={{ fontSize: 13, padding: "9px 18px" }}>
                  Sign out
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-v" style={{ fontSize: 13, padding: "9px 18px" }}>Sign in</Link>
            )}
          </div>

          <button className="hamburger" onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", padding: 8, cursor: "pointer", color: "var(--t1)" }}
            aria-label="Menu">
            {menuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
      </nav>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        {links.map(({ href, label }) => (
          <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{
            padding: "12px 14px", borderRadius: "var(--r)", fontSize: 15,
            fontWeight: path === href ? 600 : 400,
            color: path === href ? "var(--v)" : "var(--t2)",
            background: path === href ? "var(--vs)" : "transparent",
          }}>
            {label}
          </Link>
        ))}
        <Link href="/translate" className="btn btn-v" onClick={() => setMenuOpen(false)}
          style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>
          Open Translator
        </Link>
        {user
          ? <button type="button" onClick={() => { setMenuOpen(false); void signOut(); }} className="btn btn-outline">Sign out</button>
          : <Link href="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline">Sign in</Link>}
      </div>
      {authError && <p role="alert" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 150, padding: 12, background: "var(--bg-1)", color: "var(--rose)", border: "1px solid var(--b)", borderRadius: "var(--r)" }}>{authError}</p>}
    </>
  );
}
