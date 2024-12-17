import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import centerOfMass from '@turf/center-of-mass';
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
      bufferForAddressOrLocationOrZipcode: {},
      imageryOn: false,
      imagerySelected: '2023',
      latestSelectedResourceFromMap: null,
      zipcodeCenter: null,
      geolocation: null,
    };
  },
  actions: {
    geofindSuccess(position) {
      if (import.meta.env.VITE_DEBUG) console.log('geofindSuccess is running, position:', position);
      const MainStore = useMainStore();
      MainStore.shouldShowGreeting = false;
      this.geolocation = [position.coords.longitude, position.coords.latitude];
    },
    geofindError(error) {
      if (import.meta.env.VITE_DEBUG) console.log('geofindError is running, error:', error);
    },
    async geolocate() {
      console.log('geolocate is running');
      if (!this.geolocation) {
        navigator.geolocation.getCurrentPosition(this.geofindSuccess, this.geofindError, { enableHighAccuracy: true, timeout: 1000, maximumAge: 0, distanceFilter: 5 });
      } else {
        this.geolocation = null;
        this.bufferForAddressOrLocationOrZipcode = {};
      }
    },
    async fillBufferForAddressOrLocationOrZipcode() {
      const MainStore = useMainStore();
      const GeocodeStore = useGeocodeStore();
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running');
      if (this.geolocation) {
        this.bufferForAddressOrLocationOrZipcode = buffer(point(this.geolocation), this.searchDistance, {units: 'miles'});
      } else if (GeocodeStore.aisData.features) {
        if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running, GeocodeStore.aisData.features:', GeocodeStore.aisData.features);
        let addressPoint = point(GeocodeStore.aisData.features[0].geometry.coordinates);
        // if (import.meta.env.VITE_DEBUG == 'true') console.log('fillBufferForAddressOrLocationOrZipcode is running, addressPoint:', addressPoint, 'addressBuffer:', addressBuffer, 'lng:', lng, 'lat:', lat);
        this.bufferForAddressOrLocationOrZipcode = buffer(addressPoint, this.searchDistance, {units: 'miles'});
      } else if (MainStore.selectedZipcode) {
        const DataStore = useDataStore();
        if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running, MainStore.selectedZipcode:', MainStore.selectedZipcode, 'DataStore.zipcodes.features:', DataStore.zipcodes.features);
        let zipcodesData = DataStore.zipcodes;
        let theSelectedZipcode = MainStore.selectedZipcode;
        let zipcode;
        if (zipcodesData && theSelectedZipcode) {
          zipcode = zipcodesData.features.filter(item => item.properties.CODE == theSelectedZipcode)[0];
        }
        this.zipcodeCenter = centerOfMass(zipcode);
        this.bufferForAddressOrLocationOrZipcode= buffer(zipcode, this.searchDistance, {units: 'miles'});
      }
    },
  },

});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};