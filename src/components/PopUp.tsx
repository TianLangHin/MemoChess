import { PopUpProps } from '../types.ts'
import '../App.css'

function PopUp(props: PopUpProps) {
  const { showPopUp, setShowPopUp, children } = props
  return (
    showPopUp && (
      <div className="pop-up">
        <div>
          { children }
          <button onClick={() => setShowPopUp(false)}>
            Close
          </button>
        </div>
      </div>
    )
  )
}

export default PopUp
