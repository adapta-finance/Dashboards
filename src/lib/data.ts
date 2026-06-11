/**
 * ADP-FIN-OS · Camada de dados (V0)
 * ----------------------------------------------------------------------
 * Fonte atual: snapshot estático extraído da aba "diário" da planilha
 * Journal Entries (visão CAIXA: data_pagto / valor_pago) em 10/06/2026.
 *
 * Contrato de evolução (Seção 01 do repositório de KPIs):
 * o dashboard lê EXCLUSIVAMENTE a camada Gold. Quando gold__kpi__daily
 * estiver no ar (F1), este módulo troca o import estático por fetch na
 * API que expõe a Gold — as assinaturas abaixo não mudam.
 * ----------------------------------------------------------------------
 */
import raw from "@/data/cash.json";

export type Serie = (number | null)[];

export const META = raw.meta;
export const MESES: string[] = raw.meses;

/** índice do último mês com realizado completo (mai/2026) */
export const IDX_ULTIMO_REAL = MESES.indexOf(raw.meta.ultimo_mes_real);
/** índice do mês corrente, parcial (jun/2026) */
export const IDX_MES_CORRENTE = MESES.indexOf(raw.meta.mes_corrente_parcial);

export const FLUXO = raw.fluxo as {
  saldo_inicial: Serie;
  entradas_total: Serie;
  entradas: Record<string, Serie>;
  saidas_total: Serie;
  saidas: Record<string, Serie>;
};

export const PL = raw.pl as Record<string, Serie>;

export const RATIOS = raw.ratios as {
  meses: string[];
  taxa_antecipacao_pct: Serie;
  custo_antecipacao_pct: Serie;
  api_infra_sobre_receita_pct: Serie;
  pessoal_sobre_receita_pct: Serie;
};

export const SALDOS_DIARIOS = raw.saldos_diarios as ({
  data: string;
  total: number;
} & Record<string, number | string>)[];

const MES_NOME = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export function rotuloMes(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MES_NOME[parseInt(m) - 1]}/${y.slice(2)}`;
}

export function fmtBRL(v: number | null | undefined, compacto = true): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  if (compacto) {
    const abs = Math.abs(v);
    const sinal = v < 0 ? "−" : "";
    if (abs >= 1_000_000) return `${sinal}R$ ${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
    if (abs >= 1_000) return `${sinal}R$ ${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
    return `${sinal}R$ ${abs.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  }
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function fmtPct(v: number | null | undefined, casas = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

export function variacaoPct(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

/** soma de uma série num intervalo [de, ate] inclusivo */
export function soma(s: Serie, de: number, ate: number): number {
  let t = 0;
  for (let i = de; i <= ate; i++) t += s[i] ?? 0;
  return t;
}

/** Resultado líquido de caixa do mês (M5): entradas − saídas */
export function resultadoCaixa(i: number): number | null {
  const e = FLUXO.entradas_total[i];
  const s = FLUXO.saidas_total[i];
  if (e === null || s === null) return null;
  return e + s; // saídas já vêm negativas
}

/** Burn líquido médio (últimos n meses reais, excluindo antecipação) */
export function burnMedio(n = 3): number {
  let t = 0;
  for (let i = IDX_ULTIMO_REAL - n + 1; i <= IDX_ULTIMO_REAL; i++) {
    const e = (FLUXO.entradas_total[i] ?? 0) - (FLUXO.entradas["Receita via Antecipação"][i] ?? 0);
    const s = FLUXO.saidas_total[i] ?? 0;
    t += e + s;
  }
  return t / n;
}

/** Runway em meses: saldo do início do mês corrente ÷ burn médio (se burn < 0) */
export function runwayMeses(): number | null {
  const saldo = FLUXO.saldo_inicial[IDX_MES_CORRENTE];
  const burn = burnMedio(3);
  if (saldo === null) return null;
  if (burn >= 0) return Infinity;
  return saldo / -burn;
}

/** % do caixa operacional vindo de antecipação no mês i */
export function pctAntecipacao(i: number): number | null {
  const ant = FLUXO.entradas["Receita via Antecipação"][i];
  const tot = FLUXO.entradas_total[i];
  if (ant === null || tot === null || tot === 0) return null;
  return (ant / tot) * 100;
}

/** status de farol do variance bridge (Seção 06): 🟢 |Δ|≤5 · 🟡 5–10 · 🔴 >10 */
export function farolVariance(deltaPct: number | null): "verde" | "amarelo" | "vermelho" | "nd" {
  if (deltaPct === null) return "nd";
  const a = Math.abs(deltaPct);
  if (a <= 5) return "verde";
  if (a <= 10) return "amarelo";
  return "vermelho";
}
