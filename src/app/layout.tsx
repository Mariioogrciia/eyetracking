import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroScribe AI | Gaze Tracking",
  description: "Plataforma clínica para análisis ocular predictivo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <Script 
          src="https://webgazer.cs.brown.edu/webgazer.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
