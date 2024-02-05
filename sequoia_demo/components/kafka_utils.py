from sequoia_demo.components.logging_utils import logging
from json import loads
from kafka import KafkaConsumer

TOPIC_RECEIVE = "RawDAS"
socketio = None


def init_socketio(sio):
    global socketio
    socketio = sio


def read_kafka(host):
    try:
        consumer = KafkaConsumer(
            TOPIC_RECEIVE,
            bootstrap_servers=[host],
            value_deserializer=lambda x: loads(x.decode("utf-8")),
            fetch_max_bytes=20971520,
            max_partition_fetch_bytes=20971520,
        )
        logging.info(" # [admin] Consumer connected")

        if consumer:
            for message in consumer:
                batch_das = message.value["array"]
                print(batch_das)
                # Envoyer les données au frontend
                send_data_to_frontend(batch_das)
    except ConnectionRefusedError:
        logging.error(" # [admin] Connection Error to the Kafka pipeline")


def send_data_to_frontend(data):
    # Envoyer les données au frontend via la WebSocket
    socketio.emit('data_update', data)
