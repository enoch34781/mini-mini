"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [configured, setConfigured] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      setConfigured(data.configured);
      if (data.authenticated) router.replace("/admin");
    }).catch(() => setMessage("Admin sign-in is unavailable right now."));
  }, [router]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Sign in failed.");
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return <main className="admin-login-wrap"><section className="admin-login"><Link href="/" className="admin-back"><ArrowLeft size={15} /> Back to shop</Link><div className="admin-lock"><LockKeyhole size={22} /></div><span className="eyebrow">STORE OWNER</span><h1>Welcome back.</h1><p>Sign in to manage your snacks and orders.</p>{!configured ? <div className="admin-alert">Owner sign-in is not configured yet. Add <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code>, and a 32+ character <code>SESSION_SECRET</code> to <code>.env.local</code>, then restart the app.</div> : <form className="form-stack" onSubmit={submit}><label className="field">Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field">Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className="checkout-message" role="alert">{message}</p>}<button className="button button-dark" disabled={busy}>{busy ? "Signing in..." : "Sign in securely"}</button></form>}</section></main>;
}