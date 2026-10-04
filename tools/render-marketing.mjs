// Documentation-only DOM facade for local SVGs prepared by the Python XML parser.
// Geometry, SVG validation, paint handling and fitting use the application code.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {Color,SRGBColorSpace} from 'three';

const inputs=JSON.parse(await readFile(process.argv[2],'utf8'));
const documents=new Map(inputs.map(input=>[input.text,input.root]));
class Element {
  constructor(data,parent=null){
    this.nodeType=1;this.nodeName=this.localName=data.tag;this.parentElement=parent;
    this.attrs={...data.attrs};this.text=data.text;this.children=data.children.map(c=>new Element(c,this));
    const styles=Object.fromEntries((this.attrs.style||'').split(';').filter(v=>v.includes(':')).map(v=>{const i=v.indexOf(':');return [v.slice(0,i).trim(),v.slice(i+1).trim()];}));
    this.style=new Proxy({getPropertyValue:n=>styles[n]||'',setProperty:(n,v)=>{styles[n]=v;}},{get:(target,key)=>key in target?target[key]:styles[key]||''});
  }
  get childNodes(){return this.children;}
  get textContent(){return this.text+this.children.map(c=>c.textContent).join('');}
  get attributes(){return Object.entries(this.attrs).map(([name,value])=>({name,localName:name.split(':').at(-1),value}));}
  hasAttribute(name){return name in this.attrs;}
  getAttribute(name){return this.attrs[name]??null;}
  getAttributeNS(_,name){return this.getAttribute(name);}
  setAttribute(name,value){this.attrs[name]=String(value);}
  remove(){this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
  querySelectorAll(selector){const tags=selector.split(',').map(v=>v.trim());return this.children.flatMap(c=>[c,...c.querySelectorAll('*')]).filter(c=>tags.includes('*')||tags.includes(c.localName));}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  json(){return {tag:this.localName,attrs:this.attrs,text:this.text,children:this.children.map(c=>c.json())};}
}
class Document {
  constructor(root){this.documentElement=new Element(root);}
  querySelectorAll(selector){const root=this.documentElement;return [root,...root.querySelectorAll('*')].filter(c=>selector==='*'||selector.split(',').map(v=>v.trim()).includes(c.localName));}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getElementById(id){return this.querySelectorAll('*').find(c=>c.getAttribute('id')===id)||null;}
}
globalThis.DOMParser=class{parseFromString(text){const root=documents.get(text);if(!root)throw new Error('Unknown documentation SVG');return new Document(root);}};
let normalizedId=0;
globalThis.XMLSerializer=class{serializeToString(doc){const key='normalized-document-'+(++normalizedId);documents.set(key,doc.documentElement.json());return key;}};
const context={color:'#000000',clearRect(){},fillRect(){},
  get fillStyle(){return this.color;},
  set fillStyle(css){
    if(!/^(#[\da-f]{3,8}|(?:rgb|hsl)a?\(.+\)|black|white|orange|blue|red|green|yellow|gray|grey)$/i.test(css))return;
    const color=new Color().setStyle(css);this.color='#'+color.getHexString(SRGBColorSpace);
  },
  getImageData(){return {data:new Uint8Array([...this.color.slice(1).match(/../g).map(v=>parseInt(v,16)),255])};},
};
globalThis.document={createElement:()=>({getContext:()=>context})};
const svgSource=(await readFile(new URL('../src/svg.js',import.meta.url),'utf8'))
  .replace("'three/addons/loaders/SVGLoader.js'",JSON.stringify(import.meta.resolve('three/addons/loaders/SVGLoader.js')));
const {parseArtwork}=await import('data:text/javascript;base64,'+Buffer.from(svgSource).toString('base64'));
const modelSource=(await readFile(new URL('../src/model.js',import.meta.url),'utf8'))
  .replace("import Module from 'manifold-3d';",`import Module from ${JSON.stringify(import.meta.resolve('manifold-3d'))};`)
  .replace("import wasmUrl from 'manifold-3d/manifold.wasm?url';",`const wasmUrl=${JSON.stringify(fileURLToPath(import.meta.resolve('manifold-3d/manifold.wasm')))};`);
const {buildBadge}=await import('data:text/javascript;base64,'+Buffer.from(modelSource).toString('base64'));
const shapes=['rect','hexagon','logo'];
const output=[];
for(const input of inputs){
  const artwork=parseArtwork(input.text);
  const mode=['Apple','OpenAI','Codex','Tesla'].includes(input.name)?'single':'multi';
  for(const shape of shapes){
    const result=await buildBadge(artwork,{shape,mode,width:40,height:40,margin:shape==='logo'?1:2,baseThickness:2,reliefHeight:.8,cornerRadius:shape==='hexagon'?0:3});
    output.push({name:input.filename.replace('.svg','')+'-'+shape,brand:input.name,shape,back:false,
      parts:result.parts.map(p=>({color:p.color,positions:Array.from(p.mesh.positions),triangles:Array.from(p.mesh.triangles)}))});
  }
  console.log('Generated documentation models:',input.name);
}
await writeFile(process.argv[3],JSON.stringify(output));
