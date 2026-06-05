import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Nav } from "@/components/Nav";

// Runs before first paint to set the `dark` class from the saved choice (or OS),
// preventing a flash of the wrong theme on load.
const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem("theme");
    var dark = saved ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lottery",
  description: "Online lottery platform",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <AuthProvider>
            <Nav />
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
