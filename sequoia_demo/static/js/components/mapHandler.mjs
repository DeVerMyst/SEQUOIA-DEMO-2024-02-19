import { purgePlots, stopAnimation } from "./plotHandler.mjs"

// Representation of the map at Nice by setting the view center and maximum zoom level at 19.5
// Leaflet is globablly available as `L`
L.Hotline.renderer({pane: "popupPane"});
var map = L.map('map').setView([43.69315081744552, 7.245756233588564], 14);
var openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom : 19.5
}).addTo(map);
var satelliteMap = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
})


 
// Instantiate a layer for the markers (to be access within function scope)
var markers = null;
var markerLayer = null;
var cableLayer = null;
var hotLineLayer = null;
var markers = [];


/*
===============================================================
  Definitions
===============================================================
*/

const iconSize = [25, 41];
const iconAnchor = [12, 41];
const popupAnchor = [1, -34];
const shadowSize = [41, 41];
 
// Default marker
const defaultMarker = new L.Icon({
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Disc_Plain_blue_dark.svg",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, 0],
});
// Default icon for control markers
const redMarker = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    shadowSize: shadowSize,
});
// Icon for traffic light marker
const trafficMarker = new L.Icon({
    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Traffic_lights_icon.svg',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    shadowSize: shadowSize,
});
// Icon for intersection marker
const intersectionMarker = new L.Icon({
    iconUrl: './src/img/road-sign.png',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    shadowSize: shadowSize,
});
// icon from tram station marker
const tramMarker = new L.Icon({
    iconUrl: './src/img/tramstation_icon.png',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    shadowSize: shadowSize,
});
// Icon for bus station marker
const busMarker = new L.Icon({
    iconUrl: './src/img/busstation_icon.png',
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: popupAnchor,
    shadowSize: shadowSize,
});
 
const markerPopupText = `
<div class="row">
    <div class="form-check">
        <input type="radio" class="form-check-input" id="trafficlight" name="option" value="Traffic light"><label class="form-check-label" for="trafficlight">Traffic light</label>
    </div>
</div>
<div class="row">
    <div class="form-check">
        <input type="radio" class="form-check-input" id="intersection" name="option" value="Intersection"><label class="form-check-label" for="intersection">Intersection</label>
    </div>
</div>
<div class="row">
    <div class="form-check">
        <input type="radio" class="form-check-input" id="tramstation" name="option" value="Tram station"><label class="form-check-label" for="tramstation">Tram station</label>
    </div>
</div>
<div class="row">
    <div class="form-check">
        <input type="radio" class="form-check-input" id="busstation" name="option" value="Bus station"><label class="form-check-label" for="busstation">Bus station</label>
    </div>
</div>
<!--<div class="row mt-2">
    <input type="text" class="form-control" id="reason" name="option" placeholder="Other reason..."/>
</div>-->
`;


/*
===============================================================
  Toggles
===============================================================
*/


function addHotline(data, options) {
    if (hotLineLayer !== null) {
        map.removeLayer(hotLineLayer);
    }
    hotLineLayer = L.hotline(data, options).addTo(map);
}

function removeHotline() {
    if (hotLineLayer !== null) {
        stopAnimation();
        map.removeLayer(hotLineLayer);
        hotLineLayer = null;
    }
}

function addCable(data) {
    if (cableLayer !== null) {
        map.removeLayer(cableLayer);
    }
    cableLayer = L.polyline(data, {color: "blue"}).addTo(map);
    let div = $("#show-cable").parent();
    $(div).removeClass("btn-light off");
    $("#show-cable").prop("checked", true);
}

function removeCable() {
    if (cableLayer !== null) {
        map.removeLayer(cableLayer);
    }
    cableLayer = null;
    let div = $("#show-cable").parent();
    $(div).removeClass("btn-success").addClass("btn-light off");
    $("#show-cable").prop("checked", false);
}

function removeMarkers() {
    try {
        map.removeLayer(markerLayer);
        clearMarkers();
        let div = $("#show-markers").parent();
        $(div).removeClass("btn-success").addClass("btn-light off");
        $("#show-markers").prop("checked", false);
        purgePlots();
    }
    catch(error) {
        console.log("No marker layer present...");
    }
    
}

function toggleMarkers(show) {
    // If state === true: add marker group layer to map
    // Else: remove marker group layer

    if (show) {
        map.addLayer(markerLayer);
    }
    else {
        removeMarkers();
    }
}

function toggleCable(show) {
    if (show) {
        const data = JSON.parse(sessionStorage.getItem("arrayCoordinates"));
        addCable(data);
    }
    else {
        removeCable();
    }
}

