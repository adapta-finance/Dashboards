"use client";

import {
  MESES, FLUXO, PL, RATIOS, SALDOS_DIARIOS,
  IDX_ULTIMO_REAL, IDX_MES_CORRENTE,
  fmtBRL, fmtPct, rotuloMes, variacaoPct, resultadoCaixa, runwayMeses, pctAntecipacao, burnMedio,
} from "@/lib/data";
import { Cabecalho, CartaoKpi, Secao, Painel, ChipLivro, Farol } from "@/components/ui";
import { CORES, TooltipCaixa, eixoX, eixoY } from "@/components/grafico";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ReferenceLine, AreaChart, Area, CartesianGrid, Cell,
} from "recharts";

export default function PainelDiario() {
  const i = IDX_ULTIMO_REAL; // mai/26 — último mês fechado
  const ant = i - 1;

  const saldoAtual = FLUXO.saldo_inicial[IDX_MES_CORRENTE];
  const runway = runwayMeses();
  const burn = burnMedio(3);
  const antPct = pctAntecipacao(i);
  const receita = PL.receita_bruta[i];
  const receitaAnt = PL.receita_bruta[ant];
  const resultado = resultadoCaixa(i);
  const margemBruta = PL.margem_bruta_pct[i];

  const serieFluxo = MESES.slice(0, IDX_MES_CORRENTE + 1).map((m, k) => ({
    mes: rotuloMes(m),
    entradas: FLUXO.entradas_total[k],
    saidas: Math.abs(FLUXO.saidas_total[k] ?? 0) * -1,
    saldo: FLUXO.saldo_inicial[k],
    parcial: k === IDX_MES_CORRENTE,
  }));

  const serieDiaria = SALDOS_DIARIOS.map((d) => ({
    data: d.data.slice(5).split("-").reverse().join("/"),
    total: d.total,
  }));

  const serieAnt = MESES.slice(0, IDX_ULTIMO_REAL + 1).map((m, k) => ({
    mes: rotuloMes(m),
    pct: pctAntecipacao(k),
  }));

  const alertas: { metrica: string; valor: string; regra: string; estado: "verde" | "amarelo" | "vermelho"; owner: string }[] = [
    {
      metrica: "Runway",
      valor: runway === Infinity ? "∞ (burn positivo)" : `${runway?.toFixed(1)} meses`,
      regra: "< 12 meses: vermelho",
      estado: runway === Infinity ? "verde" : runway && runway >= 12 ? "verde" : "vermelho",
      owner: "CFO",
    },
    {
      metrica: "% caixa via antecipação",
      valor: fmtPct(antPct),
      regra: "> 30% por 2 meses: vermelho",
      estado: (antPct ?? 0) > 30 ? "vermelho" : (antPct ?? 0) > 20 ? "amarelo" : "verde",
      owner: "Tesouraria",
    },
    {
      metrica: "API + Infra / receita cash",
      valor: fmtPct(Math.abs(RATIOS.api_infra_sobre_receita_pct[16] ?? 0)),
      regra: "> 25% por 3 dias: alerta",
      estado: Math.abs(RATIOS.api_infra_sobre_receita_pct[16] ?? 0) > 25 ? "amarelo" : "verde",
      owner: "Eng + FinOps",
    },
    {
      metrica: "Margem bruta (caixa)",
      valor: fmtPct(margemBruta, 0),
      regra: "meta > 65% · piso AI-native 50%",
      estado: (margemBruta ?? 0) >= 65 ? "verde" : (margemBruta ?? 0) >= 50 ? "amarelo" : "vermelho",
      owner: "CEO + CFO",
    },
  ];

  return (
    <>
      <Cabecalho
        codigo="04"
        titulo="Painel diário — o pulso"
        descricao="Contrato: às 09:00 BRT, todos os números de D-1 na tela. V0 opera no grão mensal da aba diário; o grão diário chega com gold__kpi__daily (fase F1)."
        acoes={<ChipLivro tipo="caixa" />}
      />

      {/* Bloco 1 · Caixa */}
      <Secao titulo="Bloco 1 · Caixa" chip={<ChipLivro tipo="caixa" />} nota={`fechamento ${rotuloMes(MESES[i])} · saldo em ${rotuloMes(MESES[IDX_MES_CORRENTE])}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <CartaoKpi
            rotulo="Posição de caixa"
            valor={fmtBRL(saldoAtual)}
            sub={`saldo inicial ${rotuloMes(MESES[IDX_MES_CORRENTE])}`}
            alerta={{ estado: (saldoAtual ?? 0) > 0 ? "verde" : "vermelho", regra: "queda >5% d/d: alerta" }}
          />
          <CartaoKpi
            rotulo="Runway"
            valor={runway === Infinity ? "∞" : `${runway?.toFixed(1)}m`}
            sub={`burn médio 3m ${fmtBRL(burn)} (excl. antecipação)`}
            alerta={{
              estado: runway === Infinity || (runway ?? 0) >= 12 ? "verde" : "vermelho",
              regra: "< 12 meses: vermelho",
            }}
          />
          <CartaoKpi
            rotulo="% caixa via antecipação"
            valor={fmtPct(antPct)}
            sub={`custo ${fmtPct(Math.abs(RATIOS.custo_antecipacao_pct[16] ?? 0), 2)} · ${rotuloMes(MESES[i])}`}
            alerta={{
              estado: (antPct ?? 0) > 30 ? "vermelho" : (antPct ?? 0) > 20 ? "amarelo" : "verde",
              regra: "> 30% / 2 meses: vermelho",
            }}
          />
          <CartaoKpi
            rotulo="Resultado de caixa (M5)"
            valor={fmtBRL(resultado)}
            sub={`entradas ${fmtBRL(FLUXO.entradas_total[i])} · saídas ${fmtBRL(FLUXO.saidas_total[i])}`}
            delta={resultado !== null ? { valor: rotuloMes(MESES[i]), positivo: resultado >= 0 } : undefined}
            alerta={{ estado: (resultado ?? 0) >= 0 ? "verde" : "amarelo", regra: "reconcilia com extrato (Δ < 0,5%)" }}
          />
        </div>
      </Secao>

      {/* Bloco 2 · Operação */}
      <Secao titulo="Bloco 2 · Operação" chip={<ChipLivro tipo="caixa" />} nota="receita e margens na visão caixa do journal">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <CartaoKpi
            rotulo="Receita bruta"
            valor={fmtBRL(receita)}
            sub={`${rotuloMes(MESES[i])} · ${fmtBRL(receitaAnt)} em ${rotuloMes(MESES[ant])}`}
            delta={{
              valor: `${variacaoPct(receita, receitaAnt)?.toFixed(1)}% m/m`,
              positivo: (variacaoPct(receita, receitaAnt) ?? 0) >= 0,
            }}
          />
          <CartaoKpi
            rotulo="Margem bruta"
            valor={fmtPct(margemBruta, 0)}
            sub={`CSP ${fmtBRL(PL.csp[i])}`}
            alerta={{ estado: (margemBruta ?? 0) >= 65 ? "verde" : (margemBruta ?? 0) >= 50 ? "amarelo" : "vermelho", regra: "meta > 65%" }}
          />
          <CartaoKpi
            rotulo="API + Infra / receita"
            valor={fmtPct(Math.abs(RATIOS.api_infra_sobre_receita_pct[16] ?? 0))}
            sub="o COGS-IA do mês como % da receita cash"
            alerta={{
              estado: Math.abs(RATIOS.api_infra_sobre_receita_pct[16] ?? 0) > 25 ? "amarelo" : "verde",
              regra: "> 25%: atenção · meta < 20%",
            }}
          />
          <CartaoKpi
            rotulo="Margem operacional"
            valor={fmtPct(PL.margem_operacional_pct[i], 0)}
            sub={`resultado op. ${fmtBRL(PL.resultado_operacional[i])}`}
            alerta={{ estado: (PL.margem_operacional_pct[i] ?? 0) >= 15 ? "verde" : (PL.margem_operacional_pct[i] ?? 0) >= 0 ? "amarelo" : "vermelho", regra: "meta EBITDA > 15% sustentado" }}
          />
        </div>
      </Secao>

      {/* Fluxo mensal + saldo */}
      <Secao titulo="Entradas × saídas × saldo" nota="o mês corrente aparece tracejado: ainda é projeção, não fato">
        <Painel>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serieFluxo} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                <XAxis dataKey="mes" {...eixoX} interval={1} />
                <YAxis {...eixoY} tickFormatter={(v) => fmtBRL(v)} width={70} />
                <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtBRL(v, false)} />} />
                <ReferenceLine y={0} stroke={CORES.tintaMuda} />
                <Bar dataKey="entradas" name="Entradas" radius={[3, 3, 0, 0]}>
                  {serieFluxo.map((d, k) => (
                    <Cell key={k} fill={CORES.caixa} opacity={d.parcial ? 0.35 : 0.9} />
                  ))}
                </Bar>
                <Bar dataKey="saidas" name="Saídas" radius={[0, 0, 3, 3]}>
                  {serieFluxo.map((d, k) => (
                    <Cell key={k} fill={CORES.saida} opacity={d.parcial ? 0.35 : 0.85} />
                  ))}
                </Bar>
                <Line dataKey="saldo" name="Saldo inicial" stroke={CORES.foto} strokeWidth={2} dot={{ r: 2, fill: CORES.foto }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Painel>
      </Secao>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
        {/* Antecipação */}
        <Secao titulo="Vigilância de antecipação" chip={<ChipLivro tipo="caixa" />} nota="caixa puxado do futuro">
          <Painel>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serieAnt} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={CORES.traco} strokeDasharray="2 6" vertical={false} />
                  <XAxis dataKey="mes" {...eixoX} interval={2} />
                  <YAxis {...eixoY} tickFormatter={(v) => `${v}%`} width={40} domain={[0, 90]} />
                  <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtPct(v)} />} />
                  <ReferenceLine y={30} stroke={CORES.alerta} strokeDasharray="4 4" label={{ value: "limite 30%", fill: CORES.alerta, fontSize: 10, position: "insideTopRight" }} />
                  <Bar dataKey="pct" name="% do caixa via antecipação" radius={[3, 3, 0, 0]}>
                    {serieAnt.map((d, k) => (
                      <Cell key={k} fill={(d.pct ?? 0) > 30 ? CORES.alerta : (d.pct ?? 0) > 20 ? CORES.atencao : CORES.caixa} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-tintaMuda mt-2">
              Acima de 30% por dois meses seguidos, o negócio opera consumindo o próprio futuro. Antecipação nunca entra como receita orgânica — é linha própria, com custo destacado.
            </p>
          </Painel>
        </Secao>

        {/* Fita diária */}
        <Secao titulo="Fita diária de saldos" chip={<ChipLivro tipo="foto" />} nota="extrato consolidado por dia (amostra disponível: dez/24 → ago/25)">
          <Painel>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieDiaria} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CORES.foto} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CORES.foto} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" {...eixoX} interval={30} />
                  <YAxis {...eixoY} tickFormatter={(v) => fmtBRL(v)} width={64} />
                  <Tooltip content={<TooltipCaixa formatador={(v: number) => fmtBRL(v, false)} />} />
                  <Area dataKey="total" name="Saldo consolidado" stroke={CORES.foto} strokeWidth={1.5} fill="url(#gradSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-tintaMuda mt-2">
              É a fotografia D do calendário de snapshots: permite reconstruir o que o painel mostrava em qualquer manhã. A série completa nasce do cron das 07:30 (F0).
            </p>
          </Painel>
        </Secao>
      </div>

      {/* Disciplina de alerta */}
      <Secao titulo="Disciplina de alerta" nota="cada linha vermelha dispara no Slack: métrica + desvio, owner marcado, resposta no mesmo dia">
        <Painel className="overflow-x-auto scroll-fino p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-traco font-mono text-[10px] uppercase tracking-wider text-tintaMuda">
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Métrica</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Regra</th>
                <th className="text-left px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={a.metrica} className="border-b border-tracoSuave last:border-0">
                  <td className="px-4 py-3"><Farol estado={a.estado} /></td>
                  <td className="px-4 py-3 text-tinta">{a.metrica}</td>
                  <td className="px-4 py-3 text-right font-mono tabular text-tinta">{a.valor}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-tintaMuda">{a.regra}</td>
                  <td className="px-4 py-3 text-tintaSuave">{a.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Painel>
      </Secao>
    </>
  );
}
