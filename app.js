//Todo make markers change color based on colour selected
//Todo get measureing tool to work at any time not only if it is selected on initial page load
//Todo stop measure working with draw polygon button
//todo allow the user to add comments to a point
//todo allow the user to read the comment
//todo allow the user to edit the comment


var drawingManager;
var selectedShape;
var colors = ['yellow', 'blue', 'green', 'orange', 'purple', 'red', 'pink']; //add any colours required for land covers(although marker colours are limited)
var selectedColor;
var colorButtons = {};
//this clears the selected shape when another is selected
function clearSelection() {
  if (selectedShape) {
    if (selectedShape.type !== 'marker') {
      selectedShape.setEditable(false);
    }

    selectedShape = null;
  }
}
//set selected shape
function setSelection(shape) {
  if (shape.type !== 'marker') {
    clearSelection();
    shape.setEditable(true);
    selectColor(shape.get('fillColor') || shape.get('strokeColor'));
  }

  selectedShape = shape;
}

//select an object using custom button
function selectObject() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.SELECT);
}

//delete a ploted shape
function deleteSelectedShape() {
  if (selectedShape) {
    selectedShape.setMap(null);
  }
}

//add marker using custom buttons
function addMarker() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.MARKER);
}

//draw a polygon using custom buttons
function drawPolygon() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
}

//draw a rectangle using custom button
function drawRectangle() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
}

//draw a circle using custom button
function drawCircle() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
}

//draw a line using custom button
function drawLine() {
  drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYLINE);
}

//add comment using custom button
function addComment() {

}


//creates the colour selector
function selectColor(color) {
  selectedColor = color;
  for (var i = 0; i < colors.length; ++i) {
    var currColor = colors[i];
    colorButtons[currColor].style.border = currColor == color ? '5px solid #789' : '5px solid #fff';
    console.log("color varible value outside initulise is" + " " + color);
  }

  // Retrieves the current options from the drawing manager and replaces the
  // set stroke or fill colour as appropriate.
  var polylineOptions = drawingManager.get('polylineOptions');
  polylineOptions.strokeColor = color;
  drawingManager.set('polylineOptions', polylineOptions);

  var rectangleOptions = drawingManager.get('rectangleOptions');
  rectangleOptions.fillColor = color;
  drawingManager.set('rectangleOptions', rectangleOptions);

  var circleOptions = drawingManager.get('circleOptions');
  circleOptions.fillColor = color;
  drawingManager.set('circleOptions', circleOptions);

  var polygonOptions = drawingManager.get('polygonOptions');
  polygonOptions.fillColor = color;
  drawingManager.set('polygonOptions', polygonOptions);

  var markerOptions = drawingManager.get('markerOptions');
  markerOptions.icon = "http://maps.google.com/mapfiles/ms/icons/" + selectedColor + "-dot.png", //pass the color varible in where green is;
  drawingManager.set('markerOptions', markerOptions);
}


//set the colour of the shape drawn
function setSelectedShapeColor(color) {
  if (selectedShape) {
    if (selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
      selectedShape.set('strokeColor', color);
    } else {
      selectedShape.set('fillColor', color);
    }
  }
}

//build the colour buttons

function makeColorButton(color) {
  var button = document.createElement('span');
  button.className = 'color-button';
  button.style.backgroundColor = color;
  google.maps.event.addDomListener(button, 'click', function() {
    selectColor(color);
    setSelectedShapeColor(color);
  });

  return button;
}

function buildColorPalette() {
  var colorPalette = document.getElementById('color-palette');
  for (var i = 0; i < colors.length; ++i) {
    var currColor = colors[i];
    var colorButton = makeColorButton(currColor);
    colorPalette.appendChild(colorButton);
    colorButtons[currColor] = colorButton;
  }
  selectColor(colors[0]);
}

