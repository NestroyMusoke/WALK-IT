/** Local-only operator command after an author marker preflight passes. */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createPrivateRouteShare,makeVisitorUrl} from '../server/route-share.ts';

const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const reportPath=process.argv[2];
if(!reportPath)throw Error('Usage: node scripts/issue-route.ts <private-marker-preflight.json>');
const report=JSON.parse(await readFile(resolve(reportPath),'utf8'));
if(report.sourceClass!=='RECORDED REPLAY'||!report.candidate?.accepted||
   report.candidate.configSha256!==report.configSha256||
   report.candidate.sourceCaptureSha256!==report.captureSha256)
 throw Error('Accepted, hash-bound author marker preflight required');
const config=JSON.parse(await readFile(resolve(root,'config/vision.yaml'),'utf8'));
const base=(await readFile(resolve(root,'tmp/phone-link.txt'),'utf8')).trim();
const share=await createPrivateRouteShare(resolve(root,'eval/sessions'),report.candidate,
 Date.now(),config.DIAGNOSTIC_SESSION_TTL_MS);
console.log(JSON.stringify({visitorLink:makeVisitorUrl(base,share.token),
 expiresAt:new Date(share.expiresAtMs).toISOString(),
 routeId:share.routeId,arrowAuthorized:false,
 warning:'Route candidate only. The visitor still needs verified live start and route-follow gates.'},null,2));
