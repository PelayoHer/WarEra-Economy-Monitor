import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/MarketTicker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "WarEra Economy Monitor",
    description: "Monitor de mercado y calculadora de rentabilidad para WarEra",
};



export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Navbar />
                <MarketTicker />
                <div className="pt-28">
                    {children}
                </div>
            </body>
        </html>
    );
}
