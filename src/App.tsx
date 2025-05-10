import React, { useEffect, useRef, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import { BoardView } from './components/BoardView.tsx'
import { PopUp } from './components/PopUp.tsx'
import { useWindowHeight } from './components/WindowHeight.ts'
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
  const [webcamUrl, setWebcamUrl] = useState('')
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined)

  // State relating to showing miscellaneous information.
  const [showPopUp, setShowPopUp] = useState(false)

  // State relating to login mechanism.
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // State relating to scrollable move list.
  const scrollableRef = useRef(null)

  useEffect(() => {
    const element = scrollableRef.current
    if (element) {
      element.scrollTop = element.scrollHeight
    }
  }, [moveList])

  const windowHeight = useWindowHeight()

  // State relating to the game data for PGN download.
  const [whitePlayer, setWhitePlayer] = useState('')
  const [blackPlayer, setBlackPlayer] = useState('')

  const updateWhitePlayer = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWhitePlayer(event.currentTarget.value)
  }

  const updateBlackPlayer = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBlackPlayer(event.currentTarget.value)
  }

  const [gameOutcome, setGameOutcome] = useState('*')

  const handleWhiteResign = () => {
    if (gameOutcome !== '*')
      return
    setGameOutcome('0-1')
    setCapture(false)
    setContinuing(false)
  }

  const handleGameDraw = () => {
    if (gameOutcome !== '*')
      return
    setGameOutcome('1/2-1/2')
    setCapture(false)
    setContinuing(false)
  }

  const handleBlackResign = () => {
    if (gameOutcome !== '*')
      return
    setGameOutcome('1-0')
    setCapture(false)
    setContinuing(false)
  }

  const downloadPgn = () => {
    const pgnContents = composePgn(moveList, whitePlayer, blackPlayer, 'MemoChess', gameOutcome)
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
                    setGameOutcome(json.status)
                    setCapture(false)
                    setContinuing(false)
                    alert(`Game has concluded. Result: ${json.status}.`)
                  }
                }
              })
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
          Please login to use MemoChess.
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
        <button onClick={() => setShowPopUp(!showPopUp)}>
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
          <h2 className="text-black text-4xl p-4">Our Team</h2>
          <ol>
            <p className="text-black">Tian Lang Hin (24766127)</p>
            <p className="text-black">Duong Anh Tran (24775456)</p>
            <p className="text-black">Isabella Watt (24843322)</p>
          </ol>
        </PopUp>
      </div>
      <h1 className="p-[20px]">
        MemoChess
      </h1>
      <p>
        {
          (gameOutcome !== '*') && `Result: ${gameOutcome}`
        }
      </p>
      <div className="container grid grid-cols-4 grid-rows-1 gap-2 p-2">
        <h2 className="border-2">White Player</h2>
        <input type="text" className="border-1"
          placeholder="Enter White Player's Name..."
          value={whitePlayer} onChange={updateWhitePlayer} />
        <input type="text" className="border-1"
          placeholder="Enter Black Player's Name..."
          value={blackPlayer} onChange={updateBlackPlayer} />
        <h2 className="border-2">Black Player</h2>
      </div>
      <div className="container grid grid-cols-3 grid-rows-2 gap-4 main-content">
        <div className="grid grid-col-1 row-span-2">
          <BoardView url={blobUrl} />
          <div className="grid grid-cols-2 px-2 gap-2">
            <input type="text" className="border-2"
              placeholder="IP Webcam Address"
              value={webcamUrl} onChange={updateWebcamUrl} />
            <button className="px-4" onClick={toggleCaptureButton}>
              { capture ? "Stop Capture" : "Start Capture" }
            </button>
          </div>
        </div>
        <div className="grid col-start-2 row-span-2 flex justify-center items-center">
          <Chessboard
            arePiecesDraggable={false}
            position={fen}
            boardWidth={0.4 * windowHeight} />
        </div>
        <div className="grid col-start-3 row-span-2">
          <div ref={scrollableRef} className="overflow-y-scroll">
            {
              moveListDisplay(moveList).map(item => (
                <div className="h-1/8 text-2xl">
                  <p key={item[0]}>
                    {`${item[0]}. ${item[1]} ${item[2]}`}
                  </p>
                </div>
              ))
            }
          </div>
        </div>
      </div>
      <div className="container grid grid-cols-3 grid-rows-1 gap-2 p-5">
        <button className="p-4" onClick={handleWhiteResign}>
          White Resigns
        </button>
        <button className="p-4" onClick={handleGameDraw}>
          Draw Game
        </button>
        <button className="p-4" onClick={handleBlackResign}>
          Black Resigns
        </button>
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
