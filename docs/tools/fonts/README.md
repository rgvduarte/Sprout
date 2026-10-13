# fonts/

`sprout-symbols-Regular.woff2` e `sprout-symbols-SemiBold.woff2` são subconjuntos da **Inter 4.0**
(SIL Open Font License 1.1, ver `OFL-Inter.txt`) com apenas espaço fino (U+2009), espaço estreito inseparável (U+202F, separador de milhares), setas (U+2190–2199), ≈, ≠, ≤ e ≥.

Ajuste: o avanço do U+202F foi alargado para 0,26 em e o do U+2009 para 0,20 em, para que o separador de milhares se veja em corpo pequeno (ver o script em baixo).

Porquê: os ficheiros latin/latin-ext do @fontsource para Archivo, Public Sans e IBM Plex Mono não têm
esses glifos. Sem este subconjunto o Chromium recorria a uma fonte do sistema diferente em cada máquina.
`print.css` declara-os como `"Sprout Symbols"` com `unicode-range` restrito, a seguir às fontes da marca.

Regenerar (requer fonttools e brotli):

    pyftsubset /usr/share/fonts/opentype/inter/Inter-Regular.otf \
      --unicodes="U+2009,U+202F,U+2190-2199,U+2248,U+2260,U+2264,U+2265" --flavor=woff2 \
      --layout-features='' --no-hinting --desubroutinize \
      --output-file=sprout-symbols-Regular.woff2

Depois de gerar, alargar os espaços (fontTools):

    python3 -c "from fontTools.ttLib import TTFont
    for w in ['Regular','SemiBold']:
        f=f'sprout-symbols-{w}.woff2'; t=TTFont(f); cm=t.getBestCmap(); u=t['head'].unitsPerEm
        for cp,em in [(0x202F,0.26),(0x2009,0.2)]: t['hmtx'][cm[cp]]=(int(u*em),t['hmtx'][cm[cp]][1])
        t.flavor='woff2'; t.save(f)"
