import { map, addCable, toggleCable, toggleMarkers, updateFeatures, createFeatures, removeCable, removeHotline, removeMarkers, toggleSatellite, clearMarkers } from "./components/mapHandler.mjs"
import { detectStopRealtime, fetchDisplay, stopQuery } from "./components/dataHandler.mjs"
import { stopAnimation, getTimeOut, clearDateTime } from "./components/plotHandler.mjs";
import { decimateObject } from "./components/tools.mjs"
/*
===============================================================
  General
===============================================================
*/

// Whenever one of the main menu buttons is clicked,
// show the corresponding menu underneath
$("button.main-button").on("click", function() {
    // Get data-target of clicked button
    var target = this.dataset.target;
    var elem = document.getElementById(target);
    var show = !$(elem).hasClass("active");

    // Get all menu items and hide them
    $(".menu-options").removeClass("active");
    $(".main-button").removeClass("btn-primary btn-success").addClass("btn-primary");

    if (show) {
        // Show target menu
        $(elem).addClass("active");
        $(this).removeClass("btn-primary").addClass("btn-success");
    }
})


// Clear the map
$("button#clear-button").on("click", function() {
    removeCable();
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
    
    // ANTONY FOR DEMO ======= clear map --> addCable
    // addCable(arrayCoordinates);
})


/*
===============================================================
  Setup
===============================================================
*/

// Fix for Bootstrap custom file input
$(".custom-file-input").on("change", function(e) {
    // Get the file name
    var fileName = e.target.files[0].name;
    // Replace the "Choose a file" label
    $(this).next(".custom-file-label").html(fileName);
});


// Upload a cable/sensor file
$("button.upload-file").on("click", function() {
    const target = this.dataset.target;
    const elem = document.getElementById(target);
    const type = elem.getAttribute("aria-label");
    const files = elem.files;

    // If the submit button is pressed without file: break
    if (files.length <= 0) {
        return false;
    }

    // Clear session memory
    sessionStorage.clear();
    
    // Instantiate a file reader (async)
    let fr = new FileReader();
    // When upload is started
    fr.onload = function(e) {
        // Parse results
        const result = JSON.parse(e.target.result);

        // If a new cable location file is provided
        if (type == "cable") {
            // Get channel spacing
            const interval = $("#channel-spacing").val();
            // Generate sensor locations from channel spacing
            createFeatures(result, interval);
        }
        // If a calibrated sensor file is provided
        else if (type == "calib") {
            // Load sensor locations directly from file
            updateFeatures(result);
        }
    }
    // Since the file reader is async, we have to wait 
    // until everything is ready to plot on the map...
    fr.onloadend = function() {

        const arrayCoordinates = JSON.parse(sessionStorage.getItem("arrayCoordinates"));
        const sensors = JSON.parse(sessionStorage.getItem("sensors"));
        // Number of DAS channels
        sessionStorage.setItem("Nch", sensors.length);

        // Plot cable on map
        addCable(arrayCoordinates);

        
        
    }
    // Start parsing the input file
    fr.readAsText(files.item(0));
});

var bucket

$("button.submit-bucket").on("click", function() {
    bucket = $("#bucket-name").val();

    // Switch to calibration menu
    $(".menu-options").removeClass("active");
    $("#calibration-options").addClass("active");
    // Enable other menu options
        $(".main-button").removeAttr("disabled");
        // Change button colours
        $(".main-button").removeClass("btn-success btn-primary").addClass("btn-primary");        
        $("#calib-button").removeClass("btn-primary").addClass("btn-success");

});

// ANTONY FOR DEMO ======= global variable
updateFeatures(result);
// console.log(result)
toggleCable(true);

// Écouter l'événement zoomend
map.on('zoomend', function() {
    // Obtenir le nouveau niveau de zoom
    var newZoom = map.getZoom();
    const checkbox = document.getElementById('show-markers');

    if(checkbox.checked)
    if(newZoom < 19)
    {
        var result_copy = decimateObject(result, .5*(19-newZoom)**2);
        updateFeatures(result_copy);
        console.log(isCableChecked)
        // toggleMarkers(checked);
        $("#show-markers").prop("checked", true);
        toggleMarkers(true)
        
        
    }
    // Mettre à jour ou utiliser le nouveau niveau de zoom
    console.log('Nouveau niveau de zoom :', newZoom);
});

// Number of DAS channels
sessionStorage.setItem("Nch", sensors.length);

// ANTONY FOR DEMO ======= SETUP is fix -->  Calibration
// Switch to calibration menu
// $(".menu-options").removeClass("active");
// $("#calibration-options").removeClass("active");
// $("#analysis-options").removeClass("active");
/*
===============================================================
  Calibration
===============================================================
*/


// Toggle sensor markers on/off
$("#show-markers").change(function() {
    const checked = $(this).prop("checked");
    toggleMarkers(checked);
})

