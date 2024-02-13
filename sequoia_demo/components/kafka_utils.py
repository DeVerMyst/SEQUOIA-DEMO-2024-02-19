# sequoia_demo/components/kafka_utils.py

from sequoia_demo.components.logging_utils import logging
import threading
from json import loads
from kafka import KafkaConsumer

TOPIC_RECEIVE = "RawDAS"
socketio = None
stream = None
stream_run = False
host = ""

def init_socketio(sio, hostname):
    global socketio, stream, host
    socketio = sio
    host = hostname
    stream = threading.Thread(target=read_kafka)
    
def start_stream():
    global stream_run 
    stream_run = True
    stream.start()

def stop_stream():
    global stream_run
    stream_run = False

def read_kafka():
    try:
        consumer = KafkaConsumer(
            TOPIC_RECEIVE,
            bootstrap_servers=[host],
            value_deserializer=lambda x: loads(x.decode("utf-8")),
            fetch_max_bytes=209715200,
            max_partition_fetch_bytes=209715200,
        )
        logging.info(" # [admin] Consumer connected")

        if consumer:
            for message in consumer:
                if stream_run:
                    batch_das = message.value
                    print(batch_das)
                    # Envoyer les données au frontend
                    send_data_to_frontend(batch_das)
    except ConnectionRefusedError:
        logging.error(" # [admin] Connection Error to the Kafka pipeline")


def send_data_to_frontend(data):
    # Envoyer les données au frontend via la WebSocket
    socketio.emit('data_update', data)
