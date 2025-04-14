from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def root():
    return jsonify({'memo-chess': True})

if __name__ == '__main__':
    app.run()