function toggleSatellite(show) {
    if (show) {
        map.removeLayer(openStreetMap);
        map.addLayer(satelliteMap);
    }
    else {
        removeSatellite();
    }
}

function removeSatellite() {
    map.removeLayer(satelliteMap);
    map.addLayer(openStreetMap);
}

/*
===============================================================
  Show marker on map when hover on the graph
===============================================================
*/

// Show the marker when hover on the graph on the menu
function showMarker(sensor) {
  
    // Add a marker for the corresponding sensor
    var latLng = getLatLngForSensor(sensor); // Use this function to get the latitude and longitude for the sensor
    if (latLng) {
        // Remove existing markers from the map
        map.eachLayer(function (layer) {
            if (layer instanceof L.Marker) {
                map.removeLayer(layer);
            }
        });

        // Creates a red marker
        var redMarker = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        
        // Show marker on map
        var marker = L.marker([latLng.latLng.lat, latLng.latLng.lng], {icon: redMarker}).addTo(map);
        marker.bindPopup("Sensor " + sensor);
        marker.openPopup();

        // Marker disapear automatically after 3s
        setTimeout(function () {
            map.removeLayer(marker);
        }, 3000);

    }
}

// Get the lat and lng of the channel
function getLatLngForSensor(sensorId) {    
    // Example implementation:
    // const sensors = JSON.parse(sessionStorage.getItem("sensors"));
    
        
    // Check if the sensorId exists in the sensorData
    if (sensorId in sensors) {
      return sensors[sensorId];
    } else {
      return null; // Return null if the sensorId is not found
    }
}

// Add marker for sensors between speed range
function showPosition(lat, lng, sensorId, speed) {
    
    // Create a marker
    var redMarker = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var markerSpeed = L.marker([lat, lng], {icon: redMarker}).addTo(map);
    markerSpeed.bindPopup("Sensor " + sensorId + "<br>Speed " + speed + " km/h");

    // Add the marker to the markers array
    markers.push(markerSpeed);

    // Marker disapear automatically after 1s as the time interval for speed is 1s
    setTimeout(function () {
        map.removeLayer(markerSpeed);
    }, 1000);
}

// Add marker for sensors between speed range
function showPositionFixed(lat, lng, sensorId, speed, time) {

    // Create a marker
    var redMarker = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    var markerSpeed = L.marker([lat, lng], {icon: redMarker}).addTo(map);
    markerSpeed.bindPopup("Sensor : " + sensorId + "<br>Speed : " + speed + " km/h" + "<br>Time : " + time);

    // Add the marker to the markers array
    markers.push(markerSpeed);

}

// Google Street View marker
map.on('click', function(e) {

    var icon = L.divIcon({
      className: 'custom-div-icon',
      html: "<div style='background-color:#4838cc;' class='marker-pin'></div><i class='fa fa-camera awesome'>",
      iconSize: [15, 20],
      iconAnchor: [11, 20], 
      popupAnchor:  [0, -20],
    });
  
    let lat = e.latlng.lat.toPrecision(8);
    let lon = e.latlng.lng.toPrecision(8);
  
  
    var point = L.marker([lat, lon], { icon: icon }).addTo(map)
                    .bindPopup("Click for : <br>" + '<a href="http://maps.google.com/maps?q=&layer=c&cbll=' + lat + ',' + lon + '&cbp=11,0,0,0,0" target="blank"><b> Google Street View </b></a>').openPopup();

  
    // Open the Street View modal on popup click
    point.on('click', function() {
      $(content).modal('show');
    });
  
    // Marker disappears automatically after 3s
    setTimeout(function() {
      map.removeLayer(point);
    }, 3000);
});

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) {
        map.removeLayer(markers[i]);
    }
    markers = [];
}
  

/*
===============================================================
  Callbacks
===============================================================
*/

function markerCallback() {
    $(".btn-check").on("change", e => {
        e.preventDefault();
        var button = $(".btn-check:checked");
        var container = button.parent().parent();
        var reason = container.find("input[name='option']:checked").val();
        var sensors = JSON.parse(sessionStorage.getItem("sensors"));
        var controlPoints = JSON.parse(sessionStorage.getItem("controlPoints"));
        if (controlPoints == null) {
            var controlPoints = []
        }
        const i = parseInt(button.val());

        sensors[i].controlPoint = 1;
        sensors[i].reason = reason;

        // Find control point insertion location
        let index = controlPoints.findIndex(elem => elem > i);
        if (index == -1) {
            index = controlPoints.length;
        }
        controlPoints.splice(index, 0, i);

        sessionStorage.setItem("sensors", JSON.stringify(sensors));
        sessionStorage.setItem("controlPoints", JSON.stringify(controlPoints));

        createMarkers();
        toggleMarkers(true);
    })
}

