import { ArrowRight, BarChart3, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Logo } from "../components/Logo";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@stocksense.local");
  const [password, setPassword] = useState("StockSense-Demo-2026!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await login(email, password); navigate("/", { replace: true }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Sign in failed."); } finally { setBusy(false); } }
  return <main className="login-page">
    <section className="login-story">
      <div className="login-glow one" /><div className="login-glow two" />
      <Logo />
      <div className="story-copy"><span className="hero-chip"><Sparkles size={15} /> AI-ready inventory</span><h1>Know every shelf.<br /><em>Move with confidence.</em></h1><p>One colorful command center for stock, sales, alerts, and an assistant that never acts without your approval.</p></div>
      <div className="story-stats"><div><BarChart3 /><strong>Live</strong><span>stock intelligence</span></div><div><ShieldCheck /><strong>Role-safe</strong><span>by design</span></div><div><LockKeyhole /><strong>Human</strong><span>confirmed AI</span></div></div>
      <p className="mall-caption">Built for Nowshera Shopping Mall</p>
    </section>
    <section className="login-panel"><div className="login-card"><div className="form-heading"><span>Welcome back</span><h2>Step into StockSense</h2><p>Use your secure mall account to continue.</p></div><form onSubmit={submit}>
      <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required /></label>
      <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button wide" disabled={busy}>{busy ? <span className="button-loader" /> : <>Sign in securely <ArrowRight size={18} /></>}</button>
    </form><div className="demo-accounts"><strong>Demo access</strong><button type="button" onClick={() => { setEmail("manager@stocksense.local"); setPassword("StockSense-Demo-2026!"); }}>Manager</button><button type="button" onClick={() => { setEmail("staff@stocksense.local"); setPassword("StockSense-Demo-2026!"); }}>Staff</button></div></div></section>
  </main>;
}

