from sequoia_demo.components.logging_utils import logging
from json import loads
from kafka import KafkaConsumer

TOPIC_RECEIVE = "RawDAS"


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
    except ConnectionRefusedError:
        logging.error(" # [admin] Connection Error to the Kafka pipeline")
