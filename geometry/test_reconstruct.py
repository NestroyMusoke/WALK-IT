import unittest
import numpy as np
from reconstruct import triangulate_known,extrinsic
class GeometryTests(unittest.TestCase):
 def test_camera_axes(self):
  e=extrinsic({'rotation':[0,0,0,1],'position':[1,2,3]})
  np.testing.assert_allclose(e@np.array([1,2,1,1]),[0,0,2])
  np.testing.assert_allclose(e@np.array([1,3,1,1]),[0,-1,2])
 def test_known_geometry(self):
  k=np.array([[400.,0,320],[0,400,240],[0,0,1]])
  a=np.c_[np.eye(3),np.zeros(3)]; b=np.c_[np.eye(3),np.array([-1.,0,0])]
  xyz=np.array([[.1,.2,4.],[.4,-.2,5.],[-.3,.1,6.]])
  def project(p):
   q=(k@p@np.c_[xyz,np.ones(3)].T).T
   return q[:,:2]/q[:,2:]
  points,errors,valid=triangulate_known(project(a),project(b),k,k,a,b,1.)
  self.assertTrue(valid.all());np.testing.assert_allclose(points,xyz,atol=1e-9)
  bad=project(b);bad[:,1]+=30
  _,_,valid=triangulate_known(project(a),bad,k,k,a,b,1.)
  self.assertFalse(valid.any())
 def test_gl_cv_extrinsic_round_trip_and_scale_equivariance(self):
  axis=np.array([1.,-2.,.5]);axis/=np.linalg.norm(axis)
  q=np.r_[axis*np.sin(.31/2),np.cos(.31/2)]
  pose={'rotation':q.tolist(),'position':[1.,2.,3.]}
  e=extrinsic(pose);world=np.array([[.2,1.,-2.],[2.,.5,-4.],[-1.,3.,-6.]])
  u=q[:3];w=q[3]
  def rotate(v,conjugate=False):
   vector=-u if conjugate else u
   return v+2*w*np.cross(vector,v)+2*np.cross(vector,np.cross(vector,v))
  gl=rotate(world-np.array(pose['position']),conjugate=True)
  cv=(e@np.c_[world,np.ones(len(world))].T).T
  np.testing.assert_allclose(cv,gl*np.array([1,-1,-1]),atol=1e-10)
  k=np.array([[400.,0,320],[0,400,240],[0,0,1.]])
  expected=np.c_[400*gl[:,0]/-gl[:,2]+320,240-400*gl[:,1]/-gl[:,2]]
  actual=np.c_[400*cv[:,0]/cv[:,2]+320,400*cv[:,1]/cv[:,2]+240]
  np.testing.assert_allclose(actual,expected,atol=.01)
  a=extrinsic({'rotation':[0,0,0,1],'position':[0,0,0]});b=extrinsic({'rotation':[0,0,0,1],'position':[1,0,0]})
  def project(e,p):
   h=(k@e@np.c_[p,np.ones(len(p))].T).T;return h[:,:2]/h[:,2:]
  points=np.array([[.1,.2,-4.],[.4,-.2,-5.],[-.3,.1,-6.]])
  uv1,uv2=project(a,points),project(b,points)
  result,_,valid=triangulate_known(uv1,uv2,k,k,a,b,1.)
  self.assertTrue(valid.all());np.testing.assert_allclose(result,points,atol=1e-9)
  scaled_points=points*4;scaled_b=extrinsic({'rotation':[0,0,0,1],'position':[4,0,0]})
  np.testing.assert_allclose(project(scaled_b,scaled_points),uv2,atol=1e-10)
  result4,_,valid4=triangulate_known(uv1,uv2,k,k,a,scaled_b,1.)
  self.assertTrue(valid4.all());np.testing.assert_allclose(result4,points*4,atol=1e-8)
if __name__=='__main__':unittest.main()

