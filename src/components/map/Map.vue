<script setup>

import { useMainStore } from '../../stores/MainStore.js';
import { useMapStore } from '../../stores/MapStore.js';
import { useGeocodeStore } from '../../stores/GeocodeStore.js';
import { useDataStore } from '../../stores/DataStore.js';
import { useConfigStore } from '../../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, onMounted, watch, nextTick } from 'vue';

import $mapConfig from '../../mapConfig';
const $config = useConfigStore().config;
if (import.meta.env.VITE_DEBUG) console.log('Map.vue $config:', $config, '$mapConfig:', $mapConfig);

const $emit = defineEmits(['geolocate', 'popupClicked']);

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
import GeolocateControl from './GeolocateControl.vue';
import ImageryToggleControl from './ImageryToggleControl.vue';
import CyclomediaControl from './CyclomediaControl.vue';
import CyclomediaPanel from './CyclomediaPanel.vue';
import CyclomediaRecordingsClient from '../../util/recordings-client.js';
import OverlayLegend from './OverlayLegend.vue';

// import ImageryDropdownControl from '@/components/map/ImageryDropdownControl.vue';

let map;

// keep image sources as computed props so that the publicPath can be used, for pushing the app to different environments
const markerSrc = computed(() => {
  return MainStore.publicPath + 'images/marker_blue_base_5.png';
})
// const buildingColumnsSrc = computed(() => {
//   return MainStore.publicPath + 'images/building-columns-solid.png';
// })
const cameraSrc = computed(() => {
  return MainStore.publicPath + 'images/camera.png';
})

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const clickedPopup = () => {
  if (import.meta.env.VITE_DEBUG) console.log('clickedPopup');
  $emit('popupClicked');
}

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

  MapStore.map = map;

  // if (import.meta.env.VITE_DEBUG) console.log('Map.vue onMounted, DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);

  map.on('load', async() => {
    // map.resize();
    
    let canvas = document.querySelector(".maplibregl-canvas");
    canvas.setAttribute('tabindex', -1);

    let geojson = featureCollection(DataStore.currentData);
    if (import.meta.env.VITE_DEBUG) console.log('geojson:', geojson);
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
      let dataPoint;
      if (DataStore.sources[DataStore.appType].data.features) {
        dataPoint = DataStore.sources[DataStore.appType].data.features.filter(item => item._featureId == DataStore.selectedResource)[0];
      } else {
        dataPoint = DataStore.sources[DataStore.appType].features.filter(item => item._featureId == DataStore.selectedResource)[0];
      }
      if (import.meta.env.VITE_DEBUG) console.log('dataPoint:', dataPoint);
      if (dataPoint) {
        const popup = document.getElementsByClassName('maplibregl-popup');
        if (popup.length) {
          popup[0].remove();
        }
        const currentDataIncludesCurrentPoint = DataStore.currentData.filter(item => item._featureId == dataPoint._featureId).length>0;
        if (currentDataIncludesCurrentPoint && dataPoint.geometry && dataPoint.geometry.coordinates) {
          new maplibregl.Popup({ className: dataPoint._featureId })
            .setLngLat(dataPoint.geometry.coordinates)
            .setHTML(`<div id="popup-div">${dataPoint.properties[$config.locationInfo.siteNameField]}</div>`)
            .setMaxWidth("300px")
            .addTo(map);
        
          document.getElementById('popup-div').addEventListener('click', clickedPopup);
        }

        
        if ($config.showBuildingFootprint) {
          map.getSource('buildingFootprints').setData(dataPoint.buildingFootprint);
        }
        
        if (!route.query.address && dataPoint.geometry && dataPoint.geometry.coordinates) {
          map.setCenter(dataPoint.geometry.coordinates);
        }
      }
    }
    
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map on load 3, MapStore.bufferForAddressOrLocationOrZipcode:', MapStore.bufferForAddressOrLocationOrZipcode);
    if (MapStore.bufferForAddressOrLocationOrZipcode !== null) {
      map.getSource('buffer').setData(MapStore.bufferForAddressOrLocationOrZipcode);
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
    await nextTick();
    map.resize();
  })

  // add the address marker and camera icon sources
  const markerImage = await map.loadImage(markerSrc.value)
  if (import.meta.env.VITE_DEBUG) console.log('markerImage:', markerImage);
  map.addImage('marker-blue', markerImage.data);
  const cameraImage = await map.loadImage(cameraSrc.value)
  map.addImage('camera-icon', cameraImage.data);

  // add the unchanged maplibre controls
  map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
  // map.addControl(new maplibregl.GeolocateControl(), 'bottom-right');

  map.on('moveend', () => {
    // if (import.meta.env.VITE_DEBUG) console.log('map moveend event, e:', e, 'map.getZoom()', map.getZoom(), 'map.getStyle().layers:', map.getStyle().layers, 'map.getStyle().sources:', map.getStyle().sources);
    if (MapStore.cyclomediaOn) {
      map.getZoom() > 16.5 ? MapStore.cyclomediaRecordingsOn = true : MapStore.cyclomediaRecordingsOn = false;
      if (MapStore.cyclomediaRecordingsOn) {
        updateCyclomediaRecordings();
      } else {
        let geojson = { type: 'FeatureCollection', features: [] };
        map.getSource('cyclomediaRecordings').setData(geojson);
        $mapConfig.pwdDrawnMapStyle.sources.cyclomediaRecordings.data.features = [];
      }
    }
  });

  map.on('zoomend', () => {
    if (MapStore.cyclomediaOn) {
      updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
    }
  });

  // if a cyclomedia recording circle is clicked, set its coordinates in the MapStore
  map.on('click', 'cyclomediaRecordings', (e) => {
    // if (import.meta.env.VITE_DEBUG) console.log('cyclomediaRecordings click, e:', e, 'e.features[0]:', e.features[0]);
    e.clickOnLayer = true;
    MapStore.clickedCyclomediaRecordingCoords = [ e.lngLat.lng, e.lngLat.lat ];
  });

  map.on('mouseenter', 'cyclomediaRecordings', (e) => {
    if (e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
    }
  });

  map.on('mouseleave', 'cyclomediaRecordings', () => {
    map.getCanvas().style.cursor = ''
  });

  map.on('click', 'pwd', (e) => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map click event, e:', e);
  })

  map.on('click', 'resources', (e) => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue map click event, e:', e, 'e.features:', e.features, 'e.features[0]._featureId:', e.features[0]._featureId);
    MainStore.lastSelectMethod = 'map';
    // const feature = e.features[0];
    // const properties = e.features[0].properties;
    // if (import.meta.env.VITE_DEBUG) console.log('click, e:', e, 'feature:', feature, 'properties:', properties);
    const selectedResourceId = e.features[0].properties._featureId;
    MapStore.latestSelectedResourceFromMap = selectedResourceId;
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
    // if (import.meta.env.VITE_DEBUG) console.log('mouseenter, e:', e);
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
    MapStore.fillBufferForAddressOrLocationOrZipcode();
  }
)

