"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ITENS = [
  { href: "/", codigo: "04", titulo: "Painel diário", sub: "O contrato das 09:00" },
  { href: "/fluxo-de-caixa", codigo: "02", titulo: "Fluxo de caixa", sub: "O livro da sobrevivência" },
  { href: "/pl-margens", codigo: "05", titulo: "P&L & margens", sub: "Cascata M0 → M5" },
  { href: "/real-vs-orcado", codigo: "06", titulo: "Real vs. Orçado", sub: "Variance bridge" },
  { href: "/benchmarks", codigo: "08", titulo: "Benchmarks", sub: "O placar canônico" },
  { href: "/repositorio", codigo: "01", titulo: "Repositório", sub: "Catálogo · cadências · roadmap" },
  { href: "/framework", codigo: "FW", titulo: "Framework", sub: "8 dimensões · ~43 indicadores" },
];

export default function Nav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAberto(!aberto)}
        aria-label="Abrir navegação"
        className="lg:hidden fixed top-3 left-3 z-50 bg-cartao border border-traco rounded-md px-3 py-2 font-mono text-xs text-caixa"
      >
        ☰ menu
      </button>

      <nav
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-painel border-r border-traco flex flex-col transition-transform lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 pt-6 pb-5 border-b border-traco">
          <div className="font-mono text-[10px] tracking-[0.25em] text-tintaMuda">ADP-FIN-OS · V0</div>
          <div className="font-display font-800 text-xl tracking-tight mt-1 text-tinta">
            Adapta<span className="text-caixa">.</span>fin
          </div>
          <div className="mt-3 flex gap-1.5 flex-wrap">
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-caixaFundo text-caixa border border-caixa/30">CAIXA · ATIVO</span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-competenciaFundo text-competencia border border-competencia/20 opacity-60">COMPETÊNCIA · F2</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 scroll-fino">
          {ITENS.map((item) => {
            const ativo = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setAberto(false)}
                className={`flex items-baseline gap-3 px-5 py-3 border-l-2 transition-colors ${
                  ativo
                    ? "border-caixa bg-cartao text-tinta"
                    : "border-transparent text-tintaSuave hover:text-tinta hover:bg-cartao/50"
                }`}
              >
                <span className={`font-mono text-[10px] ${ativo ? "text-caixa" : "text-tintaMuda"}`}>{item.codigo}</span>
                <span className="min-w-0">
                  <span className="block font-display font-600 text-sm leading-tight">{item.titulo}</span>
                  <span className="block text-[11px] text-tintaMuda truncate">{item.sub}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="px-5 py-4 border-t border-traco fita">
          <div className="font-mono text-[9px] leading-relaxed text-tintaMuda bg-painel/90 rounded p-2 border border-tracoSuave">
            FONTE · journal_entries (aba diário)
            <br />EXTRAÍDO · 10/06/2026
            <br />PRÓXIMO · gold__kpi__daily (F1)
          </div>
        </div>
      </nav>

      {aberto && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setAberto(false)} aria-hidden />
      )}
    </>
  );
}
