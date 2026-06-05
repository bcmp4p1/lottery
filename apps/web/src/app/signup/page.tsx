"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { validateEmail, validatePassword } from "@/lib/validation";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { ErrorText } from "@/components/ui/ErrorText";

const SignupPage = () => {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateEmail(email) ?? validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUp(email, password);
      if (needsEmailConfirmation) {
        setAwaitingConfirmation(true);
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold">Confirm your email 📧</h1>
        <p className="text-gray-600 dark:text-gray-400">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          activate your account, then sign in.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign up</h1>
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
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;
