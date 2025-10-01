<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useMapStore } from '../../stores/MapStore';
const MapStore = useMapStore();
import { useGeocodeStore } from '../../stores/GeocodeStore';
const GeocodeStore = useGeocodeStore();
import { useMainStore } from '../../stores/MainStore';
const MainStore = useMainStore();
import { useDataStore } from '../../stores/DataStore';
const DataStore = useDataStore();

import $mapConfig from '../../mapConfig';

const cyclomediaInitialized = ref(false);

const $emit = defineEmits(['updateCameraYaw', 'updateCameraLngLat', 'updateCameraHFov', 'toggleCyclomedia']);

const selectedResourceCoords = computed(() => {
  let dataSource;
  if (DataStore.sources[DataStore.appType].data.features) {
    dataSource = DataStore.sources[DataStore.appType].data.features;
  } else if (DataStore.sources[DataStore.appType].features) {
    dataSource = DataStore.sources[DataStore.appType].features;
  }

  if (import.meta.env.VITE_DEBUG) console.log('selectedResourceCoords, dataSource:', dataSource, 'DataStore.selectedResource:', DataStore.selectedResource);
  const dataPoint = dataSource.filter(dataPoint => dataPoint._featureId === DataStore.selectedResource)[0];
  if (import.meta.env.VITE_DEBUG) console.log('selectedResourceCoords, dataPoint:', dataPoint);
  if (dataPoint && dataPoint.geometry && dataPoint.geometry.coordinates) {
    return dataPoint.geometry.coordinates;
  }
});

watch(
  () => selectedResourceCoords.value,
  newSelectedResourceCoords => {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue watch selectedResourceCoords, newSelectedResourceCoords:', newSelectedResourceCoords);
    if (newSelectedResourceCoords && newSelectedResourceCoords.length) setNewLocation(newSelectedResourceCoords);
  }
)

watch(
  () => MapStore.currentAddressCoords,
  newLngLat => {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue watch cyclomediaLngLat, newLngLat:', newLngLat);
    if (newLngLat.length) setNewLocation(newLngLat);
  }
)

watch(
  () => MapStore.cyclomediaOn,
  newCyclomediaOn => {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue watch cyclomediaOn, newCyclomediaOn:', newCyclomediaOn);
    if (newCyclomediaOn) {
      if (DataStore.selectedResource) {
        setNewLocation(selectedResourceCoords.value);
      } else if (MapStore.currentAddressCoords.length) {
        setNewLocation(MapStore.currentAddressCoords);
      } else {
        setNewLocation($mapConfig.cityCenterCoords);
      }
    }
  }
)

const navBarExpanded = ref(false);

const setNewLocation = async (coords) => {
  if (MapStore.cyclomediaOn) {
    // if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, coords:', coords);
    const today = new Date();
    const year = MapStore.cyclomediaYear;
    let thisYear, lastYear;
    let params = {};
    if (year) {
      lastYear = `${year}-01-01`;
      thisYear = `${year + 1}-01-01`;
      params = {
        coordinate: coords,
        dateRange: { from: lastYear, to: thisYear },
      };
    } else {
      params = {
        coordinate: coords,
        orientation: { pitch: 0 },
      };
    }
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, lastYear:', lastYear, 'thisYear:', thisYear, 'coords:', coords);
    const response = await StreetSmartApi.open(
      params,
      {
        viewerType: StreetSmartApi.ViewerType.PANORAMA,
        srs: 'EPSG:4326',
        panoramaViewer: {
          closable: false,
          maximizable: false,
        },
      }
    )
    let viewer = response[0];
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, viewer:', viewer, 'response:', response);
    viewer.toggleNavbarExpanded(navBarExpanded.value);
    viewer.toggleButtonEnabled('panorama.elevation', false);
    viewer.toggleButtonEnabled('panorama.reportBlurring', false);

    for (let overlay of viewer.props.overlays) {
      if (overlay.id === 'surfaceCursorLayer') {
        if (overlay.visible === true) {
          viewer.toggleOverlay(overlay);
        }
      }
    }

    viewer.on('VIEW_CHANGE', function(e) {
      if (import.meta.env.VITE_DEBUG) console.log('on VIEW_CHANGE fired, type:', e.type, 'detail:', e.detail, 'viewer.props:', viewer.props, 'viewer.props.orientation.xyz:', viewer.props.orientation.xyz, 'MapStore.cyclomediaCameraXyz:', MapStore.cyclomediaCameraXyz);
      if (MapStore.cyclomediaOn) {
        MapStore.cyclomediaCameraYaw = e.detail.yaw;
        MapStore.cyclomediaCameraHFov = e.detail.hFov;
        $emit('updateCameraYaw', e.detail.yaw);
        $emit('updateCameraHFov', e.detail.hFov, e.detail.yaw);
        if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
          const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
          MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
          $emit('updateCameraLngLat', lngLat);
        }
      }
    });

    viewer.on('VIEW_LOAD_END', function(e) {
      if (import.meta.env.VITE_DEBUG) console.log('on VIEW_LOAD_END fired, type:', e.type, 'e:', e, 'viewer.props.orientation:', viewer.props.orientation, 'viewer.props:', viewer.props);
      if (import.meta.env.VITE_DEBUG) console.log('update cyclomedia date, viewer.props.recording.year:', viewer.props.recording.year);
      MapStore.cyclomediaYear = viewer.props.recording.year;
      const orientation = viewer.getOrientation();
      if (import.meta.env.VITE_DEBUG) console.log('orientation:', orientation);
      if (viewer.props.orientation.xyz !== MapStore.cyclomediaCameraXyz) {
        const lngLat = [ viewer.props.orientation.xyz[0], viewer.props.orientation.xyz[1] ];
        MapStore.setCyclomediaCameraLngLat(lngLat, viewer.props.orientation.xyz);
        $emit('updateCameraLngLat', lngLat);
        const orientation = viewer.getOrientation();
        if (import.meta.env.VITE_DEBUG) console.log('orientation:', orientation);
        $emit('updateCameraYaw', orientation.yaw);
        $emit('updateCameraHFov', orientation.hFov, orientation.yaw);
      }
    });

    if (!MapStore.currentAddressCoords.length) {
      $emit('updateCameraLngLat', coords);
    }
    const orientation = viewer.getOrientation();
    $emit('updateCameraYaw', orientation.yaw);
    $emit('updateCameraHFov', orientation.hFov, orientation.yaw);
  }
}