function controlMarkerCallback() {
    $(".btn-check").on("change", e => {
        e.preventDefault();
        var button = $(".btn-check:checked");
        var sensors = JSON.parse(sessionStorage.getItem("sensors"));
        var controlPoints = JSON.parse(sessionStorage.getItem("controlPoints"));
        const i = parseInt(button.val());

        sensors[i].controlPoint = 0;
        sensors[i].reason = null;

        const index = controlPoints.findIndex(element => element == i);
        if (index === 0) {
            controlPoints.shift();
        }
        else {
            controlPoints.splice(index);
        }

        sessionStorage.setItem("sensors", JSON.stringify(sensors));
        sessionStorage.setItem("controlPoints", JSON.stringify(controlPoints));

        createMarkers();
        toggleMarkers(true);
    })
}

function dragMarkerCallback(e, i) {
    const arrayCoordinates = JSON.parse(sessionStorage.getItem("arrayCoordinates"));
    let sensors = JSON.parse(sessionStorage.getItem("sensors"));
    let latlng = e.target.getLatLng();
    latlng = closest(map, arrayCoordinates, latlng);

    sensors[i].latLng.lat = latlng.lat;
    sensors[i].latLng.lng = latlng.lng;

    sessionStorage.setItem("sensors", JSON.stringify(sensors));
    markers[i].setLatLng(sensors[i].latLng).update();

    // Trigger update of other sensor positions
    updateSensorPositions(i);
}


/*
===============================================================
  Instantiation routines
===============================================================
*/

function updateSensorPositions(c) {
    // Given control index `c`, find the previous and next control points
    // Update sensor positions uniformly between c-1 and c, and c and c+1
    // Do not affect other sensors...

    // Find neighbouring control points
    const arrayCoordinates = JSON.parse(sessionStorage.getItem("arrayCoordinates"));
    let controlPoints = JSON.parse(sessionStorage.getItem("controlPoints"));
    let sensors = JSON.parse(sessionStorage.getItem("sensors"));
    const index = controlPoints.findIndex(element => element == c);
    let prevPoint = 0;
    let nextPoint = 0;
    let Nstart = 0;
    let Nend = 0;

    // Control point not found...
    if (index == -1) {
        console.error(`control point ${c} not found...`);
        return;
    }

    // Last control point
    if (index == controlPoints.length - 1) {
        Nend = sensors.length;
        nextPoint = {
            latLng: {
                lat: arrayCoordinates.slice(-1)[0][0],
                lng: arrayCoordinates.slice(-1)[0][1],
            }
        };
    }
    else {
        Nend = controlPoints[index+1];
        nextPoint = sensors[Nend];
    }

    // First control point
    if (index == 0) {
        prevPoint = {
            latLng: {
                lat: arrayCoordinates[0][0],
                lng: arrayCoordinates[0][1],
            }
        };
        Nstart = 0;
    }
    else {
        Nstart = controlPoints[index-1]
        prevPoint = sensors[Nstart];
    }

    let thisPoint = sensors[c];

    const object = {
        0: [prevPoint, thisPoint, Nstart, c],
        1: [thisPoint, nextPoint, c, Nend],
    };

    for (const key in object) {
        const obj = object[key];

        let segment1 = isPointOnLine([obj[0].latLng.lat, obj[0].latLng.lng], arrayCoordinates);
        let segment2 = isPointOnLine([obj[1].latLng.lat, obj[1].latLng.lng], arrayCoordinates);

        let segmentSensors = [[obj[0].latLng.lat, obj[0].latLng.lng]];
        for (let i = segment1+1; i <= segment2; i++) {
            segmentSensors.push([arrayCoordinates[i][0], arrayCoordinates[i][1]]);
        }
        segmentSensors.push([obj[1].latLng.lat, obj[1].latLng.lng]);

        const Nsensors = obj[3] - obj[2];

        let ratios = [];
        for (let i = 0; i <= Nsensors; i++) {
            const ratio = i / Nsensors;
            ratios.push(ratio);
        }

        const sensorsCorrected = ratios.map((ratio) => interpolateOnLine(map, segmentSensors, ratio));

        for (let i = 1; i < sensorsCorrected.length - 1; i++) {
            const index = obj[2] + i;
            sensors[index].latLng.lat = sensorsCorrected[i].latLng.lat;
            sensors[index].latLng.lng = sensorsCorrected[i].latLng.lng;
            markers[index].setLatLng(sensors[index].latLng).update();
        }
    }

    sessionStorage.setItem("sensors", JSON.stringify(sensors));

}

