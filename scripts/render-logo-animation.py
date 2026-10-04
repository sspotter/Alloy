"""Render the approved six-second Alloy-Tech logo assembly at 1080p."""
import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
OUTPUT = ASSETS / 'alloy-tech-logo-animation.mp4'
WIDTH, HEIGHT, FPS, DURATION = 1920, 1080, 30, 6
PAPER = '#f5f4ee'
LOGO_WIDTH, LOGO_HEIGHT = 620, 360
SCALE = LOGO_WIDTH / 260
ORIGIN = ((WIDTH - LOGO_WIDTH) // 2, 290)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def ease(value):
    value = min(1.0, max(0.0, value))
    return 1 - (1 - value) ** 4


def polygon_mask(points):
    mask = Image.new('L', (LOGO_WIDTH * 3, LOGO_HEIGHT * 3))
    ImageDraw.Draw(mask).polygon(
        [(round(x * SCALE * 3), round(y * SCALE * 3)) for x, y in points],
        fill=255,
    )
    return mask.resize((LOGO_WIDTH, LOGO_HEIGHT), Image.Resampling.LANCZOS)


def make_facets():
    # Coordinates follow the supplied reference, including its open T counter.
    polygons = [
        [(0, 149), (99, 6), (104, 1), (110, 0), (147, 59), (202, 149)],
        [(110, 0), (163, 0), (169, 2), (174, 9), (260, 149), (202, 149)],
        [(147, 59), (202, 149), (115, 149), (115, 83)],
    ]
    colors = [((167, 183, 141), (65, 104, 74)),
              ((104, 161, 122), (51, 111, 82)),
              ((53, 99, 72), (36, 82, 62))]
    opening = polygon_mask([(69, 59), (198, 59), (181, 83),
                            (149, 83), (149, 150), (115, 150),
                            (115, 83), (85, 83)])
    y, x = np.mgrid[0:LOGO_HEIGHT, 0:LOGO_WIDTH]
    gradient = np.clip(.65 * (1 - y / LOGO_HEIGHT) + .35 * x / LOGO_WIDTH, 0, 1)
    facets = []
    for points, (low, high) in zip(polygons, colors):
        alpha = np.asarray(polygon_mask(points), dtype=np.float32)
        alpha *= 1 - np.asarray(opening, dtype=np.float32) / 255
        rgb = np.array(low) + gradient[..., None] * (np.array(high) - np.array(low))
        facets.append(Image.fromarray(np.dstack((rgb, alpha)).astype('uint8')))
    return facets


def make_wordmark():
    face = ImageFont.truetype(str(ASSETS / 'manrope.ttf'), 65)
    face.set_variation_by_axes([800])
    text, tracking = 'ALLOY-TECH', 5
    widths = [face.getlength(letter) for letter in text]
    layer = Image.new('RGBA', (round(sum(widths) + tracking * (len(text) - 1)), 90))
    draw = ImageDraw.Draw(layer)
    x = 0
    for letter, width in zip(text, widths):
        draw.text((x, 0), letter, font=face, fill='#121713', anchor='la')
        x += width + tracking
    return layer


FACETS = make_facets()
WORDMARK = make_wordmark()
COMBINED_ALPHA = np.maximum.reduce([np.asarray(f.getchannel('A')) for f in FACETS])
SWEEP_X = np.mgrid[0:LOGO_HEIGHT, 0:LOGO_WIDTH][1]


def place_facet(canvas, facet, offset, progress):
    layer = facet.copy()
    layer.putalpha(facet.getchannel('A').point(lambda alpha: round(alpha * progress)))
    x = round(ORIGIN[0] + offset[0] * (1 - progress))
    y = round(ORIGIN[1] + offset[1] * (1 - progress))
    canvas.alpha_composite(layer, (x, y))


def add_sweep(canvas, time):
    if 2.0 <= time <= 3.5:
        center = -160 + (time - 2) / 1.5 * (LOGO_WIDTH + 320)
        intensity = np.exp(-((SWEEP_X - center) / 65) ** 2) * .20
        layer = Image.new('RGBA', (LOGO_WIDTH, LOGO_HEIGHT), 'white')
        layer.putalpha(Image.fromarray((COMBINED_ALPHA * intensity).astype('uint8')))
        canvas.alpha_composite(layer, ORIGIN)


def frame(time):
    canvas = Image.new('RGBA', (WIDTH, HEIGHT), PAPER)
    motions = [(-160, 70, 0.0), (160, -65, .18), (0, 110, .42)]
    for facet, (x, y, delay) in zip(FACETS, motions):
        place_facet(canvas, facet, (x, y), ease((time - delay) / 1.48))
    add_sweep(canvas, time)
    progress = ease((time - 3.5) / 1.0)
    wordmark = WORDMARK.copy()
    wordmark.putalpha(WORDMARK.getchannel('A').point(lambda alpha: round(alpha * progress)))
    canvas.alpha_composite(wordmark, ((WIDTH - WORDMARK.width) // 2,
                                     round(710 + 14 * (1 - progress))))
    return canvas.convert('RGB')


def render_video():
    command = [FFMPEG, '-y', '-loglevel', 'error', '-f', 'rawvideo',
               '-pix_fmt', 'rgb24', '-s', f'{WIDTH}x{HEIGHT}', '-r', str(FPS),
               '-i', '-', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18',
               '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(OUTPUT)]
    with subprocess.Popen(command, stdin=subprocess.PIPE) as encoder:
        for index in range(FPS * DURATION):
            encoder.stdin.write(frame(index / FPS).tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError('Video encoding failed')


def save_previews():
    frame(5.5).save(ASSETS / 'alloy-tech-logo-animation-poster.png')
    sheet = Image.new('RGB', (1440, 540), PAPER)
    for index, time in enumerate([.6, 1.3, 2.1, 2.8, 4.0, 5.5]):
        thumbnail = frame(time).resize((480, 270), Image.Resampling.LANCZOS)
        sheet.paste(thumbnail, ((index % 3) * 480, (index // 3) * 270))
    sheet.save(ASSETS / 'alloy-tech-logo-animation-storyboard.jpg', quality=92)
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(OUTPUT),
                    '-vf', 'fps=15,scale=768:-1:flags=lanczos,split[a][b];'
                    '[a]palettegen[p];[b][p]paletteuse', '-loop', '0',
                    str(ASSETS / 'alloy-tech-logo-animation-preview.gif')], check=True)


if __name__ == '__main__':
    render_video()
    save_previews()
    print(f'Saved {OUTPUT}', flush=True)
