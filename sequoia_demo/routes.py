from flask import render_template
from flask import jsonify
from sequoia_demo import app
from sequoia_demo.components.logging_utils import logging
from sequoia_demo.components.sensors_utils import config_sensors
import config as config
import json


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

    # data = array_coordinates.tolist()
    print("Data:", data)

    return jsonify(data["sensors"])
