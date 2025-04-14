from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

import chess
import cv2
import io
import numpy as np
import random

random.seed(19937)

app = Flask(__name__)
CORS(app)

GLOBAL_BOARD_STATE = chess.Board()

@app.route('/')
def root():
    return jsonify({'memo-chess': True})

@app.route('/video')
def video():
    webcam = request.args.get('webcam')
    cap = cv2.VideoCapture(f'http://{webcam}/video')
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            _, raw_image_blob = cv2.imencode('.png', frame)
            image_file = io.BytesIO(raw_image_blob.tobytes())

            # Stub move logic here. Mutates global state.
            move = random.choice(list(GLOBAL_BOARD_STATE.legal_moves))
            GLOBAL_BOARD_STATE.push(move)
            # End global state mutation.

            return send_file(image_file, mimetype='image/png')

    array = np.zeros([100, 200, 3], dtype=np.uint8)
    array[:,:100] = [255, 128, 0]
    array[:,100:] = [0, 0, 255]
    _, array = cv2.imencode('.png', array)
    return send_file(io.BytesIO(array.tobytes()), mimetype='image/png')

@app.route('/board')
def board():
    return jsonify({'fen': GLOBAL_BOARD_STATE.fen()})

if __name__ == '__main__':
    app.run()
