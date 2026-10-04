from pathlib import Path
import base64
import argparse
import sys
from urllib.parse import urlparse
import re
import qrcode
from PIL import Image, ImageDraw, ImageFont
import zxingcpp

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Create a verified Alloy Tech QR code and branded card.')
parser.add_argument('--url', help='HTTP or HTTPS destination URL')
parser.add_argument('--description', help='Description underneath the QR; wraps automatically')
parser.add_argument('--footer', help='Small footer text; defaults to Scan to explore + URL')
parser.add_argument('--name', default='alloy-tech-website', help='Output filename prefix')
parser.add_argument('--output-dir', type=Path, default=ROOT / 'assets' / 'branding')
args = parser.parse_args()
DEFAULT_URL = 'https://alloy-tech.vercel.app/'
DEFAULT_DESCRIPTION = 'Different strengths. Better systems.'
if sys.stdin.isatty():
    if args.url is None:
        args.url = input(f'URL [{DEFAULT_URL}]: ').strip() or DEFAULT_URL
    if args.description is None:
        args.description = input(f'Bottom description [{DEFAULT_DESCRIPTION}]: ').strip() or DEFAULT_DESCRIPTION
URL = args.url or DEFAULT_URL
DESCRIPTION = args.description if args.description is not None else DEFAULT_DESCRIPTION
parsed = urlparse(URL)
if parsed.scheme not in ('http', 'https') or not parsed.netloc or any(c.isspace() for c in URL):
    parser.error('Use a complete http:// or https:// URL without spaces.')
if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]*', args.name):
    parser.error('--name must use letters, numbers, hyphens or underscores.')
if not DESCRIPTION.strip():
    parser.error('The description cannot be empty.')
OUT = args.output_dir.resolve()
INK = '#243b2c'
PAPER = '#f5f4ee'
FOOTER = args.footer if args.footer is not None else 'Scan to explore ' + URL.removeprefix('https://').removeprefix('http://').rstrip('/')

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=24, border=4)
qr.add_data(URL)
qr.make(fit=True)
code = qr.make_image(fill_color=INK, back_color='white').convert('RGB')
logo = Image.open(ROOT / 'assets' / 'alloy-tech-logo.png').convert('RGBA')
logo = logo.crop(logo.getchannel('A').getbbox())
logo.thumbnail((96, 64), Image.Resampling.LANCZOS)
center = code.width // 2
plate = (center - 60, center - 44, center + 60, center + 44)
ImageDraw.Draw(code).rectangle(plate, fill='white')
code.paste(logo, (center - logo.width // 2, center - logo.height // 2), logo)


# Keep the QR modules as vector rectangles for scalable print use.
matrix = qr.get_matrix()
module = 24
rects = ''.join(f'<rect x="{x*module}" y="{y*module}" width="24" height="24"/>' for y,row in enumerate(matrix) for x,dark in enumerate(row) if dark)
logo_data = base64.b64encode((ROOT / 'assets' / 'alloy-tech-logo.png').read_bytes()).decode()
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {code.width} {code.height}" role="img" aria-label="QR code for the Alloy Tech website"><rect width="100%" height="100%" fill="white"/><g fill="{INK}">{rects}</g><rect x="{center-60}" y="{center-44}" width="120" height="88" fill="white"/><image href="data:image/png;base64,{logo_data}" x="{center-48}" y="{center-32}" width="96" height="64" preserveAspectRatio="xMidYMid meet"/></svg>'


def font(size, weight=600):
    f = ImageFont.truetype(str(ROOT / 'assets' / 'manrope.ttf'), size)
    f.set_variation_by_axes([weight])
    return f

poster = Image.new('RGB', (1440,1800), PAPER)
draw = ImageDraw.Draw(poster)
brandfont = font(62,700)
brand = 'ALLOY TECH'
brandwidth = draw.textlength(brand,font=brandfont)
brandlogo = Image.open(ROOT / 'assets' / 'alloy-tech-logo.png').convert('RGBA')
brandlogo = brandlogo.crop(brandlogo.getchannel('A').getbbox())
brandlogo.thumbnail((124,80),Image.Resampling.LANCZOS)
start = int((1440-brandwidth-156)/2)
poster.paste(brandlogo,(start,128),brandlogo)
draw.text((start+156,125),brand,font=brandfont,fill=INK)
qr_y = 330
qr_x = (1440-code.width)//2
poster.paste(code.resize((984,984),Image.Resampling.NEAREST),(228,qr_y))
def wrapped_lines(text, face, width):
    lines = []
    for paragraph in text.splitlines():
        line = ''
        for word in paragraph.split():
            if face.getlength(word) > width:
                if line:
                    lines.append(line)
                    line = ''
                piece = ''
                for char in word:
                    if piece and face.getlength(piece + char) > width:
                        lines.append(piece)
                        piece = ''
                    piece += char
                line = piece
            elif line and face.getlength(line + ' ' + word) > width:
                lines.append(line)
                line = word
            else:
                line = (line + ' ' + word).strip()
        lines.append(line)
    return lines

for size in range(62, 25, -2):
    description_font = font(size,600)
    description_lines = wrapped_lines(DESCRIPTION,description_font,1120)
    if len(description_lines)*(size+16) <= 205:
        break
else:
    parser.error('Description is too long for the card. Use a shorter description.')
for index,text in enumerate(description_lines):
    draw.text((720,1410+index*(size+16)),text,font=description_font,fill=INK,anchor='mt')
footer_font = font(30,500)
footer_lines = wrapped_lines(FOOTER,footer_font,1120)
if len(footer_lines) > 3:
    parser.error('Footer is too long. Set a shorter --footer.')
for index,text in enumerate(footer_lines):
    draw.text((720,1650+index*40),text,font=footer_font,fill='#4c5c49',anchor='mt')

for label,im in [('QR',code),('card',poster),('QR at reduced size',code.resize((max(246,len(matrix)*6),max(246,len(matrix)*6)),Image.Resampling.LANCZOS))]:
    decoded = zxingcpp.read_barcode(im)
    assert decoded and decoded.text == URL, f'Failed to decode {label}'
    print(f'{label}: verified {decoded.text}')
OUT.mkdir(parents=True, exist_ok=True)
code.save(OUT / f'{args.name}-qr.png')
poster.save(OUT / f'{args.name}-qr-card.png',dpi=(300,300))
(OUT / f'{args.name}-qr.svg').write_text(svg,encoding='utf-8')
print(f'Saved PNG card, standalone PNG, and SVG to {OUT} (prefix: {args.name})')
