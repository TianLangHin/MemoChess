import { MoveListProps } from '../types.ts'

type MoveStruct = {
  moveNumber: number,
  whiteMove: string,
  blackMove: string
}

function moveListDisplay(moves: string[]): MoveStruct[] {
  const bothMoveCount = moves.length >> 1

  const evenPlies = Array.from(Array(bothMoveCount).keys())
    .map(i => ({
      moveNumber: i+1,
      whiteMove: moves[2*i],
      blackMove: moves[2*i+1]
    }))

   const lastMove = moves.length % 2 === 1
    ? [
      {
        moveNumber: bothMoveCount + 1,
        whiteMove: moves[moves.length - 1],
        blackMove: ''
      }
    ]
    : []

  return [...evenPlies, ...lastMove]
}

export function MoveList(props: MoveListProps) {

  const { scrollRef, moveList } = props

  return (
    <>
      <div ref={scrollRef} className="overflow-y-scroll">
        {
          moveListDisplay(moveList).map(
            ({ moveNumber, whiteMove, blackMove }) => (
              <div className="h-1/8 text-2xl">
                <p key={moveNumber}>
                  {`${moveNumber}. ${whiteMove} ${blackMove}`}
                </p>
              </div>
            )
          )
        }
      </div>
    </>
  )
}
