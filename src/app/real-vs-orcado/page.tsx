"use client";

import { useMemo, useState } from "react";
import { MESES, FLUXO, PL, IDX_ULTIMO_REAL, IDX_MES_CORRENTE, fmtBRL, fmtPct, rotuloMes, farolVariance } from "@/lib/data";
import { Cabecalho, Secao, Painel, ChipLivro, Farol } from "@/components/ui";
import { CORES, TooltipCaixa, eixoX, eixoY } from "@/components/grafico";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, Area, Cell,
} from "recharts";

export default function RealVsOrcado() {
  const [mes, setMes] = useState(IDX_ULTIMO_REAL);

  /**
   * V0: o journal carrega valor_projetado × valor_pago — o micro Real vs.
   * Orçado de tesouraria. Como a extração mensal já consolida o projetado
   * dos meses futuros, usamos: REAL = meses fechados · PLANO = a curva
   * projetada de jun→dez/26. O fato orçamento versionado (AOP-2026 em
   * gold__budget__fato) substitui esta proxy na F3.
   */
  const linhas = useMemo(() => {
    const defs: { nome: string; serie: (i: number) => number | null }[] = [
      { nome: "Receita bruta", serie: (i) => PL.receita_bruta[i] },
      { nome: "Deduções da receita", serie: (i) => PL.deducoes[i] },
      { nome: "CSP (IA · infra · taxas)", serie: (i) => PL.csp[i] },
      { nome: "Despesas S&M", serie: (i) => PL.desp_sm[i] },
      { nome: "Despesas G&A", serie: (i) => PL.desp_ga[i] },
      { nome: "Despesas R&D", serie: (i) => PL.desp_rd[i] },
      { nome: "Adapta Summit", serie: (i) => PL.desp_summit[i] },
      { nome: "Impostos", serie: (i) => PL.outras_desp_impostos[i] },
      { nome: "Resultado operacional", serie: (i) => PL.resultado_operacional[i] },
    ];
    return defs.map((d) => {
      const real = d.serie(mes);
      // plano-proxy: média dos 3 meses anteriores (run-rate) até o fato orçamento existir
      const hist = [mes - 1, mes - 2, mes - 3].map((k) => (k >= 0 ? d.serie(k) ?? 0 : 0));
      const plano = hist.reduce((a, b) => a + b, 0) / hist.filter((_, k) => mes - 1 - k >= 0).length;
      const delta = real !== null && plano !== 0 ? ((real - plano) / Math.abs(plano)) * 100 : null;
      return { nome: d.nome, real, plano, delta, farol: farolVariance(delta) };
    });
  }, [mes]);

  const serieReceita = MESES.map((m, k) => ({
    mes: rotuloMes(m),
    real: k <= IDX_ULTIMO_REAL ? PL.receita_bruta[k] : null,
    plano: k >= IDX_MES_CORRENTE ? Math.abs(FLUXO.saidas_total[k] ?? 0) * 0 + (PL.receita_bruta[k] ?? 0) : null,
    saidasPlano: k >= IDX_MES_CORRENTE ? FLUXO.saidas_total[k] : null,
    saidasReal: k <= IDX_ULTIMO_REAL ? FLUXO.saidas_total[k] : null,
  }));

  return (
    <>
      <Cabecalho
        codigo="06"
        titulo="Real vs. Orçado — variance bridge"
        descricao="Comparação como JOIN, não como planilha reconstruída. Na V0, o 'plano' é o run-rate trimestral e a curva projetada do journal; o fato orçamento versionado (AOP-2026) entra na F3."
        acoes={<ChipLivro tipo="construir" />}
      />

      <Secao titulo="Realizado × curva projetada" chip={<ChipLivro tipo="caixa" />} nota="à direita da linha: o que o journal projeta para jun→dez/26">
        <Painel>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serieReceita} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="gradReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORES.caixa} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CORES.caixa} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                <XAxis dataKey="mes" {...eixoX} interval={1} />
                <YAxis {...eixoY} tickFormatter={(v) => fmtBRL(v)} width={70} />
                <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtBRL(v, false)} />} />
                <ReferenceLine x={rotuloMes(MESES[IDX_MES_CORRENTE])} stroke={CORES.atencao} strokeDasharray="3 3" label={{ value: "hoje", fill: CORES.atencao, fontSize: 10, position: "top" }} />
                <ReferenceLine y={0} stroke={CORES.tintaMuda} />
                <Area dataKey="real" name="Receita realizada" stroke={CORES.caixa} strokeWidth={2} fill="url(#gradReal)" connectNulls={false} />
                <Line dataKey="plano" name="Receita projetada" stroke={CORES.caixa} strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls={false} />
                <Line dataKey="saidasReal" name="Saídas realizadas" stroke={CORES.saida} strokeWidth={2} dot={false} connectNulls={false} />
                <Line dataKey="saidasPlano" name="Saídas projetadas" stroke={CORES.saida} strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Painel>
      </Secao>

      <Secao
        titulo="Bridge por linha de P&L"
        nota="🟢 |Δ|≤5% · 🟡 5–10% (explicar no fechamento) · 🔴 >10% (plano de ação com dono)"
        chip={
          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="bg-painel border border-traco rounded px-2 py-1 font-mono text-xs text-tinta"
          >
            {MESES.slice(3, IDX_ULTIMO_REAL + 1).map((m) => (
              <option key={m} value={MESES.indexOf(m)}>{rotuloMes(m)}</option>
            ))}
          </select>
        }
      >
        <Painel className="p-0 overflow-x-auto scroll-fino">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-traco font-mono text-[10px] uppercase tracking-wider text-tintaMuda">
                <th className="text-left px-4 py-3">Linha de P&L</th>
                <th className="text-right px-4 py-3">Real · {rotuloMes(MESES[mes])}</th>
                <th className="text-right px-4 py-3">Run-rate 3m (proxy de plano)</th>
                <th className="text-right px-4 py-3">Δ %</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.nome} className="border-b border-tracoSuave last:border-0 hover:bg-painel/60">
                  <td className="px-4 py-3 text-tinta">{l.nome}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-tinta">{fmtBRL(l.real, false)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-tintaSuave">{fmtBRL(l.plano, false)}</td>
                  <td className={`px-4 py-3 text-right font-mono tabular ${
                    l.farol === "vermelho" ? "text-alerta" : l.farol === "amarelo" ? "text-atencao" : "text-caixa"
                  }`}>
                    {l.delta !== null ? `${l.delta > 0 ? "+" : ""}${l.delta.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-center"><Farol estado={l.farol} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Painel>
        <p className="text-[11px] text-tintaMuda mt-3 max-w-3xl">
          A decomposição volume × preço × mix exige o driver explícito de cada linha orçada (vendas_qtd, ticket, usd_brl, cpm…) — ela nasce junto com gold__budget__fato e gold__budget__variance na F3. Sem driver, todo desvio vira &quot;o mercado&quot;.
        </p>
      </Secao>

      <Secao titulo="As três regras que fazem o modelo funcionar" chip={<ChipLivro tipo="construir" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { t: "Mesmas chaves do real", d: "O orçado usa exatamente a taxonomia do realizado: categoria_p_l e item_p_l do journal, grupo_produto do de-para. Linha orçada sem equivalente no real falha o teste de integridade do fechamento." },
            { t: "Versões imutáveis", d: "O AOP nunca é editado. Mudou o cenário? Cria-se RF-2026-Q3. Relatórios mostram sempre vs. AOP (a promessa ao board) e vs. último reforecast (a expectativa corrente)." },
            { t: "Driver explícito", d: "Cada linha declara seu driver e premissa. Isso separa erro de premissa (o câmbio estourou) de erro de execução (vendemos menos) — a distinção que transforma reunião em decisão." },
          ].map((r, k) => (
            <Painel key={k}>
              <div className="font-mono text-[10px] text-construir mb-1.5">REGRA {k + 1}</div>
              <div className="font-display font-600 text-sm text-tinta mb-1.5">{r.t}</div>
              <p className="text-[12px] leading-relaxed text-tintaSuave">{r.d}</p>
            </Painel>
          ))}
        </div>
      </Secao>
    </>
  );
}
