# MemoChess
A computer vision app that automatically notates classical chess games live, intended both for tournament and casual use.

## Framework
This web application is presented through a React web interface,
which calls a locally hosted Flask web server for computer vision and move validation functionality.
The computer vision model used is the Ultralytics YOLO v11 (medium) model,
trained on a custom dataset.

## Usage
MemoChess is a locally hosted web application which automatically records and notates
a chess game as it progresses live.
It takes in a live video stream from an IP Webcam (typically from a smartphone)
that sees a top-down view of the chessboard.

If an illegal move or an incorrect board state is detected,
this will be flagged by the interface and play will continue when validity is restored.
Alternatively, if the software itself makes a mistake,
the "Undo Move" and "Override Move" buttons
allow manual overrides of removing erroneous moves and adding the actual move respectively.

The game history can be downloaded as a PGN together with the inputted player names,
and with the result of the game (if concluded).

### Dependencies
To run this application, both Python and NPM need to be installed.

### Preparing On First Install
Firstly, the Python virtual environment needs to be installed and activated.
Then, this virtual environment needs to be activated, and the dependencies installed,
and the required dependencies need to be installed into this virtual environment.
Finally, the React web interface needs to be built.

This GitHub repository also contains the weight file of the YOLO v11 medium model,
which is approximately 38 MB in size.

For Windows, call the following.
```
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
npm run build
```

For Linux/MacOS, call the following.
```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm run build
```

### Running the Application
After the previous step is completed, MemoChess can be run.

For Windows, run the `runserver.cmd` BatchFile in the command prompt.
For Linux/MacOS, run the `runserver.sh` Bash script in the terminal.

Then, the app can be accessed at `127.0.0.1:5000` in your web browser.
