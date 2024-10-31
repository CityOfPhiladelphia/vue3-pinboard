import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import { point } from '@turf/helpers';
import { useConfigStore } from './ConfigStore';
import { useGeocodeStore } from './GeocodeStore';
import { useMainStore } from './MainStore';
import { useDataStore } from './DataStore';
import { useRoute, useRouter } from 'vue-router';

export const useMapStore = defineStore("MapStore", {

  state: () => {
    const ConfigStore = useConfigStore();
    const $config = ConfigStore.config;
    return {
      searchDistance: $config.searchBar.searchDistance,
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      bufferList: null,
      bufferShape: null,
      watchPositionOn: null,
      bufferForAddressOrZipcode: {},
      imageryOn: false,
      imagerySelected: '2023',
      latestSelectedResourceFromMap: null,
    };
  },
  actions: {
    async fillBufferForAddressOrZipcode() {
      const MainStore = useMainStore();
      // const route = {...useRoute()};
      // const route = useRoute();
      // if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrZipcode is running, route:', route);
      // if (route.query.address) {
      if (MainStore.lastPinboardSearchMethod == 'geocode') {
        const GeocodeStore = useGeocodeStore();
        if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrZipcode is running, GeocodeStore.aisData.features:', GeocodeStore.aisData.features);
        let addressPoint = point(GeocodeStore.aisData.features[0].geometry.coordinates);
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddressOrZipcode is running, addressPoint:', addressPoint, 'addressBuffer:', addressBuffer, 'lng:', lng, 'lat:', lat);
        this.bufferForAddressOrZipcode = buffer(addressPoint, this.searchDistance, {units: 'miles'});
      } else if (MainStore.lastPinboardSearchMethod == 'zipcode') {
      // } else if (route.query.zipcode) {
        const DataStore = useDataStore();
        if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrZipcode is running, DataStore.zipcodes.features:', DataStore.zipcodes.features);
        // if (DataStore.zipcodes.features) {
          let zipcodesData = DataStore.zipcodes;
          let theSelectedZipcode = MainStore.selectedZipcode;
          let zipcode;
          if (zipcodesData && theSelectedZipcode) {
            zipcode = zipcodesData.features.filter(item => item.properties.CODE == theSelectedZipcode)[0];
          }
          this.bufferForAddressOrZipcode= buffer(zipcode, this.searchDistance, {units: 'miles'});
        // }
      }
    },
  },

});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};