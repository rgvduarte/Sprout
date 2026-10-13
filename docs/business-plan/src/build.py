#!/usr/bin/env python3
"""build.py — monta docs/business-plan/business-plan.html a partir das partes em src/parts/.

Os números financeiros das tabelas, dos gráficos e do texto saem só de modelo/resultados.json
(gerado por build_model.py a partir do livro recalculado). As partes HTML usam dois marcadores:
  {{nome}}     substituído por uma tabela, uma especificação de gráfico (svg-charts.mjs) ou um
               diagrama SVG desenhado aqui;
  {{= expr }}  uma expressão Python avaliada sobre resultados.json (números no texto corrido,
               formatados com nf/k/M/pct), para que nenhum número do modelo seja escrito à mão.
O índice lê os números de página de src/toc-pages.json, escrito por toc.py depois da primeira
renderização (lê o outline do PDF).

Uso:  python3 build.py            (escreve ../business-plan.html)
"""
import json
import html
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
BP = HERE.parent
R = json.loads((BP / 'modelo' / 'resultados.json').read_text())
P = json.loads((BP / 'modelo' / 'pressupostos.json').read_text())
C = R['cenarios']
B, RC, PE, OT, RV = C['base'], C['recomendado'], C['pessimista'], C['otimista'], C['recomendado_verificado']
UE = R['unit_economics']
SE = R['sensibilidade']
YEARS = R['meta']['anos']
KP = P['kpis_piloto']
MINUS = '−'

# ---------------------------------------------------------------- formatação pt-PT


def nf(v, dec=0, sign=False):
    """Número pt-PT: vírgula decimal, milhares com espaço (render-pdf torna-o fino e inseparável)."""
    if v is None:
        return '—'
    neg = v < 0
    s = f'{abs(v):,.{dec}f}'.replace(',', ' ').replace('.', ',')
    if s.strip('0, ') == '':
        neg = False
    pre = MINUS if neg else ('+' if sign and v > 0 else '')
    return pre + s


def k(v, dec=0, sign=False):
    return nf(v / 1000, dec, sign)


def M(v, dec=2, sign=False):
    return nf(v / 1e6, dec, sign)


def pct(v, dec=1, sign=False):
    return nf(v * 100, dec, sign) + ' %'


def esc(s):
    return html.escape(str(s), quote=True)


def chart(kind, spec):
    return (f'<div data-chart="{kind}"><script type="application/json">'
            + json.dumps(spec, ensure_ascii=False) + '</script></div>')


def num_row(label, vals, fmt=k, cls='', sub=None, lbl_cls=''):
    tds = ''.join(f'<td class="num">{fmt(v)}</td>' for v in vals)
    s = f'<span class="sub">{sub}</span>' if sub else ''
    return f'<tr class="{cls}"><td class="{lbl_cls}">{label}{s}</td>{tds}</tr>'


def years_head(first='k€', extra=''):
    return '<thead><tr><th>' + first + '</th>' + ''.join(f'<th class="num">{y}</th>' for y in YEARS) + extra + '</tr></thead>'


# ---------------------------------------------------------------- valores derivados usados no texto ({{= … }})

def ue(ch, sc='base'):
    return UE[{'h': 'horeca_gourmet_20t', 'd': 'distribuidores_exportacao_30t', 'g': 'granel_certificado_100t'}[ch]][sc]


def ekg(ch, sc, key):
    return ue(ch, sc)['eur_kg'][key]


def breakeven_price(ch, sc):
    """Preço a que a margem depois do seguro de crédito é zero (provisão e seguro proporcionais ao preço)."""
    e = ue(ch, sc)['eur_kg']
    rate = (-e['prov'] - e['hedge'] - e['segcred']) / e['price']
    return e['price'] - e['margem_seg'] / (1 - rate)


def per_010(sc='base', y=4):
    """Δ EBITDA de 0,10 €/kg a mais pago pelos distribuidores no ano y (provisão e seguro descontados)."""
    e = ue('d', sc)['eur_kg']
    rate = (-e['prov'] - e['segcred']) / e['price']
    return C[sc]['volumes_t']['azeite_distribuidores_exportacao'][y] * 1000 * 0.10 * (1 - rate)


def s_rec(case, key='ebitda_2031'):
    return SE['recomendado'][case][key]


def s_base(case, key='ebitda_2031'):
    return SE['base'][case][key]


PROD_KT = P['commodities']['azeite']['producao_pt_referencia_kt']
LEV = RC['ebitda'][4] - RV['ebitda'][4]           # alavancas por provar (Δ EBITDA 2031)
STRUCT = RV['ebitda'][4] - B['ebitda'][4]         # estrutura, canais e financiamento
GATE = RC['gasto_ate_gate_2027_08']
T0 = RC['aplicacao_fundos']['pre_arranque_e_capital_spv']
T1 = GATE - T0
T2 = RC['pre_seed'] - GATE
PIL_H, PIL_D = KP['volume']['azeite_horeca_gourmet_t'], KP['volume']['azeite_distribuidores_offtake_t']
PIL_COST = PIL_H * 1000 * (-ekg('h', 'base', 'gr') - ekg('h', 'base', 'emb')) + PIL_D * 1000 * (-ekg('d', 'base', 'gr') - ekg('d', 'base', 'emb'))
PIL_MARG = PIL_H * 1000 * UE['piloto_2027_eur_kg']['base']['h_margem'] + PIL_D * 1000 * UE['piloto_2027_eur_kg']['base']['d_margem']
PIL_AZ = KP['gmv_alvo_detalhe']['azeite_horeca_gourmet'] + KP['gmv_alvo_detalhe']['azeite_distribuidores']
PIL_OPEN_LOSS = PIL_H * 1000 * (-ekg('h', 'base', 'gr') - ekg('h', 'base', 'emb')) * -P['sensibilidades']['preco_aove']
REC_SHARE = RC['linhas']['cg_rec'][4] / (RC['linhas']['cg_rec'][4] + RC['linhas']['cg_stock'][4])
N_CASES = len(R['verificacao']['contra_espelho_python']) - 1 - 4

NS = dict(nf=nf, k=k, M=M, pct=pct, B=B, RC=RC, PE=PE, OT=OT, RV=RV, C=C, UE=UE, SE=SE, P=P, R=R, KP=KP, ue=ue, ekg=ekg,
          breakeven_price=breakeven_price, per_010=per_010, s_rec=s_rec, s_base=s_base, PROD_KT=PROD_KT, LEV=LEV, STRUCT=STRUCT,
          GATE=GATE, T0=T0, T1=T1, T2=T2, PIL_COST=PIL_COST, PIL_MARG=PIL_MARG, PIL_AZ=PIL_AZ, PIL_OPEN_LOSS=PIL_OPEN_LOSS,
          REC_SHARE=REC_SHARE, N_CASES=N_CASES, round=round, abs=abs, max=max, min=min, sum=sum)

GEN = {}


def gen(name):
    def deco(fn):
        GEN[name] = fn
        return fn
    return deco

# ---------------------------------------------------------------- tabelas do sumário


@gen('tbl_resumo_cenarios')
def _():
    rows = [
        ('Pessimista', PE, 'tese da fonte, preços baixos'),
        ('Base', B, 'tese da fonte, corrigida'),
        ('Otimista', OT, 'tese da fonte, referência de 6,00'),
        ('Recomendado', RC, 'desenho reestruturado'),
        ('Recomendado a preços verificados', RV, 'sem as alavancas por provar'),
    ]
    out = ['<table class="compact tight t-scen"><thead><tr><th>Cenário</th><th class="num">GMV 2031<span class="sub">M€</span></th>'
           '<th class="num">GMV 2031 sem granel<span class="sub">M€</span></th>'
           '<th class="num">Margem de contrib. 2031<span class="sub">k€</span></th><th class="num">EBITDA 2027<span class="sub">k€</span></th>'
           '<th class="num">EBITDA 2031<span class="sub">k€</span></th><th class="num">Capital próprio necessário<span class="sub">M€, até 2031</span></th></tr></thead><tbody>']
    for name, s, sub in rows:
        cls = ' class="em"' if name == 'Recomendado' else ''
        out.append(f'<tr{cls}><td>{name}<span class="sub">{sub}</span></td><td class="num">{M(s["gmv_total"][4])}</td>'
                   f'<td class="num">{M(s["gmv_sem_granel"][4])}</td>'
                   f'<td class="num">{k(s["margem_contribuicao"]["total"][4])}</td><td class="num">{k(s["ebitda"][0])}</td>'
                   f'<td class="num">{k(s["ebitda"][4])}</td><td class="num">{M(s["necessidade_capital_proprio"])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_decomp')
