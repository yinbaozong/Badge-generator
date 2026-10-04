// Experimental local raster tracing: transparency, edge-connected matte removal,
// color quantization and oriented pixel-boundary contours. No remote service.
const MAX_SIDE = 1024;
const ANALYSIS_SIDE = 2048;
const ALPHA_CUTOFF = 128;
function distance(a, b) { return (a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2; }
function area(points) { return points.reduce((sum, p, i) => { const q=points[(i+1)%points.length]; return sum+p[0]*q[1]-q[0]*p[1]; },0)/2; }
function simplifyOpen(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length); keep[0]=keep[points.length-1]=1;
  const stack=[[0,points.length-1]];
  while(stack.length) {
    const [a,b]=stack.pop(), p=points[a], q=points[b], dx=q[0]-p[0],dy=q[1]-p[1],len=dx*dx+dy*dy;
    let far=-1, max=tolerance*tolerance;
    for(let i=a+1;i<b;i++) {
      const r=points[i],t=len?Math.max(0,Math.min(1,((r[0]-p[0])*dx+(r[1]-p[1])*dy)/len)):0;
      const d=(r[0]-p[0]-t*dx)**2+(r[1]-p[1]-t*dy)**2;
      if(d>max){max=d;far=i;}
    }
    if(far!==-1){keep[far]=1;stack.push([a,far],[far,b]);}
  }
  return points.filter((_,i)=>keep[i]);
}
function simplifyRing(points) {
  // Smooth the uniformly spaced boundary BEFORE simplification. Rounding each
  // pixel corner alone left whole staircase segments on curved letters.
  if (points.length > 16) {
    const weights = Array.from({length:11},(_,i)=>Math.exp(-((i-5)**2)/(2*2.5**2)));
    const total = weights.reduce((sum,weight)=>sum+weight,0);
    for (let pass=0;pass<3;pass++) points=points.map((_,i)=>{
      const p=[0,0];
      for(let j=-5;j<=5;j++){
        const q=points[(i+j+points.length)%points.length], weight=weights[j+5]/total;
        p[0]+=q[0]*weight;p[1]+=q[1]*weight;
      }
      return p;
    });
  }
  let pivot=1,far=0;
  for(let i=1;i<points.length;i++){const d=(points[i][0]-points[0][0])**2+(points[i][1]-points[0][1])**2;if(d>far){far=d;pivot=i;}}
  let fitted = simplifyOpen(points.slice(0,pivot+1),.25).slice(0,-1)
    .concat(simplifyOpen(points.slice(pivot).concat([points[0]]),.25).slice(0,-1));
  // Short fitted segments still showed tiny corners when extruded. Subdivide
  // the final ring with corner cutting; preserve winding and small contours.
  if (fitted.length > 16) for (let pass=0;pass<2;pass++) {
    const curved=[];
    for(let i=0;i<fitted.length;i++){
      const a=fitted[i],b=fitted[(i+1)%fitted.length];
      curved.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],
        [a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
    }
    fitted=curved;
  }
  return fitted;
}
function contoursFor(labels,w,h,color) {
  const edges=[],from=new Map(),stride=w+1;
  function edge(x0,y0,x1,y1,dir) {
    if (edges.length >= 200000) throw new Error('图片轮廓过于复杂，请使用更简单的图案。');
    const start=y0*stride+x0,end=y1*stride+x1,index=edges.length;
    edges.push({start,end,dir,used:false});
    if(!from.has(start))from.set(start,[]);
    from.get(start).push(index);
  }
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;if(labels[i]!==color)continue;
    if(!y||labels[i-w]!==color)edge(x,y,x+1,y,0);
    if(x===w-1||labels[i+1]!==color)edge(x+1,y,x+1,y+1,1);
    if(y===h-1||labels[i+w]!==color)edge(x+1,y+1,x,y+1,2);
    if(!x||labels[i-1]!==color)edge(x,y+1,x,y,3);
  }
  const result=[];
  for(let first=0;first<edges.length;first++){
    if(edges[first].used)continue;
    const loop=[],start=edges[first].start;let index=first,closed=false;
    for(let step=0;step<=edges.length;step++){
      const current=edges[index];if(current.used)break;
      current.used=true;loop.push([current.start%stride,Math.floor(current.start/stride)]);
      if(current.end===start){closed=true;break;}
      const choices=(from.get(current.end)||[]).filter(i=>!edges[i].used);
      const priority=[(current.dir+1)%4,current.dir,(current.dir+3)%4,(current.dir+2)%4];
      choices.sort((a,b)=>priority.indexOf(edges[a].dir)-priority.indexOf(edges[b].dir));
      if(!choices.length)break;index=choices[0];
    }
    if(closed&&loop.length>=3&&Math.abs(area(loop))>=3){
      const simplified=simplifyRing(loop);if(simplified.length>=3)result.push(simplified);
    }
  }
  return result;
}