watch(
  () => MapStore.geolocation,
  async newGeolocation => {
    MapStore.fillBufferForAddressOrLocationOrZipcode();
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue geolocation watch, newGeolocation:', newGeolocation);
    if (newGeolocation) {
      map.setCenter(newGeolocation);
      map.getSource('geolocationMarker').setData(point(newGeolocation));
    } else {
      map.getSource('geolocationMarker').setData({ type: 'FeatureCollection', features: [] });
    }
  }
)

watch(
  () => MapStore.bufferForAddressOrLocationOrZipcode,
  async newBuffer => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue bufferForAddressOrLocationOrZipcode watch, newBuffer:', newBuffer);
    if (newBuffer && map.getSource('buffer')) {
      map.getSource('buffer').setData(newBuffer);
    } else if (map.getSource('buffer')) {
      map.getSource('buffer').setData({ type: 'FeatureCollection', features: [] });
    }
  }
)

watch(
  () => DataStore.currentData,
  async newData => {
  let geojson = featureCollection(newData);
    // if (import.meta.env.VITE_DEBUG) console.log('geojson:', geojson, 'map.getStyle().sources.resources.data:', map.getStyle().sources.resources.data);
  if (import.meta.env.VITE_DEBUG) console.log('map.getSource("resources"):', map.getSource('resources'));
  if (map.getSource('resources')) {
    map.getSource('resources').setData(geojson);
  }
});

