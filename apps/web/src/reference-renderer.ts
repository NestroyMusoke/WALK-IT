import {BufferGeometry,Float32BufferAttribute,PerspectiveCamera,Points,Scene,ShaderMaterial,WebGLRenderer} from 'three';
import type {CameraFrame,WorldPoint} from './display';
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
  constructor(canvas:HTMLCanvasElement,context?:WebGL2RenderingContext){
    this.renderer=new WebGLRenderer({canvas,context,antialias:false,alpha:false,preserveDrawingBuffer:false});
    this.renderer.autoClear=false;this.reference.frustumCulled=false;this.scene.add(this.reference);
  }
  draw(point:WorldPoint|null,frame:CameraFrame,width:number,height:number,ratio:number,clear=false){
    this.renderer.resetState();this.renderer.setViewport(0,0,width,height);
    if(clear){this.renderer.setClearColor(0x101e22,1);this.renderer.clear(true,true,true);}
    if(point){
      this.camera.position.fromArray(frame.position);this.camera.quaternion.fromArray(frame.rotation);
      this.camera.projectionMatrix.fromArray(frame.projection);this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
      this.camera.updateMatrixWorld(true);this.reference.position.fromArray(point);
      this.material.uniforms.pointSize.value=settings.MARKER_SIZE_CSS_PX*ratio;
      this.renderer.render(this.scene,this.camera);
    }
    this.renderer.resetState();
  }
  dispose(){this.geometry.dispose();this.material.dispose();this.renderer.dispose();}
}
