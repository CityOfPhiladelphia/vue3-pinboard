<script setup>

import $config from '@/config';
if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue $config:', $config);

import { ref, onMounted, watch, watchEffect, computed } from 'vue';

// PACKAGE IMPORTS
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
import '@/assets/mapbox-gl-draw.min.js'
import '@/assets/maplibre-gl-draw.css';
import destination from '@turf/destination';
import { point, polygon, multiPolygon, feature, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

// STORES
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();
import { useDataStore } from '@/stores/DataStore.js'
const DataStore = useDataStore();

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

// COMPONENTS
import AddressSearchControl from '@/components/AddressSearchControl.vue';
// import ImageryToggleControl from '@/components/map/ImageryToggleControl.vue';
// import ImageryDropdownControl from '@/components/map/ImageryDropdownControl.vue';

let map;

// keep image sources as computed props so that the publicPath can be used, for pushing the app to different environments
const markerSrc = computed(() => {
  return MainStore.publicPath + 'images/marker_blue_base_5.png';
})
// const buildingColumnsSrc = computed(() => {
//   return MainStore.publicPath + 'images/building-columns-solid.png';
// })
// const cameraSrc = computed(() => {
//   return MainStore.publicPath + 'images/camera.png';
// })

onMounted(async () => {
  // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue onMounted route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  
  // create the maplibre map
  let currentTopicMapStyle = 'pwdDrawnMapStyle';
  let zoom = route.params.address ? 17 : 12;

  map = new maplibregl.Map({
    container: 'map',
    style: $config[currentTopicMapStyle],
    center: $config.cityCenterCoords,
    // center: [-75.163471, 39.953338],
    zoom: zoom,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  });

  console.log('import.meta.env.VITE_DEBUG:', import.meta.env.VITE_DEBUG);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue onMounted, DataStore.covidFreeMealSites.features:', DataStore.covidFreeMealSites.features);

  map.on('load', () => {
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  if (import.meta.env.VITE_DEBUG == 'true') console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);
  // const buildingColumnsImage = await map.loadImage(buildingColumnsSrc.value)
  // map.addImage('building-columns-solid', buildingColumnsImage.data);
  // const cameraImage = await map.loadImage(cameraSrc.value)
  // map.addImage('camera-icon', cameraImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-left');

  // if the L&I topic is selected, and a building footprint is clicked, set the selected building number in the LiStore

  // if a nearby circle marker is clicked or hovered on, set its id in the MainStore as the hoveredStateId
  // map.on('click', 'nearby', (e) => {
  //   const properties = e.features[0].properties;
  //   let idField, infoField, row;
  //   if (MainStore.currentTopic == 'nearby') {
  //     idField = NearbyActivityStore.dataFields[properties.type].id_field;
  //     infoField = NearbyActivityStore.dataFields[properties.type].info_field;
  //     row = NearbyActivityStore[properties.type].rows.filter(row => row[idField] === properties.id)[0];
  //   } else if (MainStore.currentTopic == '311') {
  //     idField = City311Store.dataFields[properties.type].id_field;
  //     infoField = City311Store.dataFields[properties.type].info_field;
  //     row = City311Store[properties.type].rows.filter(row => row[idField] === properties.id)[0];
  //   }
  //   if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, e:', e, 'properties:', properties, 'idField:', idField, 'infoField:', infoField, 'e.features[0]:', e.features[0], 'row:', row);
  //   // if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, e:', e, 'properties:', properties, 'idField:', idField, 'e.features[0]:', e.features[0], 'type:', type, 'row:', row);
  //   e.clickOnLayer = true;
  //   MainStore.clickedMarkerId = e.features[0].properties.id;
  //   MainStore.hoveredStateId = e.features[0].properties.id;
  //   if (row.properties) {
  //     row[infoField] = row.properties[infoField];
  //   }

  //   const popup = document.getElementsByClassName('maplibregl-popup');
  //   if (popup.length) {
  //     popup[0].remove();
  //   }
  //   new maplibregl.Popup({ className: 'my-class' })
  //     .setLngLat(e.lngLat)
  //     .setHTML(row[infoField])
  //     .setMaxWidth("300px")
  //     .addTo(map);
  // });

  map.on('click', 'resources', (e) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('click, e:', e);
    if (e.features.length > 0) {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getSource(nearby):', map.getSource('nearby'), 'map.getStyle().sources:', map.getStyle().sources);
      // MainStore.clickedMarkerId = e.features[0].properties.id;
      // MainStore.clickedRow = { id: e.features[0].properties.id, lngLat: e.lngLat };
      // MainStore.clickedRow = { id: e.features[0].properties.id, lngLat: e.lngLat };
      // MainStore.clickedRow = { id: e.features[0].properties.id, lngLat: e.lngLat, type: e.features[0].properties.type };
    }
  });

  map.on('mouseenter', 'resources', (e) => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('mouseenter, e:', e);
    if (e.features.length > 0) {
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getSource(nearby):', map.getSource('nearby'), 'map.getStyle().sources:', map.getStyle().sources);
      map.getCanvas().style.cursor = 'pointer'
      // MainStore.hoveredStateId = e.features[0].properties.id;
    }
  });

  map.on('mouseleave', 'resources', () => {
    // if (hoveredStateId.value) {
    map.getCanvas().style.cursor = ''
      // MainStore.hoveredStateId = null;
    // }
  });
});

