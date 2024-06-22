mapboxgl.accessToken = 'pk.eyJ1IjoidmFpc2huYXZpMDEiLCJhIjoiY2x4bG9kY2lyMDA4cjJpcjNheDN0eGYwMiJ9.kJ4GY22I40mJL4dk_MP8DQ';

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
    enableHighAccuracy: true
});

function successLocation(position) {
    console.log(position);
    setupMap([position.coords.longitude, position.coords.latitude]);
}

function errorLocation() {
    setupMap([-2.24, 53.48]);
}

function setupMap(center) {
    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/streets-v11",
        center: center,
        zoom: 14
    });

    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav);

    var directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric'
    });

    map.addControl(directions, "top-left");

    map.on('load', () => {
        map.loadImage(
            'battery.png', // Make sure this path is correct
            (error, image) => {
                if (error) throw error;
                map.addImage('battery-icon', image);

                directions.on('route', (event) => {
                    // console.log('Directions event:', event);
                    if (event.route && event.route.length > 0) {
                        // console.log('Route object:', event.route[0]['distance']);
                        // console.log(event.route[0])
                        const route = event.route[0].geometry;
                        const cords = decodePolyline(route);
                        console.log(cords.length)
                        if (cords.length > 0) {
                            // console.log(cords);
                            addBatteryIcons(map, cords);
                            
                        } else {
                            console.error("Route geometry is empty or not defined.");
                        }
                    } else {
                        console.error("No route found in event data.");
                    }
                });
            }
        );
    });
}


function decodePolyline(encoded) {
  var decodedPath = google.maps.geometry.encoding.decodePath(encoded);
  var path = [];
  
  decodedPath.forEach(function(point) {
      path.push([point.lng(), point.lat()]);
  });

  return path;
}



function addBatteryIcons(map, route) {
    console.log(typeof route)
    const batteryIcon = {
        'type': 'FeatureCollection',
        'features': []
    };

    let distance = 0;
    const interval = 20; // 5 km

    for (let i = 1; i < route.length; i++) {
        // console.log(route[i - 1])
        const from = turf.point(route[i - 1]);
        const to = turf.point(route[i]);
        
        const segment = turf.distance(from, to, { units: 'kilometers' });
        distance += segment;
        // console.log(segment)
        if (distance >= interval) {
            batteryIcon.features.push({
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': route[i]
                }
            });
            distance = 0;
        }
    }

    if (map.getLayer('battery-icons')) {
        map.removeLayer('battery-icons');
        map.removeSource('battery-icons');
    }

    map.addSource('battery-icons', {
        'type': 'geojson',
        'data': batteryIcon
    });

    map.addLayer({
        'id': 'battery-icons',
        'type': 'symbol',
        'source': 'battery-icons',
        'layout': {
            'icon-image': 'battery-icon', // This should match the ID used in map.addImage
            'icon-size': 0.2,
            'icon-allow-overlap': true
        }
    });
}
