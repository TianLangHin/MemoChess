export function continuingErrorMsg(errorMsg: string[]): string {
  const errorType = errorMsg[0]
  switch (errorType) {
    case 'image-conversion':
      return 'The model could not detect all board corners. Please adjust the board or lighting.'
    case 'move-illegal':
      return errorMsg[1] + '\nPlease restore the live board to match MemoChess.'
    case 'move-impossible':
      return 'An impossible move was made.\n' + errorMsg[1] + '\nPlease restore the live board to match MemoChess.'
    default:
      return `Unknown error occurred: ${errorType}`
  }
}

export function resumingErrorMsg(errorMsg: string): string {
  if (errorMsg === 'possible-move-made') {
    return 'The live board position does not match Memochess. Did you already make a move?'
  } else if (errorMsg === 'image-conversion') {
    return 'The model could not detect all board corners. Please adjust the board or lighting.'
  } else if (errorMsg.startsWith('move-illegal')) {
    return 'The live board position does not match Memochess. Please restore the live board before starting capture.'
  } else if (errorMsg === 'move-impossible') {
    return 'The live board position does not match Memochess. Please restore the live board before starting capture.'
  } else if (errorMsg === 'no-capture') {
    return 'No live board capture could be found. Is the IP Camera server started?'
  } else {
    return `Unknown error occurred: ${errorMsg}`
  }
}
