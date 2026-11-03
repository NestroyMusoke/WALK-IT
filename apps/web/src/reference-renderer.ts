import {BufferGeometry,Float32BufferAttribute,PerspectiveCamera,Points,Scene,ShaderMaterial,WebGLRenderer} from 'three';
import type {CameraFrame,WorldPoint} from './display';
import {isAuthorizedRouteArrow,type AuthorizedRouteArrow} from './route-arrow';
import {settings} from './settings';
export class ReferenceRenderer {
  readonly renderer:WebGLRenderer;
  readonly camera=new PerspectiveCamera();
  private scene=new Scene();
  private geometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0],3));
  private material=new ShaderMaterial({
    uniforms:{pointSize:{value:settings.MARKER_SIZE_CSS_PX},stroke:{value:settings.CROSS_HALF_STROKE_FRACTION}},
    vertexShader:'uniform float pointSize; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=pointSize;}',
    fragmentShader:'uniform float stroke; void main(){vec2 d=abs(2.0*gl_PointCoord-1.0);if(min(d.x,d.y)>stroke)discard;gl_FragColor=vec4(1.0,0.0,1.0,1.0);}',
    depthTest:false,depthWrite:false
  });
  private reference=new Points(this.geometry,this.material);
  private arrowGeometry=new BufferGeometry().setAttribute('position',new Float32BufferAttribute([0,0,0],3));
  private arrowMaterial=new ShaderMaterial({
    uniforms:{pointSize:{value:settings.MARKER_SIZE_CSS_PX},stroke:{value:settings.CROSS_HALF_STROKE_FRACTION},angle:{value:0}},
    vertexShader:'uniform float pointSize; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_PointSize=pointSize;}',
    fragmentShader:'uniform float stroke; uniform float angle; void main(){vec2 p=2.0*gl_PointCoord-1.0;float c=cos(angle),s=sin(angle);vec2 q=vec2(c*p.x+s*p.y,-s*p.x+c*p.y);bool shaft=q.x>=-1.0&&q.x<=0.0&&abs(q.y)<=stroke;bool head=q.x>=0.0&&q.x<=1.0&&abs(q.y)<=1.0-q.x;if(!shaft&&!head)discard;gl_FragColor=vec4(0.73,0.96,0.33,1.0);}',
    depthTest:false,depthWrite:false
  });
  private arrow=new Points(this.arrowGeometry,this.arrowMaterial);
  constructor(canvas:HTMLCanvasElement,context?:WebGL2RenderingContext,private transparent=false){
    this.renderer=new WebGLRenderer({canvas,context,antialias:false,alpha:transparent,preserveDrawingBuffer:false});
    this.renderer.autoClear=false;this.reference.frustumCulled=false;this.arrow.frustumCulled=false;
    this.scene.add(this.reference,this.arrow);
  }
  draw(point:WorldPoint|null,frame:CameraFrame,width:number,height:number,ratio:number,clear=false,routeArrow:AuthorizedRouteArrow|null=null){
    this.renderer.resetState();this.renderer.setViewport(0,0,width,height);
    if(clear){this.renderer.setClearColor(this.transparent?0x000000:0x101e22,this.transparent?0:1);this.renderer.clear(true,true,true);}
    this.reference.visible=Boolean(point);this.arrow.visible=isAuthorizedRouteArrow(routeArrow);
    if(point||this.arrow.visible){
      this.camera.position.fromArray(frame.position);this.camera.quaternion.fromArray(frame.rotation);
      this.camera.projectionMatrix.fromArray(frame.projection);this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
      this.camera.updateMatrixWorld(true);if(point)this.reference.position.fromArray(point);
      this.material.uniforms.pointSize.value=settings.MARKER_SIZE_CSS_PX*ratio;
      if(routeArrow){this.arrow.position.fromArray(routeArrow.worldPoint);
        this.arrowMaterial.uniforms.pointSize.value=settings.MARKER_SIZE_CSS_PX*ratio;
        this.arrowMaterial.uniforms.angle.value=routeArrow.angleRad;}
      this.renderer.render(this.scene,this.camera);
    }
    this.renderer.resetState();
  }
  dispose(){this.geometry.dispose();this.material.dispose();this.arrowGeometry.dispose();this.arrowMaterial.dispose();this.renderer.dispose();}
}
