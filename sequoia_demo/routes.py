# sequoia_demo/routes.py
from flask import render_template, jsonify
from sequoia_demo import app
from sequoia_demo.components.logging_utils import logging
from sequoia_demo.components.sensors_utils import config_sensors
from sequoia_demo.components.kafka_utils import start_stream, init_socketio, stop_stream
from flask_socketio import SocketIO

import config as config
import json

# kafka host
host = config.KAFKA_HOST

# Initialisation de Flask-SocketIO
socketio = SocketIO(app)
init_socketio(socketio, host)  # Initialisez le socketio dans kafka_utils.py
start_stream()


# Logger handle
logger = logging.getLogger(__name__)

# import sensors coordinates
array_coordinates, sensors, data = config_sensors(config.CALIBRATION_PATH)


# Index.html
@app.route("/")
def index():
    logger.info(" # [admin] request: index.html")
    return render_template("index.html",
                           array_coordinates=array_coordinates.tolist(),
                           sensors=sensors.tolist(),
                           result=data)


@app.route("/api/sensors")
def get_sensor_data():
    # Chargez les données depuis le fichier JSON (sensors.json)
    with open(config.CALIBRATION_PATH) as f:
        data = json.load(f)

    return jsonify(data["sensors"])


@app.route("/readDAS", methods=["POST"])
def readDAS():
    # print("="*50)
    # print("# [admin] routes read data")
    # print("="*50)

    # Exécutez votre script Python pour lire les données
    #process = read_kafka(host)
    #result = process.stdout
    #print(result)
    # Vous pouvez retourner des données au client si nécessaire
    start_stream()
    return {"status": "Started"}


@app.route("/dontreadDAS", methods=["POST"])
def dontreadDAS():
    print("# [admin] routes dont read data")
    stop_stream()
    # Vous pouvez retourner des données au client si nécessaire
    return {"status": "nothing", "result": 200}


# Route pour la WebSocket
@socketio.on('connect')
def handle_connect():
    print('Client connected')


@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')


if __name__ == '__main__':
    socketio.run(app, debug=True, port=5050)
