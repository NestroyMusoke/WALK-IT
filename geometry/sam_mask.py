"""Decode a complete SAM 3.1 still-image mask and compare projected source pixels.

This module does not establish camera pose, identify a destination, or call the API.
"""

import math

from meta_sam_parser import CompletedOutcome, decode_mask_to_raster, image_segmentation_format

from geometry.e05_sam_smoke import parse_image_boxes


def mask_hit(bounds, mask_size, raster, pixel):
    """Look up a source-image pixel in a box-local row-major mask raster."""
    try:
        left, top, right, bottom = bounds
        width, height = mask_size
        x, y = pixel
        if not all(isinstance(n, (int, float)) and math.isfinite(n) for n in (left, top, right, bottom, x, y)):
            return False
        if not all(type(n) is int and n > 0 for n in (width, height)):
            return False
        if right <= left or bottom <= top or len(raster) != width * height:
            return False
        if not (left <= x < right and top <= y < bottom):
            return False
        col = min(width - 1, int((x - left) * width / (right - left)))
        row = min(height - 1, int((y - top) * height / (bottom - top)))
        return raster[row * width + col] == 1
    except (TypeError, ValueError, IndexError):
        return False


def inspect_sam_image(output_text, image_size, target_pixel, decoy_pixel):
    """Return only bounded membership evidence; any malformed output abstains."""
    abstain = {"mask_evaluated": False, "object_count": 0,
               "target_projected_inside_mask": False,
               "decoy_projected_inside_mask": None}
    if not isinstance(output_text, str) or not output_text or not isinstance(image_size, (tuple, list)) or len(image_size) != 2:
        return abstain
    width, height = image_size
    if any(type(n) is not int or n <= 0 for n in (width, height)):
        return abstain
    if not all(isinstance(p, (tuple, list)) and len(p) == 2 and all(isinstance(v, (int, float)) and math.isfinite(v) for v in p) for p in (target_pixel, decoy_pixel)):
        return abstain
    if not all(0 <= p[0] < width and 0 <= p[1] < height for p in (target_pixel, decoy_pixel)):
        return abstain
    try:
        boxes = parse_image_boxes(output_text)
        if not boxes or any(box["image_px"] != [width, height] for box in boxes):
            return abstain
        parser = image_segmentation_format().create_parser()
        parser.push(output_text if output_text.endswith("\n") else output_text + "\n")
        result = parser.finish(CompletedOutcome()).result
        if result.outcome.status != "completed" or result.diagnostics:
            return abstain
        masks = [record for record in result.records if record.kind == "mask"]
        parsed_boxes = [record for record in result.records if record.kind == "box"]
        if len(masks) != len(boxes) or len(parsed_boxes) != len(boxes):
            return abstain
        by_id = {str(box["object_id"]): box for box in boxes}
        hits = []
        for mask in masks:
            box = by_id.get(mask.object_id)
            if box is None:
                return abstain
            bounds = mask.bounds
            # The wire's x2/y2 are inclusive; the official parser exposes
            # half-open right/bottom bounds in source-image pixels.
            wire = box["box_px"]
            if [bounds.left, bounds.top, bounds.right, bounds.bottom] != [wire[0], wire[1], wire[2] + 1, wire[3] + 1]:
                return abstain
            raster = decode_mask_to_raster(mask.mask)
            region = (bounds.left, bounds.top, bounds.right, bounds.bottom)
            size = (mask.mask.width, mask.mask.height)
            if mask_hit(region, size, raster, target_pixel):
                hits.append(mask_hit(region, size, raster, decoy_pixel))
        return {"mask_evaluated": True, "object_count": len(hits),
                "target_projected_inside_mask": bool(hits),
                "decoy_projected_inside_mask": any(hits) if hits else False}
    except (ValueError, TypeError, IndexError, OverflowError):
        return abstain
