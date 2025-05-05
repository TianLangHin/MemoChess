export type MoveTuple = [number, string, string]

export function moveListDisplay(moves: string[]): MoveTuple[] {
  const bothMoveCount = moves.length >> 1
  const moveAtEnd = moves.length % 2 === 1

  const evenPlies = Array.from(Array(bothMoveCount).keys())
    .map(i => [i+1, moves[2*i], moves[2*i+1]])

  const lastMove = moveAtEnd ? [[bothMoveCount + 1, moves.at(-1), '']] : []

  return [...evenPlies, ...lastMove]
}
