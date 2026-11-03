import base64
import hashlib
import json
import unittest
from pathlib import Path

import cv2
import numpy as np

from geometry.marker_scan import scan_marker


RAW = (Path(__file__).resolve().parents[1] / 'config/vision.yaml').read_bytes()
CFG = json.loads(RAW)
SHA = hashlib.sha256(RAW).hexdigest()
K = np.array([[700., 0., 320.], [0., 700., 240.], [0., 0., 1.]])


def request():
    marker = cv2.aruco.generateImageMarker(
        cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50), CFG['MARKER_ID'], 400)
    edge = CFG['MARKER_BLACK_SQUARE_EDGE_M']/2
    corners = cv2.projectPoints(np.array([[-edge,edge,0],[edge,edge,0],
                                          [edge,-edge,0],[-edge,-edge,0]],float),
                                np.array([np.pi-0.25,-0.18,0.05]),
                                np.array([0.01,-0.02,0.9]),K,None)[0].reshape(4,2).astype(np.float32)
    warp = cv2.getPerspectiveTransform(np.float32([[0,0],[399,0],[399,399],[0,399]]),corners)
    pixels = cv2.warpPerspective(marker,warp,(640,480),flags=cv2.INTER_NEAREST,borderValue=255)
    encoded = base64.b64encode(cv2.imencode('.png',pixels)[1]).decode()
    return {'imagePngBase64':encoded,'frameId':'v0','videoTime':1.0,
            'frameAtPhoneMs':1000.0,'trackerPosition':[0,0,0],
            'trackerRotation':[0,0,0,1],
            'intrinsics':K.reshape(9).tolist(),'width':640,'height':480,
            'configSha256':SHA,'privacyReviewed':True}


class MarkerScanTests(unittest.TestCase):
    def test_compact_jpeg_marker_request_uses_the_same_pose_gate(self):
        data=request()
        pixels=cv2.imdecode(np.frombuffer(base64.b64decode(data.pop('imagePngBase64')),np.uint8),cv2.IMREAD_GRAYSCALE)
        data['imageJpegBase64']=base64.b64encode(cv2.imencode('.jpg',pixels,[cv2.IMWRITE_JPEG_QUALITY,82])[1]).decode()
        result=scan_marker(data,RAW)
        self.assertTrue(result['accepted'],result)
        self.assertLess(len(data['imageJpegBase64']),100000)

    def test_real_opencv_detection_returns_synced_pose_without_arrow(self):
        result=scan_marker(request(),RAW)
        self.assertTrue(result['accepted'],result)
        self.assertEqual(result['frameId'],'v0')
        self.assertEqual(result['frameAtPhoneMs'],1000)
        self.assertEqual(result['configSha256'],SHA)
        self.assertFalse(result['arrowAuthorized'])
        self.assertNotIn('imagePngBase64',result)

    def test_privacy_and_config_gate_before_inference(self):
        for update in ({'privacyReviewed':False},{'configSha256':'a'*64}):
            data={**request(),**update}
            with self.assertRaises(ValueError):scan_marker(data,RAW)


if __name__=='__main__':unittest.main()
