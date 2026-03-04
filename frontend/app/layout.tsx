import ReactQueryProvider from "@/providers/ReactQueryProvider";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen relative selection:bg-primary/30">
        {/* Background Decorative Blur */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
        </div>
        
        <ReactQueryProvider>
          <Toaster theme="dark" position="top-right" richColors toastOptions={{
             style: { background: '#111827', border: '1px solid rgba(255,255,255,0.1)' }
          }} />
          {children}
        </ReactQueryProvider>
      </body>
    </html>
  );
}