function createMarkers() {

    const sensors = JSON.parse(sessionStorage.getItem("sensors"));

    // Check if markers were already defined before
    // If yes: attempt to remove from map
    if (markerLayer !== null) {
        map.removeLayer(markerLayer);
    }
    // Create a new marker layer
    markerLayer = L.layerGroup();
    markers = [];

    for(let i = 0; i < sensors.length; i++) {
        const point = new L.LatLng(sensors[i].latLng.lat, sensors[i].latLng.lng);
        let icon = null;
        
        if (sensors[i].controlPoint) {

            var reason = sensors[i].reason;
            switch (reason) {
                case "Traffic light":
                    icon = trafficMarker;
                    break;
                case "Tram station":
                    icon = tramMarker;
                    break;
                case "Intersection":
                    icon = intersectionMarker;
                    break;
                case "Bus station":
                    icon = busMarker;
                    break;
                default:
                    reason = "no reason"
                    icon = redMarker;
            }

            var marker = L.marker(point, {draggable: true, autoPan: true, icon: icon});
            const popupContent = `
            <div class="container">
                <div class="row"><h3>Sensor ${i}</h3></div>
                <div class="row">Control point (${reason})</div>
                <div class="row mt-2">
                    <input type="checkbox" class="btn-check" id="btn-check-${i}" value="${i}" autocomplete="off" style="display: none">
                    <label class="btn btn-danger" for="btn-check-${i}">Deselect control point</label>
                </div>
            </div>
            `;

            const ID = i;  // Freeze `i` and pass it to callback wrapper
            marker.bindPopup(popupContent).on("popupopen", controlMarkerCallback);
            marker.on("dragend", function(e) { dragMarkerCallback(e, ID); });
        }
        else {
            var marker = L.marker(point, {draggable: false, autoPan: true, icon: defaultMarker});
            const popupContent = `
            <div class="container">
                <div class="row"><h3>Sensor ${i}</h3></div>
                ${markerPopupText}
                <div class="row mt-2">
                    <input type="checkbox" class="btn-check" id="btn-check-${i}" value="${i}" autocomplete="off" style="display: none">
                    <label class="btn btn-outline-secondary" for="btn-check-${i}">Select as control point</label>
                </div>
            </div>
            `;
            marker.bindPopup(popupContent).on("popupopen", markerCallback);
        }
        
        marker.addTo(markerLayer);
        markers.push(marker);
    }

}

function createFeatures(data, interval) {

    // Step 1: digest cable locations
    let arrayCoordinates = [];
    const totalCoordinates = data.features[0].geometry.coordinates[0].length
    for (let i = 0; i < totalCoordinates; i++){
        arrayCoordinates.push([
            data.features[0].geometry.coordinates[0][i][1],
            data.features[0].geometry.coordinates[0][i][0]
        ]);                
    }
    sessionStorage.setItem("arrayCoordinates", JSON.stringify(arrayCoordinates));

    // Step 2: interpolate cable to get sensor locations (overwrite arrayCoordinates)
    // Create an array which containes distance between evry two sensors
    const lengths = accumulatedLengths(arrayCoordinates);
    // Find total distances by adding all the distances in array
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    // Find number of sensors along the fiber according to gauge length
    const totalPoints = Math.floor(totalLength / interval);
    // Create an array which contains the ratio of distance of each sensors on fiber
    let ratios = [];
    for (let i = 0; i <= totalPoints; i++) {
        const ratio = i / totalPoints;
        ratios.push(ratio);
    }
    // Interpolate sensors all fiber and create an array conating their coordinates
    let markers = ratios.map((ratio) =>
        interpolateOnLine(map, arrayCoordinates, ratio)
    );
    let sensors = JSON.stringify(markers);
    sessionStorage.setItem("sensors", sensors);

    // Step 3: create markers for sensors
    createMarkers();

}

function updateFeatures(result) {

    let controlPoints = [];
    const sensors = result.sensors;
    const arrayCoordinates = result.arrayCoordinates;

    // Step 1: parse sensor locations -> arrayCoordinates
    for (let i = 0; i < sensors.length; i++) {
        if (sensors[i].controlPoint == 1) {
            controlPoints.push(i);
        }
    }
    sessionStorage.setItem("arrayCoordinates", JSON.stringify(arrayCoordinates));
    sessionStorage.setItem("controlPoints", JSON.stringify(controlPoints));
    sessionStorage.setItem("sensors", JSON.stringify(sensors));

    // Step 2: create markers for sensors
    createMarkers();

}



export { 
    map, addHotline, addCable, removeCable, toggleCable,
    toggleMarkers, updateFeatures, createFeatures,
    removeHotline, removeMarkers, toggleSatellite, showMarker, showPosition, showPositionFixed, clearMarkers
};
