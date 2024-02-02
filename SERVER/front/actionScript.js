const BASE_URL = 'http://127.0.0.1:5000/';//host.docker.internal
var btnStart = document.getElementById("start");
var lightGreen = document.getElementById("green-light");

var btnStop = document.getElementById("stop");
var lightRed = document.getElementById("red-light");

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