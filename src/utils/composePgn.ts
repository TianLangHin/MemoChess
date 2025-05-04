function pgnMoveList(moves: string[]): string {
  const bothMoveCount = moves.length >> 1
  const moveAtEnd = moves.length % 2 === 1

  const evenPlies = Array.from(Array(bothMoveCount).keys())
    .map(i => `${i+1}. ${moves[2*i]} ${moves[2*i+1]}`)
    .join(' ')

  return evenPlies + (moveAtEnd ? ` ${bothMoveCount + 1}. ${moves[moves.length-1]}` : '')
}

export function composePgn(
  moveList: string[],
  whitePlayer: string,
  blackPlayer: string,
  event: string,
  result: string): string {

  return ```[Event "${event}"]
[White "${whitePlayer}"]
[Black "${blackPlayer}"]
[Result "${result}"]

${pgnMoveList(moveList)} ${result === '*' ? '' : result}```
}
