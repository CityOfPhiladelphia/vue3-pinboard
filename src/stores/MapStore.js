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
      bufferShape: null,
      watchPositionOn: null,
      bufferForAddressOrLocationOrZipcode: {},
      imageryOn: false,
      imagerySelected: '2023',
      latestSelectedResourceFromMap: null,
      zipcodeCenter: null,
      location: null,
    };
  },
  actions: {
    geofindSuccess(position) {
      if (import.meta.env.VITE_DEBUG) console.log('geofindSuccess is running, position:', position);
      const MainStore = useMainStore();
      MainStore.shouldShowGreeting = false;
      this.location = [position.coords.longitude, position.coords.latitude];
      // this.watchPositionOn = true;
    },
    geofindError(error) {
      if (import.meta.env.VITE_DEBUG) console.log('geofindError is running, error:', error);
      // this.watchPositionOn = false;
    },
    async geolocate() {
      console.log('geolocate is running');
      if (!this.location) {
        navigator.geolocation.getCurrentPosition(this.geofindSuccess, this.geofindError, { enableHighAccuracy: true, timeout: 1000, maximumAge: 0, distanceFilter: 5 });
      } else {
        // this.watchPositionOn = false;
        this.location = null;
        this.bufferForAddressOrLocationOrZipcode = null;
      }
    },
    async fillBufferForAddressOrLocationOrZipcode() {
      const MainStore = useMainStore();
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running');
      if (this.location) {
        this.bufferForAddressOrLocationOrZipcode = buffer(point(this.location), this.searchDistance, {units: 'miles'});
      } else if (MainStore.lastPinboardSearchMethod == 'geocode') {
        const GeocodeStore = useGeocodeStore();
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