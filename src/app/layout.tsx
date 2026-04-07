import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "DueMate — AI-Powered Payment Reminders",
  description:
    "Upload invoices, let AI extract data, then sit back as smart reminders go out automatically — email & WhatsApp.",
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
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="h-full overflow-hidden antialiased">{children}</body>
    </html>
  );
}
