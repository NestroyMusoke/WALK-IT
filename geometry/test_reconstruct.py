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
if __name__=='__main__':unittest.main()

