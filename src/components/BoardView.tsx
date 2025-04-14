import { BoardViewProps } from '../types.ts'

export function BoardView(props: BoardViewProps) {
  const { url } = props
  return (
    <>
      <img src={url} width="600px" height="400px" />
    </>
  )
}
