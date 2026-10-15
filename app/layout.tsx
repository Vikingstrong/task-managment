// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Public_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/themes/theme-provider";
import { Suspense } from "react";
import Header from "@/components/widget/Header";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-lg font-bold tracking-tight">TaskFlow</span>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 rounded-md bg-muted/40 animate-pulse" />
          <div className="h-8 w-24 rounded-md bg-muted/40 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
import { ReduxProvider } from "@/components/providers/ReduxProvider"; // Импортируем наш клиентский провайдер

const publicSansHeading = Public_Sans({ subsets: ['latin'], variable: '--font-heading' });
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow — Система управления задачами и воркфлоу",
  description: "Современная платформа для управления задачами, проектами и гибкими воркфлоу в стиле Linear и Plane.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={cn(
        "h-full", 
        "antialiased", 
        geistSans.variable, 
        geistMono.variable, 
        "font-sans", 
        inter.variable, 
        publicSansHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col antialiased">
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={<HeaderFallback />}>
              <Header />
            </Suspense>
            {children}
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}