watch(
  () => DataStore.selectedResource,
  async (newSelectedResource, oldSelectedResource) => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue DataStore.selectedResource watch, map.isStyleLoaded():', map.isStyleLoaded(), 'newSelectedResource:', newSelectedResource, 'oldSelectedResource:', oldSelectedResource);
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

        if ($config.showBuildingFootprint) {
          map.getSource('buildingFootprints').setData({ type: 'FeatureCollection', features: [] });
        }
      }
      if (newSelectedResource) {
        if(import.meta.env.VITE_DEBUG) console.log('Map.vue DataStore.selectedResource watch, newSelectedResource:', newSelectedResource);
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
        if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType].data:', DataStore.sources[DataStore.appType].data, 'DataStore.sources[DataStore.appType].data.features:', DataStore.sources[DataStore.appType].data.features);
        
        let dataPoint;
        if (DataStore.sources[DataStore.appType].data.features) {
          if (import.meta.env.VITE_DEBUG) console.log('DataStore.sources[DataStore.appType].data.features:', DataStore.sources[DataStore.appType].data.features, 'newSelectedResource:', newSelectedResource);
          dataPoint = DataStore.sources[DataStore.appType].data.features.filter(item => item._featureId == newSelectedResource)[0];
        } else if (DataStore.sources[DataStore.appType].features) {
          if (import.meta.env.VITE_DEBUG) console.log('DataStore.sources[DataStore.appType].data.features:', DataStore.sources[DataStore.appType].data.features, 'newSelectedResource:', newSelectedResource);
          dataPoint = DataStore.sources[DataStore.appType].features.filter(item => item._featureId == newSelectedResource)[0];
        }

        if (import.meta.env.VITE_DEBUG) console.log('dataPoint:', dataPoint);
        if (MainStore.lastSelectMethod == 'row' && dataPoint.geometry && dataPoint.geometry.coordinates) {
          map.setCenter(dataPoint.geometry.coordinates);
        }

        const popup = document.getElementsByClassName('maplibregl-popup');
        if (popup.length) {
          popup[0].remove();
        }

        if (dataPoint.geometry && dataPoint.geometry.coordinates) {
          new maplibregl.Popup({ className: dataPoint._featureId })
            .setLngLat(dataPoint.geometry.coordinates)
            .setHTML(`<div id="popup-div">${dataPoint.properties[$config.locationInfo.siteNameField]}</div>`)
            .setMaxWidth("300px")
            .addTo(map);


          document.getElementById('popup-div').addEventListener('click', clickedPopup);
        };


        if ($config.showBuildingFootprint) {
          map.getSource('buildingFootprints').setData(dataPoint.buildingFootprint);
        }
      }
    }
  }
)

