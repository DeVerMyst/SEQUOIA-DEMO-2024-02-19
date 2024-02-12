import { transpose, getNt } from "./dataHandler.mjs";
import { addHotline, removeCable, showMarker, showPosition, showPositionFixed, clearMarkers } from "./mapHandler.mjs";

var runAnimation = false;
let autoSlideFlag;
let timeOut;

// Plotly layout options
var layout = {
    autosize: false,
    width: 600,
    height: 200,
    margin: {
        t: 20,
        b: 10,
        l: 10,
        r: 10,
        pad: 0,
    },
    xaxis: {
        "showticklabels": true,
        "autorange": true,
    },
    yaxis: {
        "showticklabels": true,
        "autorange": true,
    },
};


// Adjust toolbar on top of the panel
var modeBarOptions = {
    displayModeBar: true,
    modeBarButtonsToRemove: [
        "hoverClosestCartesian", 
        "hoverCompareCartesian", 
        "toggleSpikelines",
        "autoScale2d",
    ],
    displaylogo: false,
}

// Calculate time out which is depending on the frequency of data
function getTimeOut(times) {
    timeOut = new Date(times[1]).getTime() - new Date(times[0]).getTime();
    return timeOut;
} 


// Sleep for `ms` milliseconds (works in async)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Remove all plotly panels
function purgePlots() {
    Plotly.purge("analysisEnergyPanel");
   // Plotly.purge("calibEnergyPanel");
}

// Stop the current animation
async function stopAnimation() {
    runAnimation = false;
    autoSlideFlag = false; // Set the flag to stop autoSlide
    await sleep(40);
}

var oldData;
var oldTime;

// Plot a waterfall (heatmap) plot - dynamic & real time mode
function plotWaterfall(data, channels, target, zmin, zmax, time, dataType, displayMode) {
    console.log("waterfall");

    switch (dataType) {
        case "speed":
            var myPlot = document.getElementById('analysisEnergyPanel');
            var params = [{
                y: channels,
                x: time,
                z: data,
                zmin: zmin,
                zmax: zmax,
                type: "heatmap",
                showscale: true,
                hovertemplate: "sensor: %{y}<br>value: %{z}<br>time: %{x}<extra></extra>",
                /*colorscale: [
                    [0, "rgb(0, 0, 255)"],    
                    [0.2, "rgb(0, 128, 0)"],  
                    [0.4, "rgb(255, 255, 0)"],
                    [0.6, "rgb(255, 165, 0)"],
                    [0.8, "rgb(255, 0, 0)"],  
                    [1, "rgb(128, 0, 128)"]
                  ],*/
                  colorscale : "RdBu",
                colorbar: {
                    title: "in km/h",
                    ticks: "outside",
                    tickmode: "auto",
                    
                  },
            }];     

            var layout = {
                title: `Graph of ${dataType}`,
                yaxis: {
                title: "Channels"
                },
                xaxis: {
                title: "Time",
                tickmode: "auto",
                nticks: 5,
                },
            };

            //purgePlots();
            //Plotly.newPlot(target, params, layout, modeBarOptions);

        break;

        case "total_count":
            var myPlot = document.getElementById('analysisEnergyPanel');
            var params = [{
                y: channels,
                x: time,
                z: data,
                zmin: zmin,
                zmax: zmax,
                type: "heatmap",
                showscale: true,
                hovertemplate: "sensor: %{y}<br>value: %{z}<br>time: %{x}<extra></extra>",
                colorscale : "RdBu",
                colorbar: {
                    title: "numbers",
                    ticks: "outside",
                    tickmode: "auto",
                    
                  },
            }];     

            var layout = {
                title: `Graph of vehicle counts`,
                yaxis: {
                title: "Channels"
                },
                xaxis: {
                title: "Time",
                tickmode: "auto",
                nticks: 5,
                },
            };
            
        break;

        default: 
        var myPlot = document.getElementById('analysisEnergyPanel');

        var params = [{
            y: channels,
            x: time,
            z: data,
            zmin: zmin,
            zmax: zmax,
            zmid: 0.5 * (zmin + zmax),
            type: "heatmap",
            colorscale: "Viridis",
            showscale: true,
            hovertemplate: "sensor: %{y}<br>value: %{z}<br>time: %{x}<extra></extra>",
        }];

        var layout = {
            title: `Graph of ${dataType}`,
            yaxis: {
                title: "Channels"
            },
            xaxis: {
                title: "Time",
                tickmode: "auto",
                nticks: 5,
            }
        };
        
        //purgePlots();
        //Plotly.newPlot(target, params, layout, modeBarOptions);

        break;
    };
    
    
    var plotExists = myPlot && myPlot.hasChildNodes();

    // Create or update the plot
    if (plotExists && displayMode === "realtime" && oldTime && oldData) {
        
        var concatenatedData = [];
        var concatenatedTime = oldTime.concat(time);

        // add data queried just before add to the new query
        for (let i = 0; i < oldData.length; i++) {
            concatenatedData.push([...oldData[i], ...data[i]]);
        };

        var newParams = {
            z : [concatenatedData],
            x : [concatenatedTime],
            y : [channels],
        };

        Plotly.update(target, newParams, [0]);
        oldData = data;
        oldTime = time;

    } else {
        Plotly.newPlot(target, params, layout, modeBarOptions);
        oldData = data;
        oldTime = time;
    }

    // Attach hover event listener
    myPlot.on('plotly_hover', function (eventData) {
        var sensor = eventData.points[0].y;
        // show hover marker
        return showMarker(sensor);
    })
}



