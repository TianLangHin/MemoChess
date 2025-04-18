import chess
import numpy as np
from typing import List, Optional, Tuple
from ultralytics import YOLO

from server.read import yolo_image_to_board
from server.state import find_valid_move
from server.types import *

def continuing_game(
        prev_state: chess.Board,
        model: YOLO,
        image: np.ndarray) -> Tuple[Optional[chess.Move], bool]:
    new_state, pred_image = yolo_image_to_board(model, image)
    return find_valid_move(prev_state, new_state), pred_image

def resuming_game(
        prev_state: chess.Board,
        model: YOLO,
        image: np.ndarray) -> GameResumeOutcome:
    new_state, pred_image = yolo_image_to_board(model, image)
    for i in range(56, -1, -8):
        print(' '.join('.' if x is None else str(x) for x in new_state[i:i+8]))
    move, exact = find_valid_move(prev_state, new_state)
    if move is None:
        if exact:
            return GameResumeOutcome.ExactMatch, pred_image
        else:
            return GameResumeOutcome.InexactMatch, pred_image
    else:
        return GameResumeOutcome.PossibleMoveMade, pred_image
