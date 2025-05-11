export type BoardViewProps = {
  url: string | undefined,
  webcam: string,
  updateWebcam: (event: React.ChangeEvent<HTMLInputElement>) => void,
  capture: boolean,
  toggleCapture: () => void
}

export type MoveListProps = {
  scrollRef: React.Ref<HTMLDivElement> | undefined,
  moveList: string[]
}

export type PopUpProps = {
  showPopUp: boolean,
  setShowPopUp: (arg0: boolean) => void,
  children: React.ReactNode
}
