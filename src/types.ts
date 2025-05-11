export type BoardViewProps = {
  url: string | undefined,
  webcam: string,
  updateWebcam: (event: React.ChangeEvent<HTMLInputElement>) => void,
  capture: boolean,
  toggleCapture: () => void
}

export type MoveListProps = {
  moveList: string[]
}

export type PlayerNamesProps = {
  whiteGetter: string,
  whiteSetter: (event: React.ChangeEvent<HTMLInputElement>) => void,
  blackGetter: string,
  blackSetter: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export type PopUpProps = {
  showPopUp: boolean,
  setShowPopUp: (arg0: boolean) => void,
  children: React.ReactNode
}
