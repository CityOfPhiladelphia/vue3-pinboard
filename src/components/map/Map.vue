<script setup>

import { useMainStore } from '../../stores/MainStore.js';
import { useMapStore } from '../../stores/MapStore.js';
import { useGeocodeStore } from '../../stores/GeocodeStore.js';
import { useDataStore } from '../../stores/DataStore.js';
import { useConfigStore } from '../../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch } from 'vue';

import $mapConfig from '../../mapConfig';
const $config = useConfigStore().config;
if (import.meta.env.VITE_DEBUG) console.log('Map.vue $config:', $config, '$mapConfig:', $mapConfig);

// PACKAGE IMPORTS
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// this was recommended by a comment in https://github.com/mapbox/mapbox-gl-js/issues/9114
// the official mapbox-gl-draw was blocking map clicks
import '../../assets/mapbox-gl-draw.min.js'
import '../../assets/maplibre-gl-draw.css';
import destination from '@turf/destination';
import { point, polygon, multiPolygon, feature, featureCollection } from '@turf/helpers';
import centerOfMass from '@turf/center-of-mass';
import bbox from '@turf/bbox';
import buffer from '@turf/buffer';

// STORES
const MapStore = useMapStore();
const MainStore = useMainStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();

// ROUTER
const route = useRoute();
const router = useRouter();

// COMPONENTS
import AddressSearchControl from '../AddressSearchControl.vue';
import OverlayLegend from './OverlayLegend.vue';
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

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

onMounted(async () => {
  if (import.meta.env.VITE_DEBUG) console.log('Map.vue onMounted');
  
  // create the maplibre map
  let currentTopicMapStyle = 'pwdDrawnMapStyle';
  let zoom = route.params.address ? 17 : 12;

  map = new maplibregl.Map({
    container: 'map',
    style: $mapConfig[currentTopicMapStyle],
    center: $mapConfig.cityCenterCoords,
    zoom: zoom,
    minZoom: 6,
    maxZoom: 22,
    attributionControl: false,
  });

  // if (import.meta.env.VITE_DEBUG) console.log('Map.vue onMounted, DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);

  map.on('load', () => {
    map.resize();
    
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);

    let geojson = featureCollection(DataStore.currentData);
    console.log('geojson:', geojson);
    map.getSource('resources').setData(geojson);

    map.addLayer($config.mapLayer, 'addressMarker');

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
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 2, DataStore.selectedResource:', DataStore.selectedResource);
    if (DataStore.sources[DataStore.appType]) {
      const dataPoint = DataStore.sources[DataStore.appType].data.features.filter(item => item._featureId == DataStore.selectedResource)[0];
      if (import.meta.env.VITE_DEBUG) console.log('dataPoint:', dataPoint);
      if (dataPoint) {
        const popup = document.getElementsByClassName('maplibregl-popup');
        if (popup.length) {
          popup[0].remove();
        }
        new maplibregl.Popup({ className: 'my-class' })
          .setLngLat(dataPoint.geometry.coordinates)
          .setHTML(dataPoint.properties[$config.locationInfo.siteNameField])
          .setMaxWidth("300px")
          .addTo(map);
        
        if (!route.query.address) {
          map.setCenter(dataPoint.geometry.coordinates);
        }
      }
    }
    
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 3, MapStore.bufferForAddressOrZipcode:', MapStore.bufferForAddressOrZipcode);
    if (MapStore.bufferForAddressOrZipcode !== null && Object.keys(MapStore.bufferForAddressOrZipcode).length) {
      map.getSource('buffer').setData(MapStore.bufferForAddressOrZipcode);
    }
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 4');
    if (DataStore.zipcodes && MainStore.selectedZipcode) {

      if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 5, DataStore.zipcodes:', DataStore.zipcodes, 'MainStore.selectedZipcode:', MainStore.selectedZipcode);
      const zipcodeData = DataStore.zipcodes.features.filter(item => item.properties.CODE == MainStore.selectedZipcode)[0];
      map.getSource('zipcode').setData(zipcodeData);
      const center = centerOfMass(zipcodeData);
      map.setCenter(center.geometry.coordinates);
      MapStore.zipcodeCenter = center;
    }

    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 6, map.getStyle().layers:', map.getStyle().layers);
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  if (import.meta.env.VITE_DEBUG == 'true') console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  map.addControl(new maplibregl.GeolocateControl(), 'bottom-right');

  map.on('click', 'pwd', (e) => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map click event, e:', e);
  })

  map.on('click', 'resources', (e) => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map click event, e:', e, 'e.features:', e.features, 'e.features[0]._featureId:', e.features[0]._featureId);
    MainStore.lastSelectMethod = 'map';
    const feature = e.features[0];
    const properties = e.features[0].properties;
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('click, e:', e, 'feature:', feature, 'properties:', properties);
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
    if (import.meta.env.VITE_DEBUG == 'true') console.log('mouseenter, e:', e);
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
  () => MapStore.searchDistance,
  async () => {
    MapStore.fillBufferForAddressOrZipcode();
  }
)

watch(
  () => MapStore.bufferForAddressOrZipcode,
  async newBuffer => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue bufferForAddressOrZipcode watch, newBuffer:', newBuffer);
    if (newBuffer) {
      map.getSource('buffer').setData(newBuffer);
    } else {
      map.getSource('buffer').setData({ type: 'FeatureCollection', features: [] });
    }
  }
)

watch(
  () => DataStore.currentData,
  async newData => {
  let geojson = featureCollection(newData);
    // if (import.meta.env.VITE_DEBUG == 'true') console.log('geojson:', geojson, 'map.getStyle().sources.resources.data:', map.getStyle().sources.resources.data);
  if (import.meta.env.VITE_DEBUG) console.log('map.getSource("resources"):', map.getSource('resources'));
  if (map.getSource('resources')) {
    map.getSource('resources').setData(geojson);
  }
});

watch(
  () => DataStore.selectedResource,
  async (newSelectedResource, oldSelectedResource) => {
    if (import.meta.env.VITE_DEBUG) console.log('map.isStyleLoaded():', map.isStyleLoaded(), 'newSelectedResource:', newSelectedResource, 'oldSelectedResource:', oldSelectedResource);
    if (map.isStyleLoaded()) {
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
        if (DataStore.sources[DataStore.appType].data.features) {
          const dataPoint = DataStore.sources[DataStore.appType].data.features.filter(item => item._featureId == newSelectedResource)[0];
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
            .setHTML(dataPoint.properties[$config.locationInfo.siteNameField])
            .setMaxWidth("300px")
            .addTo(map);
        }
      }
    }
  }
)

