import { BoardViewProps } from '../types.ts'

function BoardView(props: BoardViewProps) {

  const { url, webcam, updateWebcam, capture, toggleCapture } = props

  return (
    <>
      <img src={url} width="600px" height="400px" />
      <div className="grid grid-cols-2 px-2 gap-2">
        <input type="text" className="border-2"
          placeholder="IP Webcam Address"
          value={webcam} onChange={updateWebcam} />
        <button className="px-4" onClick={toggleCapture}>
          { capture ? "Stop Capture" : "Start Capture" }
        </button>
      </div>
    </>
  )
}

export default BoardView
