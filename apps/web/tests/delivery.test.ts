import {it,expect,vi} from 'vitest';
import {deliverReport} from '../src/delivery';
it('requires a saved receipt with the same session before acknowledging',async()=>{
  const session={id:'test-session',token:'test-token'};
  const request=vi.fn().mockResolvedValue(new Response(JSON.stringify({saved:true,id:session.id,passed:true}),{status:201}));
  expect((await deliverReport({},session,request)).saved).toBe(true);
  request.mockResolvedValue(new Response(JSON.stringify({saved:true,id:'wrong'}),{status:200}));
  await expect(deliverReport({},session,request)).rejects.toThrow();
  request.mockResolvedValue(new Response('unavailable',{status:503}));
  await expect(deliverReport({},session,request)).rejects.toThrow();
});