// watch GeocodeStore.aisData for moving map center and setting zoom
watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      map.setCenter(newCoords);
      map.setZoom(12);
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

// const labelLayers = computed(() => { return MapStore.labelLayers; });

// watch(
//   () => labelLayers,
//   (newLabelLayers) => {
//     setLabelLayers(newLabelLayers.value);
//   },
//   { deep: true }
// )

const selectedZipcode = computed(() => {
  return MainStore.selectedZipcode;
});

const zipcodeData = computed(() => {
  let zipcode = featureCollection([]);
  if (selectedZipcode.value && DataStore.zipcodes.features) {
    let zipcodesData = DataStore.zipcodes;
    let theSelectedZipcode = selectedZipcode.value;
    if (zipcodesData && selectedZipcode) {
      zipcode = zipcodesData.features.filter(item => item.properties.CODE == theSelectedZipcode)[0];
    }
  }
  return zipcode;
});

watch(
  () => zipcodeData.value,
  async newZipcodeData => {
    map.getSource('zipcode').setData(newZipcodeData);
    // MapStore.zipcodeCenter = centerOfMass(newZipcodeData);
    if (import.meta.env.VITE_DEBUG) console.log('watch zipcodeData.value, newZipcodeData:', newZipcodeData, 'MapStore.zipcodeCenter:', MapStore.zipcodeCenter);
  }
)

// const zipcodeCenter = computed(() => {
//   let center;
//   if (zipcodeData.value) {
//     center = centerOfMass(zipcodeData.value);
//   }
//   return center;
// });

watch(
  () => MapStore.zipcodeCenter,
  async newZipcodeCenter => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue zipcodeCenter watch, newZipcodeCenter:', newZipcodeCenter);
    if (newZipcodeCenter) {
      map.setCenter(newZipcodeCenter.geometry.coordinates);
    }
  }
)

// const setLabelLayers = (newLabelLayers) => {
//   if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, newLabelLayers:', newLabelLayers, 'map.getStyle().layers:', map.getStyle().layers);
//     if (newLabelLayers.length) {
//       newLabelLayers.forEach(layer => {
//         if (!map.getSource(layer.id)) {
//           // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, NOT THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
//           map.addSource(layer.id, JSON.parse(JSON.stringify(layer.source)));
//         } else {
//           // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, YES THERE, layer:', layer, 'layer.id:', layer.id, 'JSON.parse(JSON.stringify(layer.source)):', JSON.parse(JSON.stringify(layer.source)));
//           map.getSource(layer.id).setData(layer.source.data);
//         }
//       })
//     }
//     // if (import.meta.env.VITE_DEBUG == 'true') console.log('Map.vue setLabelLayers, map.getStyle:', map.getStyle(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
// }

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

    <AddressSearchControl
      v-if="!isMobile"
      :input-id="'map-search-input'"
    />

    <!-- <ImageryToggleControl @toggle-imagery="toggleImagery" />

    <ImageryDropdownControl
      v-if="MapStore.imageryOn"
      @set-imagery="setImagery"
    /> -->

    <OverlayLegend
      v-if="$config.legendControl"
      :items="$config.legendControl.legend.data"
      :options="{ shape: 'circle' }"
    />
  </div>
</template>

<style>

.center-spinner {
  color: #333333;
}

</style>