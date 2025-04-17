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
    new_state = yolo_image_to_board(model, image)
    return find_valid_move(prev_state, new_state)

def resuming_game(
        prev_state: chess.Board,
        model: YOLO,
        image: np.ndarray) -> GameResumeOutcome:
    new_state = yolo_image_to_board(model, image)
    move, exact = find_valid_move(prev_state, new_state)
    if move is None:
        if exact:
            return GameResumeOutcome.ExactMatch
        else:
            return GameResumeOutcome.InexactMatch
    else:
        return GameResumeOutcome.PossibleMoveMade
