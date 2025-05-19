import { PopUpProps } from '../types.ts'
import '../App.css'

function PopUp(props: PopUpProps) {
  const { showPopUp, setShowPopUp, children } = props
  return (
    showPopUp && (
      <div className="pop-up rounded-md bg-slate-300 p-4">
        <div className="overflow-y-scroll mb-3">{children}</div>
        <button onClick={() => setShowPopUp(false)} className="mb-0">
          Close
        </button>
      </div>
    )
  )
}

export default PopUp
