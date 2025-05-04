import React, { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import { BoardView } from './components/BoardView.tsx'
import { PopUp } from './components/PopUp.tsx'

const SERVER_IP = '127.0.0.1:5000'

function App() {
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [moveList, setMoveList] = useState<string[]>([])
  const [capture, setCapture] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined)
  const [webcamUrl, setWebcamUrl] = useState('192.168.1.47:8080')
  const [showPopUp, setShowPopUp] = useState(false)

  const updateWebcamUrl = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWebcamUrl(event.currentTarget.value)
  }

  const toggleCaptureButton = () => {
    setCapture(capturing => !capturing)
    setContinuing(false)
  }

  const undoLastMoveButton = () => {
    fetch(`http://${SERVER_IP}/undolastmove`)
      .then(response => response.json())
      .then(json => {
        setMoveList(list => list.slice(0, -1))
        setFen(json.fen)
      })
  }

  // Every 2 seconds, poll the server for both the video feed and updated board.
  useEffect(() => {
    const interval = setInterval(() => {
      // Do not do any processing if we are not capturing feed.
      if (!capture)
        return

      // Provide the webcam IP.
      const webcamParams = new URLSearchParams({ webcam: webcamUrl })

      if (continuing) {
        // Clear out previous blobs to avoid memory leaks.
        if (blobUrl !== undefined)
          URL.revokeObjectURL(blobUrl)

        fetch(`http://${SERVER_IP}/continue?` + webcamParams.toString())
          .then(response => response.blob())
          .then(blob => {
            setBlobUrl(URL.createObjectURL(blob))
          })

        fetch(`http://${SERVER_IP}/lastmove`)
          .then(response => response.json())
          .then(json => {
            if (json.error === null) {
              setFen(json.fen)
              setMoveList(list => [...list, json.move])
              if (json.status !== '*') {
                alert(json.status)
              }
            }
          })

      } else {

        // If not "continuing" a game, we are instead "resuming" from a position.
        fetch(`http://${SERVER_IP}/resume?` + webcamParams.toString())
          .then(response => response.json())
          .then(json => {
            if (json.error === null) {
              console.log(`Exact match: ${json.exact}`)
              setContinuing(true)
            } else {
              console.log(`Error: ${json.error}`)
              setCapture(false)
              setContinuing(false)
            }
          })
          .catch(() => {})
      }

    }, 2000)

    return () => {
      clearInterval(interval)
    }

  }, [capture, continuing])

  return (
    <>
      <div className="right-[5%] top-[5%] fixed">
        <button onClick={() => setShowPopUp(true)}>
          Show Pop Up
        </button>
      </div>
      <div>
        <PopUp showPopUp={showPopUp} setShowPopUp={setShowPopUp}>
          <h1>
            Pop Up Here
          </h1>
        </PopUp>
      </div>
      <div className="container grid grid-cols-3 grid-rows-2 gap-4">
        <div className="grid grid-col-1 row-span-2">
          <BoardView url={blobUrl} />
          <div className="grid grid-cols-2">
            <input type="text" value={webcamUrl} onChange={updateWebcamUrl} />
            <button onClick={toggleCaptureButton}>
              { capture ? "Stop Capture" : "Start Capture" }
            </button>
          </div>
        </div>
        <div className="grid col-start-2 row-span-2">
          <Chessboard arePiecesDraggable={false} position={fen} />
        </div>
        <div className="grid col-start-3 row-span-2 overflow-y-scroll">
          {
            moveList.map(move => {
              return (
                <p>{move}</p>
              )
            })
          }
        </div>
      </div>
      <div>
        <button onClick={undoLastMoveButton}>
          Undo Move
        </button>
      </div>
    </>
  )
}

export default App