// watch GeocodeStore.aisData for moving map center and setting zoom
watch(
  () => GeocodeStore.aisData,
  async newAddress => {
    if (import.meta.env.VITE_DEBUG) console.log('MapStore aisData watch, newAddress:', newAddress);
    if (newAddress.features && newAddress.features[0].geometry.coordinates.length) {
      const newCoords = newAddress.features[0].geometry.coordinates;
      map.setCenter(newCoords);
      map.setZoom(12);
      MapStore.currentAddressCoords = newCoords;
  
      const popup = document.getElementsByClassName('maplibregl-popup');
      if (popup.length) {
        popup[0].remove();
      }
    } else {
      MapStore.currentAddressCoords = [];
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
  if (import.meta.env.VITE_DEBUG) console.log('Map pwdCoordinates watch, newCoords:', newCoords, 'MapStore.addressMarker:', MapStore.addressMarker);
  if (newCoords.length) {
    const address = point(newCoords);
    map.getSource('addressMarker').setData(address);
  } else if (map.getSource('addressMarker')) {
    map.getSource('addressMarker').setData({ type: 'FeatureCollection', features: [] });
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
    if (import.meta.env.VITE_DEBUG) console.log('watch zipcodeData.value, newZipcodeData:', newZipcodeData);
  }
)

watch(
  () => MapStore.zipcodeCenter,
  async newZipcodeCenter => {
    if (import.meta.env.VITE_DEBUG) console.log('Map.vue zipcodeCenter watch, newZipcodeCenter:', newZipcodeCenter);
    if (newZipcodeCenter.length) {
      map.setCenter(newZipcodeCenter);
    }
  }
)

watch(
  () => MainStore.filterChangeCounter,
  async() => {
    const popup = document.getElementsByClassName('maplibregl-popup')[0];
    let popupClass, currentPoint
    let currentDataIncludesCurrentPoint = true;
    if (popup) {
      popupClass = popup.className;
      currentPoint = popupClass.split(' ')[1];
      currentDataIncludesCurrentPoint = DataStore.currentData.filter(item => item._featureId == currentPoint).length>0;
      if (!currentDataIncludesCurrentPoint) {
        popup.remove();
      }
    }
  }
)

const imagerySelected = ref('2023');

const toggleImagery = () => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleImagery, map.getStyle:', map.getStyle(), '$mapConfig.mapLayers:', $mapConfig.mapLayers);
  if (!MapStore.imageryOn) {
    MapStore.imageryOn = true;
    map.addLayer($mapConfig.mapLayers[imagerySelected.value], 'cyclomediaRecordings')
    map.addLayer($mapConfig.mapLayers.imageryLabels, 'cyclomediaRecordings')
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('map.getStyle().layers:', map.getStyle().layers);
    MapStore.imageryOn = false;
    map.removeLayer(imagerySelected.value);
    map.removeLayer('imageryLabels');
  }
}

const removeAllCyclomediaMapLayers = () => {
  let recordingsGeojson = {
    type: 'FeatureCollection',
    features: []
  }
  map.getSource('cyclomediaRecordings').setData(recordingsGeojson);
  $mapConfig.pwdDrawnMapStyle.sources.cyclomediaRecordings.data.features = [];

  let cameraGeojson = point([0,0]);
  map.getSource('cyclomediaCamera').setData(cameraGeojson);
  $mapConfig.pwdDrawnMapStyle.sources.cyclomediaCamera.data = cameraGeojson;
  let viewConeGeojson = polygon([[[0,0], [0,0], [0,0], [0,0]]]);
  map.getSource('cyclomediaViewcone').setData(viewConeGeojson);
  $mapConfig.pwdDrawnMapStyle.sources.cyclomediaViewcone.data = viewConeGeojson;
  MapStore.setCyclomediaCameraLngLat(MapStore.cyclomediaCameraLngLat, null);
}

// toggle cyclomedia on and off
const toggleCyclomedia = async() => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleCyclomedia, map.getStyle().sources:', map.getStyle().sources, 'map.getStyle().layers:', map.getStyle().layers);
  MapStore.cyclomediaOn = !MapStore.cyclomediaOn;
  if (MapStore.cyclomediaOn) {
    MapStore.eagleviewOn = false;
    const zoom = map.getZoom();
    if (zoom > 16.5) {
      await updateCyclomediaRecordings();
      if (MapStore.cyclomediaCameraLngLat) {
        if (import.meta.env.VITE_DEBUG) console.log('in toggleCyclomedia, calling updateCyclomediaCameraLngLat, MapStore.cyclomediaCameraLngLat:', MapStore.cyclomediaCameraLngLat);
        updateCyclomediaCameraLngLat(MapStore.cyclomediaCameraLngLat);
      }
      if (MapStore.cyclomediaCameraHFov && MapStore.cyclomediaCameraYaw) {
        if (import.meta.env.VITE_DEBUG) console.log('calling updateCyclomediaCameraViewcone');
        updateCyclomediaCameraViewcone(MapStore.cyclomediaCameraHFov, MapStore.cyclomediaCameraYaw);
      }
    }
  } else {
    removeAllCyclomediaMapLayers();
  }
}

// an object class called CyclomediaRecordingsClient is used for adding the cyclomedia recordings circles to the map 
let cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
  'https://atlasapi.cyclomedia.com/api/recording/wfs',
  import.meta.env.VITE_CYCLOMEDIA_USERNAME,
  import.meta.env.VITE_CYCLOMEDIA_PASSWORD,
  4326,
);

const updateCyclomediaRecordings = async () => {
  // if (import.meta.env.VITE_DEBUG) console.log('updateCyclomediaRecordings is running');
  const bounds = map.getBounds();
  cyclomediaRecordingsClient.getRecordings(
    bounds,
    recordings => {
      let geojson = {
        type: 'FeatureCollection',
        features: []
      }
      let features = [];
      for (let item of recordings) {
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.lng, item.lat]
          },
          properties: {
            id: item.imageId,
            type: 'cyclomediaRecording',
          }
        })
      }
      geojson.features = features;
      // if (import.meta.env.VITE_DEBUG) console.log("map.getSource('cyclomediaRecordings'):", 'map.getStyle().layers:', map.getStyle().layers);
      map.getSource('cyclomediaRecordings').setData(geojson);
      // I don't know why this works - maybe because the mergeDeep is still running
      $mapConfig.pwdDrawnMapStyle.sources.cyclomediaRecordings.data.features = features;
    },
  );
}

// everything for adding, moving, and orienting the cyclomedia camera icon and viewcone
const updateCyclomediaCameraLngLat = (lngLat) => {
  // if (import.meta.env.VITE_DEBUG) console.log('updateCyclomediaCameraLngLat is running, lngLat:', lngLat);
  if (!MapStore.cyclomediaOn) {
    return;
  } else {
    const theData = point(lngLat);
    map.getSource('cyclomediaCamera').setData(theData);
    $mapConfig.pwdDrawnMapStyle.sources.cyclomediaCamera.data = theData;
  }
}

