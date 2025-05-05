import React, { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import { BoardView } from './components/BoardView.tsx'
import { PopUp } from './components/PopUp.tsx'
import { composePgn } from './utils/composePgn.ts'
import { moveListDisplay, MoveTuple } from './utils/moveListDisplay.ts'

const SERVER_IP = '127.0.0.1:5000'

function App() {
  // State relating to the current game state.
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  const [moveList, setMoveList] = useState<string[]>([])

  // State relating to the passing of feed to and from the client and server.
  const [capture, setCapture] = useState(false)
  const [continuing, setContinuing] = useState(false)
  const [webcamUrl, setWebcamUrl] = useState('192.168.1.47:8080')
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined)

  // State relating to showing miscellaneous information.
  const [showPopUp, setShowPopUp] = useState(false)

  // State relating to login mechanism.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // State relating to the game data for PGN download.
  const downloadPgn = () => {
    const pgnContents = composePgn(moveList, 'White', 'Black', 'MemoChess', '*')
    const blob = new Blob([pgnContents], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'game.pgn'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

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
              // Update the move if it is not a null move and if it is not a duplicate.
              setMoveList(list => {
                const shouldUpdateMove = json.move !== null &&
                  (list.length === 0 || json.move !== list[list.length - 1])

                return shouldUpdateMove ? [...list, json.move] : list
              })
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

  const handleLogin = () => {
    setUsername(prompt('Username:'))
    setPassword(prompt('Password:'))
  }

  if (username !== 'memochess' || password !== '42028a2025') {
    return (
      <>
        <h1 className="p-15">
          Please Login to use MemoChess.
        </h1>
        <button onClick={handleLogin} className="p-10">
          <h2 className="text-lg">
            Login
          </h2>
        </button>
      </>
    )
  }

  return (
    <>
      <div className="left-[5%] top-[5%] fixed">
        <button onClick={() => setShowPopUp(true)}>
          About Us
        </button>
      </div>
      <div className="right-[5%] top-[5%] fixed">
        <button onClick={downloadPgn}>
          Download PGN
        </button>
      </div>
      <div>
        <PopUp showPopUp={showPopUp} setShowPopUp={setShowPopUp}>
          <h2>Our Team</h2>
          <ol>
            <li key="tlh">Tian Lang Hin (24766127)</li>
            <li key="dat">Duong Anh Tran (24775456)</li>
            <li key="iw">Isabella Watt (24843322)</li>
          </ol>
        </PopUp>
      </div>
      <h1 className="p-[20px]">
        MemoChess
      </h1>
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
            moveListDisplay(moveList).map(item => (
              <p key={item[0]} className="border-2 border-solid">
                {`${item[0]}. ${item[1]} ${item[2]}`}
              </p>
            ))
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