watch(
  () => DataStore.covidFreeMealSites,
  async newData => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue watch DataStore.covidFreeMealSites.features, newData:', newData);
    let geojson = featureCollection(newData);
    if (import.meta.env.VITE_DEBUG == 'true') console.log('geojson:', geojson, 'map.getStyle().sources.resources.data:', map.getStyle().sources.resources.data);
    map.getSource('resources').setData(newData);
  }
)

// watch GeocodeStore.aisData for moving map center and setting zoom
watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      if (MainStore.lastSearchMethod !== 'mapClick') {
        map.setCenter(newCoords);
        map.setZoom(17);
      }
      MapStore.currentAddressCoords = newCoords;
  
      const popup = document.getElementsByClassName('maplibregl-popup');
      if (popup.length) {
        popup[0].remove();
      }
    }
  }
)

// watch address pwd coordinates for moving address marker
const pwdCoordinates = computed(() => {
  if (GeocodeStore.aisData.features) {
    return GeocodeStore.aisData.features[0].geometry.coordinates;
  } else {
    return [];
  }
});

watch(
  () => pwdCoordinates.value,
  newCoords => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map pwdCoordinates watch, newCoords:', newCoords, 'MapStore.addressMarker:', MapStore.addressMarker);
  if (newCoords.length) {
    const address = point(newCoords);
    map.getSource('addressMarker').setData(address);
  }
});


// for Nearby topic, watch the clicked row to fly to its coordinates and show a popup
// const clickedRow = computed(() => { return MainStore.clickedRow; })
// watch(
//   () => clickedRow.value,
//   newClickedRow => {
//     if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue clickedRow watch, newClickedRow:', newClickedRow, 'newClickedRow.type:', newClickedRow.type);
//     if (newClickedRow) map.flyTo({ center: newClickedRow.lngLat });
//     let idField, infoField, row;
//     if (MainStore.currentTopic == 'nearby') {
//       idField = NearbyActivityStore.dataFields[newClickedRow.type].id_field;
//       infoField = NearbyActivityStore.dataFields[newClickedRow.type].info_field;
//       row = NearbyActivityStore[newClickedRow.type].rows.filter(row => row[idField] === newClickedRow.id)[0];
//     } else if (MainStore.currentTopic == 'city311') {
//       idField = City311Store.dataFields.city311.id_field;
//       infoField = City311Store.dataFields.city311.info_field;
//       row = City311Store[newClickedRow.type].rows.filter(row => row[idField] === newClickedRow.id)[0];
//     }
//     if (import.meta.env.VITE_DEBUG == 'true') console.log('nearby click, newClickedRow:', newClickedRow, 'idField:', idField, 'row:', row);
//     if (row.properties) row[infoField] = row.properties[infoField];
//     const popup = document.getElementsByClassName('maplibregl-popup');
//     if (popup.length) {
//       popup[0].remove();
//     }
//     new maplibregl.Popup({ className: 'my-class' })
//       .setLngLat(newClickedRow.lngLat)
//       .setHTML(row[infoField] || row.properties[infoField])
//       .setMaxWidth("300px")
//       .addTo(map);
//   }
// );