/** Replace tiny disconnected color specks with their surrounding label. */
function cleanSpecks(labels, w, h) {
  const seen = new Uint8Array(labels.length), queue = new Int32Array(labels.length);
  const minimum = Math.max(8, Math.round(labels.length / 60000));
  for (let start = 0; start < labels.length; start++) {
    if (seen[start] || labels[start] < 0) continue;
    const label = labels[start], neighbors = new Map();
    let head = 0, tail = 1; queue[0] = start; seen[start] = 1;
    while (head < tail) {
      const i = queue[head++], x = i % w, y = Math.floor(i / w);
      const adjacent = [];
      if (x) adjacent.push(i - 1); if (x < w - 1) adjacent.push(i + 1);
      if (y) adjacent.push(i - w); if (y < h - 1) adjacent.push(i + w);
      for (const j of adjacent) {
        if (labels[j] === label) {
          if (!seen[j]) { seen[j] = 1; queue[tail++] = j; }
        } else neighbors.set(labels[j], (neighbors.get(labels[j]) || 0) + 1);
      }
    }
    if (tail < minimum && neighbors.size) {
      const replacement = [...neighbors].sort((a, b) => b[1] - a[1])[0][0];
      for (let i = 0; i < tail; i++) labels[queue[i]] = replacement;
    }
  }
}

