import React, { useEffect, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import './App.css'

import BoardView from './components/BoardView.tsx'
import MoveList from './components/MoveList.tsx'
import PlayerNames from './components/PlayerNames.tsx'
import PopUp from './components/PopUp.tsx'
import TeamInfo from './components/TeamInfo.tsx'
import useWindowHeight from './components/WindowHeight.ts'
import composePgn from './utils/composePgn.ts'
import { continuingErrorMsg, resumingErrorMsg } from './utils/errorMessages.ts'

const SERVER_IP = '127.0.0.1:5000'
const POLLING_INTERVAL = 2000

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

  // State relating to chessboard height.
  const windowHeight = useWindowHeight()

  // State and functionality relating to the game data for PGN download.
  const [whitePlayer, setWhitePlayer] = useState('')
  const [blackPlayer, setBlackPlayer] = useState('')
  const [gameOutcome, setGameOutcome] = useState('*')

  const downloadPgn = () => {
    const pgnContents = composePgn(
      moveList,
      whitePlayer,
      blackPlayer,
      'MemoChess',
      gameOutcome
    )
    // After creating the PGN text file contents, it is put in a blob for download.
    const blob = new Blob([pgnContents], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    // A link to this file is made.
    const link = document.createElement('a')
    link.href = url
    link.download = 'game.pgn'
    document.body.appendChild(link)
    // A click is then automatically triggered to initiate download.
    link.click()
    // After download concludes, remove the blob and revoke the URL to prevent memory leaks.
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Closure to deactivate all capturing of images.
  const deactivateCamera = () => {
    setCapture(false)
    setContinuing(false)
  }

  // Closure to terminate the game with a particular result.
  const handleGameTermination = (outcome: string) => {
    return () => {
      if (gameOutcome !== '*')
        return
      setGameOutcome(outcome)
      deactivateCamera()
    }
  }

  // Closure to call the server to remove one move from the move stack.
  const undoLastMoveButton = () => {
    fetch(`http://${SERVER_IP}/undolastmove`)
      .then(response => response.json())
      .then(json => {
        setMoveList(list => list.slice(0, -1))
        setFen(json.fen)
      })
  }

  // Closure to reset both the server and the UI state (for logout).
  const resetAll = () => {
    fetch(`http://${SERVER_IP}/reset`)
      .then(response => response.json())
      .then(json => {
        // Ensure pop up does not appear.
        setShowPopUp(false)
        // Deactivate camera.
        deactivateCamera()
        // Reset FEN and move list.
        setFen(json.fen)
        setMoveList([])
        // Reset login details.
        setUsername('')
        setPassword('')
        // Reset webcam.
        setWebcamUrl('')
        setBlobUrl(undefined)
        // Reset game progress.
        setWhitePlayer('')
        setBlackPlayer('')
        setGameOutcome('*')
      })
  }

  // Closure to prompt the user for a move to override incorrect detections.
  const overrideMove = () => {
    const uciMove = prompt('Please enter the move played in UCI notation:')
    const params = new URLSearchParams({ uci: uciMove ?? "" })

    fetch(`http://${SERVER_IP}/override?` + params.toString())
      .then(response => response.json())
      .then(json => {
        if (json.valid) {
          // Here, the server will return the updated FEN and move in SAN.
          setFen(json.fen)
          setMoveList(list => [...list, json.san])
        } else {
          alert('Illegal move entered.')
        }
      })

    // We finally deactivate the camera capture here to prevent
    // continuous server alerts and errors.
    deactivateCamera()
  }

  // Every `POLLING_INTERVAL` milliseconds, poll the server for the video feed then updated board.
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

        // If "continuing" a game, we first retrieve the image via `/continue`
        // and then fetch the move being made via `/lastmove`.
        // To ensure these fetches are done sequentially, they are nested.
        fetch(`http://${SERVER_IP}/continue?` + webcamParams.toString())
          .then(response => response.blob())
          .then(blob => {
            // First, we update the camera feed image.
            setBlobUrl(URL.createObjectURL(blob))

            // This server call is made immediately after `/continue` concludes.
            fetch(`http://${SERVER_IP}/lastmove`)
              .then(response => response.json())
              .then(json => {
                if (json.error === null) {

                  // Update the board state, then the move if there is a change.
                  setFen(json.fen)
                  if (json.move !== null)
                    setMoveList(list => [...list, json.move])

                  // Update the game outcome (possibly terminate/deactivate if concluded)
                  if (json.status !== '*') {
                    setGameOutcome(json.status)
                    deactivateCamera()
                    alert(`Game has concluded. Result: ${json.status}.`)
                  }
                } else {
                  deactivateCamera()
                  alert(continuingErrorMsg(json.error))
                }
              })
          })

      } else {

        const falsePositiveMoveDetections = (err: string) => {
          return err.startsWith('move-illegal')
            || err === 'move-impossible'
            || err === 'possible-move-made'
        }

        // If not "continuing" a game, we are instead "resuming" from a position.
        fetch(`http://${SERVER_IP}/resume?` + webcamParams.toString())
          .then(response => response.json())
          .then(json => {
            if (json.error === null || falsePositiveMoveDetections(json.error)) {
              setContinuing(true)
            } else {
              // If there was an error resuming the board state
              // (live board does not match, or server error)
              // then stop the camera feed and log the error.
              deactivateCamera()
              alert(resumingErrorMsg(json.error))
            }
          })
      }

    }, POLLING_INTERVAL)

    return () => {
      clearInterval(interval)
    }

  }, [capture, continuing])

  // Login prompt (with dummy login details)
  if (username !== 'memochess' || password !== '42028a2025') {
    return (
      <>
        <h1 className="p-15">Please login to use MemoChess.</h1>
        <button onClick={
          () => {
            setUsername(prompt('Username:') ?? "")
            setPassword(prompt('Password:') ?? "")
          }
        } className="p-10">
          <h2 className="text-lg">Login</h2>
        </button>
      </>
    )
  }

  return (
    <>
      {/* Buttons at the top of the UI */}
      <div className="left-[5%] top-[5%] fixed">
        <button onClick={() => setShowPopUp(!showPopUp)}>About Us</button>
      </div>
      <div className="left-[5%] top-[12%] fixed">
        <button onClick={resetAll}>Logout</button>
      </div>
      <div className="right-[5%] top-[5%] fixed">
        <button onClick={downloadPgn}>Download PGN</button>
      </div>
      {/* Pop up tab to show team information if requested */}
      <div>
        <PopUp showPopUp={showPopUp} setShowPopUp={setShowPopUp}>
          <TeamInfo />
        </PopUp>
      </div>
      {/* Main app title and the result (if the game has concluded) */}
      <h1 className="p-[20px]">MemoChess</h1>
      <p>{(gameOutcome !== '*') && `Result: ${gameOutcome}`}</p>
      {/* Player detail section */}
      <div className="container grid grid-cols-4 grid-rows-1 gap-2 p-2">
        <PlayerNames
          whiteGetter={whitePlayer}
          whiteSetter={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              setWhitePlayer(event.currentTarget.value)
            }
          }
          blackGetter={blackPlayer}
          blackSetter={
            (event: React.ChangeEvent<HTMLInputElement>) => {
              setBlackPlayer(event.currentTarget.value)
            }
          } />
      </div>
      {/* Main content section */}
      <div className="container grid grid-cols-3 grid-rows-2 gap-4 main-content">
        {/* Column 1/3: Camera live feed and webcam parameters */}
        <div className="grid grid-col-1 row-span-2">
          <BoardView
            url={blobUrl}
            webcam={webcamUrl}
            updateWebcam={
              (event: React.ChangeEvent<HTMLInputElement>) => {
                setWebcamUrl(event.currentTarget.value)
              }
            }
            capture={capture}
            toggleCapture={
              () => {
                setCapture(capturing => !capturing)
                setContinuing(false)
              }
            } />
        </div>
        {/* Column 2/3: Chessboard display */}
        <div className="grid col-start-2 row-span-2 flex justify-center items-center">
          <Chessboard
            arePiecesDraggable={false}
            position={fen}
            boardWidth={0.4 * windowHeight} />
        </div>
        {/* Column 3/3: Move list */}
        <div className="grid col-start-3 row-span-2">
          <MoveList moveList={moveList} />
        </div>
      </div>
      {/* Buttons for controlling game outcome: resignation or drawing */}
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
      {/* Buttons for manual move overriding (in case of misdetections) */}
      <div>
        <button onClick={undoLastMoveButton} className="m-1">
          Undo Move
        </button>
        <button onClick={overrideMove} className="m-1">
          Override Move
        </button>
      </div>
    </>
  )
}

export default App
