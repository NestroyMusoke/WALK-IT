import json
import unittest
from pathlib import Path

from tracks import select_start_frames


CFG = json.loads((Path(__file__).resolve().parents[1] / "config/vision.yaml").read_text())


class StartMapTests(unittest.TestCase):
    def test_selects_only_configured_start_frames_in_original_order(self):
        count = CFG["START_MAP_FRAME_CAPACITY_COUNT"] + 2
        frames = [{"id": f"kf{i}"} for i in range(count)]
        images = [{"id": f"kf{i}", "png": "private"} for i in range(count)]
        selected_frames, selected_images = select_start_frames(
            frames, images, CFG["START_MAP_FRAME_CAPACITY_COUNT"], CFG["GEOMETRY_TRACK_MIN_VIEWS_COUNT"]
        )
        self.assertEqual([f["id"] for f in selected_frames], [f"kf{i}" for i in range(CFG["START_MAP_FRAME_CAPACITY_COUNT"])])
        self.assertEqual([f["id"] for f in selected_images], [f["id"] for f in selected_frames])
        self.assertEqual(len(frames), count)

    def test_refuses_mismatched_images_and_insufficient_views(self):
        frames = [{"id": f"kf{i}"} for i in range(CFG["GEOMETRY_TRACK_MIN_VIEWS_COUNT"])]
        images = [{"id": f["id"]} for f in frames]
        with self.assertRaises(ValueError):
            select_start_frames(frames, images[:-1], CFG["START_MAP_FRAME_CAPACITY_COUNT"], CFG["GEOMETRY_TRACK_MIN_VIEWS_COUNT"])
        with self.assertRaises(ValueError):
            select_start_frames(frames[:-1], images[:-1], CFG["START_MAP_FRAME_CAPACITY_COUNT"], CFG["GEOMETRY_TRACK_MIN_VIEWS_COUNT"])


if __name__ == "__main__":
    unittest.main()
