import type { Metadata } from "next";
import type { Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { RuntimeErrorGuard } from "@/components/runtime-error-guard";
import { Toaster } from "sonner";
import { UserProfileProvider } from "@/components/user-profile-provider";
import { RoutePrefetcher } from "@/components/route-prefetcher";

// Force fully dynamic SSR across the app router tree.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Classless",
  description: "Created with v0",
  generator: "v0.app",
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
  // Language is applied via html lang attribute from localStorage on client
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){
            try{
              var lang=localStorage.getItem('classless_lang')||'en';
              document.documentElement.setAttribute('lang', lang);
              window.addEventListener('classless:language-changed',function(e){
                if(e && e.detail && e.detail.lang){
                  document.documentElement.setAttribute('lang', e.detail.lang);
                }
              });
            }catch(e){}
          })();
        `,
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <UserProfileProvider>
          <RoutePrefetcher />
          <RuntimeErrorGuard />
          <Toaster position="top-right" richColors />
          {children}
        </UserProfileProvider>
      </body>
    </html>
  );
}
