import chess
from typing import List, Optional

from server.types import MoveIllegalException, MoveImpossibleException

def piece_list(b: chess.Board) -> List[Optional[chess.Piece]]:
    return [b.piece_at(sq) for sq in range(64)]

def colour_list(pl: List[Optional[chess.Piece]]) -> List[Optional[chess.Color]]:
    return [None if p is None else p.color for p in pl]

def find_valid_move(
        prev_state: chess.Board,
        new_state: List[Optional[chess.Piece]]) -> Optional[chess.Move]:
    prev_piece_list = piece_list(prev_state)

    # Firstly, if the pieces are detected to be exactly the same,
    # we register that no move has been made.
    if prev_piece_list == new_state:
        return None

    # Next, we check if there exists a legal move that can be made
    # that will give us exactly what we see right now.
    for move in prev_state.legal_moves:
        prev_state.push(move)
        match_found = piece_list(prev_state) == new_state
        prev_state.pop()
        if match_found:
            return move

    # Now, we check whether the occupancies are about the same.
    # We consider "about the same" to be if the predicted piece colours
    # in each square are the same.
    prev_state_colour = colour_list(prev_piece_list)
    new_state_colour = colour_list(new_state)

    # If the colours are seen to be the same, we consider no move being made.
    if prev_state_colour == new_state_colour:
        return None

    # Next, we check if there is a legal move that can achieve this form.
    # We assume the first one we see is the only possible one,
    # since each move will have a unique start and end point.
    for move in prev_state.legal_moves:
        prev_state.push(move)
        match_found = colour_list(piece_list(prev_state)) == new_state_colour
        prev_state.pop()
        if match_found:
            return move

    # Finally, we see if a single piece has been moved.
    # We define this as "if there is a colour such that one of its pieces is moved,
    # but moved to a square it cannot legally move to".
    for colour in (chess.WHITE, chess.BLACK):
        prev_occupancies = set(i for i in range(64) if prev_state_colour[i] == colour)
        new_occupancies = set(i for i in range(64) if new_state_colour[i] == colour)
        intersection = prev_occupancies & new_occupancies
        origin = prev_occupancies - intersection
        destination = new_occupancies - intersection
        if len(origin) == 1 and len(destination) == 1:
            illegal_move = chess.Move(origin.pop(), destination.pop()).uci()
            raise MoveIllegalException(f'Illegal move made: {illegal_move}')

    raise MoveImpossibleException('No legal move found for this transition')
