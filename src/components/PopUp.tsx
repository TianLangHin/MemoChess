import { PopUpProps } from '../types.ts'
import '../App.css'

export function PopUp(props: PopUpProps) {
  return (
    props.showPopUp ? (
      <div className="pop-up">
        <div className="pop-up-inner">
          <button onClick={() => props.setShowPopUp(false)}>
          Close
          </button>
          { props.children }
        </div>
      </div>
    ) : (<></>)
  )
}
