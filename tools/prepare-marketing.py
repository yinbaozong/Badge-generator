"""Prepare local SVG files for documentation rendering without changing them."""
import json
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

def node(element):
    return {'tag':element.tag.split('}')[-1],
            'attrs':{key.split('}')[-1]:value for key,value in element.attrib.items()},
            'text':element.text or '', 'children':[node(child) for child in element]}

source=Path(sys.argv[1])
selection=[('claude-code.svg','Claude Code'),('codex-openai.svg','Codex'),
           ('openai.svg','OpenAI'),('apple.svg','Apple'),('python.svg','Python'),
           ('cloudflare.svg','Cloudflare'),('tesla.svg','Tesla'),
           ('alibabacloud-color.svg','Alibaba Cloud')]
items=[]
for filename,name in selection:
    text=(source/filename).read_text(encoding='utf-8-sig')
    items.append({'name':name,'filename':filename,'text':text,'root':node(ET.fromstring(text))})
Path(sys.argv[2]).write_text(json.dumps(items,ensure_ascii=False),encoding='utf-8')