export async function traceRaster(file, removeBackground=true) {
  if(file.size>15*1024*1024)throw new Error('图片超过 15 MB，请缩小后再上传。');
  let bitmap;
  try{bitmap=await createImageBitmap(file);}catch{throw new Error('图片无法读取，请上传 PNG 或 JPG 文件。');}
  try {
    if(bitmap.width*bitmap.height>40_000_000)throw new Error('图片分辨率过大，请先缩小到 4000 像素以内。');
    const ratio=Math.min(1,ANALYSIS_SIDE/Math.max(bitmap.width,bitmap.height));
    let w=Math.max(1,Math.round(bitmap.width*ratio)),h=Math.max(1,Math.round(bitmap.height*ratio));
    let canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    let ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('浏览器无法读取图片像素。');
    ctx.drawImage(bitmap,0,0,w,h);
    let image=ctx.getImageData(0,0,w,h),data=image.data,n=w*h;
    let removed=new Uint8Array(n);
    const warnings=['图片转徽章为实验功能：适合清晰图标和纯色背景；照片会简化为最多 6 种颜色。'];
    let transparent=0;
    for(let i=0;i<n;i++)if(data[4*i+3]<ALPHA_CUTOFF){removed[i]=1;transparent++;}
    if(removeBackground&&transparent<n*.01){
      const sample=(x,y)=>Array.from(data.slice(4*(y*w+x),4*(y*w+x)+3));
      const corners=[sample(0,0),sample(w-1,0),sample(0,h-1),sample(w-1,h-1)];
      const ranked=corners.map(c=>({color:c,votes:corners.filter(d=>distance(c,d)<35**2).length})).sort((a,b)=>b.votes-a.votes);
      if(ranked[0].votes>=3){
        const bg=ranked[0].color,queue=new Int32Array(n);let head=0,tail=0;
        const add=i=>{if(!removed[i]&&distance([data[4*i],data[4*i+1],data[4*i+2]],bg)<40**2){removed[i]=1;queue[tail++]=i;}};
        for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
        while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
        // Enclosed background inside letters is the same matte as the edges.
        // Remove it too, so holes and antialiased white fringes aren't extruded.
        for(let i=0;i<n;i++)if(distance([data[4*i],data[4*i+1],data[4*i+2]],bg)<70**2)removed[i]=1;
        warnings.push('已去除相近背景色和文字孔洞中的背景；请检查是否误删浅色细节。');
      }else warnings.push('背景颜色不统一，未自动抠除；建议上传透明背景图片。');
    }
    // Crop AFTER masking and BEFORE detail sampling. A small logo in a large
    // empty canvas should receive the same contour detail as a tightly cropped one.
    let left=w, top=h, right=-1, bottom=-1;
    for (let i=0;i<n;i++) {
      if (removed[i]) { data[4*i+3]=0; continue; }
      const x=i%w,y=Math.floor(i/w);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if (right < left) throw new Error('抠图后没有可见图案，请关闭自动去背景或换一张图片。');
    ctx.putImageData(image,0,0);
    const cropWidth=right-left+1,cropHeight=bottom-top+1;
    if (Math.max(cropWidth,cropHeight)/ratio < 200) warnings.push('原图图案分辨率较低，细节无法完全恢复；建议转换为 SVG 后上传。');
    const detailScale=Math.min(4,MAX_SIDE/Math.max(cropWidth,cropHeight));
    const trimmed=document.createElement('canvas');
    trimmed.width=Math.max(1,Math.round(cropWidth*detailScale));
    trimmed.height=Math.max(1,Math.round(cropHeight*detailScale));
    const trimmedContext=trimmed.getContext('2d',{willReadFrequently:true});
    if(!trimmedContext)throw new Error('浏览器无法读取图片像素。');
    trimmedContext.imageSmoothingEnabled=true;trimmedContext.imageSmoothingQuality='high';
    trimmedContext.drawImage(canvas,left,top,cropWidth,cropHeight,0,0,trimmed.width,trimmed.height);
    canvas=trimmed;ctx=trimmedContext;w=canvas.width;h=canvas.height;n=w*h;
    image=ctx.getImageData(0,0,w,h);data=image.data;removed=new Uint8Array(n);
    for(let i=0;i<n;i++)if(data[4*i+3]<ALPHA_CUTOFF)removed[i]=1;

    const bins=new Map(), interiorBins=new Map();let visibleCount=0,interiorCount=0;
    function addSample(target,key,i) {
      if(!target.has(key))target.set(key,{rgb:[0,0,0],count:0});
      const bin=target.get(key);bin.count++;for(let c=0;c<3;c++)bin.rgb[c]+=data[4*i+c];
    }
    for(let i=0;i<n;i++){
      if(removed[i])continue;
      visibleCount++;
      const key=(data[4*i]>>4)*256+(data[4*i+1]>>4)*16+(data[4*i+2]>>4);
      addSample(bins,key,i);
      const x=i%w,y=Math.floor(i/w),rgb=[data[4*i],data[4*i+1],data[4*i+2]];
      if (x && x<w-1 && y && y<h-1 && data[4*i+3]>=240 &&
          [i-1,i+1,i-w,i+w].every(j=>!removed[j] && data[4*j+3]>=240 &&
            distance(rgb,[data[4*j],data[4*j+1],data[4*j+2]])<24**2)) {
        addSample(interiorBins,key,i);interiorCount++;
      }
    }
    if(!bins.size)throw new Error('抠图后没有可见图案，请关闭自动去背景或换一张图片。');
    // Train mostly on stable interior pixels: antialias blends and JPEG edge
    // noise should map to a real color, not become raised extra material islands.
    const training=interiorCount>=Math.max(24,visibleCount*.05)?interiorBins:bins;
    const trainingCount=training===interiorBins?interiorCount:visibleCount;
    const samples=[...training.values()].map(b=>({count:b.count,rgb:b.rgb.map(v=>v/b.count)})).sort((a,b)=>b.count-a.count);
    const centers=[samples[0].rgb.slice()];
    while(centers.length<6&&centers.length<samples.length){
      let selected=null,score=0;
      for(const s of samples){
        if(s.count<Math.max(12,trainingCount*.0075))continue;
        const d=Math.min(...centers.map(c=>distance(c,s.rgb))),weight=d*Math.sqrt(s.count);
        if(d>45**2&&weight>score){score=weight;selected=s;}
      }
      if(!selected)break;centers.push(selected.rgb.slice());
    }
    for(let iteration=0;iteration<7;iteration++){
      const sums=centers.map(()=>[0,0,0,0]);
      for(const s of samples){
        let label=0,best=Infinity;centers.forEach((c,i)=>{const d=distance(c,s.rgb);if(d<best){best=d;label=i;}});
        for(let c=0;c<3;c++)sums[label][c]+=s.rgb[c]*s.count;sums[label][3]+=s.count;
      }
      centers.forEach((c,i)=>{if(sums[i][3])for(let j=0;j<3;j++)c[j]=sums[i][j]/sums[i][3];});
    }
    const colors=centers.map(c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase());
    const labels=new Int8Array(n).fill(-1);
    for(let i=0;i<n;i++){
      if(removed[i]){data[4*i+3]=0;continue;}
      const rgb=[data[4*i],data[4*i+1],data[4*i+2]];let best=Infinity,label=0;
      centers.forEach((c,j)=>{const d=distance(c,rgb);if(d<best){best=d;label=j;}});
      labels[i]=label;
    }
    cleanSpecks(labels,w,h);
    if(removeBackground && centers.length>1){
      const nearWhite=centers.map(c=>Math.min(...c)>235&&Math.max(...c)-Math.min(...c)<18);
      const populations=new Uint32Array(centers.length);
      for(const label of labels)if(label>=0)populations[label]++;
      const old=labels.slice();
      for(let i=0;i<n;i++){
        const label=old[i];
        if(label<0||!nearWhite[label]||populations[label]>visibleCount*.12)continue;
        const x=i%w,y=Math.floor(i/w);let touchesMask=false,replacement=-1,best=Infinity;
        for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
          const px=x+dx,py=y+dy;if(px<0||py<0||px>=w||py>=h){touchesMask=true;continue;}
          const neighbor=old[py*w+px];
          if(neighbor<0)touchesMask=true;
          else if(!nearWhite[neighbor] && dx*dx+dy*dy<best){best=dx*dx+dy*dy;replacement=neighbor;}
        }
        if(touchesMask && replacement>=0)labels[i]=replacement;
      }
    }
    for(let i=0;i<n;i++){
      if(labels[i]<0){data[4*i+3]=0;continue;}
      for(let c=0;c<3;c++)data[4*i+c]=Math.round(centers[labels[i]][c]);data[4*i+3]=255;
    }
    const mask=new Int8Array(n);
    for(let i=0;i<n;i++)mask[i]=labels[i]<0?-1:0;
    const silhouette=contoursFor(mask,w,h,0);
    const shapes=colors.map((color,i)=>({color,fillRule:'NonZero',contours:contoursFor(labels,w,h,i)})).filter(s=>s.contours.length);
    // A shared footprint closes artificial gaps between separately fitted color
    // boundaries. The modeler clips every color to this same outer boundary.
    if(silhouette.length)shapes.unshift({color:colors[0],fillRule:'NonZero',contours:silhouette});
    if(!shapes.length)throw new Error('图片细节太小，无法生成轮廓，请使用更清晰的图案。');
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity,pointCount=0;
    for(const s of shapes)for(const ring of s.contours)for(const [x,y]of ring){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);pointCount++;}
    if(pointCount>180000)throw new Error('图片轮廓过于复杂，请使用更简单的图案。');
    const span=Math.max(x1-x0,y1-y0),cx=(x0+x1)/2,cy=(y0+y1)/2;
    const normalize=ring=>ring.map(([x,y])=>[(x-cx)*100/span,(cy-y)*100/span]);
    for(const s of shapes)s.contours=s.contours.map(normalize);
    ctx.putImageData(image,0,0);
    const previewBlob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    return {shapes,silhouette:silhouette.map(normalize),warnings,pointCount,previewBlob};
  } finally {bitmap.close();}
}
