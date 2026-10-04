// Documentation artwork, generated with the same modeler as the web app.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = (await readFile(new URL('../src/model.js', import.meta.url), 'utf8'))
  .replace("import Module from 'manifold-3d';", `import Module from ${JSON.stringify(import.meta.resolve('manifold-3d'))};`)
  .replace("import wasmUrl from 'manifold-3d/manifold.wasm?url';", `const wasmUrl = ${JSON.stringify(fileURLToPath(import.meta.resolve('manifold-3d/manifold.wasm')))};`);
const { buildBadge } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

// These contours reproduce public/example.svg, including its quadratic corners.
function path(commands) {
  const points=[]; let current=[0,0];
  for(const command of commands){
    if(command.length===2){current=command;points.push(current);continue;}
    const start=current,[cx,cy,x,y]=command;
    for(let i=1;i<=16;i++){
      const t=i/16,s=1-t;
      points.push([s*s*start[0]+2*s*t*cx+t*t*x,s*s*start[1]+2*s*t*cy+t*t*y]);
    }
    current=[x,y];
  }
  return points.map(([x,y])=>[x-50,50-y]);
}
const artwork={warnings:[],shapes:[
  {color:'#FF8D3A',contours:[path([[12,22],[12,12,22,12],[58,12],[68,12,68,22],[68,78],[68,88,58,88],[22,88],[12,88,12,78]])]},
  {color:'#365EEC',contours:[path([[58,22],[78,22],[88,22,88,32],[88,68],[88,78,78,78],[58,78]])]},
  {color:'#FFFFFF',contours:[path([[30,30],[47,30],[39,47],[53,47],[27,73],[35,54],[23,54]])]},
]};
const defaults={shape:'rect',mode:'multi',width:40,height:40,baseThickness:3,cornerRadius:3,margin:4,reliefHeight:1.2,puzzleClearance:.2,magnetEnabled:false,magnetDiameter:6,magnetThickness:2};
const examples=[
  ['multicolor',{}],['single-color',{mode:'single'}],
  ['hexagon',{shape:'hexagon',cornerRadius:0}],
  ['logo-outline',{shape:'logo',margin:1.5}],
  ['puzzle',{shape:'puzzle'}],
  ['magnets',{magnetEnabled:true,magnetPoints:[[.28,.5],[.72,.5]]}],
];
const models=[];
for(const [name,changes] of examples){
  const result=await buildBadge(artwork,{...defaults,...changes});
  models.push({name,back:name==='magnets',parts:result.parts.map(part=>({color:part.color,positions:Array.from(part.mesh.positions),triangles:Array.from(part.mesh.triangles)}))});
}
await writeFile(process.argv[2] || 'render-models.json', JSON.stringify(models));
console.log('Prepared 6 documentation models.');
