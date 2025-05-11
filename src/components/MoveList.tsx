import { useEffect, useRef } from 'react'
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

function MoveList(props: MoveListProps) {

  const { moveList } = props

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = scrollRef.current
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }, [moveList])

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

export default MoveList
