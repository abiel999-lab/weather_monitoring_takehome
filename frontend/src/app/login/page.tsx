"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { ErrorNotice } from "@/components/ErrorNotice";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("reviewer@example.test");
  const [password, setPassword] = useState("ChangeThisLocalOnly123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api<{ data: { token: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(response.data.token);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-md p-6 md:p-8">
        <Link href="/" className="text-sm font-bold text-teal-700">← Back to dashboard</Link>
        <div className="mt-6 grid h-12 w-12 place-items-center rounded-xl bg-teal-700 font-black text-white">WX</div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">Reviewer login</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Bearer token autentikasi digunakan hanya untuk endpoint yang mengubah data. Data read-only tetap dapat dilihat tanpa login.</p>
        {error ? <div className="mt-5"><ErrorNotice message={error} /></div> : null}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <button disabled={loading} className="btn btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-500">Kredensial di atas adalah default local seed untuk kemudahan review dan harus diganti pada deployment nyata.</p>
      </div>
    </main>
  );
}
