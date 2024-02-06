const BASE_URL = 'https://demo-9c025a41.zvgz4d.on-acorn.io/';//host.docker.internal 
var btnStart = document.getElementById("start");
var lightGreen = document.getElementById("green-light");

var btnStop = document.getElementById("stop");
var lightRed = document.getElementById("red-light");
var running = false;
var lastInteration = -1;

function turnLight(type) {
    var btnPrimary = document.getElementById(type);
    var btnSecondary = document.getElementById(type == "start" ? "stop" : "start");
    var lightPrimary = document.getElementById((type == "start" ? "green" : "red") + "-light");
    var lightSecondary = document.getElementById((type == "start" ? "red" : "green") + "-light");

    btnPrimary.className = "btn btn-" + (type == "start" ? "success start" : "danger stop") + " disabled";
    btnSecondary.className = "btn btn-" + (type == "start" ? "danger stop" : "success start");
    lightPrimary.style = type == "start" ? "background-color: #50ff00; box-shadow: 0 0 5px #00FF28;" : "background-color: red; box-shadow: 0 0 5px #F00;";
    lightSecondary.style = "background-color: black;";

    //Toast notification
    const toastText = document.getElementById('toastText');
    const toastElement = document.getElementById('toastNotification');

    toastText.innerHTML = type == "start" ? "The interrogator started to producer DAS data into the Stream." : "The interrogator has stopped.";
    const toast = bootstrap.Toast.getOrCreateInstance(toastElement)
    toast.show();

    //screen
    const screen = document.getElementById("screen");
    if (lastInteration == -1)
        screen.value += type == 'start' ? "Running..." : "Stopped!";
    else
        screen.value += type == 'start' ? "\nRunning..." : "\nStopped!";
    screen.scrollTop = screen.scrollHeight;
    screen.style.display = "block";

    running = type == "start";
}

function callAPI(endpoint) {
    axios({
        method: 'post',
        url: BASE_URL + endpoint,
    })
        .then((resp) => {
            if (resp.data.status == "Started") {
                turnLight("start");
            } else if (resp.data.status == "Stopped") {
                turnLight("stop");
            }
        })
        .catch((error) => {
            shwoAlert();
            console.log(error);
        });
}

function shwoAlert() {
    const alertPlaceholder = document.getElementById('alert')
    const appendAlert = (message, type) => {
        const wrapper = document.createElement('div')
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('')

        alertPlaceholder.append(wrapper)
    }

    appendAlert('It was not possible access the API!', 'danger');
}

setInterval(() => {
    if (running) {
    axios({
        method: 'get',
        url: BASE_URL + 'status',
    })
        .then((resp) => {
            const currentInteration = resp.data.interation;
            if (currentInteration != lastInteration) {
                const screen = document.getElementById("screen");
                screen.value += "\n Interation " + currentInteration;
                screen.scrollTop = screen.scrollHeight;
                lastInteration = currentInteration;
            }
        }).catch((error) => {
            showAlert();
            console.log(error);
        });
    }
}, 1000);

document.getElementById("screen").value = "";