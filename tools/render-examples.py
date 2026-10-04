"""Render documentation meshes with a small orthographic CPU renderer.

Usage: python tools/render-examples.py render-models.json docs/images
Requires Pillow and NumPy. These are documentation assets, not print tests.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

models = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
destination = Path(sys.argv[2])
destination.mkdir(parents=True, exist_ok=True)
W, H = 1600, 1100

def render(model):
    direction = np.array([.18, -.25, -1] if model['back'] else [.35, -.62, .8])
    direction /= np.linalg.norm(direction)
    right = np.cross([0, 0, 1], direction)
    right /= np.linalg.norm(right)
    up = np.cross(direction, right)
    matrix = np.array([right, up, direction]).T
    vertices = np.concatenate([np.asarray(p['positions']).reshape(-1, 3) for p in model['parts']])
    projected = vertices @ matrix
    low, high = projected.min(axis=0), projected.max(axis=0)
    scale = min(W * .76 / (high[0]-low[0]), H * .72 / (high[1]-low[1]))
    middle = (low+high)/2
    depth = np.full((H, W), -np.inf)
    pixels = np.full((H, W, 3), [242, 243, 238], dtype=np.uint8)
    light = direction + np.array([-.35, -.1, .6 if not model['back'] else -.6])
    light /= np.linalg.norm(light)
    for part in model['parts']:
        v = np.asarray(part['positions']).reshape(-1, 3)
        triangles = np.asarray(part['triangles']).reshape(-1, 3)
        projected = v @ matrix
        screen = np.column_stack(((projected[:,0]-middle[0])*scale+W/2,
                                  H*.46-(projected[:,1]-middle[1])*scale))
        color = np.array([int(part['color'][i:i+2],16) for i in (1,3,5)])
        for ids in triangles:
            a,b,c = v[ids]
            normal = np.cross(b-a,c-a)
            length = np.linalg.norm(normal)
            if length < 1e-10:
                continue
            normal /= length
            if np.dot(normal,direction) <= 0:
                continue
            coords = screen[ids]
            x0,y0 = np.maximum(np.floor(coords.min(axis=0)).astype(int),[0,0])
            x1,y1 = np.minimum(np.ceil(coords.max(axis=0)).astype(int),[W-1,H-1])
            if x1<x0 or y1<y0:
                continue
            xx,yy = np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5)
            p,q,r = coords
            denominator = (q[1]-r[1])*(p[0]-r[0])+(r[0]-q[0])*(p[1]-r[1])
            if abs(denominator)<1e-8:
                continue
            alpha = ((q[1]-r[1])*(xx-r[0])+(r[0]-q[0])*(yy-r[1]))/denominator
            beta = ((r[1]-p[1])*(xx-r[0])+(p[0]-r[0])*(yy-r[1]))/denominator
            gamma = 1-alpha-beta
            z = alpha*projected[ids[0],2]+beta*projected[ids[1],2]+gamma*projected[ids[2],2]
            region = depth[y0:y1+1,x0:x1+1]
            mask = (alpha>=-1e-7)&(beta>=-1e-7)&(gamma>=-1e-7)&(z>region)
            region[mask]=z[mask]
            shading = .68+.32*max(0,np.dot(normal,light))
            if model['back'] and normal[2] < -.9 and a[2] > .1:
                shading *= .72  # Recessed floors receive less ambient light.
            pixels[y0:y1+1,x0:x1+1][mask] = np.minimum(255,color*shading).astype(np.uint8)
    silhouette = Image.fromarray((np.isfinite(depth)*38).astype(np.uint8))
    shadow = Image.new('L',(W,H));shadow.paste(silhouette,(12,30))
    shadow=shadow.filter(ImageFilter.GaussianBlur(26))
    background=Image.new('RGB',(W,H),(242,243,238))
    background.paste(Image.new('RGB',(W,H),(102,116,113)),mask=shadow)
    mesh=Image.fromarray(pixels)
    background.paste(mesh,mask=Image.fromarray((np.isfinite(depth)*255).astype(np.uint8)))
    background.resize((1000,688),Image.Resampling.LANCZOS).save(destination/f"{model['name']}.png",optimize=True)

for model in models:
    render(model)
print('Rendered 6 documentation images.')
