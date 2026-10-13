# fonts/

`sprout-symbols-Regular.woff2` e `sprout-symbols-SemiBold.woff2` são subconjuntos da **Inter 4.0**
(SIL Open Font License 1.1, ver `OFL-Inter.txt`) com apenas setas (U+2190–2199), ≈, ≠, ≤ e ≥.

Porquê: os ficheiros latin/latin-ext do @fontsource para Archivo, Public Sans e IBM Plex Mono não têm
esses glifos. Sem este subconjunto o Chromium recorria a uma fonte do sistema diferente em cada máquina.
`print.css` declara-os como `"Sprout Symbols"` com `unicode-range` restrito, a seguir às fontes da marca.

Espaços: não estão aqui. O separador de milhares é U+2009 + U+2060 (render-pdf.mjs) ou U+2009
(svg-charts.mjs); o HarfBuzz sintetiza o espaço fino a partir do espaço da fonte da marca (1/5 em).

Regenerar (requer fonttools e brotli):

    pyftsubset /usr/share/fonts/opentype/inter/Inter-Regular.otf \
      --unicodes="U+2190-2199,U+2248,U+2260,U+2264,U+2265" --flavor=woff2 \
      --layout-features='' --no-hinting --desubroutinize \
      --output-file=sprout-symbols-Regular.woff2
