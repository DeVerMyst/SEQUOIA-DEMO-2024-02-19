There are three applications: Kafka-broker, backend and front-end. The first program to run is the broker, it should be running when the backend start, once that
the back-end process will connect with the broker.

1 - Start the broker:
Acces the folder with the file "docker-compose.yml" and start the compose:

> docker compose up

2 - Start the backend application:
Access the "backend" unpacked folder and install the requirements:

> pip install -r requirements.txt

Now, start the flask server there:

> flask run

Check is the terminal shows the message "Running on http://127.0.0.1:5000".

2 - Access the front-end page:
Access the folder "front" and open the file "interrogator.html" with a browser.

Hit the button "Start" or "Stop" to start or stop the stream. After start you should see the interations logs in the backend terminal.
