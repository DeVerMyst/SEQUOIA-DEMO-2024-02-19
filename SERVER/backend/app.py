from flask import Flask
from flask_cors import CORS
from InterrogatorProducer import InterrogatorProducer

app = Flask(__name__)
CORS(app)

interrogator = InterrogatorProducer()

@app.route("/startDAS", methods=['POST'])
def start():
    interrogator.start_stream()
    return {"status": "Started"}

@app.route("/stopDAS", methods=['POST'])
def stop():
    interrogator.stop_stream()
    return {"status": "Stopped"}