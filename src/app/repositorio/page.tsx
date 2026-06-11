"use client";

import { useState } from "react";
import { Cabecalho, Secao, Painel, ChipLivro, Farol } from "@/components/ui";

const CATALOGO = [
  { kpi: "posicao_caixa", nome: "Posição de caixa consolidada", livro: "caixa", fonte: "kamino_financial_movement + adquirentes", cadencia: "Diária", owner: "Tesouraria", alerta: "queda >5% d/d", status: "existe" },
  { kpi: "recebido_d1", nome: "Recebido D-1 por adquirente", livro: "caixa", fonte: "silver__adquirentes__master (realizado)", cadencia: "Diária", owner: "Tesouraria", alerta: "desvio >20% vs proj. D-7", status: "existe" },
  { kpi: "a_receber", nome: "A receber 7d / 30d / 90d", livro: "caixa", fonte: "silver__adquirentes__master (projecao)", cadencia: "Diária", owner: "Tesouraria", alerta: "queda >10% s/s", status: "existe" },
  { kpi: "runway", nome: "Runway", livro: "caixa", fonte: "derivado · caixa ÷ burn 3m", cadencia: "Diária", owner: "CFO", alerta: "<12 meses: vermelho", status: "existe" },
  { kpi: "pct_antecipacao", nome: "% caixa via antecipação", livro: "caixa", fonte: "adquirentes__master (taxas_antecipacao)", cadencia: "Diária (MTD)", owner: "Tesouraria", alerta: ">30% / 2 meses", status: "existe" },
  { kpi: "exposicao_fx", nome: "Exposição FX do dia", livro: "caixa", fonte: "journal moeda='USD' × cotacoes-moedas", cadencia: "Diária", owner: "CFO", alerta: "Δ >2% d/d", status: "existe" },
  { kpi: "receita_bruta", nome: "Receita bruta D-1 + MTD", livro: "competencia", fonte: "gold__score_cards__revenue_metrics", cadencia: "Diária", owner: "CRO", alerta: "MTD <90% do orçado pro-rata", status: "existe" },
  { kpi: "refund_rate", nome: "Refund rate (cash e coorte)", livro: "competencia", fonte: "percent_reembolso_cash/_cohort_mtd", cadencia: "Diária", owner: "CX + Growth", alerta: "cash MTD >15%", status: "existe" },
  { kpi: "custo_ia_d1", nome: "Custo de IA D-1", livro: "caixa", fonte: "custo_api_consolidado + ai_gateway", cadencia: "Diária", owner: "Eng", alerta: ">1,5× média 7d", status: "existe" },
  { kpi: "ai_cost_ratio", nome: "AI cost / receita", livro: "competencia", fonte: "derivado: custo IA ÷ receita_bruta", cadencia: "Diária", owner: "Eng + FinOps", alerta: ">25% por 3 dias", status: "existe" },
  { kpi: "roas_7d", nome: "Gasto de mídia D-1 + ROAS D-7", livro: "competencia", fonte: "meta/google_ads_daily_spend × utm", cadencia: "Diária", owner: "Growth", alerta: "ROAS 7d <2,5×", status: "existe" },
  { kpi: "renovacoes", nome: "Renovações D-1", livro: "competencia", fonte: "percent_renovacao_mtd", cadencia: "Diária", owner: "CX", alerta: "<60% MTD", status: "existe" },
  { kpi: "margem_coorte_madura", nome: "Margem de coorte madura", livro: "competencia", fonte: "gold__snapshots__coortes (M+90)", cadencia: "Mensal (foto)", owner: "CFO + Growth", alerta: "—", status: "construir" },
  { kpi: "forecast_accuracy", nome: "Acurácia de forecast", livro: "foto", fonte: "gold__snapshots__recebiveis (D-30 vs real)", cadencia: "Mensal", owner: "FP&A", alerta: "fora de ±5%", status: "construir" },
  { kpi: "variance_bridge", nome: "Variance bridge (volume/preço/mix)", livro: "caixa", fonte: "gold__budget__variance", cadencia: "Mensal (DU+5)", owner: "FP&A", alerta: "🔴 >10% sem plano", status: "construir" },
];

