**architecture**

```
SERVER
│
├── backend
│   ├── app.py
│   ├── interrogatorProducer.py
│   ├── requirements.txt
│   └── VM_data.h5
│
├── front
│   ├── assets
│   ├── actionScript.js
│   ├── interrogator.css
│   └── interrogator.html
│
├── docker-compose.yml
└── README.md
```


**Danilo - Run by containers**

1 - Start the docker compose:
To run the interrogator simulator and kafka broker in containers go to the folder /SERVER and start the compose:

```
docker compose up
```

It should start the kafka broker, the backend and frontend process of the interrogator simulator.
To access the interrogator application go to: http://localhost:8080/interrogator.html

2 - Start the demo:

Go to the main folder of the repository and start the application in a the virtual env:

```
source .flask_app/bin/activate
python run.py
```

After that, open the URL: http://127.0.0.1:5050
The demo should open.

3 - Start the Interrogator simulator:

Click on the "Start" button in the intorrogator app.

4 - Start real-time:

Click on "Start Real-time" button and wait some seconds. The map should plot the DAS data.
Also the terminal running the demo should print the DAS data comming from stream.