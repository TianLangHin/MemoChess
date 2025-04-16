import chess
from collections import namedtuple
from itertools import product
import numpy as np
from ultralytics import YOLO
from typing import List, Optional, Tuple

from server.types import ImageConversionException

Point = namedtuple('Point', ['x', 'y'])
BoundingBox = namedtuple('BoundingBox', ['x', 'y', 'w', 'h'])
BoxPrediction = namedtuple('BoxResult', ['name', 'conf', 'bounding_box'])

LABEL_TO_PIECE_MAP = {
    'white pawn':   chess.Piece(chess.PAWN,   chess.WHITE),
    'white knight': chess.Piece(chess.KNIGHT, chess.WHITE),
    'white bishop': chess.Piece(chess.BISHOP, chess.WHITE),
    'white rook':   chess.Piece(chess.ROOK,   chess.WHITE),
    'white queen':  chess.Piece(chess.QUEEN,  chess.WHITE),
    'white king':   chess.Piece(chess.KING,   chess.WHITE),
    'black pawn':   chess.Piece(chess.PAWN,   chess.BLACK),
    'black knight': chess.Piece(chess.KNIGHT, chess.BLACK),
    'black bishop': chess.Piece(chess.BISHOP, chess.BLACK),
    'black rook':   chess.Piece(chess.ROOK,   chess.BLACK),
    'black queen':  chess.Piece(chess.QUEEN,  chess.BLACK),
    'black king':   chess.Piece(chess.KING,   chess.BLACK),
}

def maximum_bounding_square(corners: List[BoundingBox]) -> Tuple[Point, Point]:
    p1 = Point(x=min(p.x for p in corners), y=min(p.y for p in corners))
    p2 = Point(x=max(p.x for p in corners), y=max(p.y for p in corners))
    return p1, p2

def intersection_area(box_a: BoundingBox, box_b: BoundingBox) -> float:
    a1 = Point(box_a.x - 0.5 * box_a.w, box_a.y - 0.5 * box_a.h)
    a2 = Point(box_a.x + 0.5 * box_a.w, box_a.y + 0.5 * box_a.h)
    b1 = Point(box_b.x - 0.5 * box_b.w, box_b.y - 0.5 * box_b.h)
    b2 = Point(box_b.x + 0.5 * box_b.w, box_b.y + 0.5 * box_b.h)

    x_overlap = max(0, min(a2.x, b2.x) - max(a1.x, b1.x))
    y_overlap = max(0, min(a2.y, b2.y) - max(a1.y, b1.y))

    return x_overlap * y_overlap

def yolo_image_to_board(model: YOLO, image: np.ndarray) -> List[Optional[chess.Piece]]:

    board_representation = [None] * 64
    # Coded to be little endian (for compatibility with `chess`)
    square_names_to_board = dict(zip((f+r for r, f in product('12345678', 'abcdefgh')), range(64)))

    # We conduct the model inference here and extract the predictions.
    result = model.predict(image, imgsz=640, conf=0.25, verbose=False)[0]
    boxes = result.boxes
    box_predictions = [
        BoxPrediction(result.names[cls.item()], conf, BoundingBox(*(i.item() for i in xywh)))
        for xywh, conf, cls in zip(boxes.xywhn, boxes.conf, boxes.cls)
    ]

    corners = [p.bounding_box for p in box_predictions if p.name == 'corner']

    if len(corners) < 3:
        raise ImageConversionException('Less than 3 corners detected')

    # Need to calculate the bounds here based on the corners.
    corner1, corner2 = maximum_bounding_square(corners)

    # Then, we map a square in the image region to a particular square in the board.
    # We assume we are viewing the board such that H8 is the top-left
    # and that A1 is the bottom-right.
    x_step = (corner2.x - corner1.x) / 8
    y_step = (corner2.y - corner1.y) / 8
    x_points = [corner1.x + i * x_step for i in range(8)]
    y_points = [corner1.y + i * y_step for i in range(8)]

    # Visually, the top row is H8, H7, H6, ...
    square_names = (f+r for f, r in product('hgfedcba', '87654321'))
    square_regions = (BoundingBox(x + 0.5 * x_step, y + 0.5 * y_step, x_step, y_step)
        for y, x in product(y_points, x_points))
    grid_boxes = dict(zip(square_names, square_regions))

    for box_prediction in box_predictions:
        # We ignore all predictions of corners.
        if box_prediction.name == 'corner':
            continue

        # We then find the piece, its bounding box and its confidence.
        piece_type = LABEL_TO_PIECE_MAP[box_prediction.name]
        bounding_box = box_prediction.bounding_box
        confidence = box_prediction.conf

        # We then find the square that our bounding box overlaps with the most.
        closest_square = max(
            grid_boxes.keys(),
            key=lambda sq: intersection_area(grid_boxes[sq], bounding_box))
        closest_square_name = square_names_to_board[closest_square]

        # We then check if this square was previously guessed to be another piece,
        # and we overwrite that guess if we have a higher confidence this time.
        previous_guess = board_representation[closest_square_name]
        if previous_guess is None or previous_guess[1] < confidence:
            board_representation[closest_square_name] = (piece_type, confidence)

    # Remove the confidence guesses at the end.
    return [None if piece is None else piece[0] for piece in board_representation]
