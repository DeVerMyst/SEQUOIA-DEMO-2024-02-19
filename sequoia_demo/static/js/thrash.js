/*
===============================================================
  Setup
===============================================================
*/

// Fix for Bootstrap custom file input
$(".custom-file-input").on("change", function(e) {
    // Get the file name
    var fileName = e.target.files[0].name;
    console.log(fileName)
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

let bucket;
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