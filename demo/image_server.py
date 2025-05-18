from flask import Flask, jsonify, send_file
from flask_cors import CORS

import cv2
import io
import os
import sys

app = Flask(__name__)
CORS(app)

# This is the neighbouring directory of sample images.
# The structure is to be as follows:
# fide2024-game14/
# -- 0001.png
# -- 0002.png
# ...etc.
IMAGE_PATH = os.path.join(os.getcwd(), 'fide2024-game14')
MAX_IMAGES = len(os.listdir(IMAGE_PATH))

# To simulate a person moving a chess piece every so often,
# the server counts how many times it gets polled,
# and moves to the next position once `MAX_POLLS` is reached.
GLOBAL_STATE = (1, 0)

# `MAX_POLLS` is to be customised upon startup.
MAX_POLLS = int(sys.argv[1])

@app.route('/')
def root():
    return jsonify({'image-server': True})

@app.route('/video')
def video():
    global GLOBAL_STATE
    image_number, query_number = GLOBAL_STATE

    # Update step
    query_number += 1
    if query_number >= MAX_POLLS:
        GLOBAL_STATE = (image_number + 1, 0)
    else:
        GLOBAL_STATE = (image_number, query_number)

    return send_file(
        os.path.join(os.getcwd(), 'fide2024-game14', f'{image_number:0>4}.png'),
        mimetype='image/png')

if __name__ == '__main__':
    app.run(port=6173)
