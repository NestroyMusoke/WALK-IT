export function summarizeTrajectory(positions:number[][],times:number[]){
 if(positions.length<2||times.length!==positions.length||positions.some(p=>p.length!==3||!p.every(Number.isFinite))||times.some((t,i)=>!Number.isFinite(t)||t<0||(i>0&&t<=times[i-1])))throw Error('Invalid trajectory');
 const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
 return {frames:positions.length,durationMs:times.at(-1)!-times[0],pathLengthTrackerUnits:positions.slice(1).reduce((sum,p,i)=>sum+distance(p,positions[i]),0),endpointDistanceTrackerUnits:distance(positions[0],positions.at(-1)!),navigationReady:false};
}
