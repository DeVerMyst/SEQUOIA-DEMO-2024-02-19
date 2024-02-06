"""Script to work as a kafka producer, simulating the Interrogaot job"""
from os import getcwd
from os.path import join, exists
import threading
import h5py
from datetime import datetime

from time import sleep
from json import dumps

from kafka import KafkaProducer


class InterrogatorProducer:
    TOPIC_NAME = "RawDAS"
    current_interation = 0
    run_flag = True

    def __init__(self) -> None:
        self.producer = KafkaProducer(
            bootstrap_servers=["kafka:9092"],  #For localhost kafka use: localhost:9094
            value_serializer=lambda x: dumps(
                {"array": x, "datetime": datetime.now().strftime("%m/%d/%Y, %H:%M:%S")}
            ).encode("utf-8"),
            max_request_size=20971520,
        )

        # read DAS data
        cwd = getcwd()
        data_file = join(cwd, "VM_data.h5")
        try:
            if exists(data_file):
                # File exists, you can proceed with your code here
                print(f"The file {data_file} exists.")
            else:
                # here
                cwd = join(getcwd(), "SERVER", "backend") # For running locally
                data_file = join(cwd, "VM_data.h5")
                print(f"The file {data_file} does not exist.")
        except Exception as e:
            # Other exceptions
            print(f"An error occurred: {e}")

        with h5py.File(data_file, "r") as f:
            self.data = f["strain"][...]
            self.samp = f["strain"].attrs["samp"]

        self.stream = threading.Thread(target=self.start_producer)

    def start_producer(self):
        # sample * seconds
        batch_size = self.samp * 20

        while (
            self.run_flag
            and self.current_interation < int(self.data.shape[1] / batch_size)
        ):
            print(f"Interation {self.current_interation}")
            batch = self.data[
                :,
                int(batch_size * self.current_interation) : int(
                    batch_size * (self.current_interation + 1)
                ),
            ]

            self.producer.send(self.TOPIC_NAME, value=batch.tolist())
            sleep(5)
            self.current_interation += 1

            # restart the DAS to send the data from the begginer to keep the producer always working
            if self.current_interation == int(self.data.shape[1] / batch_size):
                self.current_interation = 0

    def start_stream(self):
        if self.current_interation == 0:
            self.stream.start()
        else:
            self.run_flag = True
            self.stream = threading.Thread(target=self.start_producer)
            self.stream.start()

    def stop_stream(self):
        self.run_flag = False
        # self.stream.join()
