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



const org = "sequoia"
const token = "zX9rO09QluTYPeRM9X8l2M4P1qZOnG3c_OSxXsuhyEotyz04hhkmhjIHOhSaLoLQ-MypdhZigvXhTYEzd5Rfdg=="

/*
const org = "amirza"
const token = "j8dKeK3p3IhZeA8yHKUI0AmopRczxs8dQg92pLJIy_8Irav5zokapNQqi9YWa3-aQ0_gYTl9F5o7l8enVxDsjw=="
//const bucket = "amirza";
*/
const influxDB = new InfluxDB({url, token}).getQueryApi(org)
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
    let T = data[0].map(function(col, c) {
        return data.map(function(row, r) {
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
    let sortedData = flatData.sort(function(a, b) { return a-b; });
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



// Interval to run the  query continuosly
let intervalId = null;

// Fetch data an show it in a plot
function fetchDisplay(dataType, timeStart, timeEnd, chStart, chEnd, speedStart, speedEnd, target, showMap=false, displayMode, bucket) {

    console.log("hi from fetechDisplay",bucket);
    const Nch = chEnd - chStart + 1;  // Get # of DAS channels
    let chString = createChQuery(chStart, chEnd);  // Get corresponding query string (for channels)
    let startT, endT;
    let query;


    // Get start/end times
    if (timeStart != null && timeEnd != null) {
        startT = timeStart.split("T")[1];
        endT = timeEnd.split("T")[1];
    }

    // If format is HH:MM, change to HH:MM:SSZ
    if (startT && startT.length == 6) {
        timeStart = timeStart.replace("Z", ":00Z");
    }
    if (endT && endT.length == 6) {
        timeEnd = timeEnd.replace("Z", ":00Z");
    }

    // Trick to select only 1 time sample (much faster than "limit(n:1)" in query)
    if (timeStart && timeEnd && timeStart === timeEnd) {
        timeEnd = timeStart.replace("Z", ".005Z");
    }


    // Query depends on the display mode chosen
    if (timeStart != null && timeEnd != null) {  // static and dynamic modes
        query = `
        from(bucket: "${bucket}")
        |> range(start: ${timeStart}, stop: ${timeEnd})
        |> filter(fn: (r) => (r._measurement == "${dataType}") and (${chString}))
        `
    } else {   // real time mode  (query data one minute before until now)
 
       query = executeQueryRealtime(dataType, chString);
  
    }

    // Window to visualize query
 
    console.log(query)

    
    let dataStore = [];
    let timeStore = [];
    let channels = []
    let lookup = {};
    for (let i = 0; i < Nch; i++) {
        channels.push(i+chStart);
        lookup[i+chStart] = i;
    }
    

    $(".loadButton").html("Loading...").removeClass("btn-outline-secondary").addClass("btn-warning");

    

    const observer = {
        next(row, tableMeta) {
            const o = tableMeta.toObject(row);
            //const index = parseInt(`${o._field}`);  // if field no "sensor_", use this
            const index = parseInt(re.exec(`${o._field}`)[1]);  // if field has "sensor_", use this

            if (!dataStore[lookup[index]]) {        // Create a new array if not exists
                dataStore[lookup[index]] = [];
                timeStore[lookup[index]] = [];
            }
            dataStore[lookup[index]].push(parseFloat(o._value));
            timeStore[lookup[index]].push(o._time);
        },
        error(error) {
            console.error(error);
        },
        complete() {
            console.log("data : ", dataStore);
            console.log("all time : ", timeStore);
            
            // If not reset array, the new data will append to the existing data, but we want only the new data
            // Reset data array
            let data = [];
            for (let i = 0; i < Nch; i++) {
                data[i] = [];
            }
            // Append new data to the existing data
            for (let i = 0; i < dataStore.length; i++) {
                if (dataStore[i]) {
                    data[i] = dataStore[i].concat(data[i]);
                }
            }
            
            // Remove old data from the dataStore
            dataStore = dataStore.slice(Nch); 

            console.log("\n Hi Query successful");

            $(".loadButton").html("Submit").removeClass("btn-warning").addClass("btn-outline-secondary");
            

            const Nt = getNt(data); 
            console.log("Nt :", Nt);

            // Check if the time array is empty
            let timesUTC;
            for (let i = 0; i < timeStore.length; i++) {
                if (timeStore[i] && timeStore[i].length > 0) {
                    timesUTC = timeStore[i];
                    break;
                }
            }

            console.log("time : ", timesUTC);


            // check if the toggle is checked or not
            var isLocalTime = document.getElementById("timeFormat").checked;
            // convert the array of UTC times to local times if the toggle is checked
            var timeFormatSelected = isLocalTime ? convertToLocale(timesUTC) : timesUTC;

            
            // Instantiate hotline options
            let plotData;
            let hl_options = {};
            let zmin, zmax;
            console.log(dataType);

            // Switch data type cases
            switch(dataType) {
                case "speed":
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
                plotTimeSeries(data, channels, target, dataType);
            }
            
            if (showMap) {
                plotMap(plotData, channels, hl_options, timesUTC, displayMode, speedStart, speedEnd, dataType);
                getTimeOut(timesUTC);
            }
        }
    };


    
    // Run the query
    // If timestart and timeend are null, continuously run the query every 60s
   
    if (timeStart == null && timeEnd == null) {
        query = executeQueryRealtime(dataType, chString);
        influxDB.queryRows(query, observer);
        intervalId = setInterval(() => {
            query = executeQueryRealtime(dataType, chString);
            influxDB.queryRows(query, observer);
            //console.log("fin")
        }, 30000);  // 30s
    }
    // If timestart and timeend are not null, run the query once
    else {
        influxDB.queryRows(query, observer);
    }


    function executeQueryRealtime(dataType, chString) {
        // Calculate the start and stop time
        var now = new Date();
        var stop = new Date(now.getTime() - (1 * 60 * 1000)); // 1 minutes before now
        now.setHours(now.getHours() + 2);  // +2hours cause Influxdb use UTC
        stop.setHours(stop.getHours() + 2);
    
        // Format the start and stop time in InfluxDB compatible format
        var startString = stop.toISOString();
        var stopString = now.toISOString();
    
        const query = `
          from(bucket: "${bucket}")
          |> range(start: ${startString}, stop: ${stopString}) 
          |> filter(fn: (r) => (r._measurement == "${dataType}") and ${chString})
        `
        return query;
    }

}




// function to convert an array of UTC time strings to local time strings
function convertToLocale(time) {
    return time.map(function(times) {
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
    if(intervalId !== null) {  // intervalId is not null meaning that real time mode is running
        if(confirm("You're currently in Real Time mode. Are you sure you want to stop Real Time mode and continue ?")) {
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