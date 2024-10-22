<script setup>

import $config from '../../config';
if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue $config:', $config);

import { ref, onMounted, watch, watchEffect, computed } from 'vue';

// PACKAGE IMPORTS
import * as maplibregl from 'maplibre-gl/dist/maplibre-gl.js';
import 'maplibre-gl/dist/maplibre-gl.css';
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
import '../../assets/mapbox-gl-draw.min.js'
import '../../assets/maplibre-gl-draw.css';
import destination from '@turf/destination';
import { point, polygon, multiPolygon, feature, featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

// STORES
import { useMapStore } from '../../stores/MapStore.js';
const MapStore = useMapStore();
import { useMainStore } from '../../stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '../../stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();
import { useDataStore } from '../../stores/DataStore.js'
const DataStore = useDataStore();

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

// COMPONENTS
import AddressSearchControl from '../AddressSearchControl.vue';
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
  // if (import.meta.env.VITE_DEBUG) console.log('Map.vue onMounted route.params.topic:', route.params.topic, 'route.params.address:', route.params.address);
  
  // create the maplibre map
  let currentTopicMapStyle = 'pwdDrawnMapStyle';
  let zoom = route.params.address ? 17 : 12;

  map = new maplibregl.Map({
    container: 'map',
    style: $config[currentTopicMapStyle],
    center: $config.cityCenterCoords,
    zoom: zoom,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  });

  if (import.meta.env.VITE_DEBUG) console.log('Map.vue onMounted, DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);

  map.on('load', () => {
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);

    if (import.meta.env.VITE_DEBUG) console.log('map on load, map.getSource("resources"):', map.getSource('resources'));
    if (map.getSource('resources') && DataStore.selectedResource) {
      map.setPaintProperty(
        'resources',
        'circle-radius',
        ['match',
        ['get', '_featureId'],
        DataStore.selectedResource,
        12,
        7,
        ]
      )
    };
    if (DataStore.sources[DataStore.appType]) {
      const dataPoint = DataStore.sources[DataStore.appType].features.filter(item => item._featureId == DataStore.selectedResource)[0];
      if (import.meta.env.VITE_DEBUG) console.log('dataPoint:', dataPoint);
      map.setCenter(dataPoint.geometry.coordinates);

      const popup = document.getElementsByClassName('maplibregl-popup');
      if (popup.length) {
        popup[0].remove();
      }
      new maplibregl.Popup({ className: 'my-class' })
        .setLngLat(dataPoint.geometry.coordinates)
        .setHTML(dataPoint.properties.site_name)
        .setMaxWidth("300px")
        .addTo(map);
    }
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  if (import.meta.env.VITE_DEBUG == 'true') console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-left');

  // if the L&I topic is selected, and a building footprint is clicked, set the selected building number in the LiStore
  map.on('click', 'resources', (e) => {
    MainStore.lastSelectMethod = 'map';
    const feature = e.features[0];
    const properties = e.features[0].properties;
    if (import.meta.env.VITE_DEBUG == 'true') console.log('click, e:', e, 'feature:', feature, 'properties:', properties);
    const selectedResourceId = e.features[0].properties._featureId;
    let query = {...route.query};
    if (import.meta.env.VITE_DEBUG) console.log('Map click query:', query);
    if (selectedResourceId != DataStore.selectedResource) {
      query['resource'] = selectedResourceId;
      router.push({ name: 'home', query });
    } else {
      delete query.resource;
      router.push({ name: 'home', query });
    }
  });

  map.on('mouseenter', 'resources', (e) => {
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('mouseenter, e:', e);
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    }
  });

  map.on('mouseleave', 'resources', () => {
    map.getCanvas().style.cursor = ''
  });

  map.on('style.load', () => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map style.load event');
  })

});

watch(
  () => DataStore.selectedResource,
  async (newSelectedResource, oldSelectedResource) => {
    if (import.meta.env.VITE_DEBUG) console.log('newSelectedResource:', newSelectedResource, 'oldSelectedResource:', oldSelectedResource);
    if (oldSelectedResource) {
      map.setPaintProperty(
          'resources',
          'circle-radius',
          ['match',
          ['get', '_featureId'],
          oldSelectedResource,
          7,
          7,
          ]
        )
      const popup = document.getElementsByClassName('maplibregl-popup');
      if (popup.length) {
        popup[0].remove();
      }
    }
    if (newSelectedResource) {
      if (map.getSource('resources')) {
        map.setPaintProperty(
          'resources',
          'circle-radius',
          ['match',
          ['get', '_featureId'],
          newSelectedResource,
          12,
          7,
          ]
        )
      };
      if (DataStore.sources[DataStore.appType].features) {
        const dataPoint = DataStore.sources[DataStore.appType].features.filter(item => item._featureId == newSelectedResource)[0];
        if (import.meta.env.VITE_DEBUG) console.log('dataPoint:', dataPoint);
        if (MainStore.lastSelectMethod == 'row') {
          map.setCenter(dataPoint.geometry.coordinates);
        }
        // map.setZoom(15);

        const popup = document.getElementsByClassName('maplibregl-popup');
        if (popup.length) {
          popup[0].remove();
        }
        new maplibregl.Popup({ className: 'my-class' })
          .setLngLat(dataPoint.geometry.coordinates)
          .setHTML(dataPoint.properties.site_name)
          .setMaxWidth("300px")
          .addTo(map);
      }
    }
  }
)

// TODO - this is going to need to be tested against all apps
const database = computed(() => {
  if (DataStore.sources[DataStore.appType]) {
    return DataStore.sources[DataStore.appType].rows || DataStore.sources[DataStore.appType] || DataStore.sources[DataStore.appType].data;
  }
});

watch(
  () => database.value,
  async newData => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue watch database, newData:', newData);
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
      // if (MainStore.lastSearchMethod !== 'mapClick') {
      map.setCenter(newCoords);
      map.setZoom(14);
      // }
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