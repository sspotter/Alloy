"""Render the editable 75-second brand film with local narration and original music."""
import json
import math
import subprocess
import wave
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
TEMP = ROOT / 'tmp' / 'film'
TEMP.mkdir(parents=True, exist_ok=True)
SCENES = json.loads((ROOT / 'scripts' / 'film-scenes.json').read_text(encoding='utf-8'))
WIDTH, HEIGHT, FPS = 1280, 720, 24
PAPER, INK, GREEN, FOREST, LIME = '#f5f4ee', '#232b24', '#335b43', '#243b2c', '#d7e3b8'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def font(size):
    face = ImageFont.truetype(str(ASSETS / 'manrope.ttf'), size)
    face.set_variation_by_axes([500])
    return face


def wrapped(draw, text, size, width):
    words, lines, current = text.split(), [], ''
    face = font(size)
    for word in words:
        candidate = (current + ' ' + word).strip()
        if draw.textlength(candidate, font=face) > width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return '\n'.join(lines)


def arrow(draw, start, end, color=GREEN):
    draw.line([start, end], fill=color, width=3)
    x, y = end
    draw.line([(x-9,y-7), end, (x-9,y+7)], fill=color, width=3)


def base_scene(scene):
    dark = scene['kind'] in ['objective', 'closing']
    bg, fg = (FOREST, PAPER) if dark else (PAPER, INK)
    image = Image.new('RGB', (WIDTH, HEIGHT), bg)
    draw = ImageDraw.Draw(image)
    draw.text((64,32), 'Yousef Mamdouh & collaborators', fill=fg, font=font(17))
    draw.text((1020,32), 'Cairo · Applied AI', fill=fg, font=font(16))
    draw.line((64,76,1216,76), fill='#53644d' if dark else '#dadcd1')
    title_size = 60 if scene['kind'] not in ['project','terminals','forecast'] else 43
    draw.multiline_text((64,119), scene['title'], fill=fg, font=font(title_size), spacing=6)
    subtitle_y = 285 if '\n' in scene['title'] else 201
    draw.text((66,subtitle_y), scene['subtitle'], fill=LIME if dark else GREEN, font=font(22))
    kind = scene['kind']
    if kind == 'identity':
        for x,label in [(145,'AI engineering'),(500,'Product engineering'),(855,'Developer tools')]:
            draw.rounded_rectangle((x,375,x+270,490), radius=12, outline=GREEN, width=2)
            draw.text((x+23,413), label, font=font(23), fill=GREEN)
        arrow(draw,(422,433),(488,433)); arrow(draw,(777,433),(843,433))
        draw.text((376,525), 'One purpose. Connected capabilities.', fill=INK, font=font(26))
    elif kind == 'objective':
        for x,number,title,desc in [(65,'01','Respect boundaries','Access follows permission.'),(468,'02','Measure improvement','Evaluate before promotion.'),(871,'03','Fit real workflows','Connect AI to useful software.')]:
            draw.line((x,340,x+340,340), fill='#6a7e5d', width=2)
            draw.text((x,362), title, fill=PAPER, font=font(27))
            draw.text((x,410),desc,fill=LIME,font=font(18))
    elif kind == 'project':
        screenshot = Image.open(ASSETS / scene['image']).convert('RGB')
        screenshot.thumbnail((1100,340), Image.Resampling.LANCZOS)
        image.paste(screenshot,((WIDTH-screenshot.width)//2,260))
        draw.text((65,610),scene['status']+' · Actual project interface',fill=GREEN,font=font(16))
    elif kind == 'terminals':
        for index,label in enumerate(['agent / frontend','agent / backend','shell / tests','agent / review']):
            x,y = 65+(index%2)*586,280+(index//2)*144
            draw.rounded_rectangle((x,y,x+554,y+125),radius=10,fill=FOREST)
            draw.text((x+22,y+14),label,fill=LIME,font=font(19))
            draw.line((x+20,y+50,x+534,y+50),fill='#52624d')
            draw.text((x+22,y+68),'$ working in parallel_',fill=PAPER,font=font(23))
        draw.text((65,599),scene['status'],fill=GREEN,font=font(16))
    elif kind == 'forecast':
        draw.text((65,315),'Explore.\nForecast.\nLearn.',fill=GREEN,font=font(47))
        points=[(490,524),(560,493),(625,512),(695,432),(770,456),(840,385),(915,408),(980,319)]
        draw.line((470,560,1190,560),fill='#bbc1af',width=2)
        draw.line(points,fill=GREEN,width=5)
        for n in range(8):
            x=980+n*24; y=319-n*9
            draw.line((x,y,x+12,y-5),fill=GREEN,width=4)
        draw.text((65,601),scene['status']+' · Not market data',fill=GREEN,font=font(16))
    elif kind == 'audience':
        for x,label in [(65,'Understand'),(363,'Define success'),(661,'Build'),(959,'Evaluate')]:
            draw.rounded_rectangle((x,388,x+247,473),radius=10,fill='#e2e7d9')
            draw.text((x+20,413),label,fill=GREEN,font=font(25))
            if x<959: arrow(draw,(x+254,430),(x+287,430))
        draw.text((65,529),'Organizations exploring private AI. Engineering teams. Pilot partners.',fill=INK,font=font(23))
    elif kind == 'closing':
        draw.text((65,369),'Private, measurable AI engineering.',fill=LIME,font=font(30))
        draw.text((65,452),'Start a conversation.',fill=PAPER,font=font(24))
        draw.text((65,502),'mamdouhy614@gmail.com',fill=LIME,font=font(24))
    return image


def make_audio():
    rate = 48000
    audio = np.zeros(rate*75,dtype=np.float64)
    for i,scene in enumerate(SCENES):
        with wave.open(str(TEMP/f'{i}.wav')) as clip:
            samples=np.frombuffer(clip.readframes(clip.getnframes()),dtype='<i2').astype(np.float64)/32768
            channels=clip.getnchannels()
            if channels>1: samples=samples.reshape(-1,channels).mean(axis=1)
            duration=len(samples)/clip.getframerate()
            # Leave breathing space around narration and a five-second closing hold.
            budget=scene['end']-scene['start']-(5 if scene['kind']=='closing' else .65)
            target_duration=min(duration,budget)
            tempo=duration/target_duration
            # Preserve voice pitch when fitting narration to the scene duration.
            decoded=subprocess.run([FFMPEG,'-v','error','-i',str(TEMP/f'{i}.wav'),'-af',f'atempo={tempo}','-ar',str(rate),'-ac','1','-f','s16le','-'],capture_output=True,check=True)
            samples=np.frombuffer(decoded.stdout,dtype='<i2').astype(np.float64)/32768
            scene['speech_duration']=len(samples)/rate
            start=int((scene['start']+.35)*rate)
            audio[start:start+len(samples)]+=samples*.87
    t=np.arange(len(audio))/rate
    music=np.zeros_like(audio)
    for start,freqs in [(0,[130.81,164.81,196]),(15,[110,130.81,164.81]),(30,[87.31,130.81,174.61]),(45,[98,146.83,196]),(60,[130.81,164.81,196])]:
        local=t-start
        envelope=np.clip(local/2,0,1)*np.clip((start+16-t)/2,0,1)
        for frequency in freqs:
            music+=envelope*(np.sin(2*np.pi*frequency*t)+.2*np.sin(2*np.pi*frequency*2*t))*.008
    fade=np.minimum(np.clip(t/2,0,1),np.clip((75-t)/3,0,1))
    audio=np.clip((audio+music)*fade,-.98,.98)
    with wave.open(str(TEMP/'mix.wav'),'wb') as output:
        output.setparams((1,2,rate,len(audio),'NONE','not compressed'))
        output.writeframes((audio*32767).astype('<i2').tobytes())


def render():
    make_audio()
    bases=[base_scene(scene) for scene in SCENES]
    for i,frame in enumerate(bases): frame.save(TEMP/f'scene-{i}.jpg',quality=90)
    bases[0].save(ASSETS/'brand-film-poster.jpg',quality=95)
    command=[FFMPEG,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}','-r',str(FPS),'-i','-','-i',str(TEMP/'mix.wav'),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-t','75',str(ASSETS/'brand-film.mp4')]
    process=subprocess.Popen(command,stdin=subprocess.PIPE,stderr=(TEMP/'encode.log').open('w'))
    for frame_number in range(75*FPS):
        time=frame_number/FPS
        index=next(i for i,scene in enumerate(SCENES) if scene['start']<=time<scene['end'])
        scene=SCENES[index]
        elapsed=time-scene['start']
        frame=bases[index].copy()
        # Short dissolves unite the visual language without hiding readable content.
        if index>0 and elapsed<.45:
            frame=Image.blend(bases[index-1],frame,elapsed/.45)
        draw=ImageDraw.Draw(frame)
        if scene['kind'] in ['identity','objective','audience']:
            x=int(65+((elapsed*.1)%1)*1150)
            y = 433 if scene['kind']=='identity' else (430 if scene['kind']=='audience' else 485)
            draw.ellipse((x,y-5,x+10,y+5),fill=LIME if scene['kind']=='objective' else GREEN)
        # Narration is broken into readable timed caption chunks.
        words=scene['voice'].split()
        chunks=[' '.join(words[n:n+12]) for n in range(0,len(words),12)]
        speech_end=.35+scene['speech_duration']
        if .35<=elapsed<speech_end:
            chunk=min(len(chunks)-1,int((elapsed-.35)/max(.1,speech_end-.35)*len(chunks)))
            caption=wrapped(draw,chunks[chunk],20,1100)
            draw.rectangle((40,643,1240,705),fill=INK)
            draw.multiline_text((640,654),caption,font=font(20),fill=PAPER,anchor='ma',align='center',spacing=3)
        draw.rectangle((0,717,int(WIDTH*time/75),720),fill=LIME if scene['kind']=='closing' else GREEN)
        process.stdin.write(frame.tobytes())
        if frame_number%(FPS*5)==0: print(f'Rendered {int(time)} / 75 seconds',flush=True)
    process.stdin.close()
    if process.wait()!=0: raise RuntimeError((TEMP/'encode.log').read_text())
    print('Saved assets/brand-film.mp4',flush=True)


if __name__=='__main__':
    render()
