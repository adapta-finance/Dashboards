"use client";

import { useMemo, useState } from "react";
import { MESES, PL, FLUXO, IDX_ULTIMO_REAL, fmtBRL, fmtPct, rotuloMes, soma, resultadoCaixa } from "@/lib/data";
import { Cabecalho, Secao, Painel, ChipLivro, SeletorPeriodo, Farol } from "@/components/ui";
import { CORES, TooltipCaixa, eixoX, eixoY } from "@/components/grafico";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceLine, Cell, ComposedChart, Line, Legend,
} from "recharts";

export default function PlMargens() {
  const [inicio, setInicio] = useState(0);
  const [fim, setFim] = useState(IDX_ULTIMO_REAL);

  // ----- cascata M0→M5 acumulada no período -----
  const cascata = useMemo(() => {
    const rb = soma(PL.receita_bruta, inicio, fim);
    const ded = soma(PL.deducoes, inicio, fim);
    const rl = rb + ded;
    const csp = soma(PL.csp, inicio, fim);
    const lb = rl + csp;
    const dop = soma(PL.despesas_operacionais, inicio, fim);
    const imp = soma(PL.outras_desp_impostos, inicio, fim);
    const ro = lb + dop + imp;
    const rf = soma(PL.resultado_financeiro, inicio, fim);
    const ext = soma(PL.eventos_extraordinarios, inicio, fim);
    const m5 = ro + rf + ext;

    const passos = [
      { nome: "M0 · Receita bruta", delta: rb, nivel: true },
      { nome: "Deduções (reembolsos)", delta: ded },
      { nome: "M1 · Receita líquida", total: rl, nivel: true },
      { nome: "CSP (IA · infra · taxas)", delta: csp },
      { nome: "M2 · Lucro bruto", total: lb, nivel: true, meta: `margem ${fmtPct((lb / rl) * 100, 0)} · meta >65%` },
      { nome: "Despesas operacionais", delta: dop },
      { nome: "Impostos", delta: imp },
      { nome: "M4 · Resultado operacional", total: ro, nivel: true, meta: `margem ${fmtPct((ro / rl) * 100, 0)} · meta >15%` },
      { nome: "Resultado financeiro", delta: rf },
      { nome: "Eventos extraordinários", delta: ext },
      { nome: "M5 · Resultado líquido de caixa", total: m5, nivel: true },
    ];

    let acumulado = 0;
    return passos.map((p) => {
      if (p.nivel && p.total !== undefined) {
        acumulado = p.total;
        return { ...p, base: 0, valor: p.total, mostra: p.total };
      }
      const v = p.delta ?? (p.total ?? 0);
      if (p.nivel) {
        acumulado = v;
        return { ...p, base: 0, valor: v, mostra: v };
      }
      const novo = acumulado + v;
      const base = Math.min(acumulado, novo);
      const altura = Math.abs(v);
      acumulado = novo;
      return { ...p, base, valor: altura, mostra: v };
    });
  }, [inicio, fim]);

  // ----- margens no tempo -----
  const margens = MESES.slice(0, IDX_ULTIMO_REAL + 1).map((m, k) => ({
    mes: rotuloMes(m),
    bruta: PL.margem_bruta_pct[k],
    operacional: PL.margem_operacional_pct[k],
  }));

  // ----- take-home: M5 ÷ receita bruta -----
  const takeHome = MESES.slice(0, IDX_ULTIMO_REAL + 1).map((m, k) => {
    const r = resultadoCaixa(k);
    const rb = PL.receita_bruta[k];
    return { mes: rotuloMes(m), pct: r !== null && rb ? (r / rb) * 100 : null };
  });

  return (
    <>
      <Cabecalho
        codigo="05"
        titulo="P&L & margens — a cascata M0 → M5"
        descricao="Margem única esconde onde o valor nasce e onde ele morre. A cascata decompõe a P&L em seis cortes — aqui na visão caixa; as lentes por produto, coorte e usuário chegam na F2."
        acoes={
          <SeletorPeriodo meses={MESES} rotulo={rotuloMes} inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
        }
      />

      <Secao
        titulo={`Cascata acumulada · ${rotuloMes(MESES[inicio])} → ${rotuloMes(MESES[fim])}`}
        chip={<ChipLivro tipo="caixa" />}
      >
        <Painel>
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cascata} layout="vertical" margin={{ top: 4, right: 90, bottom: 4, left: 8 }}>
                <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" horizontal={false} />
                <XAxis type="number" {...eixoX} tickFormatter={(v) => fmtBRL(v)} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={230}
                  tick={{ fill: "#8FA6B2", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0]?.payload;
                    return (
                      <div className="bg-chassi border border-traco rounded-md px-3 py-2">
                        <div className="font-mono text-[10px] text-tintaMuda">{label}</div>
                        <div className="font-mono tabular text-sm text-tinta">{fmtBRL(p.mostra, false)}</div>
                        {p.meta && <div className="font-mono text-[10px] text-competencia mt-0.5">{p.meta}</div>}
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={0} stroke={CORES.tintaMuda} />
                {/* base invisível do waterfall */}
                <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="valor" stackId="w" radius={2}>
                  {cascata.map((p, k) => (
                    <Cell
                      key={k}
                      fill={p.nivel ? (p.mostra >= 0 ? CORES.caixa : CORES.alerta) : p.mostra >= 0 ? CORES.foto : CORES.saida}
                      opacity={p.nivel ? 1 : 0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-tintaMuda mt-2">
            Níveis (M0–M5) em verde/vermelho; movimentos em azul (positivo) e rosa (negativo). M3 — margem de contribuição com mídia isolada — entra quando a F2 separar mídia paga do bloco S&M no journal.
          </p>
        </Painel>
      </Secao>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
        <Secao titulo="Margens no tempo" nota="bruta vs. operacional · realizado">
          <Painel>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={margens} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="mes" {...eixoX} interval={2} />
                  <YAxis {...eixoY} tickFormatter={(v) => `${v}%`} width={42} domain={[-60, 80]} />
                  <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtPct(v, 0)} />} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }} />
                  <ReferenceLine y={65} stroke={CORES.caixa} strokeDasharray="4 4" label={{ value: "meta bruta 65%", fill: CORES.caixa, fontSize: 10, position: "insideTopRight" }} />
                  <ReferenceLine y={15} stroke={CORES.competencia} strokeDasharray="4 4" label={{ value: "meta op. 15%", fill: CORES.competencia, fontSize: 10, position: "insideBottomRight" }} />
                  <ReferenceLine y={0} stroke={CORES.tintaMuda} />
                  <Line dataKey="bruta" name="Margem bruta" stroke={CORES.caixa} strokeWidth={2} dot={false} />
                  <Line dataKey="operacional" name="Margem operacional" stroke={CORES.competencia} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-tintaMuda mt-2">
              A volatilidade (−47% a +39% de margem operacional) é em parte artefato de medir tudo num eixo só — o argumento central do dual ledger. A leitura por competência estabiliza a série.
            </p>
          </Painel>
        </Secao>

        <Secao titulo="Take-home da receita" nota="M5 caixa ÷ receita bruta · meta: > 0 estrutural">
          <Painel>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={takeHome} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="mes" {...eixoX} interval={2} />
                  <YAxis {...eixoY} tickFormatter={(v) => `${v}%`} width={42} />
                  <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtPct(v, 0)} />} />
                  <ReferenceLine y={0} stroke={CORES.tintaMuda} />
                  <Bar dataKey="pct" name="Take-home" radius={[3, 3, 0, 0]}>
                    {takeHome.map((d, k) => (
                      <Cell key={k} fill={(d.pct ?? 0) >= 0 ? CORES.caixa : CORES.alerta} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Painel>
        </Secao>
      </div>

      <Secao titulo="As quatro lentes da cascata" chip={<ChipLivro tipo="construir" />} nota="o que a F2 destrava">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { lente: "Por produto", status: "base existe", farol: "amarelo" as const, desc: "pl_by_product evolui para a cascata completa M0→M4 por grupo_produto, com flag tem_custo_ia separando produtos com e sem COGS de IA." },
            { lente: "Por coorte", status: "construir", farol: "vermelho" as const, desc: "M0→M3 por mês de venda, refeita a cada foto M+90. Margem de coorte madura: o número que diz se abril valeu a pena de verdade." },
            { lente: "Por usuário", status: "dado existe", farol: "amarelo" as const, desc: "user_cost_ai_gateway (27M de linhas) cruzado com receita por email: margem individual. Destrava limites de uso e tier enterprise." },
            { lente: "Por canal", status: "base existe", farol: "amarelo" as const, desc: "M3 por utm_source_clean. Canal com ROAS alto e refund alto pode ter M3 pior que canal modesto e limpo — o corretor de ilusões do growth." },
          ].map((l) => (
            <Painel key={l.lente}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-600 text-sm text-tinta">{l.lente}</span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] text-tintaMuda uppercase">
                  <Farol estado={l.farol} /> {l.status}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-tintaSuave">{l.desc}</p>
            </Painel>
          ))}
        </div>
      </Secao>
    </>
  );
}
