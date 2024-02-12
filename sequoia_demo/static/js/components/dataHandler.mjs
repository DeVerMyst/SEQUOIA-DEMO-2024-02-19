import { removeCable } from "./mapHandler.mjs";
import { plotWaterfall, plotTimeSeries, plotMap, stopAnimation, animateHotline, getTimeOut } from "./plotHandler.mjs";
import { InfluxDB } from "https://unpkg.com/@influxdata/influxdb-client-browser/dist/index.browser.mjs"

/*
===============================================================
  Connection to InfluxDB
===============================================================
*/

// !!!  Change the url, org, token and bucket !!!

// Automatic switch between dev environment (running on port 8000) and production environment
const currUrl = new URL(window.location.href);
let url = "";
if (currUrl.port == 8000) {
    url = "http://127.0.0.1:8100/";
}
else {
    url = "http://192.168.108.171:8086/";
    //url = "http://192.168.108.147:8086/";
}

// List with data comming from the stream to be proccessed
var dinamicList = [];
var dinamicTime = [];

const org = "sequoia"
const token = "zX9rO09QluTYPeRM9X8l2M4P1qZOnG3c_OSxXsuhyEotyz04hhkmhjIHOhSaLoLQ-MypdhZigvXhTYEzd5Rfdg=="

/*
const org = "amirza"
const token = "j8dKeK3p3IhZeA8yHKUI0AmopRczxs8dQg92pLJIy_8Irav5zokapNQqi9YWa3-aQ0_gYTl9F5o7l8enVxDsjw=="
//const bucket = "amirza";
*/
const influxDB = new InfluxDB({ url, token }).getQueryApi(org)
const re = /_(.*)/;


/*
===============================================================
  Functions to query data and show data
===============================================================
*/

// Helper routine to create a query string that includes all the sensors
// Need to send query chunk by chunk to prevent the problem with too many fields requested
function createChQuery(chStart, chEnd) {
    let chString = '';
    const obj = "field";  // tags are faster than fields

    // If multiple sensors are requested
    if (chStart != chEnd) {
        for (let i = chStart; i <= chEnd; i += 100) {   // Determine chunk size = 100 
            const start = i;
            const end = Math.min(i + 99, chEnd);
            let chunkString = `(r._${obj} == "sensor_${start}"`;
            for (let j = start + 1; j <= end; j++) {
                chunkString += ` or r._${obj} == "sensor_${j}"`;
            }
            chunkString += ")";

            if (chString === '') {
                chString += chunkString;
            } else {
                chString += ` or ${chunkString}`;
            }
        }
    }
    // If only one sensor is requested
    else {
        chString = `r._${obj} == "sensor_${chStart}"`;
    }

    return chString;
}



// Transpose an array
function transpose(data) {
    let T = data[0].map(function (col, c) {
        return data.map(function (row, r) {
            return data[r][c];
        });
    });
    return T;
}

// Get the number of time samples
function getNt(data) {
    let Nt = 1;
    for (let i = 0; i < data.length; i++) {
        if (data[i].length > Nt) {
            Nt = data[i].length;
        }
    }
    return Nt;
}

// Scale the input data so that it ranges from -1.5 to +1.5
function scaleData(data) {
    const Nch = data.length;
    console.log("start scaling");
    const Nt = getNt(data);
    //console.log(Nt);


    // Create a flat array of all the data
    let flatData = [];
    for (let i = 0; i < Nch; i++) {
        for (let j = 0; j < Nt; j++) {
            if (data[i].length == Nt) {
                flatData.push(data[i][j]);
            }
        }
    }

    const N = flatData.length;

    // Sort the flattened array
    let sortedData = flatData.sort(function (a, b) { return a - b; });
    const middle = Math.floor(0.5 * N);
    let median = 0;

    // Compute the median of the data
    if (N % 2) {
        median = sortedData[middle];
    }
    else {
        median = 0.5 * (sortedData[middle - 1] + sortedData[middle]);
    }

    // Compute interquartile ranges
    let q1 = sortedData[Math.floor(N / 4)];
    let q3 = sortedData[Math.ceil(N * 3 / 4)];
    let invIQR = 1 / (q3 - q1);

    // Scale data
    let scaledData = [];
    for (let i = 0; i < Nch; i++) {
        scaledData[i] = [];
        for (let j = 0; j < Nt; j++) {
            if (data[i].length == Nt) {
                // Scale the data from -1 to +1
                scaledData[i].push((data[i][j] - median) * invIQR);
            }
            else {
                scaledData[i].push(-999);
            }

        }
    }

    return scaledData;

}

//socket read part
const socket = io("ws://127.0.0.1:5050");
socket.connect();


// Interval to run the  query continuosly
let intervalId = null;

// Fetch data an show it in a plot
function fetchDisplay() {

    var dataStore = [];
    preparePlot();

    socket.on("data_update", (result) => {
        console.log(result);

        const array = result.array;
        array.forEach((element, idx) => {
            dataStore[idx] = [];

            for (let i = 0; i < 10; i++) {
                dataStore[idx].push(element[i]);
            }
        });

        for (let i = 0; i < 10; i++) {
            let datetime = new Date(result.datetime);
            dinamicTime.push(new Date(datetime.setSeconds(datetime.getSeconds() - i)).toISOString());
        }

        // Add dataStore based by time positions. Each second a set of sensors
        dinamicList = dinamicList.concat(transpose(dataStore));
    });
}

