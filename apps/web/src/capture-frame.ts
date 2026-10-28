import {settings} from './settings';
import type {CameraFrame} from './display';
import type {CaptureSample} from './host-capture';
/** Camera background may overfill the canvas. Copy its visible crop, not its
 * uncropped viewport; projection is already calibrated to the full canvas. */
export function viewportCoversCanvas(viewport:number[],width:number,height:number){
 if(viewport.length!==4||![...viewport,width,height].every(Number.isFinite)||width<=0||height<=0)return false;
 const [w,h,x,y]=viewport;
 return w>0&&h>0&&x<=0&&y<=0&&x+w>=width&&y+h>=height;
}
export function captureDimensions(width:number,height:number){
 if(![width,height].every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid capture dimensions');
 const ratio=Math.min(1,settings.HOST_IMAGE_MAX_EDGE_PX/Math.max(width,height));
 return {width:Math.max(1,Math.round(width*ratio)),height:Math.max(1,Math.round(height*ratio))};
}
export function copyCaptureFrame(source:HTMLCanvasElement,stamp:{t:number;videoTime:number;revision:number;frame:CameraFrame},read=(source:HTMLCanvasElement,width:number,height:number)=>{
 const copy=document.createElement('canvas');copy.width=width;copy.height=height;
 const ctx=copy.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Camera copy unavailable');
 ctx.drawImage(source,0,0,width,height);const data=ctx.getImageData(0,0,width,height).data;copy.width=copy.height=0;return data;
}):CaptureSample{
 const {width,height}=captureDimensions(source.width,source.height);
 // Called synchronously after the camera renderer, before any virtual drawing.
 const rgba=read(source,width,height),f=stamp.frame;
 return {...stamp,width,height,rgba,tracking:true,frame:{position:[...f.position],rotation:[...f.rotation],projection:[...f.projection]}};
}
