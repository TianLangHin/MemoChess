import mimetypes
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS

import chess
import cv2
import io
import numpy as np
import os
from PIL import Image
import random
import requests
from typing import Optional, Tuple
from ultralytics import YOLO

from server.api import continuing_game, resuming_game
from server.types import *

# Most recently trained model.
MODEL = YOLO('models/trained_yolo11m-v0-1-0.pt')

random.seed(19937)

app = Flask(__name__, static_folder=os.path.join('dist'), static_url_path='/')
CORS(app)

GLOBAL_BOARD_STATE = chess.Board()
CURRENT_MOVE_STATE = MoveState(move=None, exact=True, error=None)

def get_image_capture_and_blob(webcam_ip: str):
    cap = cv2.VideoCapture(f'http://{webcam_ip}/video')
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            _, raw_image_blob = cv2.imencode('.png', frame)
            return raw_image_blob, frame
    else:
        # This branch is here to accommodate for HTTP servers
        # that proxy a live streaming image feed,
        # in case this app is to be tested without an IP camera.
        try:
            response = requests.get(f'http://{webcam_ip}/video')
            if response.ok:
                image_data = io.BytesIO(response.content)
                image = Image.open(image_data)
                frame = cv2.cvtColor(np.asarray(image), cv2.COLOR_BGR2RGB)
                _, blob = cv2.imencode('.png', frame)
                return blob, frame
        except:
            pass
    return None

@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

# This endpoint returns just the frame captured by the IP webcam.
@app.route('/video')
def video():
    webcam = request.args.get('webcam')
    image_capture = get_image_capture_and_blob(webcam)
    if image_capture is None:
        # Just send a black screen if not recording.
        array = np.zeros([1080, 1920, 3], dtype=np.uint8)
        _, array = cv2.imencode('.png', array)
        return send_file(io.BytesIO(array.tobytes()), mimetype='image/png')
    else:
        blob, frame = image_capture
        return send_file(io.BytesIO(blob.tobytes()), mimetype='image/png')

# This endpoint will attempt to find the move played from a previous position.
# Will mutate the global state.
@app.route('/continue')
def endpoint_continue():
    global CURRENT_MOVE_STATE
    webcam = request.args.get('webcam')
    image_capture = get_image_capture_and_blob(webcam)
    if image_capture is None:
        CURRENT_MOVE_STATE = MoveState(move=None, exact=True, error='no-capture')
        # Just send a black screen if not recording.
        array = np.zeros([1080, 1920, 3], dtype=np.uint8)
        _, array = cv2.imencode('.png', array)
        return send_file(io.BytesIO(array.tobytes()), mimetype='image/png')
    blob, frame = image_capture
    try:
        (move, exact), pred_image = continuing_game(GLOBAL_BOARD_STATE, MODEL, frame)
        if move is None:
            CURRENT_MOVE_STATE = MoveState(move=None, exact=True, error=None)
        else:
            CURRENT_MOVE_STATE = MoveState(move=GLOBAL_BOARD_STATE.san(move), exact=exact, error=None)
            GLOBAL_BOARD_STATE.push(move)
        return send_file(io.BytesIO(blob.tobytes()), mimetype='image/png')
    except ImageConversionException as err:
        CURRENT_MOVE_STATE = MoveState(
            move=None, exact=True, error=['image-conversion', ' '.join(err.args)])
    except MoveIllegalException as err:
        CURRENT_MOVE_STATE = MoveState(
            move=None, exact=True, error=['move-illegal', ' '.join(err.args)])
    except MoveImpossibleException as err:
        CURRENT_MOVE_STATE = MoveState(
            move=None, exact=True, error=['move-impossible', ' '.join(err.args)])
    return send_file(io.BytesIO(blob.tobytes()), mimetype='image/png')

@app.route('/lastmove')
def endpoint_lastmove():
    return jsonify({
        'move': CURRENT_MOVE_STATE.move,
        'exact': CURRENT_MOVE_STATE.exact,
        'error': CURRENT_MOVE_STATE.error,
        'fen': GLOBAL_BOARD_STATE.fen(),
        'status': GLOBAL_BOARD_STATE.result(),
        'repetition': GLOBAL_BOARD_STATE.is_repetition(),
    })

@app.route('/resume')
def endpoint_resume():
    webcam = request.args.get('webcam')
    image_capture = get_image_capture_and_blob(webcam)
    if image_capture is None:
        return jsonify({'error': 'no-capture'})
    try:
        blob, frame = image_capture
        match resuming_game(GLOBAL_BOARD_STATE, MODEL, frame)[0]:
            case GameResumeOutcome.ExactMatch:
                return jsonify({'error': None, 'exact': True})
            case GameResumeOutcome.InexactMatch:
                return jsonify({'error': None, 'exact': False})
            case GameResumeOutcome.PossibleMoveMade:
                return jsonify({'error': 'possible-move-made'})
    except ImageConversionException:
        return jsonify({'error': 'image-conversion'})
    except MoveIllegalException as err:
        return jsonify({'error': 'move-illegal-' + err.args[1]})
    except MoveImpossibleException:
        return jsonify({'error': 'move-impossible'})

@app.route('/undolastmove')
def endpoint_undolastmove():
    global GLOBAL_BOARD_STATE, CURRENT_MOVE_STATE
    if len(GLOBAL_BOARD_STATE.move_stack) > 0:
        GLOBAL_BOARD_STATE.pop()
        CURRENT_MOVE_STATE = MoveState(move=None, exact=True, error=None)
    return jsonify({'fen': GLOBAL_BOARD_STATE.fen()})

@app.route('/override')
def endpoint_override():
    uci_move = request.args.get('uci').lower()
    try:
        move = chess.Move.from_uci(uci_move)
        if move in GLOBAL_BOARD_STATE.legal_moves:
            san = GLOBAL_BOARD_STATE.san(move)
            GLOBAL_BOARD_STATE.push(move)
            fen = GLOBAL_BOARD_STATE.fen()
            status = GLOBAL_BOARD_STATE.result()
            CURRENT_MOVE_STATE = MoveState(move=san, exact=True, error=None)
            return jsonify({'valid': True, 'san': san, 'fen': fen, 'status': status})
        else:
            return jsonify({'valid': False})
    except (AssertionError, chess.InvalidMoveError):
        return jsonify({'valid': False})

@app.route('/reset')
def endpoint_reset():
    global GLOBAL_BOARD_STATE, CURRENT_MOVE_STATE
    GLOBAL_BOARD_STATE = chess.Board()
    CURRENT_MOVE_STATE = MoveState(move=None, exact=True, error=None)
    return jsonify({'fen': GLOBAL_BOARD_STATE.fen()})

if __name__ == '__main__':
    app.run()
