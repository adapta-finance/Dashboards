"use client";

import { PL, FLUXO, RATIOS, MESES, IDX_ULTIMO_REAL, fmtPct, soma, resultadoCaixa } from "@/lib/data";
import { Cabecalho, Secao, Painel, ChipLivro, Farol } from "@/components/ui";

type Linha = {
  metrica: string;
  formula: string;
  elite: string;
  saudavel: string;
  cadencia: string;
  atual?: string;
  farol?: "verde" | "amarelo" | "vermelho" | "nd";
  fonte: "calculado" | "construir";
};

export default function Benchmarks() {
  const i = IDX_ULTIMO_REAL;

  // Gross margin (média 3m da margem bruta caixa)
  const gm3m = ((PL.margem_bruta_pct[i] ?? 0) + (PL.margem_bruta_pct[i - 1] ?? 0) + (PL.margem_bruta_pct[i - 2] ?? 0)) / 3;

  // Take-home YTD 2026
  const idxJan26 = MESES.indexOf("2026-01");
  let m5Ytd = 0;
  for (let k = idxJan26; k <= i; k++) m5Ytd += resultadoCaixa(k) ?? 0;
  const rbYtd = soma(PL.receita_bruta, idxJan26, i);
  const takeHomeYtd = rbYtd ? (m5Ytd / rbYtd) * 100 : null;

  // Crescimento YoY (mai/26 vs mai/25)
  const yoy = ((PL.receita_bruta[i] ?? 0) / (PL.receita_bruta[i - 12] ?? 1) - 1) * 100;
  const ruleOf40 = yoy + (takeHomeYtd ?? 0);

  // % antecipação último mês
  const antPct = ((FLUXO.entradas["Receita via Antecipação"][i] ?? 0) / (FLUXO.entradas_total[i] ?? 1)) * 100;

  // AI cost ratio
  const aiRatio = Math.abs(RATIOS.api_infra_sobre_receita_pct[16] ?? 0);

  const linhas: Linha[] = [
    { metrica: "Gross margin (caixa)", formula: "M2 ÷ M1 · média 3m", elite: "70–80% SaaS", saudavel: ">65% AI-native", cadencia: "Mensal", atual: fmtPct(gm3m, 0), farol: gm3m >= 65 ? "verde" : gm3m >= 50 ? "amarelo" : "vermelho", fonte: "calculado" },
    { metrica: "Crescimento YoY", formula: "receita bruta mai/26 ÷ mai/25", elite: "—", saudavel: "—", cadencia: "Mensal", atual: fmtPct(yoy, 0), farol: yoy > 0 ? "verde" : "vermelho", fonte: "calculado" },
    { metrica: "Rule of 40", formula: "crescimento YoY % + margem FCF % (M5 caixa ÷ receita)", elite: ">40", saudavel: ">25 em scale-up", cadencia: "Trimestral", atual: ruleOf40.toFixed(0), farol: ruleOf40 >= 40 ? "verde" : ruleOf40 >= 25 ? "amarelo" : "vermelho", fonte: "calculado" },
    { metrica: "Take-home da receita", formula: "M5 caixa ÷ receita bruta · YTD 2026", elite: "—", saudavel: ">0 estrutural", cadencia: "Mensal", atual: fmtPct(takeHomeYtd, 1), farol: (takeHomeYtd ?? 0) > 0 ? "verde" : "vermelho", fonte: "calculado" },
    { metrica: "% caixa via antecipação", formula: "antecipação ÷ entradas totais", elite: "—", saudavel: "<30%", cadencia: "Mensal", atual: fmtPct(antPct, 1), farol: antPct > 30 ? "vermelho" : antPct > 20 ? "amarelo" : "verde", fonte: "calculado" },
    { metrica: "AI Cost Ratio", formula: "custo IA ÷ receita líquida", elite: "—", saudavel: "<20%", cadencia: "Diária + mensal", atual: fmtPct(aiRatio, 0) + " *", farol: aiRatio <= 20 ? "verde" : aiRatio <= 25 ? "amarelo" : "vermelho", fonte: "calculado" },
    { metrica: "NRR", formula: "receita da base existente ÷ mesma base há 12m (sales master)", elite: ">120% B2B", saudavel: ">90% consumer", cadencia: "Mensal", fonte: "construir" },
    { metrica: "Burn Multiple", formula: "caixa queimado ÷ net new ARR", elite: "<1×", saudavel: "<2×", cadencia: "Trimestral", fonte: "construir" },
    { metrica: "Magic Number", formula: "Δ receita anualizada do tri ÷ S&M do tri anterior", elite: ">1,0", saudavel: ">0,75", cadencia: "Trimestral", fonte: "construir" },
    { metrica: "CAC Payback", formula: "CAC ÷ (ARPU mensal × margem bruta M2)", elite: "<6 meses", saudavel: "<12 meses", cadencia: "Trimestral", fonte: "construir" },
    { metrica: "LTV/CAC (margem real)", formula: "margem de coorte madura ÷ CAC da coorte (foto M+90)", elite: ">5×", saudavel: ">3×", cadencia: "Trimestral", fonte: "construir" },
    { metrica: "Refund rate maduro", formula: "reembolso_cohort M+90 ÷ receita bruta da coorte", elite: "<5%", saudavel: "<10% em 12m", cadencia: "Mensal (foto)", fonte: "construir" },
    { metrica: "Forecast accuracy", formula: "|real − forecast| ÷ real · receita e caixa 30d", elite: "±3%", saudavel: "±5–8%", cadencia: "Mensal", fonte: "construir" },
    { metrica: "Concentração Top-3 fornecedores", formula: "top 3 saídas ÷ saídas operacionais", elite: "<30%", saudavel: "<45%", cadencia: "Trimestral", fonte: "construir" },
  ];

  return (
    <>
      <Cabecalho
        codigo="08"
        titulo="Benchmarks — o placar canônico"
        descricao="A língua franca de valuation: Bessemer, a16z, burn multiple de David Sacks, e a economia de tokens dos laboratórios de IA. Bússola, não gabarito — revalidar a cada ciclo anual."
      />

      <Secao titulo="Placar da Adapta" nota={`calculado sobre a visão caixa do journal · fechamento mai/26`}>
        <Painel className="p-0 overflow-x-auto scroll-fino">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-traco font-mono text-[10px] uppercase tracking-wider text-tintaMuda">
                <th className="text-left px-4 py-3">Métrica</th>
                <th className="text-left px-4 py-3">Fórmula no repositório</th>
                <th className="text-right px-4 py-3">Atual</th>
                <th className="text-right px-4 py-3">Elite</th>
                <th className="text-right px-4 py-3">Saudável</th>
                <th className="text-left px-4 py-3">Cadência</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.metrica} className={`border-b border-tracoSuave last:border-0 ${l.fonte === "construir" ? "opacity-55" : ""}`}>
                  <td className="px-4 py-3 text-tinta font-display font-600 text-[13px]">{l.metrica}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-tintaSuave max-w-xs">{l.formula}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-tinta">{l.atual ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-caixa">{l.elite}</td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-competencia">{l.saudavel}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-tintaMuda">{l.cadencia}</td>
                  <td className="px-4 py-3 text-center">
                    {l.fonte === "construir" ? <ChipLivro tipo="construir" /> : <Farol estado={l.farol ?? "nd"} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Painel>
        <p className="text-[11px] text-tintaMuda mt-3 max-w-3xl">
          * Proxy: a linha &quot;APIs / Infra / SaaS&quot; do journal sobre receita cash — inclui SaaS além de IA pura. O AI Cost Ratio exato vem de custo_api_consolidado ÷ receita líquida (F2). Linhas esmaecidas dependem de transformations marcadas CONSTRUIR no roadmap.
        </p>
      </Secao>

      <Secao titulo="O que a Adapta copia de cada referência">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { ref: "Shopify", tema: "Disciplina de flywheel", desc: "Data lake unificado, revisões mensais em métricas padronizadas, GMV por coorte. Tradução: attach rate = % da base com 2+ grupos de produto; take rate análogo = receita ÷ market_cost dos tokens." },
            { ref: "OpenAI & Anthropic", tema: "Economia de tokens", desc: "Custo por 1M tokens, mix de modelos, taxa de cache, margem de inferência por tier — em tempo quase real. A telemetria já existe no gateway: ai_gateway_consumo_por_modelo, total_cost vs market_cost." },
            { ref: "SaaS elite", tema: "O cânone dos investidores", desc: "NRR, Rule of 40, Magic Number, Burn Multiple, CAC payback. Quem chega numa Série B sem esses números nativos no warehouse negocia em desvantagem." },
          ].map((r) => (
            <Painel key={r.ref}>
              <div className="font-mono text-[10px] text-foto mb-1">{r.ref.toUpperCase()}</div>
              <div className="font-display font-600 text-sm text-tinta mb-1.5">{r.tema}</div>
              <p className="text-[12px] leading-relaxed text-tintaSuave">{r.desc}</p>
            </Painel>
          ))}
        </div>
      </Secao>
    </>
  );
}
