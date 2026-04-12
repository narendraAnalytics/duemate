import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DueMate — AI-Powered Payment Reminders",
  description:
    "Create invoices in seconds, record payments instantly, and let smart reminders go out via email — automatically.",
  icons: {
    icon: "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775557266/logo_y06zwe.png",
    apple: "https://res.cloudinary.com/dkqbzwicr/image/upload/q_auto/f_auto/v1775557266/logo_y06zwe.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${serif.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
