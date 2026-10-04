"""Combine real generated brand meshes in one promotional image."""
import importlib.util
import json
import sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont

spec=importlib.util.spec_from_file_location('badge_renders',Path(__file__).with_name('render-examples.py'))
renderer=importlib.util.module_from_spec(spec);spec.loader.exec_module(renderer)
renderer.W,renderer.H=1200,825
models=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
brands=list(dict.fromkeys(m['brand'] for m in models))
width,height=3600,1680
poster=Image.new('RGB',(width,height),(242,243,238));draw=ImageDraw.Draw(poster)
font_path='C:/Windows/Fonts/msyh.ttc'
font=lambda size:ImageFont.truetype(font_path,size)
draw.text((90,54),'把喜欢的 Logo 做成徽章',font=font(78),fill='#17394b')
draw.text((94,170),'SVG → STL / 3MF     ·     8 个图案，24 个生成示例',font=font(30),fill='#637572')
draw.text((width-90,80),'BADGE\nGENERATOR',font=font(30),fill='#365eec',anchor='ra',align='right')
left,right,top=290,70,330
cell_width=(width-left-right)/len(brands)
for index,brand in enumerate(brands):
    draw.text((left+(index+.5)*cell_width,280),brand,font=font(26),fill='#17394b',anchor='mm')
for row,(shape,title,subtitle) in enumerate([('rect','矩形','RECTANGLE'),('hexagon','六边形','HEXAGON'),('logo','Logo 外形','LOGO OUTLINE')]):
    y=top+row*390
    draw.line((80,y,width-70,y),fill='#d8deda',width=2)
    draw.text((90,y+105),title,font=font(37),fill='#17394b')
    draw.text((94,y+165),subtitle,font=font(19),fill='#7a8885')
    for column,brand in enumerate(brands):
        model=next(m for m in models if m['shape']==shape and m['brand']==brand)
        image=renderer.render(model)
        image=image.resize((int(cell_width)-12,320),Image.Resampling.LANCZOS)
        poster.paste(image,(int(left+column*cell_width)+6,y+30))
    print('Rendered showcase row:',shape,flush=True)
draw.line((80,1510,width-70,1510),fill='#d8deda',width=2)
draw.text((94,1550),'yinbaozong.github.io/badge-generator',font=font(34),fill='#365eec')
draw.text((94,1610),'示例由真实模型网格渲染；品牌标识仅用于展示，不表示品牌合作。',font=font(22),fill='#7a8885')
output=Path(sys.argv[2]);output.parent.mkdir(parents=True,exist_ok=True)
poster.save(output,optimize=True)
print('Saved',output)