def _():
    rows = [
        ('Base: a tese do documento-fonte, corrigida', B['ebitda'][4], '', 'total'),
        ('Estrutura, canais e financiamento', STRUCT,
         '12 FTE contra 17; azeite de origem e granel em corretagem; água no cabaz; café em 2030; obrigações a 75 %; servicer de reserva', 'step'),
        ('Recomendado a preços verificados', RV['ebitda'][4], 'Referência HoReCa de 5,65 €/kg; sem prémio dos distribuidores; sem verificação para terceiros nem dados', 'total'),
        ('Alavancas por provar', LEV, 'Referência de origem de 6,00 €/kg (gate: ≥ 20 cotações); prémio de 0,10 €/kg dos distribuidores '
         '(gate: offtake com prémio); verificação de 5 M€ paga pelo banco (fase 2: term sheet); dados (2030: subscritores pagantes)', 'step'),
        ('Recomendado', RC['ebitda'][4], 'Condicional às metas do gate (cap. 14)', 'total em'),
    ]
    out = ['<table class="compact tight wrap t-decomp"><colgroup><col style="width:58mm"><col style="width:22mm"><col></colgroup>'
           '<thead><tr><th>EBITDA de 2031, do Base ao Recomendado</th><th class="num">k€</th><th>O que depende de quê</th></tr></thead><tbody>']
    for lab, v, note, cls in rows:
        fmtv = k(v, sign=True) if cls == 'step' else k(v)
        out.append(f'<tr class="{cls}"><td>{lab}</td><td class="num">{fmtv}</td><td class="muted">{note}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- capítulo 2


@gen('fig_cadeia_observatorio')
def _():
    return chart('stackedBar', {
        'ariaLabel': 'Decomposição do preço de venda ao público sem IVA de 3,544 €/kg de AOVE em Espanha, campanha 2019/20',
        'thickness': 26, 'rowGap': 54, 'labelWidth': 0, 'format': {'dec': 3},
        'rows': [{'label': '', 'segments': [
            {'label': 'Granel (olivicultor + lagar)', 'value': 2.117, 'color': 'neutral.1', 'valueLabel': '2,117 · 59,7 %'},
            {'label': 'Embalamento', 'value': 0.470, 'color': 'neutral.2', 'valueLabel': '0,470'},
            {'label': 'Margem do embalador', 'value': 0.499, 'color': 'accent', 'valueLabel': '0,499 · 14,1 %'},
            {'label': 'Distribuição', 'value': 0.272, 'color': 'neutral.3', 'valueLabel': '0,272'},
            {'label': 'Margem distrib.', 'value': 0.186, 'color': 'neutral.2', 'valueLabel': '0,186'},
        ]}],
    })


@gen('fig_diferencial')
def _():
    return chart('barChart', {
        'ariaLabel': 'Margem do embalador contra o custo do desconto e o diferencial granel-prateleira, em euros por quilo',
        'thickness': 11, 'rowGap': 9, 'labelWidth': 250,
        'x': {'min': 0, 'max': 2.5, 'ticks': [0, 0.5, 1, 1.5, 2, 2.5], 'format': {'dec': 1}},
        'data': [
            {'label': 'Margem líquida do embalador, 2018/19–2020/21', 'from': 0.187, 'value': 0.499, 'valueLabel': '0,19–0,50', 'color': 'neutral.2'},
            {'label': 'Desconto de 10 % sobre a referência HoReCa de 5,65', 'value': 0.565, 'valueLabel': '0,57', 'color': 'accent', 'emphasis': True},
            {'label': 'Granel → prateleira: marca branca ES, 5 L', 'value': 0.65, 'valueLabel': '0,65', 'color': 'neutral.1'},
            {'label': 'Granel → prateleira: marca branca ES, 1 L', 'value': 1.23, 'valueLabel': '1,23', 'color': 'neutral.1'},
            {'label': 'Granel → prateleira: retalho PT, mar.–abr. 2026', 'value': 2.24, 'valueLabel': '2,24', 'color': 'neutral.1'},
        ],
    })


AOVE_ES = [
    ['2022-04-07', 3.45, {'label': '3,45', 'anchor': 'start', 'dx': 6, 'dy': 11, 'marker': True}],
    ['2023-04-07', 5.23],
    ['2023-12-26', 8.857],
    ['2024-01-24', 8.988, {'label': '8,99 · jan. 2024', 'anchor': 'middle', 'dy': -8, 'marker': True}],
    ['2024-06-15', 7.85], ['2024-12-15', 5.30], ['2025-02-15', 4.075], ['2025-04-07', 3.90],
    ['2025-11-05', 4.62], ['2026-03-20', 4.385], ['2026-06-18', 3.785], ['2026-08-31', 3.58],
    ['2026-09-22', 3.39], ['2026-10-02', 3.34],
    ['2026-10-13', 3.10, {'label': '3,10\n13-10-2026', 'anchor': 'start', 'dx': 8, 'dy': 3, 'marker': True}],
]


def aove_chart(height_mm, label_at='2023-05-01', with_pt=True):
    series = [{'name': 'AOVE na origem, Espanha', 'color': 'series.azeite', 'markers': False, 'format': {'dec': 2, 'suffix': ' €/kg'}, 'points': AOVE_ES}]
    if with_pt:
        # Portugal (SIMA/GPP): observações soltas, marcadores sem linha, para não misturar mercados numa só série
        series.append({'name': 'AOVE na origem, Portugal (SIMA)', 'color': 'neutral.1', 'width': 0, 'markers': True, 'format': {'dec': 2, 'suffix': ' €/kg'},
                       'points': [['2026-04-09', 4.43], ['2026-07-15', 3.95],
                                  ['2026-10-01', 3.60, {'label': 'PT 3,40–3,80', 'anchor': 'end', 'dx': -4, 'dy': -15}]]})
    return chart('lineChart', {
        'ariaLabel': 'Preço do azeite virgem extra na origem em Espanha de abril de 2022 a 13 de outubro de 2026, com observações portuguesas do SIMA',
        'heightMm': height_mm,
        'x': {'type': 'time', 'min': '2022-01-01', 'max': '2026-12-31', 'ticks': ['2022-01-01', '2023-01-01', '2024-01-01', '2025-01-01', '2026-01-01'], 'format': {'yearOnly': True}},
        'y': {'min': 0, 'max': 10, 'ticks': [0, 2, 4, 6, 8, 10], 'format': {'dec': 0}, 'unit': '€/kg'},
        'margin': {'r': 54},
        'bands': [{'y0': 2.81, 'y1': 4.61, 'label': 'custo de produção em Espanha: 2,81–4,61', 'labelAt': label_at, 'labelPos': 'bottom'}],
        'series': series,
    })


@gen('fig_preco_aove')
def _():
    return aove_chart(46)

# ---------------------------------------------------------------- capítulo 3: diagrama de fluxos


def _txt(x, y, s, size=9.4, anchor='middle', weight=400, fill='#1A1E16', mono=False, halo=False, italic=False):
    fam = "'IBM Plex Mono', 'Sprout Symbols', monospace" if mono else "'Public Sans', 'Sprout Symbols', sans-serif"
    h = ' stroke="#FFFFFF" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"' if halo else ''
    it = ';font-style:italic' if italic else ''
    return (f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" fill="{fill}"{h} '
            f'style="font-family:{fam};font-size:{size}px;font-weight:{weight}{it}">{esc(s)}</text>')


def _arrow_defs(ids):
    out = ['<defs>']
    for i, col in ids.items():
        out.append(f'<marker id="{i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                   f'<path d="M0,1 L9,5 L0,9 z" fill="{col}"/></marker>')
    out.append('</defs>')
    return ''.join(out)


@gen('svg_fluxos')
def _():
    W, left = 680, 84
    cols = ['Investidores\nprofissionais', 'SPV, vendedora\nSprout Capital, SA', 'OpCo\nagente e servicer', 'Lagar\nprodutor',
            'Tanque selado\n+ collateral manager', 'Armazém 3PL\ncom custódia', 'Comprador B2B\nHoReCa, distrib.']
    cw = (W - left) / len(cols)
    cx = [left + cw * (i + 0.5) for i in range(len(cols))]
    rows = [('Mercadoria', 46, 112, '#8C8A16', 'g'), ('Dinheiro', 112, 238, '#3F5A1E', 'm'), ('Título e\ngarantias [L]', 238, 362, '#1A1E16', 't')]
    H = 366
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Fluxos de mercadoria, dinheiro, título e garantias entre investidores, SPV, OpCo, lagar, tanque, 3PL e comprador" style="width:100%;height:auto">']
    o.append(_arrow_defs({'ag': '#8C8A16', 'am': '#3F5A1E', 'at': '#1A1E16'}))
    for i, c in enumerate(cols):
        l1, l2 = c.split('\n')
        o.append(_txt(cx[i], 14, l1, 9.4, weight=600))
        o.append(_txt(cx[i], 26, l2, 8.2, fill='#5B6352'))
        o.append(f'<line x1="{cx[i]:.1f}" x2="{cx[i]:.1f}" y1="38" y2="{H - 4}" stroke="#E6E9DD" stroke-width="1"/>')
    o.append(f'<line x1="0" x2="{W}" y1="{rows[0][1]}" y2="{rows[0][1]}" stroke="#1A1E16" stroke-width="0.9"/>')
    for name, y0, y1, col, key in rows:
        o.append(f'<line x1="0" x2="{W}" y1="{y1}" y2="{y1}" stroke="#D7DBCC" stroke-width="0.8"/>')
        for j, ln in enumerate(name.split('\n')):
            o.append(_txt(0, y0 + 18 + j * 12, ln, 9.6, anchor='start', weight=650, fill=col if key != 't' else '#1A1E16'))

    def arr(a, b, y, label, key, col, lab_at=0.5):
        x1, x2 = cx[a], cx[b]
        d = 1 if x2 > x1 else -1
        xs, xe = x1 + 5 * d, x2 - 5 * d
        o.append(f'<circle cx="{x1:.1f}" cy="{y}" r="3" fill="{col}"/>')
        o.append(f'<line x1="{xs:.1f}" x2="{xe:.1f}" y1="{y}" y2="{y}" stroke="{col}" stroke-width="1.6" marker-end="url(#a{key})"/>')
        o.append(_txt(x1 + (x2 - x1) * lab_at, y - 5, label, 8.4, halo=True))
    arr(3, 4, 68, 'granel AOVE', 'g', '#8C8A16')
    arr(4, 5, 68, 'tranches embaladas', 'g', '#8C8A16')
    arr(5, 6, 68, 'entregas HoReCa', 'g', '#8C8A16')
    arr(4, 6, 96, 'paletes de 5 L com offtake (distribuidores)', 'g', '#8C8A16')
    arr(0, 1, 132, 'subscrição (SCT)', 'm', '#3F5A1E')
    arr(1, 3, 132, 'preço do lote ≤ 30 dias', 'm', '#3F5A1E')
    arr(1, 0, 156, 'cupão + cash sweep', 'm', '#3F5A1E')
    arr(1, 2, 156, 'comissão de serviço', 'm', '#3F5A1E')
    arr(6, 1, 182, 'cobrança SDD B2B ≤ 35–45 dias → conta de cobranças em nome da SPV', 'm', '#3F5A1E')
    rx = cx[1]
    o.append(f'<line x1="{rx:.1f}" x2="{rx:.1f}" y1="186" y2="199" stroke="#3F5A1E" stroke-width="1.6" marker-end="url(#am)"/>')
    o.append(f'<rect x="{rx - 52:.1f}" y="202" width="104" height="24" rx="3" fill="#F4F5EF" stroke="#AEB49F" stroke-width="0.8"/>')
    o.append(_txt(rx, 212, 'reserva de 1.ª perda', 8.6, weight=600))
    o.append(_txt(rx, 222.5, '30 % da margem, até 5 %', 8, fill='#5B6352'))
    arr(3, 1, 258, 'propriedade do lote individualizado', 't', '#1A1E16')
    arr(1, 6, 284, 'venda em nome da SPV, com reserva de propriedade; a OpCo atua como agente', 't', '#1A1E16', lab_at=0.56)
    arr(4, 0, 310, 'o collateral manager detém os lotes por conta do representante comum (penhor mercantil)', 't', '#1A1E16', lab_at=0.5)
    arr(1, 0, 340, 'penhor dos créditos', 't', '#1A1E16')
    o.append(_txt(cx[1] + 12, 344, 'sobre compradores e da conta da reserva', 8.4, anchor='start', fill='#5B6352'))
    o.append('</svg>')
    return ''.join(o)

# ---------------------------------------------------------------- capítulo 6: lotes


LINE_LABELS = [
    ('ref', 'Valor à referência'), ('desc', 'Desconto ao comprador'), ('price', 'Receita (preço Sprout)'),
    ('gr', 'Granel ao lagar (índice + prémio)'), ('emb', 'Embalamento'), ('log', 'Logística'), ('3pl', 'Armazém 3PL e picking'),
    (('arm', 'seg', 'perdas', 'descl'), 'Armazenagem, seguro do stock, perdas e desclassificação'), ('anal', 'Análises'),
    ('cust', 'Custódia (collateral manager)'), ('pag', 'Pagamentos bancários'),
    ('prov', 'Provisão de crédito'), ('cupao', 'Cupão das obrigações'), ('margem', 'Margem de contribuição'),
    ('segcred', 'Seguro de crédito (no modelo, no opex desde 2028)'), ('margem_seg', 'Margem depois do seguro de crédito'),
]


@gen('tbl_lote_horeca')
def _():
    b, r = ue('h', 'base'), ue('h', 'recomendado')
    out = ['<table class="compact tight t-lote"><thead><tr><th>Lote HoReCa/gourmet de 20 t, regime de 2029</th>'
           '<th class="num">Base<span class="sub">€/kg</span></th><th class="num">Base<span class="sub">€ por lote</span></th>'
           '<th class="num">Recomendado<span class="sub">€/kg</span></th><th class="num">Recomendado<span class="sub">€ por lote</span></th></tr></thead><tbody>']
    for key, lab in LINE_LABELS:
        keys = key if isinstance(key, tuple) else (key,)
        bk, bl, rk, rl = (sum(d[x] for x in keys) for d in (b['eur_kg'], b['eur_lote'], r['eur_kg'], r['eur_lote']))
        cls = 'total' if key == 'margem_seg' else ('sub-total' if key == 'margem' else ('sep' if key in ('price', 'gr') else ''))
        out.append(f'<tr class="{cls}"><td>{lab}</td><td class="num">{nf(bk, 3)}</td><td class="num">{nf(bl)}</td>'
                   f'<td class="num">{nf(rk, 3)}</td><td class="num">{nf(rl)}</td></tr>')
    out.append(f'<tr class="memo"><td>Margem depois do seguro de crédito, % da receita</td><td class="num">{pct(b["margem_seg_pct"])}</td><td></td>'
               f'<td class="num">{pct(r["margem_seg_pct"])}</td><td></td></tr>')
    out.append(f'<tr class="memo"><td>Obrigações afetas ao lote · cupão do ciclo ({nf(b["ciclo"])} dias)</td><td></td><td class="num">{nf(b["notes"])} · {nf(b["cupciclo"])}</td>'
               f'<td></td><td class="num">{nf(r["notes"])} · {nf(r["cupciclo"])}</td></tr>')
    out.append(f'<tr class="memo"><td>Retido na reserva de 1.ª perda · margem livre para a SPV e a OpCo</td><td></td><td class="num">{nf(b["res"])} · {nf(b["livre"])}</td>'
               f'<td></td><td class="num">{nf(r["res"])} · {nf(r["livre"])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


def bolo(sc):
    """Repartição do bolo de intermediação do lote HoReCa, com o seguro de crédito nos custos diretos."""
    e = ue('h', sc)['eur_kg']
    pi = UE['bolo_intermediacao_horeca'][sc]['pi']
    cd = -sum(e[x] for x in ('3pl', 'arm', 'seg', 'anal', 'perdas', 'descl', 'cust', 'pag', 'prov', 'hedge', 'segcred'))
    parts = {'desc': -e['desc'], 'cd': cd, 'cup': -e['cupao'], 'sp': e['margem_seg']}
    return pi, parts, {kk: v / pi for kk, v in parts.items()}


@gen('fig_lote_valuechain')
def _():
    e = ue('h', 'base')['eur_kg']
    pi, v, sh = bolo('base')
    return chart('valueChain', {
        'ariaLabel': f'Decomposição do preço de referência de 5,65 €/kg e do bolo de intermediação de {nf(pi, 2)} €/kg no lote HoReCa do cenário Base',
        'format': {'dec': 2}, 'thickness': 24, 'linkHeight': 22,
        'top': {'label': 'Referência HoReCa', 'sub': '5,65 €/kg [E]', 'segments': [
            {'label': 'Granel ao lagar', 'value': -e['gr'], 'color': 'neutral.1'},
            {'label': 'Embalamento', 'value': -e['emb'], 'color': 'neutral.2'},
            {'label': 'Logística', 'value': -e['log'], 'color': 'neutral.2'},
            {'label': 'Bolo de intermediação', 'value': pi, 'color': 'accentSoft', 'zoom': True}]},
        'bottom': {'label': 'Bolo de intermediação', 'sub': f'{nf(pi, 2)} €/kg', 'segments': [
            {'label': 'Desconto ao comprador', 'valueLabel': f'{nf(v["desc"], 2)} · {pct(sh["desc"], 0)}', 'value': v['desc'], 'color': 'neutral.2'},
            {'label': 'Custos diretos e seguro', 'valueLabel': f'{nf(v["cd"], 2)} · {pct(sh["cd"], 0)}', 'value': v['cd'], 'color': 'neutral.3'},
            {'label': 'Cupão', 'valueLabel': f'{nf(v["cup"], 2)} · {pct(sh["cup"], 0)}', 'value': v['cup'], 'color': 'neutral.1'},
            {'label': 'Margem Sprout', 'valueLabel': f'{nf(v["sp"], 2)} · {pct(sh["sp"], 0)}', 'value': v['sp'], 'color': 'accent'}]},
    })


NS['bolo'] = bolo


@gen('tbl_lotes_canais')
def _():
    d, g, h = UE['distribuidores_exportacao_30t'], UE['granel_certificado_100t'], UE['horeca_gourmet_20t']
    rows = [
        ('Preço de venda', 'price'), ('Granel ao lagar', 'gr'), ('Embalamento + logística + 3PL', None),
        ('Armazenagem, seguro do stock, análises, perdas, desclassificação', 'qual'), ('Custódia + pagamentos + provisão de crédito', 'ops'),
        ('Cupão das obrigações', 'cupao'), ('Margem de contribuição', 'margem'), ('Seguro de crédito (no modelo, no opex)', 'segcred'),
        ('Margem depois do seguro de crédito', 'margem_seg')]

    def val(x, key):
        e = x['eur_kg']
        if key is None:
            return e['emb'] + e['log'] + e['3pl']
        if key == 'qual':
            return e['arm'] + e['seg'] + e['anal'] + e['perdas'] + e['descl']
        if key == 'ops':
            return e['cust'] + e['pag'] + e['prov']
        return e[key]
    cols = [('HoReCa 20 t', h['base'], 'Base'), ('HoReCa 20 t', h['recomendado'], 'Recom.'), ('Distrib. 30 t', d['base'], 'Base'),
            ('Distrib. 30 t', d['recomendado'], 'Recom.'), ('Granel 100 t', g['recomendado'], 'principal (caso)')]
    out = ['<table class="compact tight t-canais"><thead><tr><th>€/kg, regime de 2029</th>']
    for lab, _, scen in cols:
        out.append(f'<th class="num">{lab}<span class="sub">{scen}</span></th>')
    out.append('</tr></thead><tbody>')
    for lab, key in rows:
        cls = 'total' if key == 'margem_seg' else ('sub-total' if key == 'margem' else '')
        out.append(f'<tr class="{cls}"><td>{lab}</td>' + ''.join(f'<td class="num">{nf(val(x, key), 3)}</td>' for _, x, _ in cols) + '</tr>')
    out.append('<tr class="memo"><td>Margem depois do seguro, % do preço</td>' + ''.join(f'<td class="num">{pct(x["margem_seg_pct"])}</td>' for _, x, _ in cols) + '</tr>')
    out.append('<tr class="memo"><td>Margem depois do seguro, € por lote</td>' + ''.join(f'<td class="num">{nf(x["eur_lote"]["margem_seg"])}</td>' for _, x, _ in cols) + '</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_tese_literal')
def _():
    t = SE['tese_literal_horeca_base_2029']
    out = ['<table class="compact tight t-grid"><thead>'
           f'<tr><th rowspan="2">Saldo para o Sprout, €/kg</th><th class="num grp-h" colspan="3">Margem do embalador média, {nf(t["margem_embalador_med"]["margem_embalador_eur_kg"], 3)} €/kg</th>'
           f'<th class="num grp-h" colspan="3">Margem de 2019/20, {nf(t["margem_embalador_max"]["margem_embalador_eur_kg"], 3)} €/kg</th></tr><tr>']
    for key in ('margem_embalador_med', 'margem_embalador_max'):
        for c in t[key]['captura']:
            out.append(f'<th class="num">captura {int(round(c * 100))} %</th>')
    out.append('</tr></thead><tbody>')
    for i, dsc in enumerate(t['margem_embalador_med']['desconto']):
        row = f'<tr><td>Desconto de {nf(dsc * 100, 1 if dsc == 0.125 else 0)} %</td>'
        for key in ('margem_embalador_med', 'margem_embalador_max'):
            row += ''.join(f'<td class="num">{nf(v, 2)}</td>' for v in t[key]['saldo_eur_kg'][i])
        out.append(row + '</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('fig_tese_waterfall')
def _():
    t = UE['tese_literal_horeca']['base']
    cap, dsc, cd, cup = t['cap'], t['desc'], t['cd'], t['cup']
    a1 = cap
    a2 = a1 + dsc
    a3 = a2 + cd
    a4 = a3 + cup
    return chart('barChart', {
        'ariaLabel': 'Tese literal: o que se captura da margem do embalador contra o desconto, os custos diretos e o cupão, em euros por quilo',
        'thickness': 12, 'rowGap': 8, 'labelWidth': 230,
        'x': {'min': -0.9, 'max': 0.35, 'ticks': [-0.8, -0.6, -0.4, -0.2, 0, 0.2], 'format': {'dec': 1}},
        'data': [
            {'label': 'Captura de 85 % da margem do embalador', 'value': round(a1, 4), 'valueLabel': '+' + nf(cap, 2), 'color': 'neutral.1'},
            {'label': 'Desconto de 10 % sobre 5,65 €/kg', 'from': round(a1, 4), 'value': round(a2, 4), 'valueLabel': nf(dsc, 3), 'color': 'neutral.2'},
            {'label': 'Custos diretos do lote', 'from': round(a2, 4), 'value': round(a3, 4), 'valueLabel': nf(cd, 2), 'color': 'neutral.2'},
            {'label': 'Cupão das obrigações', 'from': round(a3, 4), 'value': round(a4, 4), 'valueLabel': nf(cup, 3), 'color': 'neutral.2'},
            {'label': 'Saldo para o Sprout', 'value': round(a4, 4), 'valueLabel': nf(a4, 2), 'color': 'accent', 'emphasis': True},
        ],
    })


@gen('tbl_receitas')
def _():
    mb, mr = B['margem_contribuicao'], RC['margem_contribuicao']
    rows = [
        ('Azeite HoReCa/gourmet (principal)', 'Venda a 90 % da referência documentada; custos diretos, cupão e seguro de crédito deduzidos', 'azeite_horeca_gourmet', '2027'),
        ('Azeite distribuidores e exportação (principal)', 'Preço de saída do embalador, sem desconto; Recomendado: +0,10 €/kg de prémio de origem (por provar)', 'azeite_distribuidores_exportacao', '2027'),
        ('Granel certificado (corretagem com verificação)', '0,75 % do valor ao índice; o Sprout paga custódia e análises; principal (índice + 0,15 €/kg) só com carta de intenções', 'azeite_granel_certificado', '2028 (rec.)'),
        ('Café verde (principal)', 'Compra em EUR a importador UE; venda a microtorrefatores', 'cafe_verde', '2029 / 2030'),
        ('Água (agente)', 'Comissão de 2 % do GMV, faturada ao engarrafador; sem stock nem fundos de terceiros', 'agua', '2027'),
        ('Verificação para terceiros', '0,75 % por utilização × 2 + 0,5 %/ano da carteira de um banco parceiro; no Recomendado o banco paga a custódia', 'verificacao_terceiros_liquida', '2028'),
        ('Dados e índice', 'Subscrição de preços de lotes verificados', 'dados', '2030'),
    ]
    out = ['<table class="compact tight wrap t-rec"><colgroup><col style="width:50mm"><col><col style="width:16mm"><col style="width:19mm"><col style="width:22mm"></colgroup>'
           '<thead><tr><th>Fonte de receita</th><th>Mecânica</th><th>Início</th><th class="num">Base 2031<span class="sub">k€ de margem</span></th><th class="num">Recomendado 2031<span class="sub">k€ de margem</span></th></tr></thead><tbody>']
    for lab, mec, key, ini in rows:
        out.append(f'<tr><td class="lbl">{lab}</td><td>{mec}</td><td>{ini}</td><td class="num">{k(mb[key][4], 0)}</td><td class="num">{k(mr[key][4], 0)}</td></tr>')
    out.append(f'<tr class="total"><td>Margem de contribuição total</td><td></td><td></td><td class="num">{k(mb["total"][4])}</td><td class="num">{k(mr["total"][4])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- capítulo 13: financeiro


@gen('tbl_pressupostos')
def _():
    rows = [
        ('Índice do granel (SIMA + Poolred); prémio ao lagar HoReCa', '3,50; 0,10 €/kg', '3,50; 0,15 €/kg', '00 §1.2; 01 §2.1'),
        ('Referência HoReCa/gourmet; desconto', '5,65 €/kg [E]; 10 %', '6,00 €/kg, origem identificada (por provar); 10 %', '00 §1.4; 01 §2.8'),
        ('Referência distribuidores/exportação; desconto', '4,35 €/kg; 0 %', '4,45 €/kg (prémio de origem de 0,10, por provar); 0 %', '01 §2.5, §5.4'),
        ('Clientes HoReCa/gourmet ativos, 2027 → 2031', '40 → 2 000', '40 → 1 000', '10 §5'),
        ('Azeite total, 2027 → 2031 (t)', f'{nf(B["volumes_t"]["azeite_total"][0])} → {nf(B["volumes_t"]["azeite_total"][4])}',
         f'{nf(RC["volumes_t"]["azeite_total"][0], 0)} → {nf(RC["volumes_t"]["azeite_total"][4])} (granel em corretagem 0 → {nf(RC["volumes_t"]["azeite_granel_certificado"][4])})', '01 §7.1'),
        ('Granel certificado', '—', 'corretagem com verificação: 0,75 % do valor ao índice; principal só com carta de intenções', '01 §2.8; 50 §2.2'),
        ('Água (paletes, 2031); modelo', '1 800; agente 2 %', '900; agente 2 %, só cabaz', '01 §2.7'),
        ('Café verde', '2029: 30 → 100 t', '2030: 20 → 50 t; cobertura 0,3 %', '40 §2.5'),
        ('Cupão; obrigações em % do fundo de maneio; utilização', '8 % → 7 %; 0 % em 2027, depois 90 %; 80 %', 'igual, mas obrigações a 75 % (subordinado de 25 %) e servicer de reserva', '01 §3–4; CSC 348.º/2 [L]'),
        ('Prazo de recebimento HoReCa / distribuidores', '35 / 45 dias', '35 / 55 dias', '00 §4'),
        ('Verificação para terceiros: carteira 2031; custo', '5 M€; pago pelo Sprout', '5 M€; pago pelo banco ou mutuário (por provar)', '01 §6.1'),
        ('FTE 2027 → 2031', '7 → 17', '5,5 → 12', '01 §6.2'),
        ('Pré-seed; caixa mínima', '1,1 M€; 150 k€', 'igual, em três tranches (13.7)', '01 §5.5, §7.3'),
    ]
    out = ['<table class="compact tight t-press"><thead><tr><th>Pressuposto</th><th>Base (fonte corrigida)</th><th>Recomendado</th><th>Origem</th></tr></thead><tbody>']
    for a, b_, c, d in rows:
        out.append(f'<tr><td>{a}</td><td>{b_}</td><td>{c}</td><td class="ref-cell">{d}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


def _fixos(s):
    return [p + o for p, o in zip(s['pessoal'], s['opex_nao_salarial'])]


@gen('tbl_pl')
def _():
    L = RC['linhas']
    out = ['<table class="compact tight t-fin">', years_head('Recomendado, k€'), '<tbody>']
    out.append(num_row('GMV (inclui o granel em corretagem)', RC['gmv_total'], lbl_cls='b'))
    out.append(num_row('Receita', L['dr_rec']))
    out.append(num_row('Custo das mercadorias vendidas', L['dr_cmv']))
    out.append(num_row('Margem bruta', L['dr_mb'], cls='sub-total'))
    out.append(num_row('Custos variáveis (logística, 3PL, custódia, qualidade, crédito, pagamentos)', L['dr_cv']))
    out.append(num_row('Cupão das obrigações', L['dr_cup']))
    out.append(num_row('Margem de contribuição', L['dr_mc'], cls='sub-total'))
    out.append(num_row('&nbsp;&nbsp;azeite HoReCa/gourmet', L['mc_h'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;azeite distribuidores/exportação', L['mc_d'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;granel certificado (corretagem)', L['mc_g'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;café, água, verificação para terceiros, dados', [a + b_ + c + d for a, b_, c, d in zip(L['mc_cf'], L['mc_ag'], L['mc_tp'], L['mc_dd'])], cls='dim'))
    out.append(num_row('Pessoal', L['dr_pess']))
    out.append(num_row('Opex não salarial (inclui SPV e seguro de crédito)', L['dr_opex']))
    out.append(num_row('EBITDA depois do cupão', L['dr_ebitda'], cls='total'))
    out.append(num_row('EBITDA antes do cupão (comparável com múltiplos)', L['dr_ebitda_xc'], cls='memo'))
    out.append(num_row('Amortizações', L['dr_da']))
    out.append(num_row('Resultado líquido (sem imposto: prejuízo fiscal consolidado)', L['dr_rl'], cls='sub-total'))
    out.append(num_row('Memo: FTE', RC['fte'], fmt=lambda v: nf(v, 1 if v % 1 else 0), cls='memo'))
    out.append(num_row('Memo: margem do azeite, €/kg', L['mc_az_kg'], fmt=lambda v: nf(v, 3), cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_pl_base')
def _():
    L = B['linhas']
    out = ['<table class="compact tight t-fin">', years_head('Base, k€'), '<tbody>']
    out.append(num_row('GMV', B['gmv_total'], lbl_cls='b'))
    out.append(num_row('Margem de contribuição', L['dr_mc'], cls='sub-total'))
    out.append(num_row('Pessoal + opex não salarial', [a + b_ for a, b_ in zip(L['dr_pess'], L['dr_opex'])]))
    out.append(num_row('EBITDA depois do cupão', L['dr_ebitda'], cls='total'))
    out.append(num_row('Resultado líquido', L['dr_rl']))
    out.append(num_row('Memo: FTE', B['fte'], fmt=lambda v: nf(v, 0), cls='memo'))
    out.append(num_row('Memo: margem do azeite, €/kg', L['mc_az_kg'], fmt=lambda v: nf(v, 3), cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_cf')
def _():
    out = ['<table class="compact tight t-fin">', years_head('k€, níveis médios do ano'), '<tbody>']
    for name, s in (('Recomendado', RC), ('Base', B)):
        out.append(f'<tr class="grp"><td colspan="6">{name}</td></tr>')
        out.append(num_row('Fundo de maneio (stock + recebíveis − fornecedores)', s['capital_giro']))
        out.append(num_row('Obrigações em circulação (média do ano)', s['capital_financiado']['obrigacoes_em_circulacao']))
        out.append(num_row('Reserva de 1.ª perda (caixa restrita)', s['capital_financiado']['reserva_primeira_perda']))
        out.append(num_row('Fluxo de caixa para o acionista', s['cash_flow_acionista']))
        out.append(num_row('Fluxo de caixa acumulado', s['cash_flow_acumulado'], cls='sub-total'))
        out.append(num_row('Capital próprio levantado, acumulado', s['capital_proprio_levantado_acumulado'], cls='total'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_funding')
def _():
    L = RC['linhas']
    f = RC['custo_financiamento_obrigacoes']
    out = ['<table class="compact tight t-fin">', years_head('Recomendado, k€'), '<tbody>']
    out.append(num_row('Obrigações em circulação (média do ano)', L['ob']))
    out.append(num_row('Cupão pago', L['cup_total']))
    out.append(num_row('Custos da SPV (constituição, manutenção, séries, funções independentes, servicer de reserva)', L['ox_spv']))
    out.append(num_row('Custo total do financiamento por obrigações', f['total'], cls='total'))
    out.append(num_row('Custo total em % das obrigações em circulação', f['pct_obrigacoes'], fmt=lambda v: '—' if v in (None, '') else pct(v, 1), cls='sub-total'))
    out.append(num_row('Caixa parada nas séries (obrigações levantadas e não aplicadas)', f['caixa_parada_series'], cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_fundos')
def _():
    a, b_, v = RC['aplicacao_fundos'], B['aplicacao_fundos'], RV['aplicacao_fundos']
    rows = [('Pré-arranque (4.º trim. 2026) e capital social da SPV', 'pre_arranque_e_capital_spv'), ('Perdas operacionais acumuladas (caixa)', 'perdas_operacionais'),
            ('Capex (telemetria, plataforma, equipamento)', 'capex'), ('Fundo de maneio não coberto por obrigações, reserva e caixa parada', 'capital_giro_reserva_float'),
            ('Caixa mínima operacional', 'caixa_minima'), ('Necessidade de capital próprio até 2031', 'total')]
    out = ['<table class="compact tight t-fundos"><thead><tr><th>Aplicação de fundos, 2026–2031</th><th class="num">Recomendado<span class="sub">k€</span></th>'
           '<th class="num">A preços verificados<span class="sub">k€</span></th><th class="num">Base<span class="sub">k€</span></th></tr></thead><tbody>']
    for lab, key in rows:
        cls = ' class="total"' if key == 'total' else ''
        out.append(f'<tr{cls}><td>{lab}</td><td class="num">{k(a[key])}</td><td class="num">{k(v[key])}</td><td class="num">{k(b_[key])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_tranches')
def _():
    rows = [
        ('T0', T0, 'já: out.–nov. 2026', 'Pré-arranque (parecer, constituição, auditoria do backoffice, AIPD, ledger) e capital social da SPV',
         'Nenhuma: é o custo de chegar à decisão. Fundadores ou bridge'),
        ('T1', T1, 'fev. 2027', 'Fase 0, piloto e gate (gasto até 31-08-2027: ' + k(GATE) + ' k€, menos T0)',
         '≥ 20 cotações de origem identificada com mediana ≥ 6,00 €/kg; parecer favorável às perguntas 2, 4 e 10; resposta escrita de ≥ 2 distribuidores sobre o prémio'),
        ('T2', T2, 'set. 2027', 'Set.–dez. 2027 (fechar a seed ou encerrar) e 150 k€ de caixa mínima', 'Gate de 31-08-2027 cumprido (14.2)'),
    ]
    out = ['<table class="compact tight wrap t-tranches"><colgroup><col style="width:10mm"><col style="width:16mm"><col style="width:22mm"><col><col style="width:64mm"></colgroup>'
           '<thead><tr><th>Tranche</th><th class="num">k€</th><th>Desembolso</th><th>Financia</th><th>Condição</th></tr></thead><tbody>']
    for t, v, when, what, cond in rows:
        out.append(f'<tr><td class="lbl">{t}</td><td class="num">{k(v)}</td><td>{when}</td><td>{what}</td><td>{cond}</td></tr>')
    out.append(f'<tr class="total"><td>Total</td><td class="num">{k(T0 + T1 + T2)}</td><td></td><td>Pré-seed</td><td></td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


def _series3(key, scale=1000, dec=0):
    def pts(s):
        return [[y, round(v / scale, dec) if dec else round(v / scale)] for y, v in zip(YEARS, s[key])]
    return pts


@gen('fig_ebitda_cenarios')
def _():
    pts = _series3('ebitda')
    return chart('lineChart', {
        'ariaLabel': 'EBITDA de 2027 a 2031 nos cenários Base, Recomendado e Recomendado a preços verificados, em milhares de euros', 'heightMm': 50, 'margin': {'r': 120},
        'x': {'type': 'linear', 'ticks': YEARS, 'format': {'group': False}},
        'y': {'min': -1400, 'max': 200, 'ticks': [-1200, -800, -400, 0], 'format': {'dec': 0}, 'unit': 'k€'},
        'refLines': [{'y': 0, 'label': 'break-even', 'labelAt': 'start'}],
        'series': [
            {'name': 'Base', 'color': 'neutral.1', 'points': pts(B), 'endLabel': f'Base {k(B["ebitda"][4])}', 'markers': 'ends'},
            {'name': 'A preços verificados', 'color': 'accent', 'dash': '5 3', 'width': 1.6, 'points': pts(RV), 'endLabel': f'Preços verificados {k(RV["ebitda"][4])}', 'markers': 'ends'},
            {'name': 'Recomendado', 'color': 'accent', 'points': pts(RC), 'endLabel': f'Recomendado {k(RC["ebitda"][4])}', 'emphasis': True, 'markers': 'ends'},
        ],
    })


@gen('fig_capital_cenarios')
def _():
    def pts(s):
        return [[y, round(v / 1000)] for y, v in zip(YEARS, s['capital_proprio_levantado_acumulado'])]
    return chart('lineChart', {
        'ariaLabel': 'Capital próprio levantado acumulado nos cenários Base, Recomendado e Recomendado a preços verificados, 2027 a 2031', 'heightMm': 50, 'margin': {'r': 120},
        'x': {'type': 'linear', 'ticks': YEARS, 'format': {'group': False}},
        'y': {'min': 0, 'max': 6000, 'ticks': [0, 2000, 4000, 6000], 'format': {'dec': 0}, 'unit': 'k€'},
        'series': [
            {'name': 'Base', 'color': 'neutral.1', 'points': pts(B), 'endLabel': f'Base {M(B["necessidade_capital_proprio"])}', 'markers': 'ends', 'endDy': -5},
            {'name': 'A preços verificados', 'color': 'accent', 'dash': '5 3', 'width': 1.6, 'points': pts(RV), 'endLabel': f'Preços verificados {M(RV["necessidade_capital_proprio"])}', 'markers': 'ends', 'endDy': 1},
            {'name': 'Recomendado', 'color': 'accent', 'points': pts(RC), 'endLabel': f'Recomendado {M(RC["necessidade_capital_proprio"])}', 'emphasis': True, 'markers': 'ends', 'endDy': 6},
        ],
    })


@gen('fig_mc_fixos')
def _():
    return chart('groupedColumns', {
        'ariaLabel': 'Cenário Recomendado: margem de contribuição contra custos fixos, 2027 a 2031', 'heightMm': 44,
        'categories': [str(y) for y in YEARS],
        'y': {'min': 0, 'max': 1400, 'ticks': [0, 400, 800, 1200], 'format': {'dec': 0}, 'unit': 'k€'},
        'barWidth': 14,
        'series': [
            {'name': 'Margem de contribuição', 'color': 'accent', 'values': [round(v / 1000) for v in RC['margem_contribuicao']['total']], 'labelAt': [0, 4]},
            {'name': 'Pessoal + opex não salarial', 'color': 'neutral.2', 'values': [round(v / 1000) for v in _fixos(RC)], 'labelAt': [0, 4]},
        ],
    })


@gen('fig_mc_mix')
def _():
    m = RC['margem_contribuicao']
    seg = [
        ('Azeite: distribuidores e exportação', m['azeite_distribuidores_exportacao'][4], 'neutral.1'),
        ('Azeite: HoReCa/gourmet', m['azeite_horeca_gourmet'][4], 'neutral.1'),
        ('Granel certificado (corretagem)', m['azeite_granel_certificado'][4], 'neutral.1'),
        ('Verificação para terceiros', m['verificacao_terceiros_liquida'][4], 'accent'),
        ('Dados', m['dados'][4], 'accent'),
        ('Café verde', m['cafe_verde'][4], 'neutral.1'),
        ('Água (agente)', m['agua'][4], 'neutral.1'),
    ]
    seg.sort(key=lambda t: -t[1])
    return chart('barChart', {
        'ariaLabel': 'Margem de contribuição de 2031 no cenário Recomendado, por canal, em milhares de euros',
        'thickness': 10, 'rowGap': 7, 'labelWidth': 178,
        'x': {'min': 0, 'max': 300, 'ticks': [0, 100, 200, 300], 'format': {'dec': 0}},
        'data': [{'label': a, 'value': round(v / 1000), 'valueLabel': k(v), 'color': c} for a, v, c in seg],
    })


@gen('tbl_tem_de_ser')
def _():
    b, r = B['o_que_tem_de_ser_verdade_2031'], RC['o_que_tem_de_ser_verdade_2031']
    rows = [
        ('Défice de EBITDA de 2031 a fechar', f'{k(b["defice_ebitda"])} k€', f'{k(r["defice_ebitda"])} k€', ''),
        ('Prémio adicional pago por distribuidores e exportadores', f'+{nf(b["premio_adicional_distribuidores_eur_kg"], 2)} €/kg', f'+{nf(r["premio_adicional_distribuidores_eur_kg"], 2)} €/kg', 'o 01 só suporta 0,10–0,20'),
        ('Referência HoReCa documentada (com 10 % de desconto)', f'{nf(b["referencia_horeca_eur_kg"], 2)} €/kg', f'{nf(r["referencia_horeca_eur_kg"], 2)} €/kg', 'retalho PT médio: 6,67 sem IVA'),
        ('Volume de granel certificado (Recomendado: em corretagem)', f'{nf(b["volume_granel_t"])} t', f'{nf(r["volume_granel_t"])} t', f'produção PT ~{nf(PROD_KT * 1000)} t [E]'),
        ('Corte nos custos fixos (pessoal + opex)', f'{MINUS}{nf(b["corte_custos_fixos_pct"] * 100)} %', f'{MINUS}{nf(r["corte_custos_fixos_pct"] * 100)} %', ''),
        ('Carteira de verificação para terceiros', f'{M(b["carteira_terceiros_eur"], 0)} M€', f'{M(r["carteira_terceiros_eur"], 1)} M€', 'modelado: 5 M€'),
    ]
    out = ['<table class="compact tight t-tds"><thead><tr><th>Uma alavanca de cada vez, para EBITDA de 2031 = 0</th><th class="num">Base</th><th class="num">Recomendado</th><th>Contexto</th></tr></thead><tbody>']
    for a, b_, c, d in rows:
        out.append(f'<tr><td>{a}</td><td class="num">{b_}</td><td class="num">{c}</td><td class="muted">{d}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_cenarios')
def _():
    sc = [('Pessimista', PE), ('Base', B), ('Otimista', OT), ('Recomendado', RC), ('A preços verificados', RV)]
    rows = [
        ('Azeite 2031, t', lambda s: nf(s['volumes_t']['azeite_total'][4])),
        ('Quota da produção PT, 2031', lambda s: pct(s['volumes_t']['quota_producao_pt'][4], 2)),
        ('Clientes HoReCa/gourmet, 2031', lambda s: nf(s['volumes_t']['clientes_horeca_gourmet'][4])),
        ('GMV 2031, M€', lambda s: M(s['gmv_total'][4])),
        ('GMV 2031 sem granel, M€', lambda s: M(s['gmv_sem_granel'][4])),
        ('Margem do azeite 2031, €/kg', lambda s: nf(s['margem_contribuicao']['azeite_eur_kg'][4], 3)),
        ('Margem de contribuição 2031, k€', lambda s: k(s['margem_contribuicao']['total'][4])),
        ('FTE 2031', lambda s: nf(s['fte'][4], 1 if s['fte'][4] % 1 else 0)),
        ('EBITDA 2031 depois do cupão, k€', lambda s: k(s['ebitda'][4])),
        ('EBITDA 2031 antes do cupão, k€', lambda s: k(s['ebitda_sem_cupao'][4])),
        ('Fluxo de caixa acumulado 2027–2031, k€', lambda s: k(s['cash_flow_acumulado'][4])),
        ('Obrigações em circulação 2031 (média), k€', lambda s: k(s['capital_financiado']['obrigacoes_em_circulacao'][4])),
        ('Investidores estimados 2031', lambda s: nf(s['capital_financiado']['investidores_estimados'][4], 0)),
        ('Necessidade de capital próprio, M€', lambda s: M(s['necessidade_capital_proprio'])),
        ('Autonomia do pré-seed de 1,1 M€, meses', lambda s: nf(s['runway_pre_seed_meses'], 1)),
        ('Gasto até ao gate de 31-08-2027, k€', lambda s: k(s['gasto_ate_gate_2027_08'])),
        ('Primeiro ano de EBITDA positivo', lambda s: 'não até 2031' if not isinstance(s['primeiro_ano_ebitda_positivo'], (int, float)) else str(s['primeiro_ano_ebitda_positivo'])),
    ]
    out = ['<table class="compact tight t-scen4"><thead><tr><th></th>' + ''.join(f'<th class="num{" em" if n == "Recomendado" else ""}">{n}</th>' for n, _ in sc) + '</tr></thead><tbody>']
    for lab, f in rows:
        out.append(f'<tr><td>{lab}</td>' + ''.join(f'<td class="num{" em" if n == "Recomendado" else ""}">{f(s)}</td>' for n, s in sc) + '</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


SENS_CASES = [('desconto_10', 'Caso central (desconto HoReCa de 10 %)'), ('desconto_12_5', 'Desconto HoReCa de 12,5 %'), ('desconto_15', 'Desconto HoReCa de 15 %'),
              ('volume_menos_30', 'Volumes −30 %'), ('volume_mais_30', 'Volumes +30 %'), ('preco_aove_menos_30', 'Preço do AOVE −30 % (repercussão proporcional)'),
              ('cupao_10', 'Cupão das obrigações de 10 %'), ('cupao_12', 'Cupão das obrigações de 12 %'),
              ('precos_verificados', 'A preços verificados (sem as alavancas por provar)'), ('granel_principal', 'Granel certificado como principal (índice + 0,15)'),
              ('obrigacoes_90', 'Obrigações a 90 % do fundo de maneio (subordinado de 10 %)'), ('pagamento_lagar_d5', 'Pagamento ao lagar a D5'),
              ('topo_dos_intervalos', 'Topo dos intervalos')]


@gen('tbl_sens')
def _():
    out = ['<table class="compact tight t-sens"><thead><tr><th>Sensibilidade</th><th class="num">Base<span class="sub">EBITDA 2031, k€</span></th><th class="num">Base<span class="sub">capital, M€</span></th>'
           '<th class="num">Recomendado<span class="sub">EBITDA 2031, k€</span></th><th class="num">Recomendado<span class="sub">capital, M€</span></th><th class="num">Recomendado<span class="sub">margem HoReCa 2029, €/kg</span></th></tr></thead><tbody>']
    for key, lab in SENS_CASES:
        b, r = SE['base'].get(key), SE['recomendado'][key]
        cls = ' class="sub-total"' if key == 'desconto_10' else ''
        bcells = (f'<td class="num">{k(b["ebitda_2031"])}</td><td class="num">{M(b["necessidade_capital_proprio"])}</td>' if b
                  else '<td class="num muted">—</td><td class="num muted">—</td>')
        out.append(f'<tr{cls}><td>{lab}</td>{bcells}'
                   f'<td class="num">{k(r["ebitda_2031"])}</td><td class="num">{M(r["necessidade_capital_proprio"])}</td><td class="num">{nf(r["margem_horeca_2029_eur_kg"], 3)}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('fig_tornado')
def _():
    r = SE['recomendado']
    c0 = round(r['cenario']['ebitda_2031'] / 1000)
    order = ['preco_aove_menos_30', 'precos_verificados', 'volume_menos_30', 'cupao_12', 'desconto_15', 'pagamento_lagar_d5', 'cupao_10',
             'desconto_12_5', 'obrigacoes_90', 'granel_principal', 'volume_mais_30', 'topo_dos_intervalos']
    labs = dict(SENS_CASES)
    labs['topo_dos_intervalos'] = 'Topo dos intervalos (prémio 0,20; carteira de 10 M€; volumes +30 %)'
    labs['precos_verificados'] = 'A preços verificados'
    labs['obrigacoes_90'] = 'Obrigações a 90 % (subordinado de 10 %)'
    data = []
    for key in order:
        v = round(r[key]['ebitda_2031'] / 1000)
        data.append({'label': labs[key], 'from': c0, 'value': v, 'valueLabel': f'{nf(v)} k€',
                     'color': 'accent' if v > c0 else 'neutral.1'})
    return chart('barChart', {
        'ariaLabel': f'Sensibilidade do EBITDA de 2031 do cenário Recomendado, a partir de {c0} mil euros',
        'thickness': 10, 'rowGap': 7, 'labelWidth': 232,
        'x': {'min': -1500, 'max': 0, 'ticks': [-1500, -1250, -1000, -750, -500, -250, 0], 'format': {'dec': 0}},
        'refLines': [{'x': c0, 'label': f'caso central {nf(c0)}'}],
        'data': data,
    })


@gen('tbl_fte')
def _():
    L = RC['linhas']
    roles = [('ceo_comercial', 'CEO / comercial (fundador)'), ('cto', 'CTO (fundador)'), ('risco_tesouraria', 'Responsável de Risco e Tesouraria'),
             ('compliance_aml', 'Compliance/AML'), ('operacoes_supply', 'Operações e abastecimento'), ('tecnico_qualidade_azeite', 'Técnico(a) de qualidade do azeite'),
             ('engenheiro_software', 'Engenheiro(a) de software'), ('gestor_conta_b2b', 'Gestor(a) de conta B2B'),
             ('trader_granel_exportacao', 'Trader de granel e exportação'), ('assistente_operacoes', 'Assistente de operações')]
    out = ['<table class="compact tight t-fte">', years_head('FTE, Recomendado'), '<tbody>']
    f = (lambda v: nf(v, 1) if v % 1 else nf(v, 0))
    for key, lab in roles:
        out.append(num_row(lab, L['pf_' + key], fmt=lambda v: '·' if v == 0 else f(v)))
    out.append(num_row('Total', RC['fte'], fmt=f, cls='total'))
    out.append(num_row('Base (comparação)', B['fte'], fmt=f, cls='memo'))
    out.append(num_row('Pessoal, k€ (Recomendado)', RC['pessoal'], cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- linhas temporais


def timeline_piloto(lane_h=22):
    return chart('timeline', {
        'ariaLabel': 'Calendário de out. 2026 a mar. 2028: fase 0, piloto, gate, fase 2; registo da SPV e 1.ª série; pré-seed em tranches',
        'start': '2026-10-01', 'end': '2028-03-31', 'today': '2026-10-13', 'todayLabel': '13-10-2026',
        'laneHeight': lane_h, 'barHeight': 13,
        'lanes': [
            {'label': 'Operação', 'items': [
                {'from': '2026-10-13', 'to': '2027-01-31', 'label': 'Fase 0: preparação', 'tone': 'soft'},
                {'from': '2027-02-01', 'to': '2027-07-31', 'label': 'Piloto: 2 × 10 t + 60 paletes', 'color': 'accent'},
                {'from': '2027-09-01', 'to': '2028-03-31', 'label': 'Fase 2: campanha 2027/28', 'tone': 'outline', 'color': 'accent'},
                {'at': '2027-08-31', 'label': '', 'kind': 'milestone'}]},
            {'label': 'Obrigações (SPV)', 'items': [
                {'from': '2026-11-20', 'to': '2027-11-20', 'label': 'SPV registada; sem exceção ao CSC 348.º/2 [L], 12 meses sem emitir', 'tone': 'outline', 'color': 'neutral.1'},
                {'from': '2027-11-20', 'to': '2028-01-31', 'label': '1.ª série', 'color': 'series.azeite'},
                {'at': '2026-11-20', 'label': '', 'kind': 'milestone'}]},
            {'label': 'Capital próprio', 'items': [
                {'at': '2026-10-31', 'label': 'T0', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-01-31', 'label': 'T1 (condicionada)', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-08-31', 'label': 'Gate 31-08-2027 → T2; seed condicionada', 'kind': 'milestone', 'anchor': 'start'}]},
        ],
    })


@gen('fig_timeline_piloto')
def _():
    return timeline_piloto()


@gen('fig_timeline_marcos')
def _():
    return chart('timeline', {
        'ariaLabel': 'Marcos de out. 2026 a dez. 2029: operação, canais, capital, equipa e marcos',
        'start': '2026-10-01', 'end': '2029-12-31', 'today': '2026-10-13', 'todayLabel': 'hoje', 'tick': 'quarter',
        'laneHeight': 22, 'barHeight': 12,
        'lanes': [
            {'label': 'Operação', 'items': [
                {'from': '2026-10-13', 'to': '2027-01-31', 'label': 'Fase 0', 'tone': 'soft'},
                {'from': '2027-02-01', 'to': '2027-07-31', 'label': 'Piloto', 'color': 'accent'},
                {'from': '2027-09-01', 'to': '2028-08-31', 'label': 'Campanha 2027/28', 'tone': 'outline', 'color': 'accent'},
                {'from': '2028-09-01', 'to': '2029-08-31', 'label': 'Campanha 2028/29', 'tone': 'outline', 'color': 'accent'},
                {'from': '2029-09-01', 'to': '2029-12-31', 'label': '2029/30', 'tone': 'outline', 'color': 'accent'}]},
            {'label': 'Canais', 'items': [
                {'from': '2027-02-01', 'to': '2029-12-31', 'label': 'HoReCa/gourmet e distribuidores com offtake', 'tone': 'soft'}]},
            {'label': ' ', 'items': [
                {'from': '2028-01-01', 'to': '2029-12-31', 'label': 'Granel em corretagem: 500 t em 2028, 1 500 t em 2029', 'tone': 'soft'}]},
            {'label': 'Capital', 'items': [
                {'at': '2026-11-20', 'label': 'SPV', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-01-31', 'label': 'T1', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-08-31', 'label': 'Gate', 'kind': 'milestone', 'anchor': 'start'},
                {'from': '2027-11-20', 'to': '2028-01-31', 'label': '1.ª série', 'color': 'series.azeite'},
                {'at': '2028-06-30', 'label': 'Banco parceiro', 'kind': 'milestone', 'anchor': 'start'}]},
            {'label': 'Equipa', 'items': [
                {'at': '2027-06-30', 'label': 'Risco e Tesouraria', 'kind': 'milestone', 'anchor': 'end'},
                {'at': '2027-09-01', 'label': 'Engenharia', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2029-01-15', 'label': 'Trader de granel', 'kind': 'milestone', 'anchor': 'start'}]},
            {'label': 'Marcos', 'items': [
                {'at': '2027-01-11', 'label': '90 dias', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-10-13', 'label': '12 meses', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2029-10-13', 'label': '36 meses', 'kind': 'milestone', 'anchor': 'end'}]},
        ],
    })

# ---------------------------------------------------------------- diagramas SVG (cap. 7, 10, 11, 15)


def _box(x, y, w, h, lines, fill='#FFFFFF', stroke='#AEB49F', sw=0.8, dash=False, bold_first=True, size=9.2, rx=3, tcol='#1A1E16', anchor='middle', n_head=1):
    """Caixa com texto: as primeiras n_head linhas formam o título (um só estilo); as restantes, critério ou consequência, em tom atenuado."""
    da = ' stroke-dasharray="4 3"' if dash else ''
    s = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>'
    n = len(lines)
    lh = size * 1.25
    y0 = y + h / 2 - (n - 1) * lh / 2 + size * 0.35
    tx = x + w / 2 if anchor == 'middle' else x + 6
    for i, ln in enumerate(lines):
        head = i < n_head
        s += _txt(tx, y0 + i * lh, ln, size if head else size - 0.8, anchor=anchor, weight=600 if (head and bold_first) else 400,
                  fill=tcol if head else '#5B6352')
    return s


@gen('svg_arvore')
def _():
    W, H = 680, 300
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Árvore de decisão: qualificação jurídica do produto e estrutura permitida, com os testes adicionais ao ramo C" style="width:100%;height:auto">',
         _arrow_defs({'ak': '#5B6352'})]
    QX, QW = 0, 172          # coluna das perguntas
    OX, OW = 252, 196        # coluna dos resultados
    RX, RW = 486, 194        # testes adicionais ao ramo C
    INK2 = '#5B6352'

    def hline(x1, y, x2, lab):
        o.append(f'<path d="M{x1},{y} H{x2 - 2}" fill="none" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
        if lab:
            o.append(_txt(x1 + 8, y - 4, lab, 8.2, anchor='start', fill=INK2))

    def vline(x, y1, y2, lab):
        o.append(f'<path d="M{x},{y1} V{y2 - 2}" fill="none" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
        o.append(_txt(x + 5, (y1 + y2) / 2 + 3, lab, 8.2, anchor='start', fill=INK2))

    def qbox(y, lines):
        o.append(_box(QX, y, QW, 46, lines, fill='#F4F5EF', size=9, n_head=len(lines)))
    qbox(6, ['P1. O pagador compra mercadoria', 'para usar ou revender, com', 'entrega física?'])
    o.append(_box(OX, 9, OW, 40, ['A. Marketplace B2B (comércio)', 'sem licença financeira'], fill='#E1E8CF', stroke='#3F5A1E'))
    hline(QW, 29, OX, 'sim')
    vline(60, 52, 84, 'não: quer retorno')
    qbox(84, ['P2. Há retorno prometido e', 'capital reembolsável', '(incluindo «refunding»)?'])
    o.append(_box(OX, 87, OW, 40, ['G. Proibido', 'fora de obrigações, ECSP ou FIA', '(RGICSF arts. 8.º, 9.º e 200.º)'], fill='#FFFFFF', stroke='#B42318', sw=1))
    hline(QW, 107, OX, 'sim, sem veículo')
    vline(60, 130, 162, 'sim, via obrigações da SA')
    qbox(162, ['P3. Via obrigações (dívida):', 'quem subscreve?'])
    ys = [(170, 'profissionais'), (226, 'retalho ≤ 5 M€'), (272, 'retalho > 5 M€')]
    bx = QW + 12
    o.append(f'<path d="M{QW},185 H{bx}" fill="none" stroke="{INK2}" stroke-width="1"/>')
    o.append(f'<path d="M{bx},{ys[0][0]} V{ys[-1][0]}" fill="none" stroke="{INK2}" stroke-width="1"/>')
    for y, lab in ys:
        hline(bx, y, OX, lab)
    o.append(_box(OX, 148, OW, 46, ['C. SPV PT, obrigações: fase 1', 'só profissionais, sem revenda a', 'não profissionais (CSC art. 349.º [L])'],
                  fill='#E1E8CF', stroke='#3F5A1E', sw=1.2))
    o.append(_box(OX, 209, OW, 34, ['D. Promotor numa ECSP de terceiros', 'retalho, ≤ 5 M€/12 meses: fase 3'], fill='#FFFFFF'))
    o.append(_box(OX, 255, OW, 34, ['Oferta pública + intermediário', 'prospeto > 12 M€; KID: fora do horizonte'], fill='#FFFFFF'))
    # painel dos testes adicionais, ligado ao ramo C
    o.append(f'<rect x="{RX}" y="6" width="{RW}" height="283" rx="3" fill="#F4F5EF" stroke="#D7DBCC" stroke-width="0.8"/>')
    o.append(_txt(RX + 8, 22, 'Testes adicionais ao ramo C', 9.2, anchor='start', weight=650))
    o.append(_txt(RX + 8, 34, 'a passar no parecer, antes da 1.ª série', 8, anchor='start', fill=INK2))
    tests = [
        (['P4. O retorno vem de um conjunto', 'de lotes gerido com política', 'discricionária?'], '→ FIA + gestor: não'),
        (['P5. O investidor recebe só a', 'diferença de preço em dinheiro?'], '→ derivado, MiFID C(5): não'),
        (['P6. Lotes em token ou veículo', 'fora da UE?'], '→ MiCA/MiFID na mesma: não'),
        (['Emissão nos termos e limites do', 'CSC (arts. 348.º/2 e 349.º [L])', '= exceção do RGICSF art. 9.º'], ''),
        (['As obrigações são PRIIP (KID)?', 'Quem comercializa (MiFID)?', 'Há tranching (Reg. 2017/2402)?'], ''),
    ]
    y = 46
    for lines, res in tests:
        for i, ln in enumerate(lines):
            o.append(_txt(RX + 8, y + 10 + i * 11, ln, 8.6, anchor='start', weight=600 if res else 400))
        yy = y + 10 + len(lines) * 11
        if res:
            o.append(_txt(RX + 8, yy, res, 8.2, anchor='start', fill=INK2))
            yy += 11
        o.append(f'<line x1="{RX + 8}" x2="{RX + RW - 8}" y1="{yy - 4}" y2="{yy - 4}" stroke="#D7DBCC" stroke-width="0.6"/>')
        y = yy
    o.append(f'<path d="M{OX + OW},171 H{RX - 2}" fill="none" stroke="{INK2}" stroke-width="1" stroke-dasharray="3 2" marker-end="url(#ak)"/>')
    o.append(_txt(OX + OW + 4, 166, 'testes', 8, anchor='start', fill=INK2))
    o.append('</svg>')
    return ''.join(o)


@gen('svg_arquitetura')
def _():
    W, H = 680, 290
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Arquitetura de referência do piloto: canais, serviços núcleo com o ledger ao centro, e integrações externas; backoffice atual em quarentena" style="width:100%;height:auto">',
         _arrow_defs({'ak': '#5B6352'})]
    INK2 = '#5B6352'
    chans = [['Área de investidor', 'reporte da série; depois do gate'], ['Portal do comprador', 'catálogo, encomendas'], ['Portal do produtor', 'stock, lotes, análises'], ['Bastidores', 'operação, tesouraria, compliance']]
    cw = (W - 3 * 10) / 4
    for i, c in enumerate(chans):
        o.append(_box(i * (cw + 10), 0, cw, 32, c, dash=(i == 0)))
        x = i * (cw + 10) + cw / 2
        o.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="32" y2="44" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
    o.append(f'<rect x="0" y="46" width="{W}" height="136" rx="4" fill="#F4F5EF" stroke="#D7DBCC" stroke-width="0.8"/>')
    o.append(_txt(8, 59, 'Serviços núcleo (região UE)', 9.2, anchor='start', weight=650))
    core = [['Identidade', 'SSO, MFA, RBAC'], ['Contrapartes e KYC', 'orquestração e casos'], ['Catálogo e lotes', 'em € e kg'], ['Encomendas', 'contratos, offtake'],
            ['Telemetria', 'MQTT/HTTP → séries'], ['Documentos', 'assinatura CMD/CC, QES']]
    bw = (W - 16 - 5 * 8) / 6
    for i, c in enumerate(core):
        o.append(_box(8 + i * (bw + 8), 65, bw, 32, c, size=8.8))
    o.append(_box(8, 105, 250, 32, ['Ledger de dupla entrada (€ + kg)', 'imutável; conta-espelho por banco, lote e série'], fill='#E1E8CF', stroke='#3F5A1E', sw=1.3))
    o.append(_box(270, 105, 190, 32, ['Reconciliação D+1', 'camt.053 → correspondência → divergências'], fill='#FFFFFF'))
    o.append(_box(472, 105, 200, 32, ['Risco', 'preço contra contrato, gatilhos, resultado por lote'], fill='#FFFFFF'))
    o.append(f'<line x1="258" x2="268" y1="121" y2="121" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
    o.append(f'<line x1="460" x2="470" y1="121" y2="121" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
    o.append(_box(8, 145, W - 16, 28, ['Registo de auditoria só de acréscimo, encadeado por hash → armazenamento WORM; quatro olhos em IBAN, pagamentos > 25 k€ e libertação de lotes'], fill='#FFFFFF', size=8.8))
    ext = [['Bancos PT', 'OpCo + SPV (1 conta/série)', 'SCT Inst, VoP, SDD B2B'], ['KYC/KYB + screening', 'Sumsub ou Veriff', '+ ComplyAdvantage'],
           ['Faturação certificada AT', 'API; ATCUD, QR', 'selo qualificado 2027'], ['ERP do lagar + sensores', 'CSV → API →', 'radar a cada 15 min'], ['PSP marketplace', 'só fase 2, se houver', 'fundos de terceiros']]
    ew = (W - 4 * 8) / 5
    labs = ['camt.053, pain.001/008', 'decisões e evidência', 'rascunho → fatura', 'eventos de stock', 'webhooks']
    for i, e in enumerate(ext):
        x = i * (ew + 8)
        o.append(_box(x, 210, ew, 44, e, size=8.8, dash=(i == 4)))
        cxm = x + ew / 2
        o.append(f'<line x1="{cxm:.1f}" x2="{cxm:.1f}" y1="208" y2="184" stroke="{INK2}" stroke-width="1" marker-end="url(#ak)"/>')
        o.append(_txt(cxm + 4, 199, labs[i], 7.8, anchor='start', fill=INK2))
    o.append(_box(0, 262, 300, 28, ['Backoffice atual (obtido por engenharia inversa): quarentena', 'sem ligação até à auditoria; sem dinheiro real nem dados de investidores'], fill='#FFFFFF', stroke='#B42318', dash=True, size=8.6, anchor='start'))
    o.append(_txt(312, 280, '× nenhuma integração com o ledger, pagamentos ou KYC antes do gate de auditoria', 8.4, anchor='start', fill='#B42318', weight=600))
    o.append('</svg>')
    return ''.join(o)


ROT = "font-family:'Public Sans','Sprout Symbols',sans-serif"


@gen('svg_posicionamento')
def _():
    W, H = 680, 300
    L, T, Rr, Bm = 36, 10, 674, 272

    def X(v):
        return L + v * (Rr - L)

    def Y(v):
        return Bm - v * (Bm - T)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Mapa de posicionamento: cliente comercial a investidor no eixo horizontal, integração física no vertical" style="width:100%;height:auto">']
    o.append(f'<rect x="{X(0.55):.1f}" y="{Y(1):.1f}" width="{X(1) - X(0.55):.1f}" height="{Y(0.52) - Y(1):.1f}" fill="#F7E4E1"/>')
    o.append(_txt(X(0.57), Y(0.56), 'Zona de perigo: retorno em € + operador que gere o ativo', 8.4, anchor='start', fill='#8F1C13', weight=600))
    o.append(_txt(X(0.57), Y(0.56) + 11, '(Asset Land, Capital Alternatives, Park First, whisky, Afinsa)', 8, anchor='start', fill='#8F1C13'))
    o.append(f'<line x1="{L}" x2="{Rr}" y1="{Y(0.5):.1f}" y2="{Y(0.5):.1f}" stroke="#AEB49F" stroke-width="1"/>')
    o.append(f'<line x1="{X(0.5):.1f}" x2="{X(0.5):.1f}" y1="{T}" y2="{Bm}" stroke="#AEB49F" stroke-width="1"/>')
    o.append(_txt(L, Bm + 16, '← comprador comercial (consome o bem)', 8.6, anchor='start', fill='#5B6352'))
    o.append(_txt(Rr, Bm + 16, 'investidor (quer retorno em €) →', 8.6, anchor='end', fill='#5B6352'))
    o.append(f'<text transform="translate(12,{(T + Bm) / 2:.1f}) rotate(-90)" text-anchor="middle" fill="#5B6352" style="{ROT};font-size:8.6px">integração física: software/dados → posse/custódia</text>')
    pts = [
        (0.06, 0.93, 'Sovena · Deoleo · Gallo'), (0.30, 0.93, 'Recheio · Makro'), (0.06, 0.83, 'Dcoop'), (0.30, 0.83, 'Frubana'),
        (0.06, 0.74, 'Marcas premium PT, cooperativas DOP'),
        (0.06, 0.52, 'Tridge'), (0.22, 0.52, 'Algrano'), (0.36, 0.47, 'Liv-ex'),
        (0.06, 0.28, 'Corretores de azeite'), (0.38, 0.32, 'CrowdFarming'), (0.06, 0.16, 'Choco'), (0.22, 0.16, 'Covantis'), (0.06, 0.06, 'Poolred · Mintec'),
        (0.60, 0.93, 'Cult Wines'), (0.80, 0.93, 'Masterworks · Vint'), (0.70, 0.84, 'AcreTrader · FarmTogether'),
        (0.70, 0.28, 'Raize (ECSP) · GoParity, Miimosa (NV)'), (0.60, 0.16, 'Incomlend'), (0.84, 0.10, 'Greensill · Stenn (falidas)'),
    ]
    for x, y, lab in pts:
        o.append(f'<circle cx="{X(x):.1f}" cy="{Y(y):.1f}" r="3.2" fill="#7D846F" stroke="#FFFFFF" stroke-width="1.5"/>')
        o.append(_txt(X(x) + 6, Y(y) + 3.2, lab, 8.6, anchor='start', halo=True))

    def diamond(x, y, lab, sub):
        cx_, cy_ = X(x), Y(y)
        s = 6
        o.append(f'<path d="M{cx_:.1f},{cy_ - s:.1f} L{cx_ + s:.1f},{cy_:.1f} L{cx_:.1f},{cy_ + s:.1f} L{cx_ - s:.1f},{cy_:.1f} Z" fill="#3F5A1E" stroke="#FFFFFF" stroke-width="1.5"/>')
        o.append(_txt(cx_ + 10, cy_ - 1, lab, 9.4, anchor='start', weight=650, halo=True))
        o.append(_txt(cx_ + 10, cy_ + 10, sub, 8.2, anchor='start', fill='#5B6352', halo=True))
    diamond(0.24, 0.635, 'Sprout: lotes B2B', 'SPV vende, OpCo opera; origem; back-to-back')
    diamond(0.60, 0.42, 'Sprout Capital, SA: obrigações', 'só profissionais; credor colateralizado')
    o.append(_txt(X(0.80), Y(0.70), '× tese original', 9.2, anchor='start', fill='#8F1C13', weight=650))
    o.append(_txt(X(0.80), Y(0.70) + 11, 'retalho, 10–15 %, refunding', 8.2, anchor='start', fill='#8F1C13'))
    o.append('</svg>')
    return ''.join(o)


RISKS = [
    # id, título curto, P, I
    (1, 'Referência de origem < 6,00 €/kg documentada', 4, 4),
    (2, 'Emissão fora dos termos do CSC, sem KID ou sem licença MiFID', 2, 5),
    (3, 'Promoção a retalho ou gamificação de retornos', 2, 5),
    (4, 'Índice −30 % com stock em aberto', 3, 4),
    (5, 'Incumprimento de compradores', 3, 3),
    (6, 'Concentração e conflito no Lagar do Val', 3, 4),
    (7, 'Falha de custódia ou stock fictício', 2, 5),
    (8, 'Desclassificação do lote (AOVE → virgem)', 3, 2),
    (9, 'Backoffice obtido por engenharia inversa', 4, 4),
    (10, 'Banco recusa conta da SPV / PSP congela fundos', 2, 4),
    (11, 'Retaliação de embaladores e cash & carry', 3, 3),
    (12, 'Seed não levantada após o gate', 4, 5),
    (13, 'Responsável de Risco por contratar', 3, 4),
    (14, 'Insolvência da OpCo, servicer da SPV', 3, 4),
]


@gen('svg_matriz_risco')
def _():
    W, H = 330, 300
    L, T, cs = 40, 8, 54
    ramp = ['#F4F5EF', '#E9EDDC', '#D8E0C1', '#C4D0A1', '#AFC07F']
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Matriz probabilidade por impacto com 14 riscos numerados" style="width:100%;height:auto">']
    for p in range(1, 6):
        for i in range(1, 6):
            score = p * i
            lvl = 0 if score <= 4 else 1 if score <= 8 else 2 if score <= 12 else 3 if score <= 16 else 4
            x = L + (p - 1) * cs
            y = T + (5 - i) * cs
            o.append(f'<rect x="{x}" y="{y}" width="{cs - 2}" height="{cs - 2}" fill="{ramp[lvl]}"/>')
    cells = {}
    for rid, _, p, i in RISKS:
        cells.setdefault((p, i), []).append(rid)
    for (p, i), ids in cells.items():
        x0 = L + (p - 1) * cs
        y0 = T + (5 - i) * cs
        n = len(ids)
        for j, rid in enumerate(ids):
            col, row = j % 2, j // 2
            cx_ = x0 + (cs - 2) / 2 + (col - 0.5) * 20 if n > 1 else x0 + (cs - 2) / 2
            rows = (n + 1) // 2
            cy_ = y0 + (cs - 2) / 2 + (row - (rows - 1) / 2) * 18
            if n % 2 == 1 and j == n - 1 and n > 1:
                cx_ = x0 + (cs - 2) / 2
            o.append(f'<circle cx="{cx_:.1f}" cy="{cy_:.1f}" r="8" fill="#1A1E16"/>')
            o.append(_txt(cx_, cy_ + 3.2, str(rid), 8.6, weight=600, fill='#FFFFFF', mono=True))
    for n_ in range(1, 6):
        o.append(_txt(L + (n_ - 1) * cs + (cs - 2) / 2, T + 5 * cs + 12, str(n_), 8.6, fill='#5B6352', mono=True))
        o.append(_txt(L - 8, T + (5 - n_) * cs + (cs - 2) / 2 + 3, str(n_), 8.6, anchor='end', fill='#5B6352', mono=True))
    o.append(_txt(L + 2.5 * cs, T + 5 * cs + 26, 'Probabilidade →', 8.8, fill='#5B6352'))
    o.append(f'<text transform="translate(10,{T + 2.5 * cs:.1f}) rotate(-90)" text-anchor="middle" fill="#5B6352" style="{ROT};font-size:8.8px">Impacto →</text>')
    o.append('</svg>')
    return ''.join(o)

# ---------------------------------------------------------------- fontes (anexo), lidas da base factual


def _wbr_url(shown):
    """Quebra preferencial depois de «/», «-» e «_», sem partir palavras ao acaso."""
    return re.sub(r'([/_\-])', r'\1<wbr>', esc(shown))


@gen('lista_fontes')
def _():
    txt = (BP.parent / 'research' / '00-base-factual.md').read_text()
    sec = txt.split('## Fontes (acesso a 13-10-2026)')[1].split('\n---')[0]
    groups = []
    for ln in sec.splitlines():
        m = re.match(r'\*\*(.+?)\*\*', ln.strip())
        if m:
            groups.append((m.group(1), []))
            continue
        m = re.match(r'- (\S+)(.*)', ln.strip())
        if m and groups:
            url, rest = m.group(1), m.group(2).strip()
            tag = ''
            if '[C]' in rest:
                tag = ' <span class="tag-ev">[C]</span>'
            elif 'lido diretamente' in rest:
                tag = ' <span class="tag-ev">lido diretamente</span>'
            shown = re.sub(r'^https?://(www\.)?', '', url)
            lines = -(-len(shown + (' [C]' if tag else '')) // 74)
            groups[-1][1].append((f'<li><a href="{esc(url)}">{_wbr_url(shown)}</a>{tag}</li>', lines))
    out = []
    for name, items in groups:
        total = sum(n for _, n in items)
        acc, cut = 0, len(items)
        for i, (_, n) in enumerate(items):
            if acc + n / 2 >= total / 2:
                cut = i
                break
            acc += n
        left, right = items[:cut], items[cut:]
        out.append(f'<h4>{esc(name)}</h4><div class="src-cols"><ul class="src">' + ''.join(h for h, _ in left) + '</ul><ul class="src">' + ''.join(h for h, _ in right) + '</ul></div>')
    return ''.join(out)


@gen('n_fontes')
def _():
    txt = (BP.parent / 'research' / '00-base-factual.md').read_text()
    sec = txt.split('## Fontes (acesso a 13-10-2026)')[1].split('\n---')[0]
    return str(len(re.findall(r'^- https?://', sec, flags=re.M)))

# ---------------------------------------------------------------- índice


CHAPTERS = [
    ('1', 'Sumário executivo'), ('2', 'O problema e a oportunidade'), ('3', 'A solução: Sprout'), ('4', 'Produto'),
    ('5', 'Mercado'), ('6', 'Modelo de negócio e unit economics'), ('7', 'Estrutura jurídica, regulatória e fiscal'), ('8', 'Gestão de risco'),
    ('9', 'Go-to-market'), ('10', 'Operações e tecnologia'), ('11', 'Concorrência e posicionamento'), ('12', 'Equipa e governação'),
    ('13', 'Plano financeiro'), ('14', 'KPIs e marcos'), ('15', 'Riscos principais e mitigação'), ('16', 'Alertas do conselheiro'),
    ('A', 'Anexo A · Plano de ação'), ('B', 'Anexo B · Glossário'), ('C', 'Anexo C · Fontes'),
]


@gen('toc')
def _():
    pages = {}
    f = HERE / 'toc-pages.json'
    if f.exists():
        pages = json.loads(f.read_text())
    out = ['<ol class="toc">']
    for n, t in CHAPTERS:
        title = t.split(' · ', 1)[1] if t.startswith('Anexo') else t
        out.append(f'<li><span class="toc-n">{n}</span><span class="toc-t">{esc(title)}</span><span class="toc-p">{pages.get(t, "—")}</span></li>')
    out.append('</ol>')
    return ''.join(out)

# ---------------------------------------------------------------- montagem


def expand(body, gens=None, ns=None):
    """Substitui {{nome}} pelos geradores e {{= expr }} pela expressão avaliada sobre resultados.json."""
    gens = GEN if gens is None else gens
    ns = NS if ns is None else ns
    missing = set()

    def sub(m):
        key = m.group(1).strip()
        if key not in gens:
            missing.add(key)
            return m.group(0)
        return gens[key]()
    body = re.sub(r'\{\{([a-z0-9_]+)\}\}', sub, body)

    def ev(m):
        return str(eval(m.group(1), {'__builtins__': {}}, ns))
    body = re.sub(r'\{\{=(.+?)\}\}', ev, body, flags=re.S)
    if missing:
        raise SystemExit(f'marcadores sem gerador: {sorted(missing)}')
    left = re.findall(r'\{\{.*?\}\}', body)
    if left:
        raise SystemExit(f'marcadores por expandir: {left[:5]}')
    return body


def main():
    parts = sorted((HERE / 'parts').glob('*.html'))
    body = expand('\n'.join(p.read_text() for p in parts))
    (BP / 'business-plan.html').write_text(body)
    print(f'business-plan.html: {len(body):,} bytes; {len(parts)} partes')


if __name__ == '__main__':
    main()
