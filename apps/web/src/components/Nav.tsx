"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/Button";

export const Nav = () => {
  const { isAuthenticated, email, isAdmin, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <nav className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          🎟️ Lottery
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:underline">
            Draws
          </Link>
          {isAuthenticated && (
            <Link href="/my-tickets" className="hover:underline">
              My Tickets
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Admin
            </Link>
          )}
          <Button
            variant="secondary"
            className="px-2 py-1"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </Button>
          {loading ? null : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-gray-500 sm:inline dark:text-gray-400">
                {email}
              </span>
              <Button variant="secondary" className="px-3 py-1" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
