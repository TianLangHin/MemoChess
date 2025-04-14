# MemoChess
A computer vision app that automatically notates classical chess games live, intended both for tournament and casual use.

## Framework

This locally hosted web app uses an IP Webcam from a smartphone to take a top-down view
video that live streams the current board state.
This is read from a locally hosted Flask web server,
which is polled at regular intervals by the React front-end interface.
When each frame is polled, it is analysed by the computer vision model
to output the updated board state.

If an illegal move is detected or the incorrect board state is given,
this will be flagged by the interface and play will continue when validity is restored.

## Usage

### Preparing Server Component
Firstly, the Python virtual environment needs to be installed and activated.
```
python -m venv .venv
```
Then, for Windows, call
```
.venv\Scripts\activate.bat
```
or for Linux/Mac OS, call
```
source .venv/bin/activate
```
Then, prepare the virtual environment by installing the dependencies from `requirements.txt`:
```
pip install -r requirements.txt
```

### Preparing Client Component
First run `npm install` to install the required `node_modules`, then the following:
```
npm run build
npm run dev
```
Ensure that the `(.venv)` virtual environment is active while doing this.
