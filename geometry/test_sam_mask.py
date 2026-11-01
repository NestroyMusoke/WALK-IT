"""Synthetic mask-coordinate fixtures; a separate private smoke tests real SAM output."""
import unittest

from geometry.sam_mask import mask_hit, inspect_sam_image


class SamMaskTests(unittest.TestCase):
    def test_maps_source_point_into_box_local_raster(self):
        # Box [10,20,14,24], raster 2x2, only lower-right cell active.
        raster = bytes([0, 0, 0, 1])
        self.assertFalse(mask_hit((10, 20, 14, 24), (2, 2), raster, (11, 21)))
        self.assertTrue(mask_hit((10, 20, 14, 24), (2, 2), raster, (13, 23)))
        self.assertFalse(mask_hit((10, 20, 14, 24), (2, 2), raster, (14, 23)))

    def test_invalid_coordinates_or_raster_never_match(self):
        self.assertFalse(mask_hit((10, 20, 14, 24), (2, 2), bytes([1]), (11, 21)))
        self.assertFalse(mask_hit((10, 20, 10, 24), (2, 2), bytes([1] * 4), (10, 21)))
        self.assertFalse(mask_hit((10, 20, 14, 24), (2, 2), bytes([1] * 4), (float('nan'), 21)))

    def test_empty_or_malformed_provider_output_abstains(self):
        empty = inspect_sam_image("", (20, 20), (5, 5), (15, 5))
        self.assertFalse(empty["mask_evaluated"])
        self.assertEqual(empty["object_count"], 0)
        invalid = inspect_sam_image("not-a-mask", (20, 20), (5, 5), (15, 5))
        self.assertFalse(invalid["mask_evaluated"])


if __name__ == "__main__":
    unittest.main()
