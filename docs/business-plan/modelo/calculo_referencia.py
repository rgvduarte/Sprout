#!/usr/bin/env python3
"""Cálculo determinístico dos resultados de referência do Sprout.

Lê pressupostos.json (mesma pasta), calcula os três cenários a 5 anos e o lote-tipo,
e imprime os resultados. Com --write grava `resultados_referencia`,
`commodities.azeite.check_margem_contribuicao_base_eur_kg` e os campos do piloto
marcados "preenchido por calculo_referencia.py" no próprio JSON.

É o "modelo simplificado" citado em 01-desenho-do-modelo.md (secções 2, 5 e 7).
O modelo financeiro completo deve reproduzir estes números com tolerância de +-5%.

Convenções (iguais às do JSON):
- margem de contribuição = receita - custos diretos por kg (granel, embalamento,
  logística, 3PL, armazenagem, seguro, análises, perdas, desclassificação esperada,
  custódia, pagamentos bancários, provisão de crédito, cupão das obrigações);
- o cupão só incide sobre a parte do capital de giro financiada por obrigações
  (em 2027 não há obrigações: CSC art. 348.º/2); o custo do capital próprio é nocional
  e não entra no EBITDA;
- obrigações em circulação = pct x capital de giro / utilização (capital levantado);
- capital de giro financiado por capital próprio >= capital social da SPV (50k);
- reserva de primeira perda = 5% das obrigações (caixa restrita);
- cash flow para o acionista = EBITDA - capex - impostos - variação do capital de giro
  financiado por capital próprio - variação da reserva;
- necessidade de capital próprio = pré-arranque + capital social da SPV + caixa mínima
  + |mínimo do cash flow acumulado no horizonte|.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(HERE, "pressupostos.json")
SCEN = ["pessimista", "base", "otimista"]
YEARS = list(range(2027, 2032))


def ser(x, s, y):
    """Valor de um parâmetro que pode ser escalar, por cenário ou série anual."""
    if isinstance(x, dict):
        x = x[s]
    if isinstance(x, list):
        return x[y]
    return x


def channel_kg(P, name, s, y, pct_notes):
    """Economia por kg de um canal de azeite no ano y (0 = 2027)."""
    az = P["commodities"]["azeite"]
    ch = az["canais"][name]
    cf = az["custos_fisicos_e_custodia"]
    fin = P["financiamento"]
    g = az["preco_indice_granel_eur_kg"][s] + az["premio_origem_pago_ao_lagar_eur_kg"][s]
    price = ch["preco_referencia_eur_kg"][s] * (1 - ch["desconto_efetivo"][s])
    emb = ch["embalamento_eur_kg"]
    ds = ser(ch["dias_stock"], s, y)
    dr = ser(ch["dias_recebimento"], s, y)
    dp = cf["dias_pagamento_produtor"]
    lot = ch["lote_medio_t"] * 1000
    util = fin["utilizacao_media_capital"][s]
    c = {
        "granel": g,
        "embalamento": emb,
        "logistica": ser(ch["logistica_eur_kg"], s, y),
        "armazem_3pl_picking": ch["armazem_logistico_picking_eur_kg"],
        "armazenagem": cf["armazenagem_eur_t_mes"] * ds / 30 / 1000,
        "seguro_stock": g * cf["seguro_stock_pct_ano"] * ds / 365,
        "analises": ch["analises_por_lote"] * cf["analise_fisico_quimica_painel_eur"] / lot,
        "perdas": cf["perdas_fisicas_pct_valor"] * g,
        "desclassificacao": cf["desclassificacao_prob_por_trimestre"] * cf["desclassificacao_penalizacao_eur_kg"] * ds / 90,
        "custodia": ch["inspecao_collateral_manager_eur_por_lote"] / lot,
        "pagamentos": ch["pagamentos_bancarios_eur_kg"],
        "provisao_credito": ser(ch["provisao_credito_pct_vendas"], s, y) * price,
        "cupao": ser(fin["cupao_anual"], s, y) * (g + emb) * (ds + dr - dp) / 365 * pct_notes / util,
    }
    cost = sum(c.values())
    cg = (g + emb) * ds / 365 + price * dr / 365 - (g + emb) * dp / 365
    return {"preco": price, "custos": c, "custo_total": cost, "margem": price - cost, "cg": cg,
            "pi": ch["preco_referencia_eur_kg"][s] - g - emb - c["logistica"],
            "desconto": ch["preco_referencia_eur_kg"][s] - price}


def run(P, s):
    az, ag, cf_ = P["commodities"]["azeite"], P["commodities"]["agua"], P["commodities"]["cafe"]
    fin, cu, cx, rec = P["financiamento"], P["custos"], P["capex"], P["receitas"]
    pe, ox, spv = cu["pessoal"], cu["opex_nao_salarial_eur"], fin["custos_spv"]
    k_spv = fin["capital_social_spv_eur"]
    keys = ["gmv_total", "gmv_azeite", "margem_contribuicao_total", "margem_azeite", "margem_azeite_horeca",
            "margem_azeite_distribuidores", "margem_outros", "margem_terceiros_liquida", "custos_pessoal",
            "opex_nao_salarial", "seguro_credito", "ebitda", "capex", "impostos", "capital_giro_liquido",
            "capital_giro_capital_proprio", "obrigacoes_em_circulacao_fim_ano", "reserva", "fte", "cf",
            "cash_flow_acionista_acumulado"]
    o = {k: [] for k in keys}
    prev_eq, prev_res, prev_fte, acum, loss = k_spv, 0.0, 0.0, 0.0, 0.0
    da = [0.0] * 5
    for y in range(5):
        pct = fin["pct_capital_giro_azeite_financiado_por_notes"][s][y]
        util = fin["utilizacao_media_capital"][s]
        vh = az["volume_horeca_gourmet_t"][s][y] * 1000
        vd = az["volume_distribuidores_export_t"][s][y] * 1000
        h = channel_kg(P, "horeca_gourmet", s, y, pct)
        d = channel_kg(P, "distribuidores_export", s, y, pct)
        gmv_az = vh * h["preco"] + vd * d["preco"]
        m_h, m_d = vh * h["margem"], vd * d["margem"]
        cg_az = vh * h["cg"] + vd * d["cg"]
        # água (agente)
        pal = ag["volume_paletes"][s][y]
        gmv_ag = pal * ag["litros_por_palete"] * ag["preco_b2b_referencia_eur_l"] * (1 - ag["desconto_efetivo"])
        m_ag = gmv_ag * ag["comissao_agente_pct_gmv"][s]
        cg_ag = m_ag * P["capital_de_giro"]["agua"]["dias_recebimento_comissao"] / 365
        # café (principal)
        cv = cf_["volume_t"][s][y] * 1000
        gmv_cf = cv * cf_["preco_venda_eur_kg"]
        cfin = ser(fin["cupao_anual"], s, y) * cf_["preco_compra_eur_kg"] * (cf_["dias_stock"] + cf_["dias_recebimento"] - cf_["dias_pagamento"]) / 365 * pct / util
        m_cf = cv * (cf_["preco_venda_eur_kg"] - cf_["preco_compra_eur_kg"] - cf_["logistica_eur_kg"] - cfin
                     - cf_["provisao_credito_pct_vendas"] * cf_["preco_venda_eur_kg"] - cf_["pagamentos_ops_eur_kg"])
        cg_cf = cv * (cf_["preco_compra_eur_kg"] * cf_["dias_stock"] + cf_["preco_venda_eur_kg"] * cf_["dias_recebimento"]
                      - cf_["preco_compra_eur_kg"] * cf_["dias_pagamento"]) / 365
        # financiamento de terceiros (líquido de custos de verificação) e dados
        ft = rec["financiamento_stock_terceiros"]
        cart = ft["carteira_media_eur"][s][y]
        bruto = cart * (ft["taxa_verificacao_por_utilizacao_pct"] * ft["rotacoes_por_ano"] + ft["taxa_monitorizacao_anual_pct"])
        kg_ver = cart / (ft["valor_colateral_eur_kg"] * ft["ltv"]) * ft["rotacoes_por_ano"]
        m_tp = bruto - kg_ver * ft["custo_verificacao_eur_kg_verificado"]
        m_dd = rec["dados_e_indice_eur"][s][y]
        gmv = gmv_az + gmv_ag + gmv_cf
        m = m_h + m_d + m_ag + m_cf + m_tp + m_dd
        # pessoal
        tot, fte = 0.0, 0.0
        fs = pe["fator_salarial_fundadores_2027"]
        for fn, v in pe["funcoes"].items():
            n = v["fte"][s][y]
            fte += n
            up = (1 + pe["atualizacao_salarial_anual"]) ** y
            sal = v["salario_bruto_anual"] * up * (1 + v.get("variavel_pct", 0))
            fac = fs["fator_efetivo_2027"] if (y == 0 and fn in fs["funcoes"]) else 1
            tot += n * sal * fac
        sub = fte * pe["subsidio_refeicao_eur_fte_ano"] * (1 + pe["atualizacao_salarial_anual"]) ** y
        pess = tot * (1 + pe["tsu_entidade_empregadora"] + pe["outros_encargos_pct"]) + sub
        # opex
        lines = sum(ox[k][s][y] for k in ox if isinstance(ox[k], dict))
        spvc = (spv["setup_eur"] if y == 0 else 0) + spv["anual_eur"] + spv["por_serie_eur"] * spv["series_por_ano"][s][y] + spv["funcoes_independentes_eur"][y]
        sc = cu["seguro_credito"]
        seg = 0.0 if YEARS[y] < sc["incluido_no_opex_desde"] else max(sc["premio_minimo_anual_eur"][s][y], sc["premio_pct_volume_seguro"] * gmv_az)
        opex = lines * (1 + ox["contingencia_pct"]) * (1 + ox["inflacao_anual"]) ** y + spvc + seg
        eb = m - pess - opex
        # capex e amortizações (software 3, equipamento 4, sensores 5 anos)
        tel = cx["telemetria_eur_por_local"] * cx["locais_novos"][s][y]
        # plataforma B2B + área de investidores (separada na revisão de 13-10-2026; mesma despesa total)
        plat = cx["plataforma_desenvolvimento_capitalizavel_eur"][s][y] + cx.get("plataforma_area_investidor_capitalizavel_eur", {}).get(s, [0] * 5)[y]
        eq = cx["equipamento_informatico_eur_por_nova_fte"] * max(0.0, fte - prev_fte)
        capex = tel + plat + eq
        for amt, life in [(plat, cx["vida_util_anos"]["software"]), (tel, cx["vida_util_anos"]["sensores"]),
                          (eq, cx["vida_util_anos"]["equipamento_informatico"])]:
            for j in range(y, min(5, y + life)):
                da[j] += amt / life
        # impostos (reporte de prejuízos com limite de 65%)
        ti = eb - da[y]
        if ti < 0:
            loss += -ti
            tax = 0.0
        else:
            ded = min(loss, P["impostos"]["reporte_prejuizos"]["limite_deducao_pct_lucro_tributavel"] * ti)
            loss -= ded
            rate = P["impostos"]["taxa_efetiva_modelo_aproximada"]["2027" if y == 0 else "2028+"]
            tax = rate * (ti - ded)
        # capital de giro, obrigações, reserva
        cg = cg_az + cg_ag + cg_cf
        ob = pct * cg / util
        eq_cg = max(cg - pct * cg, k_spv)
        res = fin["reserva_primeira_perda"]["teto_pct_saldo_notes"] * ob
        cfl = eb - capex - tax - (eq_cg - prev_eq) - (res - prev_res)
        acum += cfl
        for kk, v in [("gmv_total", gmv), ("gmv_azeite", gmv_az), ("margem_contribuicao_total", m), ("margem_azeite", m_h + m_d),
                      ("margem_azeite_horeca", m_h), ("margem_azeite_distribuidores", m_d), ("margem_outros", m_ag + m_cf + m_tp + m_dd),
                      ("margem_terceiros_liquida", m_tp), ("custos_pessoal", pess), ("opex_nao_salarial", opex), ("seguro_credito", seg),
                      ("ebitda", eb), ("capex", capex), ("impostos", tax), ("capital_giro_liquido", cg), ("capital_giro_capital_proprio", eq_cg),
                      ("obrigacoes_em_circulacao_fim_ano", ob), ("reserva", res), ("fte", fte), ("cf", cfl), ("cash_flow_acionista_acumulado", acum)]:
            o[kk].append(v)
        prev_eq, prev_res, prev_fte = eq_cg, res, fte
    pre = sum(cu["pre_arranque_2026_eur"].values())
    cmin = P["capital_de_giro"]["caixa_minima_operacional_eur"]
    vale = -min(0.0, min(o["cash_flow_acionista_acumulado"]))
    o["necessidade_capital_proprio"] = pre + k_spv + cmin + vale
    return o


def lote_tipo(P, s="base", y=2):
    """Lote de 20 t HoReCa/gourmet: piloto (2027, sem obrigações) e regime (ano y, com obrigações)."""
    out = {}
    for tag, yy, pct in [("piloto_2027", 0, 0.0), (f"regime_{YEARS[y]}", y, P["financiamento"]["pct_capital_giro_azeite_financiado_por_notes"][s][y])]:
        out[tag] = {"horeca_gourmet": channel_kg(P, "horeca_gourmet", s, yy, pct),
                    "distribuidores_export": channel_kg(P, "distribuidores_export", s, yy, pct)}
    return out


def r0(x):
    return int(round(x))


def main():
    P = json.load(open(JSON_PATH))
    R = {s: run(P, s) for s in SCEN}
    for s in SCEN:
        o = R[s]
        print("==", s)
        for kk in ["gmv_total", "margem_contribuicao_total", "margem_azeite_horeca", "margem_azeite_distribuidores", "margem_outros",
                   "custos_pessoal", "opex_nao_salarial", "ebitda", "capex", "capital_giro_liquido", "obrigacoes_em_circulacao_fim_ano",
                   "reserva", "fte", "cf", "cash_flow_acionista_acumulado"]:
            print(f"  {kk:34s}", [r0(v) for v in o[kk]])
        print("  margem azeite % GMV azeite      ", [round(a / b, 4) for a, b in zip(o["margem_azeite"], o["gmv_azeite"])])
        print("  necessidade_capital_proprio     ", r0(o["necessidade_capital_proprio"]))
    lt = lote_tipo(P)
    for tag, d in lt.items():
        for ch, v in d.items():
            print(tag, ch, "preço", round(v["preco"], 3), "custo", round(v["custo_total"], 3), "margem", round(v["margem"], 3),
                  f"({v['margem'] / v['preco']:.1%})", {k: round(x, 4) for k, x in v["custos"].items()})
    if "--write" in sys.argv:
        out = {"nota": "Gerado por calculo_referencia.py a partir deste ficheiro (2026-10-13). O modelo financeiro deve reproduzi-los com tolerância de +-5%; diferenças maiores indicam erro de implementação ou de pressuposto. Margem de contribuição inclui o cupão das obrigações; exclui o custo nocional do capital próprio.",
               "unidade": "EUR"}
        for s in SCEN:
            o = R[s]
            out[s] = {
                "gmv_total": [r0(v) for v in o["gmv_total"]],
                "margem_contribuicao_total": [r0(v) for v in o["margem_contribuicao_total"]],
                "margem_contribuicao_azeite_horeca_gourmet": [r0(v) for v in o["margem_azeite_horeca"]],
                "margem_contribuicao_azeite_distribuidores": [r0(v) for v in o["margem_azeite_distribuidores"]],
                "margem_contribuicao_azeite_pct_gmv_azeite": [round(a / b, 4) for a, b in zip(o["margem_azeite"], o["gmv_azeite"])],
                "margem_contribuicao_agua_cafe_terceiros_dados": [r0(v) for v in o["margem_outros"]],
                "custos_pessoal": [r0(v) for v in o["custos_pessoal"]],
                "opex_nao_salarial": [r0(v) for v in o["opex_nao_salarial"]],
                "ebitda": [r0(v) for v in o["ebitda"]],
                "capex": [r0(v) for v in o["capex"]],
                "capital_giro_liquido": [r0(v) for v in o["capital_giro_liquido"]],
                "obrigacoes_em_circulacao_fim_ano": [r0(v) for v in o["obrigacoes_em_circulacao_fim_ano"]],
                "reserva_primeira_perda": [r0(v) for v in o["reserva"]],
                "fte": [round(v, 1) for v in o["fte"]],
                "cash_flow_acionista": [r0(v) for v in o["cf"]],
                "cash_flow_acionista_acumulado": [r0(v) for v in o["cash_flow_acionista_acumulado"]],
                "necessidade_capital_proprio_minima": int(round(o["necessidade_capital_proprio"], -3)),
            }
        old = P["resultados_referencia"]
        for kk in ["rondas_recomendadas_base", "pessimista_recomendacao", "leitura"]:
            if kk in old:
                out[kk] = old[kk]
        P["resultados_referencia"] = out
        chk = {}
        for tag, d in lt.items():
            chk[tag] = {ch: {"preco_eur_kg": round(v["preco"], 3), "custo_direto_eur_kg": round(v["custo_total"], 3),
                             "margem_eur_kg": round(v["margem"], 3), "margem_pct": round(v["margem"] / v["preco"], 4)}
                        for ch, v in d.items()}
        P["commodities"]["azeite"]["check_margem_contribuicao_base_eur_kg"] = chk
        json.dump(P, open(JSON_PATH, "w"), indent=1, ensure_ascii=False)
        print("escrito:", JSON_PATH)


if __name__ == "__main__":
    main()
