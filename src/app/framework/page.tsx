"use client";

import { useMemo, useState } from "react";
import { MESES, FLUXO, PL, IDX_ULTIMO_REAL, fmtBRL, fmtPct, rotuloMes, soma } from "@/lib/data";
import { Cabecalho, Secao, Painel, ChipLivro, SeletorPeriodo, Farol } from "@/components/ui";

type Indicador = {
  dim: string;
  nome: string;
  formula: string;
  desc?: string;
  benchmark?: string;
  target?: string;
  freq: string;
  owner?: string;
  valor?: string;
  detalhe?: string;
  farol?: "verde" | "amarelo" | "vermelho";
  status: "calculado" | "instrumentar";
};

const DIMENSOES = [
  { id: "north", n: "01", titulo: "North Star & C-Level" },
  { id: "unit", n: "02", titulo: "Unit Economics" },
  { id: "custo", n: "03", titulo: "Eficiência de Custos" },
  { id: "produto", n: "04", titulo: "Produto & Experiência" },
  { id: "growth", n: "05", titulo: "Crescimento & Marketing" },
  { id: "tech", n: "06", titulo: "Tecnologia & R&D" },
  { id: "pessoas", n: "07", titulo: "Pessoas & Cultura" },
  { id: "risco", n: "08", titulo: "Risco & Compliance" },
];