// Plot time series - static mode
function plotTimeSeries(data, channels, target, dataType) {
    console.log("timeseries");

    var myPlot = document.getElementById('analysisEnergyPanel');
    var plotExists = myPlot && myPlot.hasChildNodes();

    let y = [];

    for(let i = 0; i < data.length; i++) {
        y.push(data[i]);
    }

    let params = [{
        x: channels,
        y: y,
        mode: "lines",
        hovertemplate: "sensor: %{x}<br />value: %{y}<extra></extra>",
    }];

    var layout = {
        title: `Graph of ${dataType}`,
        yaxis:{
            title: "Values"
        },
        xaxis: {
            title: "Channels"
        }
    }

    // Create or update the plot
    if (plotExists) {
        Plotly.update(target, params, [0]);
    }else{
        purgePlots();
        Plotly.newPlot(target, params, layout, modeBarOptions);
    }

    // Attach hover event listener
    // myPlot.on('plotly_hover', function (eventData) {
    //     var sensor = eventData.points[0].x;
    //     // show hover marker
    //     return showMarker(sensor);
    // })
}


// Plot data on the map and slider
async function plotMap(data, channels, options, times, displayMode, speedStart, speedEnd, dataType) {
    const Nt = getNt(data);
    //const sensors = JSON.parse(sessionStorage.getItem("sensors"));
    autoSlideFlag = false;
    
    // Clean-up first
  //  await stopAnimation();
    removeCable();


        // For the creation of time slider
        // find the minimum and maximum times in the array
        const minTime = new Date(times[0]);  // get the min time value as a date object
        const maxTime = new Date(times[times.length - 1]);  // get the max time value as a date object

        // set the min, max for the slider
        var slider = document.getElementById("myRange");
        slider.min = minTime.getTime();
        slider.max = maxTime.getTime();

        // set the step value to the difference between consecutive values in the times array 
        slider.step = (new Date(times[1]).getTime() - new Date(times[0]).getTime()).toString();

        // update the value display under the slider when the slider is moved
        var output = document.getElementById("demo");

        let sliderIsDragging = false; // flag variable to indicate whether slider is being dragged
        let selectedTimeIndex = 0; // Variable to keep track of the current index in the times array

        // slider.addEventListener("mousedown", function() {
        //     sliderIsDragging = true;
        //     runAnimation = false;
        // });

        // // Function to handle automatic sliding of the slider
        // async function autoSlide(currentIndex) {
        //     autoSlideFlag = true; // Flag variable to control the animation
        //     while (currentIndex < times.length && !sliderIsDragging && autoSlideFlag) {
        //         let selected = times[currentIndex];
        //         output.innerHTML = selected;
        //         slider.value = new Date(selected).getTime(); // Update the slider position
        //         currentIndex++;
        //         timeOut = getTimeOut(times);
        //         await sleep(timeOut);
        //     }
            
        // }   
    
        // slider.addEventListener("input", async function() {

        //     // Clear previous markers
        //     clearMarkers();

        //     const selectedTime = new Date(parseInt(this.value)).toISOString();
        //     output.innerHTML = selectedTime;
        //     //await plotMap(data, channels, options, selectedTime, times); // call plotMap with selectedTime
        //     if (selectedTime !== undefined) {

        //         // Find the index of the selected time in the `times` array
        //         selectedTimeIndex = times.findIndex(time => new Date(time).getTime() === new Date(selectedTime).getTime());
                
        //         // Plot the data on the map
        //         let mapData = []
        //         for (let i = 0; i < channels.length; i++) {
        //             const index = channels[i];
        //             const val = data[i][selectedTimeIndex];
        //             //selectedData.push(val);
        //             mapData.push([sensors[index].latLng.lat, sensors[index].latLng.lng, val]);
        //         }

        //         addHotline(mapData, options);

        //         if (dataType === "speed") {
        //             for (let j = 0; j < mapData.length; j++) {
        //                 if (mapData[j][2]<= speedEnd && mapData[j][2] >= speedStart) {
        //                 showPositionFixed(mapData[j][0], mapData[j][1], channels[j], mapData[j][2], selectedTime);
        //                 }
        //             }
        //         }
        //     }

        // });

    


    // set disabled property of the slider
    if (displayMode === "dynamic") {
        slider.disabled = false;
        output.innerHTML = minTime.toUTCString();
    } else if (displayMode === "realtime"){ 
        slider.disabled = true;
        output.innerHTML = "none"
    }
    
    if (Nt == 1) {   // If only 1 time sample: static mode
        document.getElementById("demo").innerHTML = times[0];
        let mapData = []
        // Create a hotline
        for (let i = 0; i < channels.length; i++) {
            const index = channels[i];
            const val = data[i];
            mapData.push([sensors[index].latLng.lat, sensors[index].latLng.lng, val]);
        }
        addHotline(mapData, options);

        // if (dataType === "speed") {
        //     for (let j = 0; j < mapData.length; j++) {
        //         if (mapData[j][2] <= speedEnd && mapData[j][2] >= speedStart) {
        //             showPositionFixed(mapData[j][0], mapData[j][1], channels[j], mapData[j][2], times[0]);
        //         }
            
        //     }
        // }   
    } else if (sliderIsDragging === false) {   // Else: dynamic mode
        runAnimation = true;
        // Transpose the data
        let dataT = transpose(data);
        animateHotline(dataT, channels, options, 0, sliderIsDragging, speedStart, speedEnd, dataType, times);
        autoSlide(0);
    }
   
}