const FASES = [
  { fase: "F0", semanas: "1–2", titulo: "Memória ligada", desc: "Fotografias começam a acumular: snapshots diário, recebíveis e financeiro + kpis.yml v1 no GitHub.", pronto: "Foto D gravada 7 dias seguidos; primeiro M-CLOSE congelado.", status: "andamento" },
  { fase: "F1", semanas: "3–5", titulo: "KPI store + painel diário", desc: "gold__build__kpi__daily, notebook de alertas → Slack, dashboard Vercel v1 — este app, plugado na Gold.", pronto: "5 dias úteis com painel completo às 09:00; primeiro alerta respondido no prazo.", status: "proximo" },
  { fase: "F2", semanas: "6–9", titulo: "P&L três visões + margens", desc: "Cascata M0→M5 vira tabela: pl tres visões, margens por produto/usuário, reconciliação caixa↔competência.", pronto: "Fechamento nas 3 visões; ponte reconcilia com Kamino (Δ < 0,5%).", status: "futuro" },
  { fase: "F3", semanas: "10–13", titulo: "Real vs. Orçado vivo", desc: "AOP-2026 → gold__budget__fato, variance com bridge volume/preço/mix, flash semanal automatizado.", pronto: "Primeiro pacote DU+5 com bridge completa e comentário por linha 🔴.", status: "futuro" },
  { fase: "F4", semanas: "contínuo", titulo: "Maturidade", desc: "Fotos M+90 e cohort book, acurácia de forecast no placar, LTV/CAC com margem real, reforecast versionado.", pronto: "Board deck do trimestre gerado em <1 dia, sem planilha manual.", status: "futuro" },
];

const CADENCIAS = [
  { nome: "Diária · o pulso", quando: "painel 09:00 BRT · assíncrono", regra: "Só se houver alerta 🔴: owner responde no Slack até 12:00 com causa + ação. Zero alerta = zero reunião." },
  { nome: "Semanal · o motor", quando: "segunda 10:00 · 45 min", regra: "Pauta = só linhas 🟡/🔴 do flash. Cada desvio sai com dono e data. Realocação de mídia acontece aqui." },
  { nome: "Mensal · o fechamento", quando: "DU+1 a DU+5 · review DU+7", regra: "Conciliação → foto M-CLOSE → pacote com DRE, cascata, ponte e comentário executivo. Tag close/YYYY-MM no GitHub." },
  { nome: "Trimestral · a calibragem", quando: "mês +1 do tri · meio dia", regra: "Cohort book, unit economics, acurácia de forecast, reforecast aprovado como versão imutável." },
  { nome: "Anual · o retrato", quando: "janeiro · até 31/01", regra: "Foto Y-CLOSE, Real vs. AOP final, cohort book anual, AOP seguinte ingerido, auditoria dos cinco contratos." },
];

const CONTRATOS = [
  { n: 1, t: "Append-only", d: "Histórico e snapshot só recebem INSERT. O passado nunca é sobrescrito." },
  { n: 2, t: "Dois eixos de data", d: "Toda tabela declara data_competencia e/ou data_caixa. Coluna chamada só 'data' é proibida em tabela nova." },
  { n: 3, t: "Métrica tem dono e fórmula", d: "Todo KPI vive no kpis.yml com nome canônico, fórmula, fonte, eixo, owner, cadência e meta." },
  { n: 4, t: "Gold é a única porta de saída", d: "Dashboard, Slack e board deck leem só Gold. Todo mundo vê o mesmo número." },
  { n: 5, t: "Fechamento é release", d: "Snapshot M-CLOSE + tag no GitHub + comentário arquivado. Reabrir exige M-RESTATE com justificativa." },
];

