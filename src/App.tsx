import React, { useEffect, useRef, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import { BoardView } from './components/BoardView.tsx'
import { MoveList } from './components/MoveList.tsx'
import { PopUp } from './components/PopUp.tsx'
import { TeamInfo } from './components/TeamInfo.tsx'
import { useWindowHeight } from './components/WindowHeight.ts'
import { composePgn } from './utils/composePgn.ts'

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
  const scrollableRef = useRef<HTMLDivElement>(null)

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

  const handleGameTermination = (outcome: string) => {
    return () => {
      if (gameOutcome !== '*')
        return
      setGameOutcome(outcome)
      setCapture(false)
      setContinuing(false)
    }
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
                } else {
                  setCapture(false)
                  setContinuing(false)
                  const errorType = json.error[0]
                  if (errorType === 'image-conversion') {
                    alert('The model could not detect all board corners. Please adjust the board or lighting.')
                  } else if (errorType === 'move-illegal') {
                    alert(json.error[1] + '\nPlease restore the live board to match MemoChess.')
                  } else if (errorType === 'move-impossible') {
                    alert('An impossible move was made.\n' + json.error[1] + '\nPlease restore the live board to match MemoChess.')
                  } else {
                    alert(`Unknown error occurred: ${errorType}`)
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
              setCapture(false)
              setContinuing(false)
              if (json.error === 'possible-move-made') {
                alert('The live board position does not match Memochess. Did you already make a move?')
              } else if (json.error === 'image-conversion') {
                alert('The model could not detect all board corners. Please adjust the board or lighting.')
              } else if (json.error.startsWith('move-illegal')) {
                alert('The live board position does not match Memochess. Please restore the live board before starting capture.')
              } else if (json.error === 'move-impossible') {
                alert('The live board position does not match Memochess. Please restore the live board before starting capture.')
              } else if (json.error === 'no-capture') {
                alert('No live board capture could be found. Is the IP Camera server started?')
              } else {
                alert(`Unknown error occurred: ${json.error}`)
              }
            }
          })
          .catch(() => {})
      }

    }, 2000)

    return () => {
      clearInterval(interval)
    }

  }, [capture, continuing])

  if (username !== 'memochess' || password !== '42028a2025') {
    return (
      <>
        <h1 className="p-15">
          Please login to use MemoChess.
        </h1>
        <button onClick={() => {
          setUsername(prompt('Username:') ?? "")
          setPassword(prompt('Password:') ?? "")
        }} className="p-10">
          <h2 className="text-lg">
            Login
          </h2>
        </button>
      </>
    )
  }

  const resetAll = () => {
    fetch(`http://${SERVER_IP}/reset`)
      .then(response => response.json())
      .then(json => {
        setShowPopUp(false)
        setCapture(false)
        setContinuing(false)
        setFen(json.fen)
        setMoveList([])
        setBlobUrl(undefined)
        setUsername('')
        setPassword('')
        setWebcamUrl('')
      })
  }

  return (
    <>
      <div className="left-[5%] top-[5%] fixed">
        <button onClick={() => setShowPopUp(!showPopUp)}>About Us</button>
      </div>
      <div className="left-[5%] top-[12%] fixed">
        <button onClick={resetAll}>Logout</button>
      </div>
      <div className="right-[5%] top-[5%] fixed">
        <button onClick={downloadPgn}>Download PGN</button>
      </div>
      <div>
        <PopUp showPopUp={showPopUp} setShowPopUp={setShowPopUp}>
          <TeamInfo />
        </PopUp>
      </div>
      <h1 className="p-[20px]">
        MemoChess
      </h1>
      <p>{ (gameOutcome !== '*') && `Result: ${gameOutcome}` }</p>
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
          <BoardView
            url={blobUrl}
            webcam={webcamUrl} updateWebcam={updateWebcamUrl}
            capture={capture} toggleCapture={toggleCaptureButton} />
        </div>
        <div className="grid col-start-2 row-span-2 flex justify-center items-center">
          <Chessboard
            arePiecesDraggable={false}
            position={fen}
            boardWidth={0.4 * windowHeight} />
        </div>
        <div className="grid col-start-3 row-span-2">
          <MoveList scrollRef={scrollableRef} moveList={moveList} />
        </div>
      </div>
      <div className="container grid grid-cols-3 grid-rows-1 gap-2 p-5">
        <button className="p-4" onClick={handleGameTermination('0-1')}>
          White Resigns
        </button>
        <button className="p-4" onClick={handleGameTermination('1/2-1/2')}>
          Draw Game
        </button>
        <button className="p-4" onClick={handleGameTermination('1-0')}>
          Black Resigns
        </button>
      </div>
      <div>
        <button onClick={undoLastMoveButton} className="m-1">
          Undo Move
        </button>
        <button onClick={() => {
          const uciMove = prompt('Please enter the move played in UCI notation:')
          const params = new URLSearchParams({ uci: uciMove ?? "" })
          fetch(`http://${SERVER_IP}/override?` + params.toString())
            .then(response => response.json())
            .then(json => {
              if (json.valid) {
                setFen(json.fen)
                setMoveList(list => [...list, json.san])
              } else {
                alert('Illegal move entered.')
              }
            })
          setCapture(false)
          setContinuing(false)
        }} className="m-1">
          Override Move
        </button>
      </div>
    </>
  )
}

export default App
