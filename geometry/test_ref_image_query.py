import json
import unittest
from pathlib import Path
import numpy as np
from ref_image_query import ReferenceImageQuery

CFG=json.loads((Path(__file__).resolve().parents[1]/'config/vision.yaml').read_text())

class ReferenceImageQueryTests(unittest.TestCase):
    def test_blank_frame_refuses_without_navigation(self):
        matcher=ReferenceImageQuery.__new__(ReferenceImageQuery)
        matcher.references=[]
        matcher.landmarks=[]
        matcher.config=CFG
        result=matcher.query_pixels(np.zeros((64,64),np.uint8),[50,0,32,0,50,32,0,0,1])
        self.assertFalse(result['accepted'])
        self.assertFalse(result['navigationReady'])

if __name__=='__main__':unittest.main()
