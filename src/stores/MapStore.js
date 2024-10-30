import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import { point } from '@turf/helpers';
import { useConfigStore } from './ConfigStore';
import { useGeocodeStore } from './GeocodeStore';

export const useMapStore = defineStore("MapStore", {
  state: () => {
    const ConfigStore = useConfigStore();
    const $config = ConfigStore.config;
    return {
      // map: {},
      searchDistance: $config.searchBar.searchDistance,
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      zipcodeCenter: [],
      bufferList: null,
      zipcodeBufferShape: null,
      bufferShape: null,
      watchPositionOn: null,
      
      
      // currentTopicMapStyle: {},
      bufferForAddress: {},
      currentMarkersForTopic: [],
      addressMarker: null,
      addressParcel: null,
      initialized: false,
      draw: null,
      imageryOn: false,
      imagerySelected: '2023',
      selectedRegmap: null,
      regmapOpacity: 0.5,
      zoningOpacity: 1,
      stormwaterOpacity: 1,
      labelLayers: [],
      latestSelectedResourceFromMap: null,
      shouldInitialize: true,
    };
  },
  actions: {
    async fillBufferForAddress() {
      const GeocodeStore = useGeocodeStore();
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddress is running, GeocodeStore.aisData.features:', GeocodeStore.aisData.features);
      // let addressPoint = point([lng, lat])
      let addressPoint = point(GeocodeStore.aisData.features[0].geometry.coordinates);
      let addressBuffer = buffer(addressPoint, this.searchDistance, {units: 'miles'});
      // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddress is running, addressPoint:', addressPoint, 'addressBuffer:', addressBuffer, 'lng:', lng, 'lat:', lat);
      this.bufferForAddress = addressBuffer;
    }
  },

});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};