let isCableChecked = false;

$("#show-cable").change(function() {
    isCableChecked = $(this).prop("checked");
    toggleCable(isCableChecked);
});

// // Toggle cable on/off
// $("#show-cable").change(function() {
//     const checked = $(this).prop("checked");
//     toggleCable(checked);
// })

// Toggle satellite on/off
$("#show-satellite").change(function() {
    const checked = $(this).prop("checked");
    toggleSatellite(checked);
})


// Submit data range for energy plot
$("#submitDateTimeCalib").on("click", function() {
    console.log("hello calibration ")
    let timeStart = `${$("#startdatetimecalib").val()}Z`;
    let timeEnd = `${$("#enddatetimecalib").val()}Z`;
    let chStart = parseInt($("#startchcalib").val());
    let chEnd = parseInt($("#endchcalib").val());
    const chMax = parseInt(sessionStorage.getItem("Nch"));

    if (isNaN(chStart) || (chStart < 0)) {
        chStart = 0;
    }
    if (isNaN(chEnd) || (chEnd >= chMax)) {
        chEnd = chMax - 1;
    }
    if (chStart >= chMax) {
        chStart = chMax - 1;
    }
    if (chStart > chEnd) {
        chEnd = chStart;
    }
    // bucket = $("#bucket-name").val();
    const target = "calibEnergyPanel"
    const displayMode = "dynamic"
   
    // fetchDisplay("energy", timeStart, timeEnd, chStart, chEnd, target, false);
    console.log("hi param: ",bucket,timeStart,timeEnd,chStart,chEnd,target,displayMode);
    // fetchDisplay("energy", timeStart, timeEnd, chStart, chEnd, target, true, displayMode, bucket);
    fetchDisplay("energy", timeStart, timeEnd, chStart, chEnd, 0, 0, target, false, displayMode, bucket);

})


$("#download-sensors").on("click", function() {
    // const sensors = JSON.parse(sessionStorage.getItem("sensors"));
    // const arrayCoordinates = JSON.parse(sessionStorage.getItem("arrayCoordinates"));

    const object = {
        sensors: sensors,
        arrayCoordinates: arrayCoordinates,
    };

    const filename = "sensors.json";
    const a = document.createElement("a");
    const type = filename.split(".").pop();
    a.href = URL.createObjectURL( new Blob([JSON.stringify(object)], {type: `text/${type === "txt" ? "plain" : type}`}) );
    a.download = filename;
    a.click();
});


/*
===============================================================
  Analysis
===============================================================
*/



// Static display: disable end time
$("#selectStatic").on("click", function() {
    if(detectStopRealtime()) {
        $("#startdatetimeanalysis").prop("disabled", false);  // enable start time
        $("#enddatetimeanalysis").prop("disabled", true);  // disable end time
        $("#submitDateTimeAnalysis").prop("disabled", false);  // disable submit button
        $("#stopRealTime").hide(); 
        $(".input-group-texte").show();
        $("#startdatetimeanalysis").show(); // disable start time
        $("#enddatetimeanalysis").show()  // disable end time 
        $("#startdatetimeanalysis").val("2021-12-22T21:31:04");
        removeCable();
        removeHotline();
        removeMarkers();
        stopAnimation();
        clearDateTime();
        $("#myRange").hide();
    } else {
        $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
        $("#submitDateTimeAnalysis").prop("disabled", true);  // enable submit button
    };
})

// Dynamic display: enable end time
$("#selectDynamic").on("click", function() {
    if(detectStopRealtime()) {
       $("#startdatetimeanalysis").prop("disabled", false);  // enable start time
       $("#enddatetimeanalysis").prop("disabled", false);  // enable start time
        $("#stopRealTime").hide();
        $(".input-group-texte").show();
        $("#startdatetimeanalysis").show(); // disable start time
        $("#enddatetimeanalysis").show()  // disable end time 
        $("#submitDateTimeAnalysis").prop("disabled", false);  // disable submit button
        removeCable();
        removeHotline();
        removeMarkers();
        stopAnimation();
        clearDateTime();
        //$("#myRange").show();
    } else {
        $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
        $("#submitDateTimeAnalysis").prop("disabled", true);  // disable submit button
    };
})

// Real time display: no start & end time
$("#selectRealtime").on("click", function() {
    $("#startdatetimeanalysis").hide(); // disable start time
    $("#enddatetimeanalysis").hide()  // disable end time 
    $(".input-group-texte").hide();
    $("#stopRealTime").show();
    $("#slide").hide();
    $("#myRange").hide();
    removeCable();
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
})

