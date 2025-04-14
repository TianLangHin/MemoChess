import React, { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import { BoardView } from './components/BoardView.tsx'

function App() {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [capture, setCapture] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined)
  const [webcamUrl, setWebcamUrl] = useState('192.168.1.47:8080')

  const updateWebcamUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWebcamUrl(event.currentTarget.value)
  }

  // Every 2 seconds, poll the server for both the video feed and updated board.
  useEffect(() => {
    const interval = setInterval(() => {
      // Do not do any processing if we are not capturing feed.
      if (!capture)
        return

      // Clear out previous blobs to avoid memory leaks.
      if (blobUrl !== undefined)
        URL.revokeObjectURL(blobUrl)

      // Provide the webcam IP.
      const params = new URLSearchParams({ webcam: webcamUrl })

      // Fetch the image from the server...
      fetch('http://127.0.0.1:5000/video?' + params.toString())
        .then(response => response.blob())
        .then(blob => {
          setBlobUrl(URL.createObjectURL(blob))
        })
        .catch(() => null)

      // And then also fetch the updated board state.
      // Note that this means the server is state-ful.
      fetch('http://127.0.0.1:5000/board')
        .then(response => response.json())
        .then(json => {
          setFen(json.fen)
        })
        .catch(() => null)

    }, 2000)

    return () => clearInterval(interval)

  }, [capture])

  return (
    <>
      <input type="text" value={webcamUrl} onChange={updateWebcamUrl} />
      <button onClick={() => { setCapture(req => !req) }}>
        { capture ? "Stop Capture" : "Start Capture" }
      </button>
      <BoardView url={blobUrl} />
      <div style={{width: '400px', height: '400px'}}>
        <Chessboard arePiecesDraggable={false} position={fen} />
      </div>
    </>
  )
}

export default App
