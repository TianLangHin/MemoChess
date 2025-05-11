import { PlayerNamesProps } from '../types.ts'

function PlayerNames(props: PlayerNamesProps) {
  const { whiteGetter, whiteSetter, blackGetter, blackSetter } = props

  return (
    <>
      <h2 className="border-2">White Player</h2>
      <input
        type="text"
        className="border-1"
        placeholder="Enter White Player's Name..."
        value={whiteGetter}
        onChange={whiteSetter} />
      <input
        type="text"
        className="border-1"
        placeholder="Enter Black Player's Name..."
        value={blackGetter}
        onChange={blackSetter} />
      <h2 className="border-2">Black Player</h2>
    </>
  )
}

export default PlayerNames
