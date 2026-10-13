#!/usr/bin/env bash
# render.sh — monta o HTML, gera o PDF, acerta os números de página do índice e rasteriza as páginas.
set -euo pipefail
cd "$(dirname "$0")"
TOOLS=../../tools
python3 build.py
node "$TOOLS/render-pdf.mjs" ../business-plan.html ../Sprout-Business-Plan.pdf | grep -v '^tipografia\|^fontes'
if ! python3 toc.py ../Sprout-Business-Plan.pdf; then
  echo "índice atualizado: segunda passagem"
  python3 build.py
  node "$TOOLS/render-pdf.mjs" ../business-plan.html ../Sprout-Business-Plan.pdf | grep -v '^tipografia\|^fontes'
  python3 toc.py ../Sprout-Business-Plan.pdf || echo "AVISO: o índice mudou outra vez"
fi
python3 "$TOOLS/preview.py" ../Sprout-Business-Plan.pdf --no-sheet > /dev/null
echo "pré-visualização em docs/tools/.preview/Sprout-Business-Plan/"
