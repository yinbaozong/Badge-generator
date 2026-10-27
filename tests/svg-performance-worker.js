import { buildBadge, initializeModeler } from '../src/model.js';
self.onmessage = async ({data}) => {
  await initializeModeler();
  const start = performance.now();
  try {
    const result = await buildBadge(data.artwork,{shape:data.shape,mode:'multi',width:40,height:40,margin:4});
    self.postMessage({done:true,shape:data.shape,ms:performance.now()-start,stats:result.stats});
  } catch(error) { self.postMessage({done:true,shape:data.shape,error:error.message}); }
};
