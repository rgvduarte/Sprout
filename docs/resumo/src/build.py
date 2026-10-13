#!/usr/bin/env python3
"""build.py — monta docs/resumo/resumo.html a partir de resumo.tpl.html e do resultados.json do modelo.

Usa os mesmos geradores, helpers e números do plano de negócios (business-plan/src/build.py), para que
os dois documentos digam sempre o mesmo. Marcadores: {{nome}} (gerador) e {{= expressão }}.

Uso:  python3 build.py   (depois: node ../../tools/render-pdf.mjs ../resumo.html ../Sprout-Resumo-Executivo.pdf)
"""
import importlib.util
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
DOCS = HERE.parent.parent
BP_SRC = DOCS / 'business-plan' / 'src'

spec = importlib.util.spec_from_file_location('bp_build', BP_SRC / 'build.py')
bp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bp)

GEN = dict(bp.GEN)
NS = dict(bp.NS)
UE, ue, ekg, nf, pct = bp.UE, bp.ue, bp.ekg, bp.nf, bp.pct


def bp_css():
    """Regras de tabelas, figuras e notas do plano de negócios, para as tabelas geradas terem o mesmo aspeto."""
    head = (BP_SRC / 'parts' / '00-head.html').read_text()
    a = head.index('/* ---------- tabelas ---------- */')
    b = head.index('/* ---------- sumário ---------- */')
    extra = [ln for ln in head[b:].splitlines() if re.match(r'\s*(table\.(t-|tight|spec)|\.legend \.dot|\.keep-p)', ln)]
    return head[a:b] + '\n'.join(extra)


GEN['bp_css'] = bp_css


def horeca_base_15():
    """Margem HoReCa do Base em 2029 com 15 % de desconto, depois do seguro de crédito (taxa do lote-tipo)."""
    e = ekg
    rate = -e('h', 'base', 'segcred') / e('h', 'base', 'price')
    m15 = bp.SE['base']['desconto_15']['margem_horeca_2029_eur_kg']
    price15 = e('h', 'base', 'ref') * 0.85
    return m15 - rate * price15


NS['horeca_base_15'] = horeca_base_15


GEN['res_timeline'] = lambda: bp.timeline_piloto(lane_h=20)


def aove_small():
    s = bp.aove_chart(34, label_at='2022-11-01')
    return s.replace(', "unit": "€/kg"', '').replace('custo de produção em Espanha: 2,81–4,61', 'custo de produção ES: 2,81–4,61')


GEN['res_aove'] = aove_small


def mc_small():
    s = bp.GEN['fig_mc_fixos']()
    return s.replace('"heightMm": 44', '"heightMm": 33')


GEN['res_mc_fixos'] = mc_small


def ebitda_small():
    return bp.GEN['fig_ebitda_cenarios']().replace('"heightMm": 50', '"heightMm": 38')


def capital_small():
    return bp.GEN['fig_capital_cenarios']().replace('"heightMm": 50', '"heightMm": 38')


GEN['res_ebitda'] = ebitda_small
GEN['res_capital'] = capital_small


def main():
    body = bp.expand((HERE / 'resumo.tpl.html').read_text(), GEN, NS)
    out = HERE.parent / 'resumo.html'
    out.write_text(body)
    print(f'resumo.html: {len(body):,} bytes')


if __name__ == '__main__':
    main()
