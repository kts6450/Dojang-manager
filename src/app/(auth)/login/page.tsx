"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = useMemo(() => {
    const rawCallbackUrl = searchParams.get("callbackUrl");

    if (!rawCallbackUrl) {
      return "/";
    }

    try {
      const normalizedUrl = new URL(rawCallbackUrl, window.location.origin);

      if (normalizedUrl.origin !== window.location.origin) {
        return "/";
      }

      return `${normalizedUrl.pathname}${normalizedUrl.search}${normalizedUrl.hash}` || "/";
    } catch {
      return rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🥋</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Dojang Manager</h1>
          <p className="text-blue-300 mt-1 text-sm">Martial Arts Studio Management</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-blue-100">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dojang.com"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-blue-100">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-400"
                />
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
