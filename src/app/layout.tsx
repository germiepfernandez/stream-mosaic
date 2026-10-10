import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MultiPOV — Watch multiple streams",
  description:
    "Watch multiple YouTube and Twitch POVs in a customizable grid. Built for following games from every angle.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrains.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 font-sans text-zinc-100">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
