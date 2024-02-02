function distance (map, latlngA, latlngB) {
    return map.latLngToLayerPoint(latlngA).distanceTo(map.latLngToLayerPoint(latlngB));
}
function accumulatedLengths (coords) {
    if (typeof coords.getLatLngs == 'function') {
        coords = coords.getLatLngs();
    }
    if (coords.length === 0)
        return [];
    var total = 0,
        lengths = [0];
    for (var i = 0, n = coords.length - 1; i< n; i++) {
        total = measure(coords[i][0],coords[i][1],coords[i+1][0],coords[i+1][1]);
        lengths.push(total);
    }
    return lengths;
}
function collectedLengths (coords) {
    var total = 0,
        lengths = [0];
    for (var i = 0, n = coords.length - 1; i< n; i++) {
        total = measure(coords[i].latLng.lat,coords[i].latLng.lng,coords[i+1].latLng.lat,coords[i+1].latLng.lng);
        if(i != 0){total = total + lengths[i];}
        lengths.push(total);
    }
    return lengths
}
function collectedLengthsJson (coords) {
    var total = 0,
        lengths = [0];
    for (var i = 0, n = coords.length - 1; i< n; i++) {
        total = measure(coords[i][0],coords[i][1],coords[i+1][0],coords[i+1][1]);
        if(i != 0){total = total + lengths[i];}
        lengths.push(total);
    }
    return lengths
}
function interpolateOnLine (map, latLngs, ratio) {
    latLngs = (latLngs instanceof L.Polyline) ? latLngs.getLatLngs() : latLngs;
    var n = latLngs.length;
    if (n < 2) {
        return null;
    }
    // ensure the ratio is between 0 and 1;
    ratio = Math.max(Math.min(ratio, 1), 0);
    if (ratio === 0) {
        return {
            latLng: latLngs[0] instanceof L.LatLng ? latLngs[0] : L.latLng(latLngs[0]),
            predecessor: -1
        };
    }
    if (ratio == 1) {
        return {
            latLng: latLngs[latLngs.length -1] instanceof L.LatLng ? latLngs[latLngs.length -1] : L.latLng(latLngs[latLngs.length -1]),
            predecessor: latLngs.length - 2
        };
    }
    // project the LatLngs as Points,
    // and compute total planar length of the line at max precision
    var maxzoom = map.getMaxZoom();
    if (maxzoom === Infinity)
        maxzoom = map.getZoom();
    var pts = [];
    var lineLength = 0;
    for(var i = 0; i < n; i++) {
        pts[i] = map.project(latLngs[i], maxzoom);
        if(i > 0)
            lineLength += pts[i-1].distanceTo(pts[i]);
    }
    var ratioDist = lineLength * ratio;
    // follow the line segments [ab], adding lengths,
    // until we find the segment where the points should lie on
    var cumulativeDistanceToA = 0, cumulativeDistanceToB = 0;
    for (var i = 0; cumulativeDistanceToB < ratioDist; i++) {
        var pointA = pts[i], pointB = pts[i+1];
        cumulativeDistanceToA = cumulativeDistanceToB;
        cumulativeDistanceToB += pointA.distanceTo(pointB);
    }
    
    if (pointA == undefined && pointB == undefined) { // Happens when line has no length
        var pointA = pts[0], pointB = pts[1], i = 1;
    }
    // compute the ratio relative to the segment [ab]
    var segmentRatio = ((cumulativeDistanceToB - cumulativeDistanceToA) !== 0) ? ((ratioDist - cumulativeDistanceToA) / (cumulativeDistanceToB - cumulativeDistanceToA)) : 0;
    var interpolatedPoint = interpolateOnPointSegment(pointA, pointB, segmentRatio);
    return {
        latLng: map.unproject(interpolatedPoint, maxzoom),
        predecessor: i-1,
        controlPoint : 0
    };
}