//initialise the map and set start up peramiters
function initialise(color) {
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: new google.maps.LatLng(56.44649, -2.89219),
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    disableDefaultUI: true,
    zoomControl: true,
  });

  //auto map location

  var infoWindow = new google.maps.InfoWindow({
    map: map
  });

  // geolocation.
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      map.setCenter(pos);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
      'Error: The Geolocation service failed.' :
      'Error: Your browser doesn\'t support geolocation.');
  }


  // Create the search box and link it to the UI element.
    const input = document.getElementById("pac-input");
    const searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // Bias the SearchBox results towards current map's viewport.
    map.addListener("bounds_changed", () => {
      searchBox.setBounds(map.getBounds());
    });
    let markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();

      if (places.length == 0) {
        return;
      }
      // Clear out the old markers.
      markers.forEach((marker) => {
        marker.setMap(null);
      });
      markers = [];
      // For each place, get the icon, name and location.
      const bounds = new google.maps.LatLngBounds();
      places.forEach((place) => {
        if (!place.geometry || !place.geometry.location) {
          console.log("Returned place contains no geometry");
          return;
        }
        const icon = {
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(17, 34),
          scaledSize: new google.maps.Size(25, 25),
        };
        // Create a marker for each place.(this can be removed to stop marker when search has been done)
        markers.push(
          new google.maps.Marker({
            map,
            icon,
            title: place.name,
            position: place.geometry.location,
          })
        );

        if (place.geometry.viewport) {
          // Only geocodes have viewport.
          bounds.union(place.geometry.viewport);
        } else {
          bounds.extend(place.geometry.location);
        }
      });
      map.fitBounds(bounds);
    });

  //set the polygon charictoristics
  var polyOptions = {
    strokeWeight: 0,
    fillOpacity: 0.45,
    editable: true,
    draggable: true
  };

    console.log("color varible value inside initulise is" + " " + color);

    //set the marker charictoristics
  var markerOptions = {
    draggable: true
  }
  // Creates a drawing manager attached to the map that allows the user to draw
  // markers, lines, and shapes.
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: false, //hide google defalt drawing control
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    polylineOptions: {
      editable: true,
      draggable: true
    },
    markerOptions: markerOptions,
    rectangleOptions: polyOptions,
    circleOptions: polyOptions,
    polygonOptions: polyOptions,
    map: map
  });

  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
    var newShape = e.overlay;

    newShape.type = e.type;

    if (e.type !== google.maps.drawing.OverlayType.MARKER) {
      // revert back to non-drawing mode after drawing a shape.
      drawingManager.setDrawingMode(null);

      // Add an event listener that selects the newly drawn shape when the user
      // mouses down on it.
      google.maps.event.addListener(newShape, 'click', function(e) {
        if (e.vertex !== undefined) {
          if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
            var path = newShape.getPaths().getAt(e.path);
            path.removeAt(e.vertex);
            if (path.length < 3) {
              newShape.setMap(null);
            }
          }
          if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
            var path = newShape.getPath();
            path.removeAt(e.vertex);
            if (path.length < 2) {
              newShape.setMap(null);
            }
          }
        }
        setSelection(newShape);
      });
      setSelection(newShape);
    } else {
      google.maps.event.addListener(newShape, 'click', function(e) {
        setSelection(newShape);
      });
      setSelection(newShape);
    }
  });


  // Clear the current selection when the drawing mode is changed, or when the
  // map is clicked.
  google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearSelection);
  google.maps.event.addListener(map, 'click', clearSelection);
  google.maps.event.addDomListener(document.getElementById('select-button'), 'click', selectObject);
  google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', deleteSelectedShape);
  google.maps.event.addDomListener(document.getElementById('marker-button'), 'click', addMarker);
  google.maps.event.addDomListener(document.getElementById('polygon-button'), 'click', drawPolygon);
  google.maps.event.addDomListener(document.getElementById('rectangle-button'), 'click', drawRectangle);
  google.maps.event.addDomListener(document.getElementById('circle-button'), 'click', drawCircle);
  google.maps.event.addDomListener(document.getElementById('line-button'), 'click', drawLine);
  google.maps.event.addDomListener(document.getElementById('measure-button'), 'click', measurePolygon);
  google.maps.event.addDomListener(document.getElementById('comment-button'), 'click', addComment);


  //measure function
  function measurePolygon(){ //falls out of scope here if not used on startup
    var infowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(drawingManager, 'polygoncomplete', function(polygon) {
      var area = google.maps.geometry.spherical.computeArea(polygon.getPath());
      infowindow.setContent("polygon area="+area.toFixed(2)+" sq meters");
      infowindow.setPosition(polygon.getPath().getAt(0));
      infowindow.open(map);
    });

  }

  buildColorPalette();
}
google.maps.event.addDomListener(window, 'load', initialise(colors[0]));