const updateCyclomediaCameraAngle = (newOrientation) => {
  // if (import.meta.env.VITE_DEBUG) console.log('updateCyclomediaCameraAngle is running, newOrientation:', newOrientation);
  if (!newOrientation) {
    newOrientation = MapStore.cyclomediaCameraYaw;
  }
  map.setLayoutProperty('cyclomediaCamera', 'icon-rotate', newOrientation);
}

const updateCyclomediaCameraViewcone = (cycloHFov, cycloYaw) => {
  const halfAngle = cycloHFov / 2.0;
  let angle1 = cycloYaw - halfAngle;
  let angle2 = cycloYaw + halfAngle;
  if (import.meta.env.VITE_DEBUG) console.log('updateCyclomediaCameraViewcone, cycloHFov:', cycloHFov, 'halfAngle:', halfAngle, 'angle1:', angle1, 'cycloYaw:', cycloYaw, 'angle2:', angle2);
  const watchedZoom = map.getZoom();
  let distance;
  if (watchedZoom < 9) {
    distance = 2000 * (21 - watchedZoom);
  } else if (watchedZoom < 10) {
    distance = 1000 * (21 - watchedZoom);
  } else if (watchedZoom < 11) {
    distance = 670 * (21 - watchedZoom);
  } else if (watchedZoom < 12) {
    distance = 420 * (21 - watchedZoom);
  } else if (watchedZoom < 13) {
    distance = 270 * (21 - watchedZoom);
  } else if (watchedZoom < 14) {
    distance = 150 * (21 - watchedZoom);
  } else if (watchedZoom < 15) {
    distance = 100 * (21 - watchedZoom);
  } else if (watchedZoom < 16) {
    distance = 55 * (21 - watchedZoom);
  } else if (watchedZoom < 17) {
    distance = 30 * (21 - watchedZoom);
  } else if (watchedZoom < 18) {
    distance = 25 * (21 - watchedZoom);
  } else if (watchedZoom < 20.4) {
    distance = 15 * (21 - watchedZoom);
  } else {
    distance = 10;
  }

  const cyclomediaCameraLngLat = MapStore.cyclomediaCameraLngLat;
  let options = { units: 'feet' };
  if (!cyclomediaCameraLngLat) {
    if (import.meta.env.VITE_DEBUG) console.log('no cyclomediaCameraLngLat');
    return;
  }
  if (import.meta.env.VITE_DEBUG) console.log('cyclomediaCameraLngLat:', cyclomediaCameraLngLat);

  var destination1 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle1, options);
  var destination2 = destination([ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ], distance, angle2, options);
  let data = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
        [ destination1.geometry.coordinates[0], destination1.geometry.coordinates[1] ],
        [ destination2.geometry.coordinates[0], destination2.geometry.coordinates[1] ],
        [ cyclomediaCameraLngLat[0], cyclomediaCameraLngLat[1] ],
      ]],
    }
  }

  map.getSource('cyclomediaViewcone').setData(data);
  $mapConfig.pwdDrawnMapStyle.sources.cyclomediaViewcone.data = data;
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

    <AddressSearchControl
      v-if="!isMobile"
      :input-id="'map-search-input'"
    />

    <GeolocateControl
      @geolocate="$emit('geolocate')"
    />
    <!-- @geolocate="MapStore.geolocate" -->

    <ImageryToggleControl @toggle-imagery="toggleImagery" />
    <CyclomediaControl @toggle-cyclomedia="toggleCyclomedia" />

    <!-- <ImageryDropdownControl
      v-if="MapStore.imageryOn"
      @set-imagery="setImagery"
    /> -->

    <OverlayLegend
      v-if="$config.legendControl"
      :items="$config.legendControl.legend.data"
      :options="{ shape: 'circle' }"
    />

  </div>
  <KeepAlive>
    <CyclomediaPanel
      v-if="MapStore.cyclomediaOn"
      @update-camera-yaw="updateCyclomediaCameraAngle"
      @update-camera-h-fov="updateCyclomediaCameraViewcone"
      @update-camera-lng-lat="updateCyclomediaCameraLngLat"
      @toggle-cyclomedia="toggleCyclomedia"
    />
  </KeepAlive>


</template>

<style>

.center-spinner {
  color: #333333;
}

</style>