// Submit data range for analysis
$("#submitDateTimeAnalysis").on("click", function() { 

    const dataType = $("input[name='data-type']:checked").val();
    const displayMode = $("input[name='display-mode']:checked").val();
    let timeStart = `${$("#startdatetimeanalysis").val()}Z`;
    let timeEnd = `${$("#enddatetimeanalysis").val()}Z`;
    let chStart = parseInt($("#startchanalysis").val());
    let chEnd = parseInt($("#endchanalysis").val());
    let speedStart = parseInt($("#startspeedlysis").val());
    let speedEnd = parseInt($("#endspeedlysis").val());
    const chMax = parseInt(sessionStorage.getItem("Nch"));

    clearMarkers();
    removeCable();
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();

    if (isNaN(chStart) || (chStart < 0)) {
        chStart = 0;
    }
    if (isNaN(chEnd) || (chEnd >= chMax)) {
        chEnd = chMax - 1;
    }
    if (chStart >= chMax) {
        chStart = chMax - 1;
    }
    if (chStart > chEnd) {
        chEnd = chStart;
    }

    if (displayMode === "static") {
        timeEnd = timeStart;
    }

    if (displayMode === "dynamic") {
        $("#slide").show();
        $("#myRange").show();
    }

    if (displayMode === "realtime") {
        timeStart = null;
        timeEnd = null;
        $(this).prop("disabled", true);  // to prevent user submit again once he clicked the real time button,
                                             // if not the query will be executed again (two times or more)
    }

    const target = "analysisEnergyPanel";
    console.log("\n analysis param: ",bucket,timeStart,timeEnd,chStart,chEnd,speedStart,speedEnd,target,displayMode)
    fetchDisplay(dataType, timeStart, timeEnd, chStart, chEnd, speedStart, speedEnd, target, true, displayMode, bucket);

})

// Stop the Real Time Analysis
$("#stopRealTime").on("click", function() {
    stopQuery();
    $("#submitDateTimeAnalysis").prop("disabled", false);  // enable submit button
    removeCable();
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
});


// Data type = speed : range of speed
$("#selectSpeed").on("click", function() {
if(detectStopRealtime()) {
    $(".input-group-textee").show();
    $("#startspeedlysis").show();  
    $("#endspeedlysis").show();
    $("#slide").hide();
    $("#myRange").hide();
    $("#startdatetimeanalysis").val("2021-12-27T11:21:00");
    $("#enddatetimeanalysis").val("2021-12-27T11:22:00");
    $("#startchanalysis").val("901");
    $("#endchanalysis").val("1000");
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
} else {
    $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
    $("#submitDateTimeAnalysis").prop("disabled", true);  // enable submit button
    $("#selectSpeed").prop("checked", true);
}
});

// Data type = energy
$("#selectEnergy").on("click", function() {
if (detectStopRealtime()) {
    $(".input-group-textee").hide();
    $("#startspeedlysis").hide();  
    $("#endspeedlysis").hide();
    $("#slide").hide();
    $("#myRange").hide();
    $("#startdatetimeanalysis").val("2021-12-22T21:31:04");
    $("#enddatetimeanalysis").val("2021-12-22T21:32:04");
    $("#startchanalysis").val("700");
    $("#endchanalysis").val("1000");
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
} else {
    $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
    $("#submitDateTimeAnalysis").prop("disabled", true);  // enable submit button
    $("#selectEnergy").prop("checked", true);
}
    
});

// Data type = strain
$("#selectStrain").on("click", function() {
if (detectStopRealtime()) {
    $(".input-group-textee").hide();
    $("#startspeedlysis").hide();  
    $("#endspeedlysis").hide();
    $("#slide").hide();
    $("#myRange").hide();
    $("#startdatetimeanalysis").val("2021-12-22T21:31:04");
    $("#enddatetimeanalysis").val("2021-12-22T21:32:04");
    $("#startchanalysis").val("700");
    $("#endchanalysis").val("1000");
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
} else {
    $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
    $("#submitDateTimeAnalysis").prop("disabled", true);  // enable submit button
    $("#selectStrain").prop("checked", true);
}
    
});

// Data type = vehicle counts
$("#selectCounts").on("click", function() {
if (detectStopRealtime()) {
    $(".input-group-textee").hide();
    $("#startspeedlysis").hide();  
    $("#endspeedlysis").hide();
    $("#slide").hide();
    $("#myRange").hide();
    $("#startdatetimeanalysis").val("2021-12-13T11:05:00");
    $("#enddatetimeanalysis").val("2021-12-13T11:06:00");
    $("#startchanalysis").val("801");
    $("#endchanalysis").val("900");
    removeHotline();
    removeMarkers();
    stopAnimation();
    clearDateTime();
} else {
    $("#selectRealtime").prop("checked", true);  // still in real time if no end the mode 
    $("#submitDateTimeAnalysis").prop("disabled", true);  // enable submit button
    $("#selectCounts").prop("checked", true);
}
    
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
  });
