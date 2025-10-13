import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import { TelemetryProvider } from "@/contexts/TelemetryContext";
import { BluetoothProvider } from "@/contexts/BluetoothContext";
import { IssPositionProvider } from "@/contexts/IssPositionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ISS Mimic",
  description: "Real-time data from the International Space Station in the ISS Micro Mimic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-bs-theme="auto">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <BluetoothProvider>
        <TelemetryProvider>
        <IssPositionProvider>
          <Navbar />
          {children}
        </IssPositionProvider>
        </TelemetryProvider>
        </BluetoothProvider>
      </body>
    </html>
  );
}
