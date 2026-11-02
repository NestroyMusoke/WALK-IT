import {PerspectiveCamera} from 'three';
import {ViewportCalibration,projectReference,type CameraFrame,type WorldPoint} from './display';
import {ReferenceRenderer} from './reference-renderer';
import {settings,configurationHash} from './settings';
import type {AuthorizedRouteArrow} from './route-arrow';
export function fixtureCamera(width:number,height:number,moved=false):CameraFrame{
  const camera=new PerspectiveCamera(settings.QA_CAMERA_FOV_DEG,width/height,settings.NEAR_CLIP_M,settings.FAR_CLIP_M);
  if(moved){camera.position.set(0.25,0.1,0.1);camera.rotation.y=0.1;}
  return {position:camera.position.toArray(),rotation:camera.quaternion.toArray(),projection:camera.projectionMatrix.toArray()};
}
export async function runDisplayCheck(){
  const canvas=document.createElement('canvas'),binding=new ViewportCalibration();
  const renderer=new ReferenceRenderer(canvas),point:WorldPoint=[0.15,0.2,-2];
  const results=[];
  try{
    for(const [width,height] of [[428,781],[781,428]])for(const dpr of [1,2])for(const moved of [false,true]){
      const size=binding.sync(canvas,width,height,dpr),frame=fixtureCamera(width,height,moved);
      renderer.draw(point,frame,size.width,size.height,size.ratio,true);
      const gl=renderer.renderer.getContext();const pixels=new Uint8Array(size.width*size.height*4);
      gl.readPixels(0,0,size.width,size.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
      let count=0,totalX=0,totalY=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(let y=0;y<size.height;y++)for(let x=0;x<size.width;x++){
        const i=4*(y*size.width+x);
        if(pixels[i]===255&&pixels[i+1]===0&&pixels[i+2]===255){
          count++;totalX+=x+0.5;totalY+=y+0.5;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        }
      }
      const expected=projectReference(point,frame,width,height)!;
      const errorPx=count?Math.hypot(totalX/count-expected.x*size.ratio,totalY/count-(height-expected.y)*size.ratio):Infinity;
      const shapeErrorPx=Math.abs((maxX-minX)-(maxY-minY));const glError=gl.getError();
      results.push({width,height,dpr,moved,bufferWidth:size.width,bufferHeight:size.height,pixels:count,errorPx,shapeErrorPx,glError,
        passed:count>0&&errorPx<=settings.QA_PIXEL_TOLERANCE_PX&&shapeErrorPx<=settings.QA_PIXEL_TOLERANCE_PX&&glError===gl.NO_ERROR});
    }
    return {build:'E02-1',kind:'synthetic GPU rasterization; not phone tracking',configSha256:await configurationHash(),
      passed:results.every(r=>r.passed),results};
  }finally{renderer.dispose();}
}
/** Synthetic WebGL arrow raster check. No camera or localization claim. */
export function runArrowRasterCheck(arrow:AuthorizedRouteArrow,frame:CameraFrame){
 const canvas=document.createElement('canvas');canvas.width=500;canvas.height=500;
 const renderer=new ReferenceRenderer(canvas);
 try{
  renderer.draw(null,frame,canvas.width,canvas.height,1,true,arrow);
  const gl=renderer.renderer.getContext();const pixels=new Uint8Array(canvas.width*canvas.height*4);
  gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  let coloredPixels=0;
  for(let i=0;i<pixels.length;i+=4)if(pixels[i+1]>pixels[i]&&pixels[i]>pixels[i+2])coloredPixels++;
  const glError=gl.getError();
  return {kind:'synthetic WebGL route arrow; not phone navigation',coloredPixels,glError,passed:coloredPixels>0&&glError===gl.NO_ERROR};
 }finally{renderer.dispose();}
}