// for Nearby topic, watch the id of the circle marker that is hovered on to change the color of the circle
// const hoveredStateId = computed(() => { return MainStore.hoveredStateId; })
// watch(
//   () => hoveredStateId.value,
//   newHoveredStateId => {
//     // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue hoveredStateId watch, newHoveredStateId:', newHoveredStateId, 'map.getStyle().sources.nearby.data.features:', map.getStyle().sources.nearby.data.features);
//     if (newHoveredStateId) {
//       if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().sources.nearby.data.features', map.getStyle().sources.nearby.data.features, 'newHoveredStateId:', newHoveredStateId);
//       const feature = map.getStyle().sources.nearby.data.features.filter(feature => feature.properties.id === newHoveredStateId)[0];
//       const index = map.getStyle().sources.nearby.data.features.indexOf(feature);
//       if (import.meta.env.VITE_DEBUG == 'true') console.log('feature:', feature, 'index:', index, 'map.getStyle().sources.nearby.data.features:', map.getStyle().sources.nearby.data.features.filter(feature => feature.properties.id === newHoveredStateId)[0]);
//       map.getStyle().sources.nearby.data.features.splice(index, 1);
//       map.getStyle().sources.nearby.data.features.push(feature);
//       console.log("map.getSource('nearby'):", map.getSource('nearby'), "map.getStyle().sources.nearby.data:", map.getStyle().sources.nearby.data);
//       map.getSource('nearby').setData(map.getStyle().sources.nearby.data);
//       // if (import.meta.env.VITE_DEBUG == 'true') console.log('map.getStyle().sources:', map.getStyle().sources.filter(source => source.id === 'nearby')[0]);
//       map.setPaintProperty(
//         'nearby',
//         'circle-stroke-color',
//         ['match',
//         ['get', 'id'],
//         newHoveredStateId,
//         'black',
//         'white',
//         ]
//       )
//       map.setPaintProperty(
//         'nearby', 
//         'circle-color',
//         ['match',
//         ['get', 'id'],
//         newHoveredStateId,
//         "#F3D661",
//         ['match',
//         ['get', 'type'],
//         'nearby311',
//         '#FF0000',
//         'city311',
//         '#FF0000',
//         'nearbyCrimeIncidents',
//         '#0096FF',
//         'nearbyZoningAppeals',
//         '#009900',
//         'nearbyVacantIndicatorPoints',
//         '#9400c6',
//         'nearbyConstructionPermits',
//         '#FF0000',
//         'nearbyDemolitionPermits',
//         '#0096FF',
//         'nearbyUnsafeBuildings',
//         '#009900',
//         /* other */ '#000000'
//         ]
//       ]
//       );
//     } else {
//       map.setPaintProperty(
//         'nearby',
//         'circle-stroke-color',
//         'white',
//       )
//       map.setPaintProperty(
//         'nearby', 
//         'circle-color', 
//         ['match',
//         ['get', 'type'],
//         'nearby311',
//         '#FF0000',
//         'city311',
//         '#FF0000',
//         'nearbyCrimeIncidents',
//         '#0096FF',
//         'nearbyZoningAppeals',
//         '#009900',
//         'nearbyVacantIndicatorPoints',
//         '#9400c6',
//         'nearbyConstructionPermits',
//         '#FF0000',
//         'nearbyDemolitionPermits',
//         '#0096FF',
//         'nearbyUnsafeBuildings',
//         '#009900',
//         /* other */ '#000000'
//         ]
//       );
//     }
//   }
// )

const labelLayers = computed(() => { return MapStore.labelLayers; });

watch(
  () => labelLayers,
  (newLabelLayers) => {
    setLabelLayers(newLabelLayers.value);
  },
  { deep: true }
)

const setLabelLayers = (newLabelLayers) => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, newLabelLayers:', newLabelLayers, 'map.getStyle().layers:', map.getStyle().layers);
    if (newLabelLayers.length) {
      newLabelLayers.forEach(layer => {
        if (!map.getSource(layer.id)) {
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, NOT THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
          map.addSource(layer.id, JSON.parse(JSON.stringify(layer.source)));
        } else {
          // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, YES THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
          map.getSource(layer.id).setData(layer.source.data);
        }
      })
    }
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, map.getStyle:', map.getStyle(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
}

</script>

<template>
  <div
    id="map"
    class="map map-class"
  >
  <div
      v-if="MainStore.addressSearchRunning"
      class="map-cover is-align-content-center has-text-centered"
    >
      <font-awesome-icon
        icon="fa-solid fa-spinner"
        class="fa-6x center-spinner"
        spin
        />
    </div>

    <AddressSearchControl :input-id="'map-search-input'" />
    <!-- <ImageryToggleControl @toggle-imagery="toggleImagery" />
    <ImageryDropdownControl
      v-if="MapStore.imageryOn"
      @set-imagery="setImagery"
    /> -->
    <!-- <OverlayLegend
      v-show="!MapStore.imageryOn && ['stormwater'].includes(MainStore.currentTopic)"
      :items="$config.stormwaterLegendData"
      :options="{ shape: 'square' }"
    />
    <OverlayLegend
      v-show="!MapStore.imageryOn && ['deeds', 'zoning'].includes(MainStore.currentTopic)"
      :items="$config.dorLegendData"
      :options="{ shape: 'square' }"
    /> -->
  </div>
</template>

<style>

.center-spinner {
  color: #333333;
}

</style>