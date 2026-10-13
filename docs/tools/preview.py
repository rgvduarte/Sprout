#!/usr/bin/env python3
"""preview.py — rasteriza as páginas de um PDF para PNG (pypdfium2) para as podermos VER.

Uso:
  python3 preview.py <ficheiro.pdf> [--out DIR] [--scale 2] [--pages 1,3-4] [--no-sheet]

Saída (por omissão em docs/tools/.preview/<nome-do-pdf>/, ignorada pelo git):
  p01.png, p02.png, ...   uma imagem por página (escala 2 ≈ 144 ppp)
  contact.png             folha de contacto com todas as páginas lado a lado (escala reduzida)
Também imprime, por página, o número de caracteres de texto e as primeiras palavras,
para confirmar rapidamente que cada página tem o conteúdo esperado.
"""
import argparse
import os
import sys

try:
    import pypdfium2 as pdfium
except ImportError:  # pragma: no cover
    sys.exit("pypdfium2 não está instalado: pip install pypdfium2")

HERE = os.path.dirname(os.path.abspath(__file__))


def parse_pages(spec, n):
    if not spec:
        return list(range(n))
    out = []
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            a, b = part.split("-")
            out.extend(range(int(a) - 1, int(b)))
        elif part:
            out.append(int(part) - 1)
    return [p for p in out if 0 <= p < n]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf")
    ap.add_argument("--out", default=None)
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--pages", default=None)
    ap.add_argument("--no-sheet", action="store_true", help="não gerar a folha de contacto")
    a = ap.parse_args()

    pdf_path = os.path.abspath(a.pdf)
    name = os.path.splitext(os.path.basename(pdf_path))[0]
    out = os.path.abspath(a.out or os.path.join(HERE, ".preview", name))
    os.makedirs(out, exist_ok=True)

    doc = pdfium.PdfDocument(pdf_path)
    n = len(doc)
    pages = parse_pages(a.pages, n)
    images = []
    print(f"{pdf_path}: {n} página(s); a rasterizar {len(pages)} para {out}")
    for i in pages:
        page = doc[i]
        w_pt, h_pt = page.get_size()
        bitmap = page.render(scale=a.scale)
        img = bitmap.to_pil()
        path = os.path.join(out, f"p{i + 1:02d}.png")
        img.save(path)
        images.append(img)
        tp = page.get_textpage()
        txt = tp.get_text_range().replace("\r\n", " ").replace("\n", " ")
        words = " ".join(txt.split()[:12])
        print(f"  p{i + 1:02d}  {w_pt / 72 * 25.4:.0f}×{h_pt / 72 * 25.4:.0f} mm  {len(txt):5d} car.  {path}\n        {words}")

    if images and not a.no_sheet:
        from PIL import Image

        thumb_h = 900
        thumbs = [im.resize((int(im.width * thumb_h / im.height), thumb_h)) for im in images]
        gap = 24
        sheet = Image.new("RGB", (sum(t.width for t in thumbs) + gap * (len(thumbs) + 1), thumb_h + 2 * gap), (233, 235, 226))
        x = gap
        for t in thumbs:
            sheet.paste(t, (x, gap))
            x += t.width + gap
        sp = os.path.join(out, "contact.png")
        sheet.save(sp)
        print(f"  folha de contacto: {sp}")


if __name__ == "__main__":
    main()