export default function Framework() {
  const [inicio, setInicio] = useState(0);
  const [fim, setFim] = useState(IDX_ULTIMO_REAL);
  const [dimAtiva, setDimAtiva] = useState<string>("todas");
  const [soCalculados, setSoCalculados] = useState(false);
  const [busca, setBusca] = useState("");

  const indicadores = useMemo<Indicador[]>(() => {
    const i0 = inicio, i1 = fim;
    const rb = soma(PL.receita_bruta, i0, i1);
    const rl = soma(PL.receita_liquida, i0, i1);
    const ded = Math.abs(soma(PL.deducoes, i0, i1));
    const csp = Math.abs(soma(PL.csp, i0, i1));
    const lb = soma(PL.lucro_bruto, i0, i1);
    const ro = soma(PL.resultado_operacional, i0, i1);
    const sm = Math.abs(soma(PL.desp_sm, i0, i1));
    const ga = Math.abs(soma(PL.desp_ga, i0, i1));
    const rd = Math.abs(soma(PL.desp_rd, i0, i1));
    const midia = Math.abs(soma(FLUXO.saidas["Mídia Paga"], i0, i1));
    const gateway = Math.abs(soma(FLUXO.saidas["Tarifas Bancárias / Gateway"], i0, i1));
    const pessoal = Math.abs(soma(FLUXO.saidas["Pessoal"], i0, i1));
    const impostos = Math.abs(soma(FLUXO.saidas["Impostos"], i0, i1));
    const antEntrada = soma(FLUXO.entradas["Receita via Antecipação"], i0, i1);
    const antCusto = Math.abs(soma(FLUXO.saidas["Custos de Antecipação"], i0, i1));
    const summitRec = soma(FLUXO.entradas["Adapta Summit"], i0, i1);
    const summitSaida = Math.abs(soma(FLUXO.saidas["Adapta Summit"], i0, i1));
    const recVendasUlt = FLUXO.entradas["Receita de Vendas"][i1] ?? 0;

    const gm = rl ? (lb / rl) * 100 : null;
    const ebitda = rl ? (ro / rl) * 100 : null;
    const refund = rb ? (ded / rb) * 100 : null;
    const cspPct = rl ? (csp / rl) * 100 : null;
    const smPct = rb ? (sm / rb) * 100 : null;
    const midiaPct = rb ? (midia / rb) * 100 : null;
    const gwPct = rb ? (gateway / rb) * 100 : null;
    const gaPct = rl ? (ga / rl) * 100 : null;
    const antPct = antEntrada ? (antCusto / antEntrada) * 100 : null;
    const mom = i1 > 0 && PL.receita_bruta[i1 - 1]
      ? (((PL.receita_bruta[i1] ?? 0) / (PL.receita_bruta[i1 - 1] ?? 1)) - 1) * 100
      : null;
    const arr = recVendasUlt * 12;

    const f = (v: number | null, lim: [number, number], invertido = false): "verde" | "amarelo" | "vermelho" => {
      if (v === null) return "vermelho";
      const [bom, ok] = lim;
      if (!invertido) return v >= bom ? "verde" : v >= ok ? "amarelo" : "vermelho";
      return v <= bom ? "verde" : v <= ok ? "amarelo" : "vermelho";
    };

    return [
      { dim: "north", nome: "★ NRR — Net Revenue Retained", formula: "(rec. bruta − devoluções − chargebacks) ÷ receita anterior × 100", desc: "A North Star: >100% = a base cresce sozinha.", benchmark: "SaaS elite >120% · marketplace >90%", target: ">100%", freq: "Mensal", owner: "CEO + CFO", status: "instrumentar", detalhe: "exige receita por cliente/coorte (sales master)" },
      { dim: "north", nome: "ARR — Receita Anual Recorrente", formula: "receita recorrente do mês × 12 (excl. antecipação e Summit)", valor: fmtBRL(arr), detalhe: `base ${rotuloMes(MESES[i1])}: vendas ${fmtBRL(recVendasUlt)}/mês`, target: "+30% YoY", freq: "Mensal", status: "calculado", farol: "verde" },
      { dim: "north", nome: "Gross Margin", formula: "(receita líq. − CSP) ÷ receita líq. × 100", valor: fmtPct(gm, 0), benchmark: "SaaS 70–80%", target: ">65%", freq: "Mensal", status: "calculado", farol: f(gm, [65, 50]) },
      { dim: "north", nome: "EBITDA Margin", formula: "resultado operacional ÷ receita líquida (visão caixa)", valor: fmtPct(ebitda, 0), target: ">15% sustentado", benchmark: "scale-up 15–25%", freq: "Mensal", status: "calculado", farol: f(ebitda, [15, 0]) },
      { dim: "north", nome: "MoM Revenue Growth", formula: "(receita mês N − mês N−1) ÷ mês N−1", valor: mom !== null ? `${mom > 0 ? "+" : ""}${mom.toFixed(1)}%` : "—", detalhe: `${rotuloMes(MESES[i1])} vs ${rotuloMes(MESES[Math.max(0, i1 - 1)])}`, target: "+8–12% consistente", freq: "Mensal", status: "calculado", farol: f(mom, [8, 0]) },
      { dim: "north", nome: "Cash Runway", formula: "saldo em caixa ÷ burn médio mensal", valor: "∞", detalhe: "burn médio 3m positivo no fechamento atual", target: ">12 meses (confortável >18)", freq: "Mensal", owner: "CFO", status: "calculado", farol: "verde" },
      { dim: "unit", nome: "CAC — Custo de Aquisição", formula: "(mídia + influenciadores + comissões + salários S&M) ÷ novos clientes", desc: "O KPI mais urgente a instrumentar: sem ele, mídia é alocada às cegas.", benchmark: "payback <12m", freq: "Mensal", owner: "CMO + Vendas", status: "instrumentar", detalhe: `S&M no período: ${fmtBRL(sm)}` },
      { dim: "unit", nome: "LTV — Lifetime Value", formula: "ticket médio × frequência anual × gross margin × (1 ÷ churn)", benchmark: "LTV/CAC >3× · elite >5×", freq: "Trimestral por coorte", status: "instrumentar", detalhe: "calcular por segmento: B2B Gold vs B2C vs Summit" },
      { dim: "unit", nome: "Churn Rate", formula: "clientes cancelados ÷ ativos no início do mês", benchmark: "SaaS elite <2%/mês", freq: "Semanal", status: "instrumentar" },
      { dim: "unit", nome: "Refund Rate", formula: "reembolsos ÷ receita bruta × 100", valor: fmtPct(refund), benchmark: "marketplace <5%", target: "<10% em 12 meses", freq: "Diária", status: "calculado", farol: f(refund, [10, 15], true), detalhe: `deduções no período: ${fmtBRL(ded)}` },
      { dim: "unit", nome: "ARPU", formula: "receita líquida ÷ usuários ativos", freq: "Mensal (MoM e YoY)", status: "instrumentar" },
      { dim: "unit", nome: "Payback Period", formula: "CAC ÷ (ARPU × gross margin)", benchmark: "excelente <6m · aceitável <12m", freq: "Mensal", status: "instrumentar" },
      { dim: "unit", nome: "Expansion Revenue %", formula: "receita de upsell/cross-sell ÷ MRR total", target: ">20% da receita", freq: "Mensal", status: "instrumentar", detalhe: "Gold, eventos premium, licenças adicionais" },
      { dim: "custo", nome: "CSP / Receita (AI Cost Ratio)", formula: "custos de API + infra ÷ receita líquida × 100", valor: fmtPct(cspPct, 0), target: "<20%", benchmark: "AI-native <30%", freq: "Mensal + alerta semanal", status: "calculado", farol: f(cspPct, [20, 30], true), detalhe: `CSP no período: ${fmtBRL(csp)}` },
      { dim: "custo", nome: "S&M Efficiency Ratio", formula: "despesas S&M ÷ receita bruta × 100", valor: fmtPct(smPct, 0), benchmark: "SaaS scale 20–30%", freq: "Mensal", status: "calculado", farol: f(smPct, [30, 40], true) },
      { dim: "custo", nome: "Mídia Paga / Receita", formula: "mídia paga ÷ receita bruta × 100", valor: fmtPct(midiaPct, 0), benchmark: "e-commerce 10–20%", freq: "Semanal", status: "calculado", farol: f(midiaPct, [20, 30], true), detalhe: `mídia no período: ${fmtBRL(midia)}` },
      { dim: "custo", nome: "Gateway Cost Ratio", formula: "tarifas de gateway ÷ receita bruta × 100", valor: fmtPct(gwPct, 1), benchmark: "1,5–2,5%", target: "renegociar a 1,5% ao escalar", freq: "Mensal", status: "calculado", farol: f(gwPct, [2.5, 3.5], true), detalhe: `tarifas no período: ${fmtBRL(gateway)}` },
      { dim: "custo", nome: "Revenue per FTE", formula: "receita líquida ÷ headcount (PJ + CLT)", target: ">R$ 1,5M/FTE", freq: "Trimestral", owner: "CEO + People", status: "instrumentar", detalhe: `pessoal no período: ${fmtBRL(pessoal)}` },
      { dim: "custo", nome: "FX Exposure Ratio", formula: "custos em USD (em BRL) ÷ custos operacionais totais", desc: "10% de desvalorização do real ≈ R$7M+ de impacto direto na margem.", freq: "Mensal", status: "instrumentar" },
      { dim: "custo", nome: "G&A % da Receita", formula: "despesas G&A ÷ receita líquida × 100", valor: fmtPct(gaPct, 1), benchmark: "scale <10%", freq: "Mensal", status: "calculado", farol: f(gaPct, [10, 15], true) },
      { dim: "custo", nome: "Custo Real da Antecipação", formula: "custos de antecipação ÷ receita antecipada × 100", valor: fmtPct(antPct, 2), benchmark: "≈1% é razoável", freq: "Mensal", status: "calculado", farol: f(antPct, [1.5, 3], true), detalhe: `antecipado ${fmtBRL(antEntrada)} · custo ${fmtBRL(antCusto)}` },
      { dim: "produto", nome: "NPS — Net Promoter Score", formula: "% promotores (9–10) − % detratores (0–6)", benchmark: "EdTech/SaaS >40 · excelente >60", freq: "Contínuo (transacional)", owner: "CPO + CX", status: "instrumentar", desc: "Aplicar pós-compra e pós-reembolso: leading indicator de churn." },
      { dim: "produto", nome: "DAU/MAU (Stickiness)", formula: "usuários ativos no dia ÷ usuários ativos no mês", benchmark: "EdTech 15–30%", target: ">25%", freq: "Semanal", status: "instrumentar" },
      { dim: "produto", nome: "Content Completion Rate", formula: "usuários que completaram ÷ que iniciaram × 100", benchmark: "EdTech referência >60% · mercado 20–30%", freq: "Mensal", status: "instrumentar", desc: "O KPI de produto que mais explica o refund de 20%+." },
      { dim: "produto", nome: "Time to Value (TTV)", formula: "tempo médio da compra até o primeiro valor percebido", desc: "A alavanca mais direta para reduzir reembolsos.", freq: "Mensal", owner: "CPO + CX", status: "instrumentar" },
      { dim: "produto", nome: "First Response Time (FRT)", formula: "tempo médio do 1º atendimento após abertura do chamado", freq: "Semanal", status: "instrumentar" },
      { dim: "produto", nome: "Resolution Rate & CSAT", formula: "tickets resolvidos ÷ total · média de avaliação pós-atendimento", target: "resolution >90% · CSAT >4,2/5", freq: "Semanal", status: "instrumentar" },
      { dim: "produto", nome: "Feature Adoption Rate", formula: "usuários que usaram a feature ÷ ativos × 100", target: "core features >40%", freq: "Mensal", status: "instrumentar", detalhe: `R&D no período: ${fmtBRL(rd)}` },
      { dim: "growth", nome: "ROAS — Return on Ad Spend", formula: "receita atribuída ao canal ÷ investimento em mídia no canal", benchmark: "mínimo >3× · saudável >5×", freq: "Diária por campanha", status: "instrumentar", detalhe: `mídia paga no período: ${fmtBRL(midia)} — atribuição por UTM pendente` },
      { dim: "growth", nome: "Viral Coefficient (K-Factor)", formula: "convites por usuário × taxa de conversão do convite", target: "K >0,3 (ambição 0,5)", freq: "Mensal", status: "instrumentar", desc: "Comunidade ativa é um ativo não monetizado." },
      { dim: "growth", nome: "Conversion Rate por Canal", formula: "compras ÷ visitantes, por canal de origem", benchmark: "e-commerce 1–3% · landing 5–15%", freq: "Semanal", status: "instrumentar" },
      { dim: "growth", nome: "Cohort Retention D7/D30/D90", formula: "usuários do coorte M ainda ativos em M+1 ÷ total do coorte", benchmark: "EdTech D30 >40% · D90 >20%", freq: "Mensal", status: "instrumentar", desc: "Decide entre 'crescer mais' e 'corrigir o produto primeiro'." },
      { dim: "growth", nome: "Influencer ROI", formula: "receita atribuída ÷ cachê (UTM + cupom único)", target: ">2×", freq: "Por contrato", status: "instrumentar" },
      { dim: "growth", nome: "Email/CRM Engagement", formula: "open rate · click rate · receita atribuída a CRM", target: "open >25% · click >3%", freq: "Semanal", status: "instrumentar" },
      { dim: "growth", nome: "Adapta Summit — ROI do Evento", formula: "(receita Summit + LTV incremental captado) ÷ custo total", valor: summitSaida > 0 ? `${(summitRec / summitSaida).toFixed(2)}× direto` : "—", detalhe: `receita ${fmtBRL(summitRec)} · saída caixa ${fmtBRL(summitSaida)} no período`, freq: "Por edição", status: summitSaida > 0 ? "calculado" : "instrumentar", farol: summitSaida > 0 ? (summitRec / summitSaida >= 1 ? "verde" : "vermelho") : undefined, desc: "ROI completo exige conversão pós-evento rastreada." },
      { dim: "tech", nome: "Deployment Frequency & Lead Time", formula: "deploys/semana · tempo do commit à produção (DORA)", benchmark: "elite >1 deploy/dia", freq: "Semanal", status: "instrumentar" },
      { dim: "tech", nome: "Uptime & AI Latency P95", formula: "(tempo total − downtime) ÷ tempo total · P95 das APIs de IA", target: "uptime >99,9%", freq: "Tempo real", status: "instrumentar", desc: "Latência alta = abandono = reembolso. Correlacionar com NPS." },
      { dim: "tech", nome: "R&D ROI", formula: "receita incremental por feature ÷ investimento em R&D", freq: "Trimestral", owner: "CPO + CFO", status: "instrumentar", detalhe: `R&D no período: ${fmtBRL(rd)}` },
      { dim: "tech", nome: "AI Token Cost per Session", formula: "custo total de API ÷ sessões com IA", target: "−20% ao semestre via caching/routing", freq: "Diária", status: "instrumentar" },
      { dim: "pessoas", nome: "Employee NPS (eNPS)", formula: "% que recomendaria (9–10) − % que não (0–6)", benchmark: "tech Brasil >30", target: ">40", freq: "Trimestral", status: "instrumentar", desc: "Prediz attrition 6 meses antes." },
      { dim: "pessoas", nome: "Voluntary Turnover", formula: "saídas voluntárias ÷ headcount médio × 100", desc: "Cada saída em tech custa 0,5–2× o salário anual.", freq: "Trimestral", status: "instrumentar" },
      { dim: "pessoas", nome: "Time-to-Hire & Quality of Hire", formula: "dias da vaga ao contrato · performance em 90 dias", target: ">80% 'exceeds' em 90d", freq: "Por vaga", status: "instrumentar" },
      { dim: "risco", nome: "Budget Variance", formula: "(realizado − projetado) ÷ projetado × 100, por categoria e depto", target: "alerta >15% · explicação no mesmo dia acima de 10%", freq: "Semanal", status: "instrumentar" },
      { dim: "risco", nome: "Fraud & Chargeback Rate", formula: "chargebacks ÷ transações × 100, por gateway", benchmark: "limite Visa/MC: 1%", freq: "Diária", status: "instrumentar" },
      { dim: "risco", nome: "Tax Compliance Rate", formula: "ISS pago ÷ devido · IRPJ/CSLL/PIS/COFINS em dia", target: "100% em dia", freq: "Mensal", status: "instrumentar", detalhe: `impostos pagos no período: ${fmtBRL(impostos)}` },
      { dim: "risco", nome: "Supplier Concentration Risk", formula: "top 3 fornecedores ÷ saídas operacionais × 100", benchmark: "saudável <45%", freq: "Trimestral", status: "instrumentar" },
    ];
  }, [inicio, fim]);

  const visiveis = indicadores.filter(
    (k) =>
      (dimAtiva === "todas" || k.dim === dimAtiva) &&
      (!soCalculados || k.status === "calculado") &&
      (busca === "" || `${k.nome} ${k.formula} ${k.desc ?? ""}`.toLowerCase().includes(busca.toLowerCase()))
  );

  const nCalc = indicadores.filter((k) => k.status === "calculado").length;

  return (
    <>
      <Cabecalho
        codigo="FW"
        titulo="Framework de KPIs — 8 dimensões"
        descricao={`As ${indicadores.length} métricas do diagnóstico estratégico, da North Star ao risco. ${nCalc} já são calculadas ao vivo sobre a visão caixa do journal no período selecionado; as demais aparecem com a régua pronta, aguardando instrumentação.`}
        acoes={
          <SeletorPeriodo meses={MESES} rotulo={rotuloMes} inicio={inicio} fim={fim} onInicio={setInicio} onFim={setFim} />
        }
      />

      <Secao
        titulo={`Indicadores · ${rotuloMes(MESES[inicio])} → ${rotuloMes(MESES[fim])}`}
        nota={`${visiveis.length} de ${indicadores.length}`}
        chip={
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="buscar indicador…"
              className="bg-painel border border-traco rounded px-2.5 py-1.5 font-mono text-xs text-tinta placeholder:text-tintaMuda w-44"
            />
            <button
              onClick={() => setSoCalculados(!soCalculados)}
              className={`font-mono text-[10px] px-2.5 py-1.5 rounded border transition-colors ${
                soCalculados ? "border-caixa text-caixa bg-caixaFundo" : "border-traco text-tintaSuave"
              }`}
            >
              só calculados
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button onClick={() => setDimAtiva("todas")} className={`font-mono text-[10px] px-2.5 py-1.5 rounded-full border transition-colors ${dimAtiva === "todas" ? "border-caixa text-caixa bg-caixaFundo" : "border-traco text-tintaSuave hover:text-tinta"}`}>TODAS</button>
          {DIMENSOES.map((d) => (
            <button key={d.id} onClick={() => setDimAtiva(d.id)} className={`font-mono text-[10px] px-2.5 py-1.5 rounded-full border transition-colors ${dimAtiva === d.id ? "border-caixa text-caixa bg-caixaFundo" : "border-traco text-tintaSuave hover:text-tinta"}`}>
              {d.n} · {d.titulo.toUpperCase()}
            </button>
          ))}
        </div>

        {DIMENSOES.filter((d) => dimAtiva === "todas" || d.id === dimAtiva).map((d) => {
          const doGrupo = visiveis.filter((k) => k.dim === d.id);
          if (doGrupo.length === 0) return null;
          return (
            <div key={d.id} className="mb-8">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-mono text-[11px] text-caixa">{d.n}</span>
                <h3 className="font-display font-700 text-sm text-tinta">{d.titulo}</h3>
                <span className="font-mono text-[10px] text-tintaMuda">{doGrupo.filter((k) => k.status === "calculado").length}/{doGrupo.length} calculados</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {doGrupo.map((k) => (
                  <Painel key={k.nome} className={k.status === "instrumentar" ? "border-dashed opacity-80" : k.farol === "vermelho" ? "border-alerta/50" : k.farol === "amarelo" ? "border-atencao/40" : ""}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-display font-600 text-[13px] text-tinta leading-snug">{k.nome}</span>
                      {k.status === "calculado" ? (
                        <span className="flex items-center gap-1.5 shrink-0">
                          {k.farol && <Farol estado={k.farol} />}
                          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded bg-caixaFundo text-caixa border border-caixa/30">CALCULADO</span>
                        </span>
                      ) : <ChipLivro tipo="construir" />}
                    </div>
                    {k.valor && <div className="font-mono tabular text-xl font-600 text-tinta mb-1">{k.valor}</div>}
                    <p className="font-mono text-[10px] leading-relaxed text-tintaSuave bg-painel rounded px-2 py-1.5 border border-tracoSuave mb-2">{k.formula}</p>
                    {k.desc && <p className="text-[11px] leading-relaxed text-tintaSuave mb-2">{k.desc}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1.5 border-t border-tracoSuave font-mono text-[10px] text-tintaMuda">
                      {k.benchmark && <span><span className="text-foto">bench</span> {k.benchmark}</span>}
                      {k.target && <span><span className="text-competencia">target</span> {k.target}</span>}
                      <span><span className="text-tintaSuave">freq</span> {k.freq}</span>
                      {k.owner && <span><span className="text-tintaSuave">owner</span> {k.owner}</span>}
                    </div>
                    {k.detalhe && <div className="font-mono text-[10px] text-tintaMuda mt-1.5">{k.detalhe}</div>}
                  </Painel>
                ))}
              </div>
            </div>
          );
        })}
      </Secao>

      <Secao titulo="Matriz de priorização" nota="o que instrumentar primeiro, por impacto × complexidade">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { t: "Imediato", cor: "text-alerta", itens: ["Refund rate diário por coorte de produto", "ROAS por canal (Meta + Google)", "CAC por canal com atribuição", "Custo de IA por sessão (token tracking)", "Chargeback rate por gateway em tempo real", "NPS transacional pós-compra e pós-reembolso"] },
            { t: "30–60 dias", cor: "text-atencao", itens: ["LTV por segmento (B2B Gold vs B2C vs Summit)", "Cohort retention D7/D30/D90", "Gross margin mensal por linha de produto", "FX hedge — exposição cambial estruturada", "Budget variance automatizado por depto", "eNPS trimestral com plano de ação"] },
            { t: "60–90 dias", cor: "text-foto", itens: ["NRR calculado por coorte mensal", "ARR separado de one-off e antecipação", "R&D ROI por feature com feature flags", "Viral coefficient e tracking de referral", "Summit ROI com pipeline pós-evento", "Supplier concentration risk scoring"] },
            { t: "Estrutural", cor: "text-construir", itens: ["DAU/MAU por produto e plano", "Time to Value medido no produto", "AI latency P95 com SLA de fornecedor", "Quality of Hire (review 90 dias)", "DORA metrics de engenharia", "Tax compliance dashboard automatizado"] },
          ].map((q) => (
            <Painel key={q.t}>
              <div className={`font-mono text-[10px] uppercase tracking-wider mb-2 ${q.cor}`}>{q.t}</div>
              <ul className="space-y-1.5">
                {q.itens.map((it) => (
                  <li key={it} className="text-[11px] leading-snug text-tintaSuave flex gap-1.5">
                    <span className="text-tintaMuda">·</span>{it}
                  </li>
                ))}
              </ul>
            </Painel>
          ))}
        </div>
      </Secao>
    </>
  );
}
