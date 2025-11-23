import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Delivery - RAG Chatbot",
  description: "Food delivery system with AI chatbot powered by Claude AI - Order food, track deliveries, and get instant support",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Food Delivery",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Food Delivery",
    title: "Food Delivery - Order Food with AI Support",
    description: "Order food from your favorite restaurants with AI chatbot support. Track deliveries in real-time.",
  },
  twitter: {
    card: "summary",
    title: "Food Delivery - Order Food with AI Support",
    description: "Order food from your favorite restaurants with AI chatbot support. Track deliveries in real-time.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="light" storageKey="rag-theme">
          <PWAProvider>
            <AuthSessionProvider>
              {children}
              <Toaster
                position="bottom-center"
                containerStyle={{
                  zIndex: 9998,
                }}
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: 'var(--toast-bg)',
                    color: 'var(--toast-color)',
                    border: '1px solid var(--toast-border)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthSessionProvider>
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
