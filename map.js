mapboxgl.accessToken = 'pk.eyJ1IjoiYWRsZXlraW0iLCJhIjoiY2p5YzBuY3ZoMGRyYjNrcW1scWJ4bmNyZCJ9.cOP1H1QwXJ2zWFriMqTiDA';
// This adds the map to your page
var map = new mapboxgl.Map({
  // container id specified in the HTML
  container: 'map',
  // style URL
  style: 'mapbox://styles/mapbox/light-v10',
  // initial position in [lon, lat] format
  center: [-74.0060, 40.7128],
  // initial zoom
  zoom: 12
});

let viomap;
$.getJSON("viomap.geojson", function(json){
  //console.log(json);
  viomap = json;

  map.on('load', function(e) {
    map.addSource('viomap', { type: 'geojson', data: viomap });
  });

  viomap.features.forEach(function(marker){
    let el = document.createElement('div');

    if(marker.properties){
      if(marker.properties.flag_pred == 1){
        el.className = "marker-flagged";
      }else{
        el.className = "marker";
      }
    }

    new mapboxgl.Marker(el, { offset: [0, -23] })
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

      el.addEventListener('click', function(e) {
        var activeItem = document.getElementsByClassName('active');
        // 1. Fly to the point
        flyToStore(marker);
        // 2. Close all other popups and display popup for clicked store
        createPopUp(marker);
        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        e.stopPropagation();
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        // var listing = document.getElementById('listing-' + i);
        // console.log(listing);
        //listing.classList.add('active');
      });
  })

});

function flyToStore(currentFeature) {
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 15
  });
}

const opts = {
  angle: 0.15, // The span of the gauge arc
  lineWidth: 0.44, // The line thickness
  radiusScale: 1, // Relative radius
  pointer: {
    length: 0.6, // // Relative to gauge radius
    strokeWidth: 0.035, // The thickness
    color: '#000000' // Fill color
  },
  limitMax: 0.6,     // If false, max value increases automatically if value > maxValue
  limitMin: 0.3,     // If true, the min value of the gauge will be fixed
  // colorStart: '#8BC34A',   // Colors
  // colorStop: '#8FC0DA',    // just experiment with them
  strokeColor: '#E0E0E0',  // to see which ones work best for you
  generateGradient: true,
  highDpiSupport: true,     // High resolution support
  percentColors : [[0.0, "#8BC34A" ], [0.25, "#FFEB3B"], [.50, "#FFC107"], [1.0, "#D50000"]]

};

let target, gauge;

function createPopUp(currentFeature) {
//  console.log(currentFeature);
  var popUps = document.getElementsByClassName('mapboxgl-popup');
  // Check if there is already a popup on the map and if so, remove it
  if (popUps[0]) popUps[0].remove();

  if(currentFeature.properties.flag_pred == 1){
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h3 style="background-color: red;">' + currentFeature.properties.dba + '</h3>' +
              '<h4>' + currentFeature.properties.cuisine + ' | ' +
              currentFeature.properties.price + ' | ' +
              currentFeature.properties.rating + '<i class="far fa-star"></i>' +
              '</h4>' +
              '<h4 id = "flag-prob">' + Math.round(currentFeature.properties.flag_pred_proba * 100) + '%</h4>' +
              '<canvas class="map-gauge"></canvas>')
      .addTo(map);
  }else{
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h3>' + currentFeature.properties.dba + '</h3>' +
              '<h4>' + currentFeature.properties.cuisine + ' | ' +
              currentFeature.properties.price + ' | ' +
              currentFeature.properties.rating + '<i class="far fa-star"></i>' +
              '</h4>' +
              '<h4 id = "flag-prob">' + Math.round(currentFeature.properties.flag_pred_proba * 100) + '%</h4>' +
              '<canvas class="map-gauge"></canvas>')
      .addTo(map);
  }



  target = document.getElementsByClassName('map-gauge')[0]; // your canvas element
  gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
  gauge.maxValue = 1; // set max gauge value
  gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
  gauge.animationSpeed = 32; // set animation speed (32 is default value)
  gauge.set(currentFeature.properties.flag_pred_proba); // set actual valu
}


    // This will let you use the .remove() function later on
    if (!('remove' in Element.prototype)) {
      Element.prototype.remove = function() {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      };
    }

//     // Add an event listener for the links in the sidebar listing
// link.addEventListener('click', function(e) {
//   // Update the currentFeature to the store associated with the clicked link
//   var clickedListing = data.features[this.dataPosition];
//   // 1. Fly to the point associated with the clicked link
//   flyToStore(clickedListing);
//   // 2. Close all other popups and display popup for clicked store
//   createPopUp(clickedListing);
//   // 3. Highlight listing in sidebar (and remove highlight for all other listings)
//   var activeItem = document.getElementsByClassName('active');
//   if (activeItem[0]) {
//     activeItem[0].classList.remove('active');
//   }
//   this.parentNode.classList.add('active');
// });
// 
// map.on('click', function(e) {
//   // Query all the rendered points in the view
//   var features = map.queryRenderedFeatures(e.point, { layers: ['restaurant'] });
//   if (features.length) {
//     var clickedPoint = features[0];
//     // 1. Fly to the point
//     flyToStore(clickedPoint);
//     // 2. Close all other popups and display popup for clicked store
//     createPopUp(clickedPoint);
//     // 3. Highlight listing in sidebar (and remove highlight for all other listings)
//     var activeItem = document.getElementsByClassName('active');
//     if (activeItem[0]) {
//       activeItem[0].classList.remove('active');
//     }
//     // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
//     var selectedFeature = clickedPoint.properties.camis;
//
//     for (var i = 0; i < features.length; i++) {
//       if (clickedPoint.properties.camis === selectedFeature) {
//         selectedFeatureIndex = i;
//       }
//     }
//   //   // Select the correct list item using the found index and add the active class
//   //   var listing = document.getElementById('listing-' + selectedFeatureIndex);
//   //   listing.classList.add('active');
//   }
// });