function interpolateOnPointSegment(pA, pB, ratio) {
    return L.point(
        (pA.x * (1 - ratio)) + (ratio * pB.x),
        (pA.y * (1 - ratio)) + (ratio * pB.y)
    );
}

function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}

function closest(map, layer, latlng, vertices) {
    var latlngs,
        mindist = Infinity,
        result = null,
        i, n, distance, subResult;
    if (layer instanceof Array) {
        // if layer is Array<Array<T>>
        if (layer[0] instanceof Array && typeof layer[0][0] !== 'number') {
            // if we have nested arrays, we calc the closest for each array
            // recursive
            for (i = 0; i < layer.length; i++) {
                subResult = L.GeometryUtil.closest(map, layer[i], latlng, vertices);
                if (subResult && subResult.distance < mindist) {
                    mindist = subResult.distance;
                    result = subResult;
                }
            }
            return result;
        } else if (layer[0] instanceof L.LatLng
                    || typeof layer[0][0] === 'number'
                    || typeof layer[0].lat === 'number') { // we could have a latlng as [x,y] with x & y numbers or {lat, lng}
            layer = L.polyline(layer);
        } else {
            return result;
        }
    }
    // if we don't have here a Polyline, that means layer is incorrect
    // see https://github.com/makinacorpus/Leaflet.GeometryUtil/issues/23
    if (! ( layer instanceof L.Polyline ) )
        return result;
    // deep copy of latlngs
    latlngs = JSON.parse(JSON.stringify(layer.getLatLngs().slice(0)));
    // add the last segment for L.Polygon
    if (layer instanceof L.Polygon) {
        // add the last segment for each child that is a nested array
        var addLastSegment = function(latlngs) {
            if (L.Polyline._flat(latlngs)) {
                latlngs.push(latlngs[0]);
            } else {
                for (var i = 0; i < latlngs.length; i++) {
                    addLastSegment(latlngs[i]);
                }
            }
        };
        addLastSegment(latlngs);
    }
    // we have a multi polygon / multi polyline / polygon with holes
    // use recursive to explore and return the good result
    if ( ! L.Polyline._flat(latlngs) ) {
        for (i = 0; i < latlngs.length; i++) {
            // if we are at the lower level, and if we have a L.Polygon, we add the last segment
            subResult = L.GeometryUtil.closest(map, latlngs[i], latlng, vertices);
            if (subResult.distance < mindist) {
                mindist = subResult.distance;
                result = subResult;
            }
        }
        return result;
    } else {
        // Lookup vertices
        if (vertices) {
            for(i = 0, n = latlngs.length; i < n; i++) {
                var ll = latlngs[i];
                distance = L.GeometryUtil.distance(map, latlng, ll);
                if (distance < mindist) {
                    mindist = distance;
                    result = ll;
                    result.distance = distance;
                }
            }
            return result;
        }
        // Keep the closest point of all segments
        for (i = 0, n = latlngs.length; i < n-1; i++) {
            var latlngA = latlngs[i],
                latlngB = latlngs[i+1];
            distance = L.GeometryUtil.distanceSegment(map, latlng, latlngA, latlngB);
            if (distance <= mindist) {
                mindist = distance;
                result = L.GeometryUtil.closestOnSegment(map, latlng, latlngA, latlngB);
                result.distance = distance;
            }
        }
        return result;
    }
}

function belongsSegment(latlng, latlngA, latlngB, tolerance) {
    tolerance = tolerance === undefined ? 0.2 : tolerance;
    var hypotenuse = measure(latlngA[0],latlngA[1],latlngB[0],latlngB[1]),
        delta = measure(latlngA[0],latlngA[1],latlng[0],latlng[1]) + measure(latlng[0],latlng[1],latlngB[0],latlngB[1]) - hypotenuse;
    return delta/hypotenuse < tolerance;
}

function isPointOnLine(point, path) {
    for (var i = 0; i < path.length - 1; i++) {
        if (belongsSegment(point, path[i], path[i + 1])) {
            return i;
        }
    }
}