watch(
  () => MapStore.clickedCyclomediaRecordingCoords,
  newClickedCyclomediaRecordingCoords => {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue watch clickedCyclomediaRecordingCoords, newClickedCyclomediaRecordingCoords:', newClickedCyclomediaRecordingCoords);
    if (newClickedCyclomediaRecordingCoords) {
      setNewLocation(newClickedCyclomediaRecordingCoords);
    }
  }
)

onMounted( async() => {
  let CYCLOMEDIA_USERNAME = import.meta.env.VITE_CYCLOMEDIA_USERNAME;
  let CYCLOMEDIA_PASSWORD = import.meta.env.VITE_CYCLOMEDIA_PASSWORD;
  if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, StreetSmartApi:', StreetSmartApi, 'CYCLOMEDIA_USERNAME:', CYCLOMEDIA_USERNAME, 'CYCLOMEDIA_PASSWORD:', CYCLOMEDIA_PASSWORD);

  if (!cyclomediaInitialized.value) {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, initializing cyclomedia');
    await StreetSmartApi.init({
      targetElement: cycloviewer,
      username: CYCLOMEDIA_USERNAME,
      password: CYCLOMEDIA_PASSWORD,
      apiKey: import.meta.env.VITE_CYCLOMEDIA_API_KEY,
      srs: 'EPSG:4326',
      locale: 'en-us',
      addressSettings: {
        locale: 'en-us',
        database: 'CMDatabase',
      },
    })
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, cyclomedia initialized');
    cyclomediaInitialized.value = true;
  }

  if (DataStore.selectedResource && selectedResourceCoords.value) {
    setNewLocation(selectedResourceCoords.value);
  } else if (GeocodeStore.aisData.features) {
    setNewLocation(GeocodeStore.aisData.features[0].geometry.coordinates);
  } else {
    setNewLocation([ -75.163471, 39.953338 ]);
  }
})

const popoutClicked = () => {
  window.open('//cyclomedia.phila.gov/?lat=' + MapStore.cyclomediaCameraLngLat[1] + '&lng=' + MapStore.cyclomediaCameraLngLat[0], '_blank');
  $emit('toggleCyclomedia');
}

</script>

<template>
  <div id="cyclomedia-panel" class="cyclomedia-panel">

    <div class="cyclomedia-pop-out">
      <font-awesome-icon
        icon="fa-external-link-alt"
        @click="popoutClicked"
      ></font-awesome-icon>
    </div>
    <div
      id="cycloviewer"
      ref="cycloviewer"
      class="panoramaViewerWindow"
    >
    </div>

  </div>
</template>

<style scoped>

.cyclomedia-panel {
  position: relative;
  height: 100%;
  width: 100%;
}

.cyclomedia-pop-out {
  position: absolute;
  right: 0;
  z-index: 2;
  background-color: white;
  padding-left: 6px;
  padding-right: 6px;
  padding-top: 1px;
  padding-bottom: 1px;
  cursor: pointer;
  border-radius: 2px;
}

@media
only screen and (max-width: 768px),
(min-device-width: 768px) and (max-device-width: 1024px)  {
  .cyclomedia-panel {
    /* height: 150px; */
    height: 70%;
  }
}

.panoramaViewerWindow {
  display: block;
  width: 100%;
  height:100%;
}

</style>
