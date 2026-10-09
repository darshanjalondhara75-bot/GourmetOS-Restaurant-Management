import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { SidebarProvider } from "@/lib/sidebarContext";
import { ThemeProvider } from "@/lib/themeContext";
import { LuxuryBackground } from "@/components/LuxuryBackground";
import { BRAND_FULL_NAME, BRAND_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Darshan Jalondhara | Python Backend & Next.js Frontend Developer",
  description: "Professional portfolio, technical resume, and detailed case study of Darshan Jalondhara — Python Backend & Next.js Frontend Developer specializing in full-stack architecture, role-based dashboards, and restaurant management systems.",
  openGraph: {
    title: "Darshan Jalondhara | Python Backend & Next.js Frontend Developer",
    description: "Professional portfolio, technical resume, and detailed case study of Darshan Jalondhara — Python Backend & Next.js Frontend Developer.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/darshan.jpg",
        width: 800,
        height: 1200,
        alt: "Darshan Jalondhara - Python Backend & Next.js Frontend Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Darshan Jalondhara | Python Backend & Next.js Frontend Developer",
    description: "Developer focused on building modern web applications with Python backend systems and Next.js frontend experiences.",
    images: ["/images/darshan.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-slate-900 min-h-screen overflow-x-clip dark:text-slate-100 bg-transparent relative selection:bg-amber-500/30" suppressHydrationWarning>
        <LuxuryBackground />
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

