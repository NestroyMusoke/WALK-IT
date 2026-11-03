import json
import unittest
from pathlib import Path

import cv2
import numpy as np

from geometry.route_follow_check import compare_frames

CFG=json.loads((Path(__file__).resolve().parents[1]/'config/experiments/aggressive_sift.yaml').read_bytes())


class RouteFollowCheckTests(unittest.TestCase):
 def test_warped_textured_frame_has_geometric_support_but_no_arrow(self):
  rng=np.random.default_rng(4)
  reference=rng.integers(0,256,(480,640),dtype=np.uint8)
  query=cv2.warpPerspective(reference,np.float32([[1,0,12],[0,1,7],[0,0,1]]),(640,480))
  result=compare_frames(reference,query,CFG)
  self.assertTrue(result['accepted'],result)
  self.assertFalse(result['arrowAuthorized'])

 def test_blank_unrelated_frame_refuses(self):
  reference=np.full((480,640),255,np.uint8)
  query=np.zeros_like(reference)
  result=compare_frames(reference,query,CFG)
  self.assertFalse(result['accepted'])
  self.assertFalse(result['arrowAuthorized'])


if __name__=='__main__':unittest.main()
