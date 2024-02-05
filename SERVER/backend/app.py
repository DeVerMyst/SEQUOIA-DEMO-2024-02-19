from flask import Flask, jsonify
from flask_cors import CORS
from InterrogatorProducer import InterrogatorProducer
import time

app = Flask(__name__)
CORS(app)

# Wait for Kafka to be ready
while True:
    try:
        interrogator = InterrogatorProducer()
        break
    except Exception as e:
        print(f"Error connecting to Kafka: {e}. Retrying...")
        time.sleep(5)  # Adjust the sleep duration as needed

# interrogator = InterrogatorProducer()


@app.route("/startDAS", methods=["POST"])
def start():
    interrogator.start_stream()
    return {"status": "Started"}


@app.route("/stopDAS", methods=["POST"])
def stop():
    interrogator.stop_stream()
    return {"status": "Stopped"}


@app.route("/checkDAS", methods=["GET"])
def check_das():
    # Assuming you have a method in InterrogatorProducer 
    # to check the DAS status
    das_status = interrogator.check_das_status()
    return jsonify({"das_status": das_status})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
