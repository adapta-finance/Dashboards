import type { Metadata } from "next";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "ADP-FIN-OS · Adapta",
  description: "Repositório de KPIs & Inteligência Financeira — visão caixa (V0)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-body antialiased min-h-screen">
        <div className="flex min-h-screen">
          <Nav />
          <main className="flex-1 min-w-0 lg:pl-60">{children}</main>
        </div>
      </body>
    </html>
  );
}
