import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { getUser } from "@/lib/supabase/server";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Manga Reader",
  description: "Personal manga and manhwa reader with ComicK, MangaDex, and AniList.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();

  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexSerif.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to content
        </a>
        <QueryProvider>
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <BottomNav isSignedIn={Boolean(user)} />
        </QueryProvider>
      </body>
    </html>
  );
}
