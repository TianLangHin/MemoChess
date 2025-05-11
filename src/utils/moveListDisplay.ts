export type MoveTuple = [number, string, string]

export type MoveStruct = {
  moveNumber: number,
  whiteMove: string,
  blackMove: string
}

export function moveListDisplay(moves: string[]): MoveStruct[] {
  const bothMoveCount = moves.length >> 1
  const moveAtEnd = moves.length % 2 === 1

  const evenPlies = Array.from(Array(bothMoveCount).keys())
    .map(i => ({
      moveNumber: i+1,
      whiteMove: moves[2*i],
      blackMove: moves[2*i+1]
    }))

  const lastMove = moveAtEnd
    ? [{moveNumber: bothMoveCount + 1, whiteMove: moves[moves.length - 1], blackMove: ''}]
    : []

  return [...evenPlies, ...lastMove]
}
