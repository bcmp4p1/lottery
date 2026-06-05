"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { validateEmail } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";

const LoginPage = () => {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateEmail(email) ?? (password ? null : "Password is required");
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" fullWidth disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        No account?{" "}
        <Link href="/signup" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;
