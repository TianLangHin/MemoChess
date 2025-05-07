import { PopUpProps } from '../types.ts'
import '../App.css'

export function PopUp(props: PopUpProps) {
  return (
    props.showPopUp ? (
      <div className="pop-up">
        <div>
          { props.children }
          <button onClick={() => props.setShowPopUp(false)}>
            Close
          </button>
        </div>
      </div>
    ) : (<></>)
  )
}
