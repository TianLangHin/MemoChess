from enum import Enum

# This exception is thrown when there is no way to
# reliably read the board state at all.
class ImageConversionException(Exception):
    pass

# These two exceptions are potentially thrown when comparing two boards
# and attempting to find the move that transitions from one to the other.

# This exception is thrown when a single piece
# has been moved to a square it cannot legally move to.
class MoveIllegalException(Exception):
    pass

# This exception is thrown when more than one piece has been moved
# in a way that does not match a legal move.
class MoveImpossibleException(Exception):
    pass

GameResumeOutcome = Enum('GameResumeOutcome', [
    'ExactMatch',
    'InexactMatch',
    'PossibleMoveMade',
])
