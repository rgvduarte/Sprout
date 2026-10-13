#!/usr/bin/env python3
"""toc.py — lê o outline (marcadores) do PDF e grava src/toc-pages.json com a página de cada capítulo.

Uso: python3 toc.py ../Sprout-Business-Plan.pdf   (sai com 1 se os números mudaram e é preciso voltar a montar)
"""
import json
import sys
from pathlib import Path

import pypdfium2 as pdfium

sys.path.insert(0, str(Path(__file__).parent))
from build import CHAPTERS  # noqa: E402

pdf = pdfium.PdfDocument(sys.argv[1])
found = {}
for item in pdf.get_toc():
    title = ' '.join((item.get_title() or '').replace('\u2060', '').replace('\u00a0', ' ').replace('\u2009', ' ').split())
    dest = item.get_dest()
    if dest is None:
        continue
    page = dest.get_index() + 1
    for _, t in CHAPTERS:
        if title == t and t not in found:
            found[t] = page
out = Path(__file__).parent / 'toc-pages.json'
old = json.loads(out.read_text()) if out.exists() else {}
missing = [t for _, t in CHAPTERS if t not in found]
print('capítulos encontrados:', len(found), '| em falta:', missing)
out.write_text(json.dumps(found, ensure_ascii=False, indent=1))
sys.exit(0 if old == found else 1)
