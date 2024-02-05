from sequoia_demo import app
from sequoia_demo import routes


def get_routes():
    return routes


get_routes()


from json import loads, dumps
from kafka import KafkaConsumer, KafkaProducer

# from mlservice_simulator import process_stream
import time

import numpy as np

TOPIC_RECEIVE = "RawDAS"

# consumer = KafkaConsumer(TOPIC_RECEIVE, bootstrap_servers=['k8s-659ef41d-037e2cdf8415e2be.elb.us-east-2.amazonaws.com:31726'],#TOPIC_RECEIVE, bootstrap_servers=['localhost:9094'],
consumer = KafkaConsumer(
    TOPIC_RECEIVE,
    bootstrap_servers=["localhost:9094"],
    value_deserializer=lambda x: loads(x.decode("utf-8")),
    fetch_max_bytes=20971520,
    max_partition_fetch_bytes=20971520,
)

for message in consumer:
    batch_das = message.value["array"]
    print(batch_das)



if __name__ == '__main__':
    app.run(debug=True, port=5050)