// Animate a hotline
async function animateHotline(data, channels, options, selectedTimeIndex, sliderIsDragging, speedStart, speedEnd, dataType, times) {
    //let i = selectedTimeIndex;
    //let t = 0;
    // NOTE: data is transposed [data.shape = (time, channels)]
    const Nt = data.length;
    const Nch = data[0].length;
    const sensors = JSON.parse(sessionStorage.getItem("sensors"));

    let lines = [];
    // Create an array of hotlines
       for (let t = selectedTimeIndex; t < Nt; t++) {
        let line = [];
        for (let c = 0; c < Nch; c++) {
            let index = channels[c];
            let val = data[t][c];
            line.push([sensors[index].latLng.lat, sensors[index].latLng.lng, val]);
        }
        lines.push(line);
        } 
    
    // Switch global flag (for interrupt)
    runAnimation = true;

        for (let i = selectedTimeIndex; i<Nt && runAnimation; i++) {
            addHotline(lines[i], options);

            if (dataType === "speed") {
                for (let j = 0; j < lines[i].length; j++) {
                    if (lines[i][j][2] <= speedEnd && lines[i][j][2] >= speedStart) {
                       showPosition(lines[i][j][0], lines[i][j][1], channels[j], lines[i][j][2]); // show red marker
                    }
                
                }
            }           

            timeOut = getTimeOut(times);
            await sleep(timeOut); // Neseccary to syncronise the clock
            // Stop animation once the data has finish
            if(i === Nt - 1 || sliderIsDragging) {
                runAnimation = false;
            }
        }
    
}

// Clear the date & time shown on menu
function clearDateTime() {
    var output = document.getElementById("demo");
    output.innerHTML = "";
    var slider = document.getElementById("myRange");
    slider.value = "0";
    autoSlideFlag = false;
}


function createTimeRangeSlider(times, data, channels, options, displayMode) {
    // set the number of time for the data
    const Nt = data.length;

    // find the minimum and maximum times in the array
    const minTime = new Date(times[1]);  // get the min time value as a date object
    const maxTime = new Date(times[times.length - 1]);  // get the max time value as a date object
        
    // set the min, max, and default values for the slider
    var slider = document.getElementById("myRange");
    slider.min = minTime.getTime();
    slider.max = maxTime.getTime();

    // set the step value to the difference between consecutive values in the times array = 40ms
    slider.step = (new Date(times[1]).getTime() - new Date(times[0]).getTime()).toString();

    // update the value display when the slider is moved
    var output = document.getElementById("demo");

    // set disabled property of the slider
    if (displayMode === "dynamic") {
        slider.disabled = false;
        output.innerHTML = minTime.toUTCString();
    } else {
        slider.disabled = true;
        output.innerHTML = "none"
    }

    //animateHotline(data, channels, options)
        
    slider.addEventListener("input", async function() {
        const selectedTime = new Date(parseInt(this.value)).toISOString();
        output.innerHTML = selectedTime;
        //console.log(data, channels, options, selectedTime, times);
        await plotMap(data, channels, options, times, selectedTime); // call plotMap with selectedTime
    });
    //plotMap(data, channels, options)
}




export { purgePlots, plotWaterfall, plotMap, plotTimeSeries, stopAnimation, animateHotline, getTimeOut, clearDateTime };
