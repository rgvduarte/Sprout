#!/usr/bin/env python3
"""build.py — monta docs/business-plan/business-plan.html a partir das partes em src/parts/.

Os números financeiros das tabelas e dos gráficos saem só de modelo/resultados.json
(gerado por build_model.py a partir do livro recalculado). As partes HTML usam marcadores
{{nome}} que este script substitui por tabelas, especificações de gráficos (svg-charts.mjs)
e diagramas SVG desenhados aqui. O índice lê os números de página de src/toc-pages.json,
escrito por toc.py depois da primeira renderização (lê o outline do PDF).

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
B, RC, PE, OT = C['base'], C['recomendado'], C['pessimista'], C['otimista']
UE = R['unit_economics']
SE = R['sensibilidade']
YEARS = R['meta']['anos']
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
        ('Otimista', OT, 'tese da fonte, referência 6,00'),
        ('Recomendado', RC, 'desenho reestruturado'),
    ]
    out = ['<table class="compact t-scen"><thead><tr><th>Cenário</th><th class="num">GMV 2031<span class="sub">M€</span></th>'
           '<th class="num">Margem de contrib. 2031<span class="sub">k€</span></th><th class="num">EBITDA 2027<span class="sub">k€</span></th>'
           '<th class="num">EBITDA 2031<span class="sub">k€</span></th><th class="num">Capital próprio necessário<span class="sub">M€, até 2031</span></th></tr></thead><tbody>']
    for name, s, sub in rows:
        cls = ' class="em"' if name == 'Recomendado' else ''
        out.append(f'<tr{cls}><td>{name}<span class="sub">{sub}</span></td><td class="num">{M(s["gmv_total"][4])}</td>'
                   f'<td class="num">{k(s["margem_contribuicao"]["total"][4])}</td><td class="num">{k(s["ebitda"][0])}</td>'
                   f'<td class="num">{k(s["ebitda"][4])}</td><td class="num">{M(s["necessidade_capital_proprio"])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- capítulo 2


@gen('fig_cadeia_observatorio')
def _():
    return chart('stackedBar', {
        'ariaLabel': 'Decomposição do preço de venda ao público sem IVA de 3,544 €/kg de AOVE em Espanha, campanha 2019/20',
        'thickness': 26, 'rowGap': 46, 'labelWidth': 0, 'format': {'dec': 3},
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


@gen('fig_preco_aove')
def _():
    return chart('lineChart', {
        'ariaLabel': 'Preço do azeite virgem extra na origem de abril de 2022 a 13 de outubro de 2026',
        'heightMm': 46,
        'x': {'type': 'time', 'min': '2022-01-01', 'max': '2026-12-31', 'ticks': ['2022-01-01', '2023-01-01', '2024-01-01', '2025-01-01', '2026-01-01'], 'format': {'yearOnly': True}},
        'y': {'min': 0, 'max': 10, 'ticks': [0, 2, 4, 6, 8, 10], 'format': {'dec': 0}, 'unit': '€/kg'},
        'bands': [{'y0': 2.81, 'y1': 4.61, 'label': 'custo de produção ES: 2,81–4,61', 'labelAt': '2022-02-01', 'labelPos': 'bottom'}],
        'series': [{'name': 'AOVE na origem', 'color': 'series.azeite', 'markers': False, 'format': {'dec': 2, 'suffix': ' €/kg'},
                    'points': [
                        ['2022-04-07', 3.45, {'label': '3,45', 'anchor': 'start', 'dx': 6, 'dy': 11, 'marker': True}],
                        ['2023-04-07', 5.23],
                        ['2023-12-26', 8.857],
                        ['2024-01-24', 8.988, {'label': '8,99 · jan. 2024', 'anchor': 'middle', 'dy': -8, 'marker': True}],
                        ['2024-06-15', 7.85], ['2024-12-15', 5.30], ['2025-02-15', 4.075], ['2025-04-07', 3.90],
                        ['2025-11-05', 4.62], ['2026-03-20', 4.385], ['2026-06-18', 3.785], ['2026-08-31', 3.58],
                        ['2026-09-22', 3.39], ['2026-10-02', 3.34],
                        ['2026-10-13', 3.10, {'label': '3,10\n13/10', 'anchor': 'start', 'dx': 8, 'dy': 3, 'marker': True}],
                    ]}],
    })

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
    cols = ['Investidores\nprofissionais', 'SPV\nSprout Capital, SA', 'OpCo\nSprout Marketplace', 'Lagar\nprodutor',
            'Tanque selado\n+ collateral manager', 'Armazém 3PL\ncom custódia', 'Comprador B2B\nHoReCa, distrib.']
    cw = (W - left) / len(cols)
    cx = [left + cw * (i + 0.5) for i in range(len(cols))]
    rows = [('Mercadoria', 46, 112, '#8C8A16', 'g'), ('Dinheiro', 112, 234, '#3F5A1E', 'm'), ('Título e\ngarantias', 234, 342, '#1A1E16', 't')]
    H = 346
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Fluxos de mercadoria, dinheiro e título entre investidores, SPV, OpCo, lagar, tanque, 3PL e comprador" style="width:100%;height:auto">']
    o.append(_arrow_defs({'ag': '#8C8A16', 'am': '#3F5A1E', 'at': '#1A1E16'}))
    for i, c in enumerate(cols):
        l1, l2 = c.split('\n')
        o.append(_txt(cx[i], 14, l1, 9.6, weight=600))
        o.append(_txt(cx[i], 26, l2, 8.2, fill='#5B6352'))
        o.append(f'<line x1="{cx[i]:.1f}" x2="{cx[i]:.1f}" y1="38" y2="{H - 4}" stroke="#E6E9DD" stroke-width="1"/>')
    o.append(f'<line x1="0" x2="{W}" y1="{rows[0][1]}" y2="{rows[0][1]}" stroke="#1A1E16" stroke-width="0.9"/>')
    for name, y0, y1, col, key in rows:
        o.append(f'<line x1="0" x2="{W}" y1="{y1}" y2="{y1}" stroke="#D7DBCC" stroke-width="0.8"/>')
        for j, ln in enumerate(name.split('\n')):
            o.append(_txt(0, y0 + 18 + j * 12, ln, 9.8, anchor='start', weight=650, fill=col if key != 't' else '#1A1E16'))

    def arr(a, b, y, label, key, col, lab_at=0.5):
        x1, x2 = cx[a], cx[b]
        d = 1 if x2 > x1 else -1
        xs, xe = x1 + 5 * d, x2 - 5 * d
        o.append(f'<circle cx="{x1:.1f}" cy="{y}" r="3" fill="{col}"/>')
        o.append(f'<line x1="{xs:.1f}" x2="{xe:.1f}" y1="{y}" y2="{y}" stroke="{col}" stroke-width="1.6" marker-end="url(#a{key})"/>')
        o.append(_txt(x1 + (x2 - x1) * lab_at, y - 5, label, 8.6, halo=True))
    arr(3, 4, 68, 'granel AOVE', 'g', '#8C8A16')
    arr(4, 5, 68, 'tranches embaladas', 'g', '#8C8A16')
    arr(5, 6, 68, 'entregas HoReCa', 'g', '#8C8A16')
    arr(4, 6, 96, 'paletes de 5 L com offtake (distribuidores)', 'g', '#8C8A16')
    arr(0, 1, 132, 'subscrição (SCT)', 'm', '#3F5A1E')
    arr(1, 3, 132, 'preço do lote ≤ 30 dias (SCT Inst)', 'm', '#3F5A1E')
    arr(1, 0, 156, 'cupão + cash sweep', 'm', '#3F5A1E')
    arr(1, 2, 156, 'margem do lote', 'm', '#3F5A1E')
    arr(6, 1, 182, 'cobrança SDD B2B ≤ 35–45 dias → conta de cobranças da série', 'm', '#3F5A1E')
    rx = cx[1]
    o.append(f'<line x1="{rx:.1f}" x2="{rx:.1f}" y1="186" y2="199" stroke="#3F5A1E" stroke-width="1.6" marker-end="url(#am)"/>')
    o.append(f'<rect x="{rx - 52:.1f}" y="202" width="104" height="24" rx="3" fill="#F4F5EF" stroke="#AEB49F" stroke-width="0.8"/>')
    o.append(_txt(rx, 212, 'reserva de 1.ª perda', 8.6, weight=600))
    o.append(_txt(rx, 222.5, '30 % da margem, até 5 %', 8, fill='#5B6352'))
    arr(3, 1, 254, 'propriedade do lote individualizado', 't', '#1A1E16')
    arr(1, 0, 254, 'garantias (repr. comum)', 't', '#1A1E16')
    arr(1, 2, 278, 'transfere na venda', 't', '#1A1E16')
    arr(2, 6, 278, 'venda com reserva de propriedade até pagamento', 't', '#1A1E16', lab_at=0.55)
    arr(2, 1, 302, 'cessão de recebíveis', 't', '#1A1E16')
    arr(1, 4, 328, 'depósito tripartido: guarda por conta da SPV; liberta só com ordem escrita', 't', '#1A1E16')
    o.append('</svg>')
    return ''.join(o)

# ---------------------------------------------------------------- capítulo 6: lotes


LINE_LABELS = [
    ('ref', 'Valor à referência'), ('desc', 'Desconto ao comprador'), ('price', 'Receita (preço Sprout)'),
    ('gr', 'Granel ao lagar (índice + prémio)'), ('emb', 'Embalamento'), ('log', 'Logística'), ('3pl', 'Armazém 3PL e picking'),
    ('arm', 'Armazenagem'), ('seg', 'Seguro do stock'), ('anal', 'Análises'), ('perdas', 'Perdas físicas'),
    ('descl', 'Desclassificação esperada'), ('cust', 'Custódia (collateral manager)'), ('pag', 'Pagamentos bancários'),
    ('prov', 'Provisão de crédito'), ('cupao', 'Cupão das obrigações'), ('margem', 'Margem de contribuição'),
]


@gen('tbl_lote_horeca')
def _():
    b, r = UE['horeca_gourmet_20t']['base'], UE['horeca_gourmet_20t']['recomendado']
    out = ['<table class="compact t-lote"><thead><tr><th>Lote HoReCa/gourmet de 20 t, regime de 2029</th>'
           '<th class="num">Base<span class="sub">€/kg</span></th><th class="num">Base<span class="sub">€ por lote</span></th>'
           '<th class="num">Recomendado<span class="sub">€/kg</span></th><th class="num">Recomendado<span class="sub">€ por lote</span></th></tr></thead><tbody>']
    for key, lab in LINE_LABELS:
        bk, bl, rk, rl = b['eur_kg'][key], b['eur_lote'][key], r['eur_kg'][key], r['eur_lote'][key]
        cls = 'total' if key == 'margem' else ('sep' if key in ('price', 'gr') else '')
        dec = 3
        out.append(f'<tr class="{cls}"><td>{lab}</td><td class="num">{nf(bk, dec)}</td><td class="num">{nf(bl)}</td>'
                   f'<td class="num">{nf(rk, dec)}</td><td class="num">{nf(rl)}</td></tr>')
    out.append(f'<tr class="memo"><td>Margem em % da receita</td><td class="num">{pct(b["margem_pct"])}</td><td></td>'
               f'<td class="num">{pct(r["margem_pct"])}</td><td></td></tr>')
    out.append(f'<tr class="memo"><td>Obrigações afetas ao lote · cupão do ciclo ({b["ciclo"]} dias)</td><td></td><td class="num">{nf(b["notes"])} · {nf(b["cupciclo"])}</td>'
               f'<td></td><td class="num">{nf(r["notes"])} · {nf(r["cupciclo"])}</td></tr>')
    out.append(f'<tr class="memo"><td>Retido na reserva de 1.ª perda · margem livre para a OpCo</td><td></td><td class="num">{nf(b["res"])} · {nf(b["livre"])}</td>'
               f'<td></td><td class="num">{nf(r["res"])} · {nf(r["livre"])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('fig_lote_valuechain')
def _():
    b = UE['horeca_gourmet_20t']['base']['eur_kg']
    pi = UE['bolo_intermediacao_horeca']['base']
    return chart('valueChain', {
        'ariaLabel': 'Decomposição do preço de referência de 5,65 €/kg e do bolo de intermediação de 1,22 €/kg no lote HoReCa base',
        'format': {'dec': 2}, 'thickness': 24, 'linkHeight': 22,
        'top': {'label': 'Referência HoReCa', 'sub': '5,65 €/kg [E]', 'segments': [
            {'label': 'Granel ao lagar', 'value': 3.60, 'color': 'neutral.1'},
            {'label': 'Embalamento', 'value': 0.55, 'color': 'neutral.2'},
            {'label': 'Logística', 'value': 0.28, 'color': 'neutral.2'},
            {'label': 'Bolo de intermediação', 'value': 1.22, 'color': 'accentSoft', 'zoom': True}]},
        'bottom': {'label': 'Bolo de intermediação', 'sub': '1,22 €/kg', 'segments': [
            {'label': 'Desconto ao comprador', 'valueLabel': f'0,57 · {pct(pi["pi_desc"], 0)}', 'value': 0.565, 'color': 'neutral.2'},
            {'label': 'Custos diretos', 'valueLabel': f'0,26 · {pct(pi["pi_cd"], 0)}', 'value': 0.26, 'color': 'neutral.3'},
            {'label': 'Cupão', 'valueLabel': f'0,05 · {pct(pi["pi_cup"], 0)}', 'value': 0.048, 'color': 'neutral.1'},
            {'label': 'Margem Sprout', 'valueLabel': f'0,35 · {pct(pi["pi_sp"], 0)}', 'value': round(b['margem'], 3), 'color': 'accent'}]},
    })


@gen('tbl_lotes_canais')
def _():
    d = UE['distribuidores_exportacao_30t']
    g = UE['granel_certificado_100t']
    h = UE['horeca_gourmet_20t']
    rows = [
        ('Preço de venda', 'price'), ('Granel ao lagar', 'gr'), ('Embalamento + logística + 3PL', None),
        ('Armazenagem, seguro, análises, perdas, desclassificação', 'qual'), ('Custódia + pagamentos + provisão de crédito', 'ops'),
        ('Cupão das obrigações', 'cupao'), ('Margem de contribuição', 'margem')]

    def val(x, key):
        e = x['eur_kg']
        if key is None:
            return e['emb'] + e['log'] + e['3pl']
        if key == 'qual':
            return e['arm'] + e['seg'] + e['anal'] + e['perdas'] + e['descl']
        if key == 'ops':
            return e['cust'] + e['pag'] + e['prov']
        return e[key]
    cols = [('HoReCa 20 t', h['base']), ('HoReCa 20 t', h['recomendado']), ('Distrib. 30 t', d['base']), ('Distrib. 30 t', d['recomendado']), ('Granel cert. 100 t', g['recomendado'])]
    out = ['<table class="compact t-canais"><thead><tr><th>€/kg, regime de 2029</th>']
    for (lab, _), scen in zip(cols, ['base', 'recom.', 'base', 'recom.', 'recom.']):
        out.append(f'<th class="num">{lab}<span class="sub">{scen}</span></th>')
    out.append('</tr></thead><tbody>')
    for lab, key in rows:
        cls = 'total' if key == 'margem' else ''
        out.append(f'<tr class="{cls}"><td>{lab}</td>' + ''.join(f'<td class="num">{nf(val(x, key), 3)}</td>' for _, x in cols) + '</tr>')
    out.append('<tr class="memo"><td>Margem em % do preço</td>' + ''.join(f'<td class="num">{pct(x["margem_pct"])}</td>' for _, x in cols) + '</tr>')
    out.append('<tr class="memo"><td>Margem por lote, €</td>' + ''.join(f'<td class="num">{nf(x["eur_lote"]["margem"])}</td>' for _, x in cols) + '</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_tese_literal')
def _():
    t = SE['tese_literal_horeca_base_2029']
    out = ['<table class="compact t-grid"><thead>'
           '<tr><th rowspan="2">Saldo para o Sprout, €/kg</th><th class="num grp-h" colspan="3">Margem do embalador média, 0,297 €/kg</th>'
           '<th class="num grp-h" colspan="3">Margem de 2019/20, 0,499 €/kg</th></tr><tr>']
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
        'x': {'min': -0.7, 'max': 0.35, 'ticks': [-0.6, -0.4, -0.2, 0, 0.2], 'format': {'dec': 1}},
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
        ('Azeite HoReCa/gourmet (principal)', 'Venda a 90 % da referência documentada; custos diretos e cupão deduzidos', 'azeite_horeca_gourmet', '2027'),
        ('Azeite distribuidores e exportação (principal)', 'Preço de saída do embalador, sem desconto; recomendado: +0,10 €/kg de prémio de origem', 'azeite_distribuidores_exportacao', '2027'),
        ('Granel certificado (principal, back-to-back)', 'Comprado ao índice, vendido a embaladores e exportadores a índice + 0,15 €/kg; lotes de 100 t', 'azeite_granel_certificado', '2028 (rec.)'),
        ('Café verde (principal)', 'Compra em EUR a importador UE; venda a microtorrefatores', 'cafe_verde', '2029 / 2030'),
        ('Água (agente)', 'Comissão de 2 % do GMV, faturada ao engarrafador; sem stock nem fundos de terceiros', 'agua', '2027'),
        ('Verificação para terceiros', '0,75 % por utilização × 2 + 0,5 %/ano da carteira de um banco parceiro; no recomendado o banco paga a custódia', 'verificacao_terceiros_liquida', '2028'),
        ('Dados e índice', 'Subscrição de preços de lotes verificados', 'dados', '2030'),
    ]
    out = ['<table class="compact wrap t-rec"><colgroup><col style="width:50mm"><col><col style="width:16mm"><col style="width:19mm"><col style="width:22mm"></colgroup>'
           '<thead><tr><th>Fonte de receita</th><th>Mecânica</th><th>Início</th><th class="num">Base 2031<span class="sub">k€ de margem</span></th><th class="num">Recomendado 2031<span class="sub">k€ de margem</span></th></tr></thead><tbody>']
    for lab, mec, key, ini in rows:
        out.append(f'<tr><td class="lbl">{lab}</td><td>{mec}</td><td>{ini}</td><td class="num">{k(mb[key][4], 0)}</td><td class="num">{k(mr[key][4], 0)}</td></tr>')
    out.append(f'<tr class="total"><td>Margem de contribuição total</td><td></td><td></td><td class="num">{k(mb["total"][4])}</td><td class="num">{k(mr["total"][4])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- capítulo 13: financeiro


@gen('tbl_pressupostos')
def _():
    rec_alt = {a['parametro'].split(' ')[0]: a for a in P['cenario_recomendado']['alteracoes']}
    rows = [
        ('Índice do granel (SIMA + Poolred); prémio ao lagar HoReCa', '3,50; 0,10 €/kg', '3,50; 0,15 €/kg', '00 §1.2; 01 §2.1'),
        ('Referência HoReCa/gourmet; desconto', '5,65 €/kg [E]; 10 %', '6,00 €/kg, origem identificada (por provar); 10 %', '00 §1.4; 01 §2.8'),
        ('Referência distribuidores/exportação; desconto', '4,35 €/kg; 0 %', '4,45 €/kg (prémio de origem 0,10); 0 %', '01 §2.5, §5.4'),
        ('Clientes HoReCa/gourmet ativos, 2027 → 2031', '40 → 2 000', '40 → 1 000', '10 §5'),
        ('Azeite total, 2027 → 2031 (t)', f'{nf(B["volumes_t"]["azeite_total"][0])} → {nf(B["volumes_t"]["azeite_total"][4])}', f'{nf(RC["volumes_t"]["azeite_total"][0], 0)} → {nf(RC["volumes_t"]["azeite_total"][4])} (granel certificado 0 → 3 500)', '01 §7.1; JSON'),
        ('Água (paletes, 2031); modelo', '1 800; agente 2 %', '900; agente 2 %, só cabaz', '01 §2.7'),
        ('Café verde', '2029: 30 → 100 t', '2030: 20 → 50 t; cobertura 0,3 %', '40 §2.5'),
        ('Cupão; obrigações em % do capital de giro; utilização', '8 % → 7 %; 0 % em 2027, 90 %; 80 %', 'igual ao base', '01 §3; CSC 348.º/2 [L]'),
        ('Prazo de recebimento HoReCa / distribuidores', '35 / 45 dias', '35 / 55 dias', '00 §1.7'),
        ('Verificação para terceiros: carteira 2031; custo', '5 M€; pago pelo Sprout', '5 M€; pago pelo banco ou mutuário', '01 §6.1'),
        ('FTE 2027 → 2031', '7 → 17', '5,5 → 12', '01 §6.2'),
        ('Pré-seed; caixa mínima', '1,1 M€; 150 k€', 'igual', '01 §5.5, §7.3'),
    ]
    out = ['<table class="compact t-press"><thead><tr><th>Pressuposto</th><th>Base (fonte corrigida)</th><th>Recomendado</th><th>Origem</th></tr></thead><tbody>']
    for a, b_, c, d in rows:
        out.append(f'<tr><td>{a}</td><td>{b_}</td><td>{c}</td><td class="ref-cell">{d}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


def _fixos(s):
    return [p + o for p, o in zip(s['pessoal'], s['opex_nao_salarial'])]


@gen('tbl_pl')
def _():
    L = RC['linhas']
    out = ['<table class="compact t-fin">', years_head('Recomendado, k€'), '<tbody>']
    out.append(num_row('GMV', RC['gmv_total'], lbl_cls='b'))
    out.append(num_row('Receita', L['dr_rec']))
    out.append(num_row('Custo das mercadorias vendidas', L['dr_cmv']))
    out.append(num_row('Margem bruta', L['dr_mb'], cls='sub-total'))
    out.append(num_row('Custos variáveis (logística, 3PL, custódia, qualidade, crédito, pagamentos)', L['dr_cv']))
    out.append(num_row('Cupão das obrigações', L['dr_cup']))
    out.append(num_row('Margem de contribuição', L['dr_mc'], cls='sub-total'))
    out.append(num_row('&nbsp;&nbsp;azeite HoReCa/gourmet', L['mc_h'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;azeite distribuidores/exportação', L['mc_d'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;azeite granel certificado', L['mc_g'], cls='dim'))
    out.append(num_row('&nbsp;&nbsp;café, água, verificação para terceiros, dados', [a + b_ + c + d for a, b_, c, d in zip(L['mc_cf'], L['mc_ag'], L['mc_tp'], L['mc_dd'])], cls='dim'))
    out.append(num_row('Pessoal', L['dr_pess']))
    out.append(num_row('Opex não salarial (inclui SPV e seguro de crédito)', L['dr_opex']))
    out.append(num_row('EBITDA', L['dr_ebitda'], cls='total'))
    out.append(num_row('Amortizações', L['dr_da']))
    out.append(num_row('Resultado líquido (sem imposto: prejuízo fiscal)', L['dr_rl'], cls='sub-total'))
    out.append(num_row('Memo: FTE', RC['fte'], fmt=lambda v: nf(v, 1 if v % 1 else 0), cls='memo'))
    out.append(num_row('Memo: margem do azeite, €/kg', L['mc_az_kg'], fmt=lambda v: nf(v, 3), cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_pl_base')
def _():
    L = B['linhas']
    out = ['<table class="compact t-fin">', years_head('Base, k€'), '<tbody>']
    out.append(num_row('GMV', B['gmv_total'], lbl_cls='b'))
    out.append(num_row('Margem de contribuição', L['dr_mc'], cls='sub-total'))
    out.append(num_row('Pessoal + opex não salarial', [a + b_ for a, b_ in zip(L['dr_pess'], L['dr_opex'])]))
    out.append(num_row('EBITDA', L['dr_ebitda'], cls='total'))
    out.append(num_row('Resultado líquido', L['dr_rl']))
    out.append(num_row('Memo: FTE', B['fte'], fmt=lambda v: nf(v, 0), cls='memo'))
    out.append(num_row('Memo: margem do azeite, €/kg', L['mc_az_kg'], fmt=lambda v: nf(v, 3), cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_cf')
def _():
    out = ['<table class="compact t-fin">', years_head('k€'), '<tbody>']
    for name, s in (('Recomendado', RC), ('Base', B)):
        out.append(f'<tr class="grp"><td colspan="6">{name}</td></tr>')
        out.append(num_row('Capital de giro (stock + recebíveis − fornecedores)', s['capital_giro']))
        out.append(num_row('Obrigações em circulação (fim de ano)', s['capital_financiado']['obrigacoes_em_circulacao']))
        out.append(num_row('Reserva de 1.ª perda (caixa restrita)', s['capital_financiado']['reserva_primeira_perda']))
        out.append(num_row('Cash flow para o acionista', s['cash_flow_acionista']))
        out.append(num_row('Cash flow acumulado', s['cash_flow_acumulado'], cls='sub-total'))
        out.append(num_row('Capital próprio levantado, acumulado', s['capital_proprio_levantado_acumulado'], cls='total'))
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_fundos')
def _():
    a, b_ = RC['aplicacao_fundos'], B['aplicacao_fundos']
    rows = [('Pré-arranque (Q4 2026) e capital social da SPV', 'pre_arranque_e_capital_spv'), ('Perdas operacionais acumuladas (cash)', 'perdas_operacionais'),
            ('Capex (telemetria, plataforma, equipamento)', 'capex'), ('Capital de giro não coberto por obrigações, reserva e float', 'capital_giro_reserva_float'),
            ('Caixa mínima operacional', 'caixa_minima'), ('Necessidade de capital próprio até 2031', 'total')]
    out = ['<table class="compact t-fundos"><thead><tr><th>Aplicação de fundos, 2026–2031</th><th class="num">Recomendado<span class="sub">k€</span></th><th class="num">Base<span class="sub">k€</span></th></tr></thead><tbody>']
    for lab, key in rows:
        cls = ' class="total"' if key == 'total' else ''
        out.append(f'<tr{cls}><td>{lab}</td><td class="num">{k(a[key])}</td><td class="num">{k(b_[key])}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('fig_ebitda_cenarios')
def _():
    def pts(s):
        return [[y, round(v / 1000)] for y, v in zip(YEARS, s['ebitda'])]
    return chart('lineChart', {
        'ariaLabel': 'EBITDA por cenário, 2027 a 2031, em milhares de euros', 'heightMm': 50,
        'x': {'type': 'linear', 'ticks': YEARS, 'format': {'group': False}},
        'y': {'min': -1400, 'max': 200, 'ticks': [-1200, -800, -400, 0], 'format': {'dec': 0}, 'unit': 'k€'},
        'refLines': [{'y': 0, 'label': 'break-even'}],
        'series': [
            {'name': 'Pessimista', 'color': 'neutral.2', 'points': pts(PE), 'endLabel': f'Pessimista {k(PE["ebitda"][4])}', 'endDy': 7},
            {'name': 'Otimista', 'color': 'neutral.2', 'points': pts(OT), 'endLabel': f'Otimista {k(OT["ebitda"][4])}', 'endDy': -7},
            {'name': 'Base', 'color': 'neutral.1', 'points': pts(B), 'endLabel': f'Base {k(B["ebitda"][4])}', 'markers': 'ends'},
            {'name': 'Recomendado', 'color': 'accent', 'points': pts(RC), 'endLabel': f'Recomendado {k(RC["ebitda"][4])}', 'emphasis': True, 'markers': 'ends'},
        ],
    })


@gen('fig_capital_cenarios')
def _():
    def pts(s):
        return [[y, round(v / 1000)] for y, v in zip(YEARS, s['capital_proprio_levantado_acumulado'])]
    return chart('lineChart', {
        'ariaLabel': 'Capital próprio levantado acumulado por cenário, 2027 a 2031', 'heightMm': 50,
        'x': {'type': 'linear', 'ticks': YEARS, 'format': {'group': False}},
        'y': {'min': 0, 'max': 6000, 'ticks': [0, 2000, 4000, 6000], 'format': {'dec': 0}, 'unit': 'k€'},
        'series': [
            {'name': 'Pessimista', 'color': 'neutral.2', 'points': pts(PE), 'endLabel': f'Pessimista {M(PE["necessidade_capital_proprio"])}', 'endDy': 2},
            {'name': 'Otimista', 'color': 'neutral.2', 'points': pts(OT), 'endLabel': f'Otimista {M(OT["necessidade_capital_proprio"])}', 'endDy': 3},
            {'name': 'Base', 'color': 'neutral.1', 'points': pts(B), 'endLabel': f'Base {M(B["necessidade_capital_proprio"])}', 'markers': 'ends', 'endDy': -6},
            {'name': 'Recomendado', 'color': 'accent', 'points': pts(RC), 'endLabel': f'Recomendado {M(RC["necessidade_capital_proprio"])}', 'emphasis': True, 'markers': 'ends', 'endDy': 5},
        ],
    })


@gen('fig_mc_fixos')
def _():
    return chart('groupedColumns', {
        'ariaLabel': 'Cenário recomendado: margem de contribuição contra custos fixos, 2027 a 2031', 'heightMm': 44,
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
        ('Distribuidores e exportação', m['azeite_distribuidores_exportacao'][4], 'neutral.1'),
        ('HoReCa/gourmet', m['azeite_horeca_gourmet'][4], 'neutral.2'),
        ('Granel certificado', m['azeite_granel_certificado'][4], 'neutral.1'),
        ('Verificação p/ terceiros', m['verificacao_terceiros_liquida'][4], 'accent'),
        ('Dados', m['dados'][4], 'accentSoft'),
        ('Café', m['cafe_verde'][4], 'neutral.2'),
        ('Água', m['agua'][4], 'neutral.3'),
    ]
    return chart('stackedBar', {
        'ariaLabel': 'Composição da margem de contribuição de 2031 no cenário recomendado, em milhares de euros',
        'thickness': 26, 'rowGap': 44, 'labelWidth': 0, 'format': {'dec': 0},
        'rows': [{'label': '', 'segments': [{'label': a, 'value': round(v / 1000, 1), 'valueLabel': k(v), 'color': c} for a, v, c in seg]}],
    })


@gen('tbl_tem_de_ser')
def _():
    b, r = B['o_que_tem_de_ser_verdade_2031'], RC['o_que_tem_de_ser_verdade_2031']
    rows = [
        ('Défice de EBITDA de 2031 a fechar', f'{k(b["defice_ebitda"])} k€', f'{k(r["defice_ebitda"])} k€', ''),
        ('Prémio adicional pago por distribuidores e exportadores', f'+{nf(b["premio_adicional_distribuidores_eur_kg"], 2)} €/kg', f'+{nf(r["premio_adicional_distribuidores_eur_kg"], 2)} €/kg', 'o 01 só suporta 0,10–0,20'),
        ('Referência HoReCa documentada (com 10 % de desconto)', f'{nf(b["referencia_horeca_eur_kg"], 2)} €/kg', f'{nf(r["referencia_horeca_eur_kg"], 2)} €/kg', 'retalho PT médio: 6,67 s/ IVA'),
        ('Volume de granel certificado', f'{nf(b["volume_granel_t"])} t', f'{nf(r["volume_granel_t"])} t', 'produção PT ~175 kt [E]'),
        ('Corte nos custos fixos (pessoal + opex)', f'{MINUS}{nf(b["corte_custos_fixos_pct"] * 100)} %', f'{MINUS}{nf(r["corte_custos_fixos_pct"] * 100)} %', ''),
        ('Carteira de verificação para terceiros', f'{M(b["carteira_terceiros_eur"], 0)} M€', f'{M(r["carteira_terceiros_eur"], 1)} M€', 'modelado: 5 M€'),
    ]
    out = ['<table class="compact t-tds"><thead><tr><th>Uma alavanca de cada vez, para EBITDA de 2031 = 0</th><th class="num">Base</th><th class="num">Recomendado</th><th>Contexto</th></tr></thead><tbody>']
    for a, b_, c, d in rows:
        out.append(f'<tr><td>{a}</td><td class="num">{b_}</td><td class="num">{c}</td><td class="muted">{d}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('tbl_cenarios')
def _():
    sc = [('Pessimista', PE), ('Base', B), ('Otimista', OT), ('Recomendado', RC)]
    rows = [
        ('Azeite 2031, t', lambda s: nf(s['volumes_t']['azeite_total'][4])),
        ('Quota da produção PT, 2031', lambda s: pct(s['volumes_t']['quota_producao_pt'][4], 2)),
        ('Clientes HoReCa/gourmet, 2031', lambda s: nf(s['volumes_t']['clientes_horeca_gourmet'][4])),
        ('GMV 2031, M€', lambda s: M(s['gmv_total'][4])),
        ('Margem do azeite 2031, €/kg', lambda s: nf(s['margem_contribuicao']['azeite_eur_kg'][4], 3)),
        ('Margem de contribuição 2031, k€', lambda s: k(s['margem_contribuicao']['total'][4])),
        ('Pessoal + opex 2031, k€', lambda s: k(_fixos(s)[4])),
        ('FTE 2031', lambda s: nf(s['fte'][4], 1 if s['fte'][4] % 1 else 0)),
        ('EBITDA 2027, k€', lambda s: k(s['ebitda'][0])),
        ('EBITDA 2031, k€', lambda s: k(s['ebitda'][4])),
        ('Resultado líquido 2031, k€', lambda s: k(s['resultado_liquido'][4])),
        ('Cash flow acumulado 2027–2031, k€', lambda s: k(s['cash_flow_acumulado'][4])),
        ('Obrigações em circulação 2031, k€', lambda s: k(s['capital_financiado']['obrigacoes_em_circulacao'][4])),
        ('Investidores estimados 2031', lambda s: nf(s['capital_financiado']['investidores_estimados'][4], 0)),
        ('Necessidade de capital próprio, M€', lambda s: M(s['necessidade_capital_proprio'])),
        ('Runway do pré-seed de 1,1 M€, meses', lambda s: nf(s['runway_pre_seed_meses'], 1)),
        ('Gasto até ao gate de 31-08-2027, k€', lambda s: k(s['gasto_ate_gate_2027_08'])),
        ('Primeiro ano de EBITDA positivo', lambda s: 'não até 2031'),
    ]
    out = ['<table class="compact t-scen4"><thead><tr><th></th>' + ''.join(f'<th class="num{" em" if n == "Recomendado" else ""}">{n}</th>' for n, _ in sc) + '</tr></thead><tbody>']
    for lab, f in rows:
        out.append(f'<tr><td>{lab}</td>' + ''.join(f'<td class="num{" em" if n == "Recomendado" else ""}">{f(s)}</td>' for n, s in sc) + '</tr>')
    out.append('</tbody></table>')
    return ''.join(out)


SENS_CASES = [('desconto_10', 'Caso central'), ('desconto_12_5', 'Desconto HoReCa de 12,5 %'), ('desconto_15', 'Desconto HoReCa de 15 %'),
              ('volume_menos_30', 'Volumes −30 %'), ('volume_mais_30', 'Volumes +30 %'), ('preco_aove_menos_30', 'Preço do AOVE −30 % (repasse proporcional)'),
              ('topo_dos_intervalos', 'Topo dos intervalos')]


@gen('tbl_sens')
def _():
    out = ['<table class="compact t-sens"><thead><tr><th>Sensibilidade</th><th class="num">Base<span class="sub">EBITDA 2031, k€</span></th><th class="num">Base<span class="sub">capital, M€</span></th>'
           '<th class="num">Recomendado<span class="sub">EBITDA 2031, k€</span></th><th class="num">Recomendado<span class="sub">capital, M€</span></th><th class="num">Recomendado<span class="sub">margem HoReCa 2029, €/kg</span></th></tr></thead><tbody>']
    for key, lab in SENS_CASES:
        b, r = SE['base'][key], SE['recomendado'][key]
        cls = ' class="sub-total"' if key == 'desconto_10' else ''
        out.append(f'<tr{cls}><td>{lab}</td><td class="num">{k(b["ebitda_2031"])}</td><td class="num">{M(b["necessidade_capital_proprio"])}</td>'
                   f'<td class="num">{k(r["ebitda_2031"])}</td><td class="num">{M(r["necessidade_capital_proprio"])}</td><td class="num">{nf(r["margem_horeca_2029_eur_kg"], 3)}</td></tr>')
    out.append('</tbody></table>')
    return ''.join(out)


@gen('fig_tornado')
def _():
    r = SE['recomendado']
    c0 = round(r['cenario']['ebitda_2031'] / 1000)
    order = ['preco_aove_menos_30', 'volume_menos_30', 'desconto_15', 'desconto_12_5', 'volume_mais_30', 'topo_dos_intervalos']
    labs = dict(SENS_CASES)
    labs['topo_dos_intervalos'] = 'Topo dos intervalos (prémio 0,20; carteira 10 M€; volumes +30 %)'
    data = []
    for key in order:
        v = round(r[key]['ebitda_2031'] / 1000)
        data.append({'label': labs[key], 'from': c0, 'value': v, 'valueLabel': f'{nf(v)} k€',
                     'color': 'accent' if v > c0 else 'neutral.1'})
    return chart('barChart', {
        'ariaLabel': f'Sensibilidade do EBITDA de 2031 do cenário recomendado, a partir de {c0} mil euros',
        'thickness': 11, 'rowGap': 8, 'labelWidth': 245,
        'x': {'min': -1050, 'max': 50, 'ticks': [-1000, -750, -500, -250, 0], 'format': {'dec': 0}},
        'data': data,
    })


@gen('tbl_fte')
def _():
    L = RC['linhas']
    roles = [('ceo_comercial', 'CEO / comercial (fundador)'), ('cto', 'CTO (fundador)'), ('risco_tesouraria', 'Responsável de Risco e Tesouraria'),
             ('compliance_aml', 'Compliance/AML'), ('operacoes_supply', 'Operações e supply'), ('tecnico_qualidade_azeite', 'Técnico(a) de qualidade do azeite'),
             ('engenheiro_software', 'Engenheiro(a) de software'), ('gestor_conta_b2b', 'Gestor(a) de conta B2B (~400 contas)'),
             ('trader_granel_exportacao', 'Trader de granel e exportação'), ('assistente_operacoes', 'Assistente de operações')]
    out = ['<table class="compact t-fte">', years_head('FTE, recomendado'), '<tbody>']
    f = (lambda v: nf(v, 1) if v % 1 else nf(v, 0))
    for key, lab in roles:
        out.append(num_row(lab, L['pf_' + key], fmt=lambda v: '·' if v == 0 else f(v)))
    out.append(num_row('Total', RC['fte'], fmt=f, cls='total'))
    out.append(num_row('Base (comparação)', B['fte'], fmt=f, cls='memo'))
    out.append(num_row('Pessoal, k€ (recomendado)', RC['pessoal'], cls='memo'))
    out.append('</tbody></table>')
    return ''.join(out)

# ---------------------------------------------------------------- linhas temporais


@gen('fig_timeline_piloto')
def _():
    return chart('timeline', {
        'ariaLabel': 'Calendário de out. 2026 a mar. 2028: fase 0, piloto, gate, fase 2; registo da SPV e 1.ª série; pré-seed',
        'start': '2026-10-01', 'end': '2028-03-31', 'today': '2026-10-13', 'todayLabel': '13/10',
        'laneHeight': 22, 'barHeight': 13,
        'lanes': [
            {'label': 'Operação', 'items': [
                {'from': '2026-10-13', 'to': '2027-01-31', 'label': 'Fase 0: preparação', 'tone': 'soft'},
                {'from': '2027-02-01', 'to': '2027-07-31', 'label': 'Piloto: 20 t + 60 paletes', 'color': 'accent'},
                {'from': '2027-09-01', 'to': '2028-03-31', 'label': 'Fase 2: campanha 2027/28', 'tone': 'outline', 'color': 'accent'},
                {'at': '2027-08-31', 'label': '', 'kind': 'milestone'}]},
            {'label': 'Obrigações (SPV)', 'items': [
                {'from': '2026-11-20', 'to': '2027-11-20', 'label': 'SPV registada; 12 meses sem poder emitir (CSC art. 348.º/2)', 'tone': 'outline', 'color': 'neutral.1'},
                {'from': '2027-11-20', 'to': '2028-01-31', 'label': '1.ª série', 'color': 'series.azeite'},
                {'at': '2026-11-20', 'label': '', 'kind': 'milestone'}]},
            {'label': 'Capital próprio', 'items': [
                {'at': '2027-01-31', 'label': 'Pré-seed 1,1 M€', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-08-31', 'label': 'Gate 31/08: seed só se o piloto mudar os pressupostos', 'kind': 'milestone', 'anchor': 'start'}]},
        ],
    })


@gen('fig_timeline_marcos')
def _():
    return chart('timeline', {
        'ariaLabel': 'Marcos de out. 2026 a dez. 2029: operação, capital, equipa e produto',
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
                {'from': '2028-01-01', 'to': '2029-12-31', 'label': 'Granel certificado: 500 t em 2028, 1 500 t em 2029', 'tone': 'soft'}]},
            {'label': 'Capital', 'items': [
                {'at': '2026-11-20', 'label': 'SPV', 'kind': 'milestone', 'anchor': 'start'},
                {'at': '2027-01-31', 'label': 'Pré-seed', 'kind': 'milestone', 'anchor': 'start'},
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


def _box(x, y, w, h, lines, fill='#FFFFFF', stroke='#AEB49F', sw=0.8, dash=False, bold_first=True, size=9.2, rx=3, tcol='#1A1E16', anchor='middle'):
    da = ' stroke-dasharray="4 3"' if dash else ''
    s = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{da}/>'
    n = len(lines)
    lh = size * 1.25
    y0 = y + h / 2 - (n - 1) * lh / 2 + size * 0.35
    tx = x + w / 2 if anchor == 'middle' else x + 6
    for i, ln in enumerate(lines):
        s += _txt(tx, y0 + i * lh, ln, size if i == 0 else size - 0.8, anchor=anchor, weight=600 if (i == 0 and bold_first) else 400,
                  fill=tcol if i == 0 else '#5B6352')
    return s


@gen('svg_arvore')
def _():
    W, H = 680, 300
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Árvore de decisão: qualificação jurídica do produto e estrutura permitida" style="width:100%;height:auto">',
         _arrow_defs({'ak': '#5B6352'})]

    def link(x1, y1, x2, y2, lab=None, lx=None, ly=None):
        mx = x1 + 14
        o.append(f'<path d="M{x1},{y1} H{mx} V{y2} H{x2 - 2}" fill="none" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)"/>')
        if lab:
            o.append(_txt(lx if lx else mx + 4, ly if ly else y2 - 4, lab, 8.2, anchor='start', fill='#5B6352', halo=True))
    # perguntas
    o.append(_box(0, 18, 168, 46, ['P1. O pagador compra', 'mercadoria para usar ou revender,', 'com entrega física?'], fill='#F4F5EF', size=9))
    o.append(_box(228, 18, 210, 40, ['A. Marketplace B2B puro (comércio)', 'sem licença financeira; UTP 30/60 dias'], fill='#E1E8CF', stroke='#3F5A1E'))
    link(168, 34, 228, 38, 'sim', 186, 33)
    o.append(_box(0, 96, 168, 46, ['P2. Retorno prometido e capital', 'reembolsável (incl. «refunding»)?'], fill='#F4F5EF', size=9))
    o.append(f'<path d="M60,64 V96" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)" fill="none"/>')
    o.append(_txt(64, 84, 'não: quer retorno', 8.2, anchor='start', fill='#5B6352'))
    o.append(_box(228, 92, 210, 40, ['G. Proibido', 'fora de obrigações/ECSP/FIA: RGICSF art. 200.º'], fill='#FFFFFF', stroke='#B42318', sw=1))
    link(168, 112, 228, 112, 'sim, sem veículo', 172, 107)
    o.append(_box(0, 178, 168, 40, ['P3. Via obrigações (dívida):', 'quem subscreve?'], fill='#F4F5EF', size=9))
    o.append(f'<path d="M60,142 V178" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)" fill="none"/>')
    o.append(_txt(64, 162, 'via obrigações da SA', 8.2, anchor='start', fill='#5B6352'))
    o.append(_box(228, 160, 210, 40, ['C. SPV PT, obrigações: fase 1', 'profissionais; ≥ 100 000 € só com parecer (KID)'], fill='#E1E8CF', stroke='#3F5A1E', sw=1.2))
    link(168, 196, 228, 180, 'profissionais', 172, 176)
    o.append(_box(228, 208, 210, 34, ['D. Promotor em ECSP de terceiros', 'retalho, ≤ 5 M€/12 meses: fase 2+'], fill='#FFFFFF'))
    link(168, 200, 228, 225, 'retalho ≤ 5 M€', 172, 222)
    o.append(_box(228, 250, 210, 34, ['Oferta pública + intermediário', 'prospeto > 12 M€; KID: não na fase 1'], fill='#FFFFFF'))
    link(168, 206, 228, 267, 'retalho > 5 M€', 172, 262)
    # verificações transversais
    o.append(_box(478, 18, 202, 52, ['P4. Retorno de um conjunto de lotes', 'gerido com política discricionária?', '→ FIA + gestor (E): não'], fill='#FFFFFF', size=9))
    o.append(_box(478, 82, 202, 52, ['P5. O investidor só recebe a', 'diferença de preço em dinheiro?', '→ derivado MiFID C(5): fora'], fill='#FFFFFF', size=9))
    o.append(_box(478, 146, 202, 52, ['P6. Lotes em token ou veículo', 'fora da UE?', '→ MiCA/MiFID na mesma: não'], fill='#FFFFFF', size=9))
    o.append(_box(478, 210, 202, 74, ['Testes que a estrutura C tem de', 'passar no parecer: cupão fixo (não', 'derivado); finalidade comercial (não FIA);', 'CSC 348.º/2 (exceção do RGICSF 9.º)'], fill='#F4F5EF', size=9))
    o.append('</svg>')
    return ''.join(o)


@gen('svg_arquitetura')
def _():
    W, H = 680, 332
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Arquitetura de referência do piloto: canais, serviços núcleo com o ledger ao centro, e integrações externas; backoffice atual em quarentena" style="width:100%;height:auto">',
         _arrow_defs({'ak': '#5B6352'})]
    # camada canais
    o.append(_txt(0, 12, 'Canais', 9.6, anchor='start', weight=650))
    chans = [['WebApp do investidor', 'jogo, carteira, ritual'], ['Portal do comprador', 'catálogo, encomendas'], ['Portal do produtor', 'stock, lotes, análises'], ['Bastidores', 'ops, tesouraria, compliance']]
    cw = (W - 3 * 10) / 4
    for i, c in enumerate(chans):
        o.append(_box(i * (cw + 10), 18, cw, 34, c))
    # núcleo
    o.append(f'<rect x="0" y="70" width="{W}" height="152" rx="4" fill="#F4F5EF" stroke="#D7DBCC" stroke-width="0.8"/>')
    o.append(_txt(8, 84, 'Serviços núcleo (região UE; SSO + MFA; RBAC com separação ops / tesouraria / compliance)', 9.2, anchor='start', weight=650))
    core = [['Identidade e RBAC'], ['Contrapartes, KYC/KYB', 'orquestração e casos'], ['Catálogo e lotes', 'em € e kg'], ['Encomendas e contratos', 'força maior, offtake'],
            ['Telemetria', 'MQTT/HTTP → séries'], ['Documentos e assinatura', 'CMD/CC, QES']]
    bw = (W - 16 - 5 * 8) / 6
    for i, c in enumerate(core):
        o.append(_box(8 + i * (bw + 8), 92, bw, 36, c, size=8.8))
    # ledger destacado
    o.append(_box(8, 140, 250, 34, ['Ledger de dupla entrada (€ + kg)', 'imutável; conta-espelho por banco, lote e série'], fill='#E1E8CF', stroke='#3F5A1E', sw=1.3))
    o.append(_box(270, 140, 190, 34, ['Reconciliação D+1', 'camt.053 → matching → breaks'], fill='#FFFFFF'))
    o.append(_box(472, 140, 200, 34, ['Risco', 'preço vs contrato, gatilhos, PnL do lote'], fill='#FFFFFF'))
    o.append(f'<line x1="258" x2="268" y1="157" y2="157" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)"/>')
    o.append(f'<line x1="460" x2="470" y1="157" y2="157" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)"/>')
    o.append(_box(8, 184, W - 16, 28, ['Audit log append-only, encadeado por hash → armazenamento WORM; quatro olhos em IBAN, pagamentos > 25 k€ e libertação de lotes'], fill='#FFFFFF', size=8.8))
    for i in range(4):
        x = i * (cw + 10) + cw / 2
        o.append(f'<line x1="{x:.1f}" x2="{x:.1f}" y1="52" y2="70" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)"/>')
    # externos
    o.append(_txt(0, 240, 'Integrações externas', 9.6, anchor='start', weight=650))
    ext = [['Bancos PT', 'OpCo + SPV (1 conta/série)', 'SCT Inst, VoP, SDD B2B'], ['KYC/KYB + screening', 'Sumsub ou Veriff', '+ ComplyAdvantage'],
           ['Faturação certificada AT', 'API; ATCUD, QR', 'selo qualificado 2027'], ['ERP do lagar + sensores', 'CSV → API →', 'radar a cada 15 min'], ['PSP marketplace', 'só fase 2, se houver', 'fundos de terceiros']]
    ew = (W - 4 * 8) / 5
    labs = ['camt.053 / pain.001 / pain.008', 'decisões e evidência', 'rascunho → fatura', 'eventos de stock', 'webhooks']
    for i, e in enumerate(ext):
        x = i * (ew + 8)
        o.append(_box(x, 248, ew, 44, e, size=8.8, dash=(i == 4)))
        cxm = x + ew / 2
        o.append(f'<line x1="{cxm:.1f}" x2="{cxm:.1f}" y1="246" y2="214" stroke="#5B6352" stroke-width="1" marker-end="url(#ak)"/>')
        o.append(_txt(cxm + 3, 230, labs[i], 7.8, anchor='start', fill='#5B6352', halo=True))
    # quarentena
    o.append(_box(0, 302, 300, 28, ['Backoffice atual («reverse engineered»): quarentena, sem ligação', 'até à auditoria; sem dinheiro real nem dados de investidores'], fill='#FFFFFF', stroke='#B42318', dash=True, size=8.6, anchor='start'))
    o.append(_txt(312, 320, '× nenhuma integração com o ledger, pagamentos ou KYC antes do gate de auditoria', 8.4, anchor='start', fill='#B42318', weight=600))
    o.append('</svg>')
    return ''.join(o)


@gen('svg_posicionamento')
def _():
    W, H = 680, 330
    L, T, Rr, Bm = 36, 14, 674, 300
    def X(v): return L + v * (Rr - L)
    def Y(v): return Bm - v * (Bm - T)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Mapa de posicionamento: cliente comercial a investidor no eixo horizontal, integração física no vertical" style="width:100%;height:auto">']
    o.append(f'<rect x="{X(0.55):.1f}" y="{Y(1):.1f}" width="{X(1) - X(0.55):.1f}" height="{Y(0.52) - Y(1):.1f}" fill="#F7E4E1"/>')
    o.append(_txt(X(0.57), Y(0.56), 'Zona de perigo: retorno em € + operador que gere o ativo', 8.4, anchor='start', fill='#8F1C13', weight=600))
    o.append(_txt(X(0.57), Y(0.56) + 11, '(Asset Land, Capital Alternatives, Park First, whisky, Afinsa)', 8, anchor='start', fill='#8F1C13'))
    o.append(f'<line x1="{L}" x2="{Rr}" y1="{Y(0.5):.1f}" y2="{Y(0.5):.1f}" stroke="#AEB49F" stroke-width="1"/>')
    o.append(f'<line x1="{X(0.5):.1f}" x2="{X(0.5):.1f}" y1="{T}" y2="{Bm}" stroke="#AEB49F" stroke-width="1"/>')
    o.append(_txt(L, Bm + 16, '← comprador comercial (consome o bem)', 8.6, anchor='start', fill='#5B6352'))
    o.append(_txt(Rr, Bm + 16, 'investidor (quer retorno em €) →', 8.6, anchor='end', fill='#5B6352'))
    o.append(f'<text transform="translate(12,{(T + Bm) / 2:.1f}) rotate(-90)" text-anchor="middle" fill="#5B6352" style="font-family:\'Public Sans\';font-size:8.6px">integração física: software/dados → posse/custódia</text>')
    pts = [
        (0.06, 0.93, 'Sovena · Deoleo · Gallo'), (0.30, 0.93, 'Recheio · Makro'), (0.06, 0.83, 'Dcoop'), (0.30, 0.83, 'Frubana'),
        (0.06, 0.55, 'Tridge'), (0.22, 0.55, 'Algrano'), (0.36, 0.47, 'Liv-ex'),
        (0.06, 0.28, 'Corretores de azeite'), (0.38, 0.32, 'CrowdFarming'), (0.06, 0.16, 'Choco'), (0.22, 0.16, 'Covantis'), (0.06, 0.06, 'Poolred · Mintec'),
        (0.60, 0.93, 'Cult Wines'), (0.80, 0.93, 'Masterworks · Vint'), (0.70, 0.84, 'AcreTrader · FarmTogether'),
        (0.74, 0.28, 'Raize · Goparity · Miimosa (ECSP)'), (0.60, 0.16, 'Incomlend'), (0.84, 0.10, 'Greensill · Stenn (falidas)'),
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
    diamond(0.17, 0.69, 'Sprout Marketplace', 'principal; lote de origem; back-to-back')
    diamond(0.60, 0.42, 'Sprout Capital, SA', 'obrigações a profissionais; credor colateralizado')
    o.append(_txt(X(0.80), Y(0.70), '× tese original', 9.2, anchor='start', fill='#8F1C13', weight=650))
    o.append(_txt(X(0.80), Y(0.70) + 11, 'retalho, 10–15 %, refunding', 8.2, anchor='start', fill='#8F1C13'))
    o.append('</svg>')
    return ''.join(o)


RISKS = [
    # id, título curto, P, I
    (1, 'Referência HoReCa < 6,00 €/kg documentada', 4, 4),
    (2, 'Emissão antes do prazo do CSC ou sem KID', 2, 5),
    (3, 'Promoção a retalho ou gamificação de retornos', 2, 5),
    (4, 'Índice −30 % com stock em aberto', 3, 4),
    (5, 'Incumprimento de compradores HoReCa', 3, 3),
    (6, 'Concentração e conflito no Lagar do Val', 3, 4),
    (7, 'Falha de custódia ou stock fictício', 2, 5),
    (8, 'Desclassificação do lote (AOVE → virgem)', 3, 2),
    (9, 'Backoffice «reverse engineered»', 4, 4),
    (10, 'Banco recusa conta da SPV / PSP congela fundos', 2, 4),
    (11, 'Retaliação de embaladores e cash & carry', 3, 3),
    (12, 'Seed não levantada após o gate', 4, 5),
    (13, 'Responsável de Risco por contratar', 3, 4),
]


@gen('svg_matriz_risco')
def _():
    W, H = 330, 300
    L, T, cs = 40, 8, 54
    ramp = ['#F4F5EF', '#E9EDDC', '#D8E0C1', '#C4D0A1', '#AFC07F']
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Matriz probabilidade por impacto com 13 riscos numerados" style="width:100%;height:auto">']
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
    o.append(f'<text transform="translate(10,{T + 2.5 * cs:.1f}) rotate(-90)" text-anchor="middle" fill="#5B6352" style="font-family:\'Public Sans\';font-size:8.8px">Impacto →</text>')
    o.append('</svg>')
    return ''.join(o)

# ---------------------------------------------------------------- fontes (anexo), lidas da base factual


@gen('lista_fontes')
def _():
    txt = (BP.parent / 'research' / '00-base-factual.md').read_text()
    sec = txt.split('## Fontes (acesso a 13-10-2026)')[1].split('\n---')[0]
    out = []
    group = None
    for ln in sec.splitlines():
        m = re.match(r'\*\*(.+?)\*\*', ln.strip())
        if m:
            if group is not None:
                out.append('</ul>')
            group = m.group(1)
            out.append(f'<h4>{esc(group)}</h4><ul class="src">')
            continue
        m = re.match(r'- (\S+)(.*)', ln.strip())
        if m and group is not None:
            url, rest = m.group(1), m.group(2).strip()
            tag = ''
            if '[C]' in rest:
                tag = ' <span class="tag-ev">[C]</span>'
            elif 'lido diretamente' in rest:
                tag = ' <span class="tag-ev">lido diretamente</span>'
            out.append(f'<li><a href="{esc(url)}">{esc(url)}</a>{tag}</li>')
    out.append('</ul>')
    return ''.join(out)


@gen('n_fontes')
def _():
    txt = (BP.parent / 'research' / '00-base-factual.md').read_text()
    sec = txt.split('## Fontes (acesso a 13-10-2026)')[1].split('\n---')[0]
    return str(len(re.findall(r'^- https?://', sec, flags=re.M)))

# ---------------------------------------------------------------- índice


CHAPTERS = [
    ('1', 'Sumário executivo'), ('2', 'O problema e a oportunidade'), ('3', 'A solução: Sprout'), ('4', 'Produto'),
    ('5', 'Mercado'), ('6', 'Modelo de negócio e unit economics'), ('7', 'Estrutura jurídica e regulatória'), ('8', 'Gestão de risco'),
    ('9', 'Go-to-market'), ('10', 'Operações e tecnologia'), ('11', 'Concorrência e posicionamento'), ('12', 'Equipa e governança'),
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
        lab = n if n.isdigit() else n
        out.append(f'<li><span class="toc-n">{lab}</span><span class="toc-t">{esc(title)}</span><span class="toc-p">{pages.get(t, "—")}</span></li>')
    out.append('</ol>')
    return ''.join(out)

# ---------------------------------------------------------------- montagem


def main():
    parts = sorted((HERE / 'parts').glob('*.html'))
    body = '\n'.join(p.read_text() for p in parts)
    missing = set()

    def sub(m):
        key = m.group(1).strip()
        if key not in GEN:
            missing.add(key)
            return m.group(0)
        return GEN[key]()
    body = re.sub(r'\{\{([a-z0-9_]+)\}\}', sub, body)
    if missing:
        raise SystemExit(f'marcadores sem gerador: {sorted(missing)}')
    (BP / 'business-plan.html').write_text(body)
    print(f'business-plan.html: {len(body):,} bytes; {len(parts)} partes')


if __name__ == '__main__':
    main()
