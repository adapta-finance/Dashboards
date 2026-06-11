"use client";

import { useMemo, useState } from "react";
import {
  MESES, FLUXO, RATIOS, IDX_ULTIMO_REAL, IDX_MES_CORRENTE,
  fmtBRL, fmtPct, rotuloMes, soma,
} from "@/lib/data";
import { Cabecalho, Secao, Painel, ChipLivro, SeletorPeriodo } from "@/components/ui";
import { CORES, PALETA_CATEGORIAS, TooltipCaixa, eixoX, eixoY } from "@/components/grafico";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, Legend, Cell, ComposedChart, Line,
} from "recharts";

export default function FluxoDeCaixa() {
  const [inicio, setInicio] = useState(0);
  const [fim, setFim] = useState(IDX_ULTIMO_REAL);
  const [lado, setLado] = useState<"saidas" | "entradas">("saidas");

  const categorias = Object.keys(FLUXO[lado]);
  const [selecao, setSelecao] = useState<Set<string>>(new Set(categorias));

  const toggleCat = (c: string) => {
    const s = new Set(selecao);
    s.has(c) ? s.delete(c) : s.add(c);
    setSelecao(s);
  };

  // empilhado por categoria
  const serie = useMemo(() => {
    return MESES.slice(inicio, fim + 1).map((m, k) => {
      const i = inicio + k;
      const row: Record<string, any> = { mes: rotuloMes(m) };
      categorias.forEach((c) => {
        if (selecao.has(c)) row[c] = Math.abs(FLUXO[lado][c][i] ?? 0);
      });
      return row;
    });
  }, [inicio, fim, lado, selecao]);

  // ranking acumulado no período
  const ranking = useMemo(() => {
    return categorias
      .map((c) => ({ categoria: c, total: Math.abs(soma(FLUXO[lado][c], inicio, fim)) }))
      .sort((a, b) => b.total - a.total);
  }, [inicio, fim, lado]);

  const totalPeriodo = ranking.reduce((t, r) => t + r.total, 0);

  // ponte líquida
  const ponte = MESES.slice(inicio, Math.min(fim, IDX_MES_CORRENTE) + 1).map((m, k) => {
    const i = inicio + k;
    return {
      mes: rotuloMes(m),
      liquido: (FLUXO.entradas_total[i] ?? 0) + (FLUXO.saidas_total[i] ?? 0),
      saldo: FLUXO.saldo_inicial[i],
    };
  });

  const corCat = (c: string) => PALETA_CATEGORIAS[categorias.indexOf(c) % PALETA_CATEGORIAS.length];

  return (
    <>
      <Cabecalho
        codigo="02"
        titulo="Fluxo de caixa — o livro da sobrevivência"
        descricao="Quanto dinheiro entrou, saiu e existe hoje. Não admite estimativa: ou o dinheiro se moveu, ou não. Eixo de data: data_pagto (GMT-3)."
        acoes={
          <SeletorPeriodo meses={MESES} rotulo={rotuloMes} inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
        }
      />

      <Secao titulo="Resultado líquido × saldo" chip={<ChipLivro tipo="caixa" />} nota="a variação de caixa do mês deve bater com o extrato — o teste final de integridade">
        <Painel>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ponte} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                <XAxis dataKey="mes" {...eixoX} interval={1} />
                <YAxis {...eixoY} tickFormatter={(v) => fmtBRL(v)} width={70} />
                <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtBRL(v, false)} />} />
                <ReferenceLine y={0} stroke={CORES.tintaMuda} />
                <Bar dataKey="liquido" name="Resultado líquido do mês">
                  {ponte.map((d, k) => (
                    <Cell key={k} fill={d.liquido >= 0 ? CORES.caixa : CORES.saida} radius={3 as any} />
                  ))}
                </Bar>
                <Line dataKey="saldo" name="Saldo inicial" stroke={CORES.foto} strokeWidth={2} dot={{ r: 2, fill: CORES.foto }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Painel>
      </Secao>

      <Secao
        titulo={lado === "saidas" ? "Saídas por categoria" : "Entradas por categoria"}
        chip={<ChipLivro tipo="caixa" />}
        nota="clique nas etiquetas para filtrar"
      >
        <div className="flex gap-2 mb-3">
          {(["saidas", "entradas"] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLado(l); setSelecao(new Set(Object.keys(FLUXO[l]))); }}
              className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                lado === l ? "border-caixa text-caixa bg-caixaFundo" : "border-traco text-tintaSuave hover:text-tinta"
              }`}
            >
              {l === "saidas" ? "SAÍDAS" : "ENTRADAS"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`font-mono text-[10px] px-2 py-1 rounded-full border transition-all ${
                selecao.has(c) ? "text-tinta border-traco bg-cartao" : "text-tintaMuda border-tracoSuave opacity-40"
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: corCat(c) }} />
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Painel className="xl:col-span-2">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="mes" {...eixoX} interval={Math.max(0, Math.floor((fim - inicio) / 12))} />
                  <YAxis {...eixoY} tickFormatter={(v) => fmtBRL(v)} width={70} />
                  <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtBRL(v, false)} />} />
                  {categorias.filter((c) => selecao.has(c)).map((c) => (
                    <Bar key={c} dataKey={c} stackId="a" fill={corCat(c)} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Painel>

          <Painel className="p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-traco font-mono text-[10px] uppercase tracking-wider text-tintaMuda">
              Acumulado {rotuloMes(MESES[inicio])} → {rotuloMes(MESES[fim])}
            </div>
            <div className="max-h-96 overflow-y-auto scroll-fino">
              {ranking.map((r) => (
                <div key={r.categoria} className="px-4 py-2.5 border-b border-tracoSuave last:border-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-tintaSuave min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: corCat(r.categoria) }} />
                      <span className="truncate">{r.categoria}</span>
                    </span>
                    <span className="font-mono tabular text-tinta shrink-0">{fmtBRL(r.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-traco overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(r.total / (ranking[0]?.total || 1)) * 100}%`, background: corCat(r.categoria) }}
                    />
                  </div>
                  <div className="font-mono text-[10px] text-tintaMuda mt-1">{fmtPct((r.total / totalPeriodo) * 100)} do total</div>
                </div>
              ))}
            </div>
          </Painel>
        </div>
      </Secao>

      <Secao titulo="Eficiência do caixa" nota="ratios sobre receita cash · jan/25 → mai/26">
        <Painel>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={RATIOS.meses.map((m, k) => ({
                  mes: rotuloMes(m),
                  api: Math.abs(RATIOS.api_infra_sobre_receita_pct[k] ?? 0),
                  pessoal: Math.abs(RATIOS.pessoal_sobre_receita_pct[k] ?? 0),
                  taxa: RATIOS.taxa_antecipacao_pct[k],
                }))}
                margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              >
                <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                <XAxis dataKey="mes" {...eixoX} interval={1} />
                <YAxis {...eixoY} tickFormatter={(v) => `${v}%`} width={42} />
                <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtPct(v)} />} />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }} />
                <ReferenceLine y={25} stroke={CORES.atencao} strokeDasharray="4 4" />
                <Line dataKey="api" name="API+Infra / receita" stroke={CORES.construir} strokeWidth={2} dot={false} />
                <Line dataKey="pessoal" name="Pessoal / receita" stroke={CORES.competencia} strokeWidth={2} dot={false} />
                <Line dataKey="taxa" name="Taxa média gateway" stroke={CORES.foto} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Painel>
      </Secao>
    </>
  );
}
