<script setup>
// IMPORTS
import { onMounted, computed, watch, useTemplateRef } from 'vue';
import { useMapStore } from '../../stores/MapStore';
import { useGeocodeStore } from '../../stores/GeocodeStore';
import { useDataStore } from '../../stores/DataStore';
import { useCyclomedia } from '@/composables/cyclomedia/useCyclomedia';
import $mapConfig from '../../mapConfig';

// INITIALIZATIONS
const MapStore = useMapStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();
const cyclomedia = useCyclomedia();

// EMITS
const $emit = defineEmits(['updateCameraYaw', 'updateCameraLngLat', 'updateCameraHFov', 'toggleCyclomedia']);

// REFS
const streetView = useTemplateRef('cycloviewer')

// LIFECYCLE HOOKS
onMounted( async() => {
  if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, cyclomedia:', cyclomedia);

  if (cyclomediaInitialized.value) {
    cyclomedia.destroy(streetView.value);
    await cyclomedia.init(streetView.value)
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, initializing cyclomedia');
    await cyclomedia.init(streetView.value)
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue onMounted, cyclomedia initialized');
    MapStore.cyclomediaInitialized = true;
  }

  if (DataStore.selectedResource && selectedResourceCoords.value) {
    setNewLocation(selectedResourceCoords.value);
  } else if (GeocodeStore.aisData.features) {
    setNewLocation(GeocodeStore.aisData.features[0].geometry.coordinates);
  } else {
    setNewLocation([ -75.163471, 39.953338 ]);
  }
})

// COMPUTED VALUES
const cyclomediaInitialized = computed(() => MapStore.cyclomediaInitialized);

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
  return null;
});

// WATCHERS
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

watch(
  () => MapStore.clickedCyclomediaRecordingCoords,
  newClickedCyclomediaRecordingCoords => {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue watch clickedCyclomediaRecordingCoords, newClickedCyclomediaRecordingCoords:', newClickedCyclomediaRecordingCoords);
    if (newClickedCyclomediaRecordingCoords) {
      setNewLocation(newClickedCyclomediaRecordingCoords);
    }
  }
)

// FUNCTIONS
const popoutClicked = () => {
  window.open('//cyclomedia.phila.gov/?lat=' + MapStore.cyclomediaCameraLngLat[1] + '&lng=' + MapStore.cyclomediaCameraLngLat[0], '_blank');
  $emit('toggleCyclomedia');
}

const setNewLocation = async (coords) => {
  if (MapStore.cyclomediaOn) {
    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, coords:', coords);
    const year = MapStore.cyclomediaYear;
    let thisYear, lastYear;
    let params = {
      coordinate: coords,
      orientation: { pitch: 0 },
    };
    if (year) {
      lastYear = `${year}-01-01`;
      thisYear = `${year + 1}-01-01`;
      params.dateRange = { from: lastYear, to: thisYear }
    }

    if (import.meta.env.VITE_DEBUG) console.log('CyclomediaPanel.vue setNewLocation, lastYear:', lastYear, 'thisYear:', thisYear, 'coords:', coords);
    const viewer = await cyclomedia.open(params)

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
      viewer.setOrientation({ pitch: 0 });
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

    const orientation = viewer.getOrientation();
    $emit('updateCameraYaw', orientation.yaw);
    $emit('updateCameraHFov', orientation.hFov, orientation.yaw);
  }
}

</script>

<template>
  <div
    id="cyclomedia-panel"
    class="cyclomedia-panel"
  >
    <div class="cyclomedia-pop-out">
      <font-awesome-icon
        icon="fa-external-link-alt"
        @click="popoutClicked"
      />
    </div>
    <div
      id="cycloviewer"
      ref="cycloviewer"
      class="panoramaViewerWindow"
    />
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
