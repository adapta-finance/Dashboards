"use client";

import { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Etiquetas de livro — a legenda do documento vira linguagem visual   */
/* ------------------------------------------------------------------ */
export function ChipLivro({ tipo }: { tipo: "caixa" | "competencia" | "foto" | "construir" | "projecao" }) {
  const cfg = {
    caixa: { txt: "CAIXA", cls: "bg-caixaFundo text-caixa border-caixa/30" },
    competencia: { txt: "COMPETÊNCIA", cls: "bg-competenciaFundo text-competencia border-competencia/30" },
    foto: { txt: "FOTOGRAFIA", cls: "bg-foto/10 text-foto border-foto/30" },
    construir: { txt: "CONSTRUIR", cls: "bg-construir/10 text-construir border-construir/40 border-dashed" },
    projecao: { txt: "PROJEÇÃO", cls: "bg-traco/40 text-tintaSuave border-traco border-dashed" },
  }[tipo];
  return (
    <span className={`inline-block font-mono text-[9px] tracking-wider px-1.5 py-0.5 rounded border ${cfg.cls}`}>
      {cfg.txt}
    </span>
  );
}

export function Farol({ estado }: { estado: "verde" | "amarelo" | "vermelho" | "nd" }) {
  const cor = { verde: "bg-caixa", amarelo: "bg-atencao", vermelho: "bg-alerta", nd: "bg-tintaMuda" }[estado];
  return <span className={`inline-block w-2 h-2 rounded-full ${cor}`} aria-label={estado} />;
}

/* ------------------------------------------------------------------ */
export function Cabecalho({
  codigo,
  titulo,
  descricao,
  acoes,
}: {
  codigo: string;
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="px-6 lg:px-10 pt-8 pb-6 border-b border-traco fita">
      <div className="bg-chassi/70 backdrop-blur-sm rounded-lg p-5 border border-tracoSuave">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-tintaMuda">ADP-FIN-{codigo}</div>
            <h1 className="font-display font-800 text-2xl lg:text-3xl tracking-tight text-tinta mt-1">{titulo}</h1>
            <p className="text-sm text-tintaSuave mt-1.5 max-w-2xl">{descricao}</p>
          </div>
          {acoes && <div className="flex items-center gap-2">{acoes}</div>}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
export function CartaoKpi({
  rotulo,
  valor,
  sub,
  livro = "caixa",
  alerta,
  delta,
}: {
  rotulo: string;
  valor: string;
  sub?: string;
  livro?: "caixa" | "competencia" | "foto" | "projecao";
  alerta?: { estado: "verde" | "amarelo" | "vermelho"; regra: string };
  delta?: { valor: string; positivo: boolean };
}) {
  return (
    <div
      className={`relative rounded-lg border bg-cartao p-4 flex flex-col gap-1.5 ${
        alerta?.estado === "vermelho"
          ? "border-alerta/50"
          : alerta?.estado === "amarelo"
          ? "border-atencao/40"
          : "border-traco"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-tintaSuave">{rotulo}</span>
        <ChipLivro tipo={livro} />
      </div>
      <div className="font-mono tabular text-2xl font-600 text-tinta leading-none mt-1">{valor}</div>
      <div className="flex items-center gap-2 min-h-[18px]">
        {delta && (
          <span className={`font-mono text-[11px] ${delta.positivo ? "text-caixa" : "text-alerta"}`}>
            {delta.positivo ? "▲" : "▼"} {delta.valor}
          </span>
        )}
        {sub && <span className="text-[11px] text-tintaMuda">{sub}</span>}
      </div>
      {alerta && (
        <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-tracoSuave">
          <Farol estado={alerta.estado} />
          <span className="font-mono text-[10px] text-tintaMuda">{alerta.regra}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function Secao({ titulo, chip, children, nota }: { titulo: string; chip?: ReactNode; children: ReactNode; nota?: string }) {
  return (
    <section className="px-6 lg:px-10 py-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display font-700 text-base text-tinta">{titulo}</h2>
        {chip}
        {nota && <span className="text-[11px] text-tintaMuda">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

export function Painel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-traco bg-cartao p-4 ${className}`}>{children}</div>;
}

/* ------------------------------------------------------------------ */
export function SeletorPeriodo({
  meses,
  rotulo,
  inicio,
  fim,
  onInicio,
  onFim,
}: {
  meses: string[];
  rotulo: (m: string) => string;
  inicio: number;
  fim: number;
  onInicio: (i: number) => void;
  onFim: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <label className="text-tintaMuda">de</label>
      <select
        value={inicio}
        onChange={(e) => onInicio(Number(e.target.value))}
        className="bg-painel border border-traco rounded px-2 py-1.5 text-tinta"
      >
        {meses.map((m, i) => (
          <option key={m} value={i} disabled={i > fim}>
            {rotulo(m)}
          </option>
        ))}
      </select>
      <label className="text-tintaMuda">até</label>
      <select
        value={fim}
        onChange={(e) => onFim(Number(e.target.value))}
        className="bg-painel border border-traco rounded px-2 py-1.5 text-tinta"
      >
        {meses.map((m, i) => (
          <option key={m} value={i} disabled={i < inicio}>
            {rotulo(m)}
          </option>
        ))}
      </select>
    </div>
  );
}
