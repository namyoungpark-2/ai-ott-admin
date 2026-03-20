import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
