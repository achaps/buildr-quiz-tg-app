import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TelegramProvider } from "@/components/layout/TelegramProvider";
import { TelegramRoot } from "@/components/layout/TelegramRoot";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Buildr Quiz",
  description: "Test your Web3 knowledge with Buildr Quiz",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <TelegramProvider>
          <TelegramRoot>
            {children}
          </TelegramRoot>
        </TelegramProvider>
      </body>
    </html>
  );
}