export default function Repositorio() {
  const [filtroLivro, setFiltroLivro] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  const visiveis = CATALOGO.filter(
    (k) =>
      (filtroLivro === "todos" || k.livro === filtroLivro) &&
      (busca === "" || `${k.kpi} ${k.nome} ${k.fonte}`.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <Cabecalho
        codigo="01"
        titulo="Repositório — catálogo, contratos & roadmap"
        descricao="Se um número importa, ele tem uma tabela, uma transformation com dono e um documento no semantic layer. Nada de KPI vivendo em planilha solta, screenshot ou memória de alguém."
      />

      <Secao titulo="Os cinco contratos">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {CONTRATOS.map((c) => (
            <Painel key={c.n}>
              <div className="font-mono text-[10px] text-caixa mb-1">CONTRATO {c.n}</div>
              <div className="font-display font-600 text-sm text-tinta mb-1.5">{c.t}</div>
              <p className="text-[12px] leading-relaxed text-tintaSuave">{c.d}</p>
            </Painel>
          ))}
        </div>
      </Secao>

      <Secao
        titulo="Catálogo de KPIs (kpis.yml)"
        nota={`${visiveis.length} de ${CATALOGO.length} métricas`}
        chip={
          <div className="flex items-center gap-2">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="buscar métrica ou fonte…"
              className="bg-painel border border-traco rounded px-2.5 py-1.5 font-mono text-xs text-tinta placeholder:text-tintaMuda w-48"
            />
            <select
              value={filtroLivro}
              onChange={(e) => setFiltroLivro(e.target.value)}
              className="bg-painel border border-traco rounded px-2 py-1.5 font-mono text-xs text-tinta"
            >
              <option value="todos">todos os livros</option>
              <option value="caixa">caixa</option>
              <option value="competencia">competência</option>
              <option value="foto">fotografia</option>
            </select>
          </div>
        }
      >
        <Painel className="p-0 overflow-x-auto scroll-fino">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-traco font-mono text-[10px] uppercase tracking-wider text-tintaMuda">
                <th className="text-left px-4 py-3">Chave</th>
                <th className="text-left px-4 py-3">Métrica</th>
                <th className="text-left px-4 py-3">Livro</th>
                <th className="text-left px-4 py-3">Fonte na Nekt</th>
                <th className="text-left px-4 py-3">Cadência</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">Alerta</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((k) => (
                <tr key={k.kpi} className="border-b border-tracoSuave last:border-0 hover:bg-painel/60">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-caixa">{k.kpi}</td>
                  <td className="px-4 py-2.5 text-tinta">{k.nome}</td>
                  <td className="px-4 py-2.5"><ChipLivro tipo={k.livro as any} /></td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-tintaSuave">{k.fonte}</td>
                  <td className="px-4 py-2.5 text-[12px] text-tintaSuave">{k.cadencia}</td>
                  <td className="px-4 py-2.5 text-[12px] text-tintaSuave">{k.owner}</td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-tintaMuda">{k.alerta}</td>
                  <td className="px-4 py-2.5 text-center">
                    {k.status === "existe" ? (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-caixaFundo text-caixa border border-caixa/30">EXISTE</span>
                    ) : (
                      <ChipLivro tipo="construir" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Painel>
      </Secao>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
        <Secao titulo="Calendário de fotografias" chip={<ChipLivro tipo="foto" />}>
          <Painel className="p-0">
            {[
              { tipo: "D", quando: "todo dia 07:30 BRT", congela: "posição de caixa, recebíveis futuros, MTD, custo IA D-1, mídia D-1" },
              { tipo: "M-CLOSE", quando: "dia útil 5", congela: "P&L 3 visões, DRE por produto, coortes, diferimento, folha, saldo de fechamento" },
              { tipo: "M+90", quando: "90 dias após o mês", congela: "coorte madura: receita líquida de reembolsos, margem real, renovação efetiva" },
              { tipo: "Y-CLOSE", quando: "até 31/jan", congela: "cohort book anual, LTV realizado, waterfall de margens, posição fiscal" },
              { tipo: "M-RESTATE", quando: "sob demanda", congela: "republicação com justificativa — o número velho continua lá, auditável" },
            ].map((f) => (
              <div key={f.tipo} className="flex items-start gap-4 px-4 py-3 border-b border-tracoSuave last:border-0">
                <span className="font-mono text-[11px] text-foto w-20 shrink-0 pt-0.5">{f.tipo}</span>
                <div className="min-w-0">
                  <div className="text-[12px] text-tinta">{f.quando}</div>
                  <div className="text-[11px] text-tintaMuda leading-relaxed">{f.congela}</div>
                </div>
              </div>
            ))}
          </Painel>
        </Secao>

        <Secao titulo="Cadências e rituais" nota="a reunião não apresenta números; ela discute desvios">
          <Painel className="p-0">
            {CADENCIAS.map((c) => (
              <div key={c.nome} className="px-4 py-3 border-b border-tracoSuave last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display font-600 text-[13px] text-tinta">{c.nome}</span>
                  <span className="font-mono text-[10px] text-tintaMuda shrink-0">{c.quando}</span>
                </div>
                <p className="text-[11px] text-tintaSuave mt-1 leading-relaxed">{c.regra}</p>
              </div>
            ))}
          </Painel>
        </Secao>
      </div>

      <Secao titulo="Roadmap F0 → F4" nota="cada fase entrega valor sozinha">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          {FASES.map((f) => (
            <Painel key={f.fase} className={f.status === "andamento" ? "border-caixa/50" : ""}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-800 text-lg text-tinta">{f.fase}</span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase text-tintaMuda">
                  <Farol estado={f.status === "andamento" ? "verde" : f.status === "proximo" ? "amarelo" : "nd"} />
                  sem. {f.semanas}
                </span>
              </div>
              <div className="font-display font-600 text-sm text-caixa mb-1.5">{f.titulo}</div>
              <p className="text-[11px] leading-relaxed text-tintaSuave mb-2">{f.desc}</p>
              <div className="pt-2 border-t border-tracoSuave">
                <span className="font-mono text-[9px] uppercase tracking-wider text-tintaMuda">Critério de pronto</span>
                <p className="text-[11px] text-tintaSuave mt-0.5 leading-relaxed">{f.pronto}</p>
              </div>
            </Painel>
          ))}
        </div>
      </Secao>
    </>
  );
}