function preparePlot() {
    let speedStart = 30;
    let speedEnd = 110;
    const target = "analysisEnergyPanel";
    const dataType = "speed";
    const displayMode = "realtime";
    let chStart = 0;
    const Nch = 1984;
    const showMap = true;

    let channels = []
    for (let i = 0; i < Nch; i++) {
        channels.push(i + chStart);
    }

    console.log("\n Hi Query successful");

    $(".loadButton").html("Submit").removeClass("btn-warning").addClass("btn-outline-secondary");


    const Nt = 1;//getNt(data);
    console.log("Nt :", Nt);

    // Instantiate hotline options
    let plotData;
    let hl_options = {};
    let zmin, zmax;
    console.log(dataType);

    // Switch data type cases
    switch (dataType) {
        case "speed":
            zmin = 40;
            zmax = 100;
            hl_options = {
                weight: 8,
                min: zmin,
                max: zmax,
                /*palette: {
                    0.0: "rgb(178, 24, 43)",
                    0.2: "rgb(214, 96, 77)",
                    0.4: "rgb(244, 165, 130)",
                    0.6: "rgb(146, 197, 222)",
                    0.8: "rgb(67, 147, 195)",
                    1.0: "rgb(33, 102, 172)",
                }*/
                palette: {
                    0.0: "blue",
                    0.5: "white",
                    1.0: "red",
                }
            };
            break;

        case "total_count":
            // Do not scale data
            plotData = [];
            for (let i = 0; i < data.length; i++) {
                plotData[i] = [];
                for (let j = 0; j < Nt; j++) {
                    if (data[i].length == Nt) {
                        plotData[i].push(data[i][j]);
                    }
                    else {
                        plotData[i].push(70);
                    }

                }
            }
            zmin = 100;
            zmax = 300;
            hl_options = {
                weight: 8,
                min: zmin,
                max: zmax,
                /*palette: {
                    0.0: "rgb(178, 24, 43)",
                    0.2: "rgb(214, 96, 77)",
                    0.4: "rgb(244, 165, 130)",
                    0.6: "rgb(146, 197, 222)",
                    0.8: "rgb(67, 147, 195)",
                    1.0: "rgb(33, 102, 172)",
                }*/
                palette: {
                    0.0: "blue",
                    0.5: "white",
                    1.0: "red",
                }
            };
            break;

        default:
            // Standardise data (x - median(x)) / IQR
            // Missing values are set to -1
            plotData = scaleData(data);
            zmin = -1.5;
            zmax = 1.5;
            hl_options = {
                weight: 8,
                min: zmin,
                max: zmax,
                palette: {
                    0.0: "rgb(68, 1, 84)",
                    0.25: "rgb(59, 82, 139)",
                    0.5: "rgb(33, 145, 140)",
                    0.75: "rgb(94, 201, 98)",
                    1.0: "rgb(253, 231, 37)",
                },
                hovertemplate: "sensor: %{y}<br>value: %{z}<extra></extra>"
            };
    }

    if (Nt > 1) {
        plotWaterfall(plotData, channels, target, zmin, zmax, timeFormatSelected, dataType, displayMode);
    }
    else {
       // plotTimeSeries(dataStore, channels, target, dataType);
    }
    
    setInterval(() => {
        console.log("here");
        if (dinamicList.length > 0) {
            console.log("dinamicList size: "+dinamicList.length);
         
            if (showMap) {
                let currentData = dinamicList.shift();
                let timesUTC = dinamicTime.shift();
                plotMap(currentData, channels, hl_options, timesUTC, displayMode, speedStart, speedEnd, dataType);
                //getTimeOut(timesUTC);
            }
            
        }
    }, 1000);
    
}

// function to convert an array of UTC time strings to local time strings
function convertToLocale(time) {
    return time.map(function (times) {
        return new Date(times).toLocaleTimeString();
    });
}



// Stop the query if user wants to end the real time mode
function stopQuery() {
    // Clear the interval if it is set (interval to run query)
    if (intervalId !== null) {
        $(".stopButton").html("Stopping...").removeClass("btn-outline-secondary").addClass("btn-warning");
        clearInterval(intervalId);
        intervalId = null;  // Set interval to null
        stopAnimation();
        console.log("Stopped");
        alert("Real time mode has been stopped.")
        $(".stopButton").html("Stop Real Time").removeClass("btn-warning").addClass("btn-outline-secondary");
    } else {
        stopAnimation();
        alert("Real Time mode is not running.")
    }
}

// Check if the stop real time button is clicked (realtime mode ended) before running others modes
function detectStopRealtime() {
    if (intervalId !== null) {  // intervalId is not null meaning that real time mode is running
        if (confirm("You're currently in Real Time mode. Are you sure you want to stop Real Time mode and continue ?")) {
            stopQuery();
            return true;  // User click "OK" to stop real time mode 
        } else {
            return false;  // User click "Cancel" to stop real time mode (cannot continue others modes)
        }
    } else {
        return true;  // intervalId is null meaning that real time mode is stopped
    }
}



export { fetchDisplay, transpose, getNt, stopQuery, detectStopRealtime };