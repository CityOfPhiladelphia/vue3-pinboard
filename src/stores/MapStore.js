import { defineStore } from 'pinia';
import buffer from '@turf/buffer';
import { point } from '@turf/helpers';
import $mapConfig from '../mapConfig.js';

export const useMapStore = defineStore("MapStore", {
  state: () => {
    return {
      map: {},
      searchDistance: $mapConfig.searchDistance,
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
    setMap(map) {
      if (import.meta.env.VITE_DEBUG == 'true') console.log('MapStore.setMap is running, map:', map);
      this.map = map;
    },
    setMapStyle(style) {
      this.currentMapStyle = style;
    },
    async fillBufferForAddress(lng, lat) {
      let thePoint = point([lng, lat])
      let theBuffer = buffer(thePoint, 750, {units: 'feet'});
      if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddress is running, thePoint:', thePoint, 'theBuffer:', theBuffer, 'lng:', lng, 'lat:', lat);
      this.bufferForAddress = theBuffer.geometry.coordinates;
    }
  },

});