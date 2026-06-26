import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
