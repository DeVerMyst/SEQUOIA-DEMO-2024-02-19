"""Script to work as a kafka producer, simulating the Interrogaot job"""
from os import getcwd
from os.path import join, exists
import threading
import h5py
from datetime import datetime, timedelta

from time import sleep
from json import dumps

from ReaderDAS import ReaderDAS
from kafka import KafkaProducer


class InterrogatorProducer:
    TOPIC_NAME = "RawDAS"
    SECONDS_SEND = 10
    current_interation = -1
    run_flag = True

    def __init__(self) -> None:
        self.producer = KafkaProducer(
            bootstrap_servers=["localhost:9094"],  #For localhost kafka use: localhost:9094
            value_serializer=lambda x: dumps(x).encode("utf-8"),
            max_request_size=209715200,
            buffer_memory=209715200,
        )

        # read DAS data
        filename = "2021_12_27_06h00m27s_HDAS_2Dmap_Strain.bin"
        cwd = getcwd()
        data_file = join(cwd, filename)
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

        if filename.endswith("h5") or filename.endswith("hdf5"):
            with h5py.File(data_file, "r") as f:
                self.data = f["strain"][...]
                self.samp = f["strain"].attrs["samp"]
        elif filename.endswith("bin"):
            reader = ReaderDAS()
            t, dist, self.data, self.samp, gauge, self.timestamp = reader.read_DAS(filename,jit=False)

        self.stream = threading.Thread(target=self.start_producer)

    def start_producer(self):
        # sample * seconds
        batch_size = self.samp * self.SECONDS_SEND

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
            
            # add data into the batch
            datetime_interation = (datetime.fromtimestamp(self.timestamp - 2082844800) + 
                                   timedelta(seconds=self.SECONDS_SEND*self.current_interation)).strftime('%Y-%m-%d %H:%M:%S')
            package = {"array": batch.tolist(), "datetime": datetime_interation}
            
            self.producer.send(self.TOPIC_NAME, value=package)
            sleep(10)
            self.current_interation += 1
            
            print(f"datetime = {datetime_interation}")

            # restart the DAS to send the data from the begginer to keep the producer always working
            if self.current_interation == int(self.data.shape[1] / batch_size):
                self.current_interation = 0

    def start_stream(self):
        if self.current_interation == -1:
            self.stream.start()
        else:
            self.run_flag = True
            self.stream = threading.Thread(target=self.start_producer)
            self.stream.start()

    def stop_stream(self):
        self.run_flag = False
