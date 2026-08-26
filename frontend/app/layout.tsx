import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AeroSync — AI-Powered Cadastral Land Intelligence from Drone Imagery",
  description: "AeroSync is an end-to-end platform that uses AI, computer vision and geospatial intelligence to generate accurate, reliable and tamper-proof land records from drone data.",
  keywords: ["Cadastral AI", "Drone Mapping", "SVAMITVA Scheme", "DoLR", "ULPIN", "GeoJSON", "Mapbox GIS"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="min-h-screen flex flex-col font-sans bg-[#f8fbfa] text-slate-800 antialiased selection:bg-teal-100 selection:text-teal-900">
        {children}
      </body>
    </html>
  );
}
