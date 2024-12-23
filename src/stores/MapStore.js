import { defineStore, acceptHMRUpdate } from 'pinia';
import buffer from '@turf/buffer';
import centerOfMass from '@turf/center-of-mass';
import { point } from '@turf/helpers';
import { useConfigStore } from './ConfigStore';
import { useGeocodeStore } from './GeocodeStore';
import { useMainStore } from './MainStore';
import { useDataStore } from './DataStore';

export const useMapStore = defineStore("MapStore", {

  state: () => {
    const ConfigStore = useConfigStore();
    const $config = ConfigStore.config;
    return {
      searchDistance: $config.searchBar.searchDistance,
      currentMapStyle: 'pwdDrawnMapStyle',
      currentAddressCoords: [],
      bufferList: null,
      bufferForAddressOrLocationOrZipcode: null,
      imageryOn: false,
      imagerySelected: '2023',
      latestSelectedResourceFromMap: null,
      zipcodeCenter: null,
      geolocation: null,
      cyclomediaOn: false,
      cyclomediaOn: false,
      cyclomediaInitialized: false,
      cyclomediaRecordingsOn: false,
      cyclomediaCameraYaw: null,
      cyclomediaCameraHFov: null,
      cyclomediaCameraXyz: null,
      cyclomediaCameraLngLat: null,
      cyclomediaYear: null,
    };
  },
  actions: {
    setCyclomediaCameraYaw(yaw) {
      this.cyclomediaCameraYaw = yaw;
    },
    setCyclomediaCameraLngLat(lngLat, xyz) {
      this.cyclomediaCameraXyz = xyz;
      this.cyclomediaCameraLngLat = lngLat;
    },
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
      if (import.meta.env.VITE_DEBUG) console.log('geolocate is running');
      if (!this.geolocation) {
        navigator.geolocation.getCurrentPosition(this.geofindSuccess, this.geofindError, { enableHighAccuracy: true, timeout: 1000, maximumAge: 0, distanceFilter: 5 });
      } else {
        this.geolocation = null;
        this.bufferForAddressOrLocationOrZipcode = null;
      }
    },
    async fillZipcodeCenter(zipcode) {
      this.zipcodeCenter = centerOfMass(zipcode).geometry.coordinates;
    },
    async fillBufferForAddressOrLocationOrZipcode() {
      if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running');
      if (this.geolocation) {
        this.bufferForAddressOrLocationOrZipcode = buffer(point(this.geolocation), this.searchDistance, {units: 'miles'});
      } else if (useGeocodeStore().aisData.features) {
        if (import.meta.env.VITE_DEBUG) console.log('fillBufferForAddressOrLocationOrZipcode is running, useGeocodeStore().aisData.features:', useGeocodeStore().aisData.features);
        let addressPoint = point(useGeocodeStore().aisData.features[0].geometry.coordinates);
        //  console.log('fillBufferForAddressOrLocationOrZipcode is running, addressPoint:', addressPoint, 'addressBuffer:', addressBuffer, 'lng:', lng, 'lat:', lat);
        this.bufferForAddressOrLocationOrZipcode = buffer(addressPoint, this.searchDistance, {units: 'miles'});
      } else if (useMainStore().selectedZipcode) {
        let zipcodesData = useDataStore().zipcodes;
        let theSelectedZipcode = useMainStore().selectedZipcode;
        let zipcode;
        if (zipcodesData) {
          zipcode = zipcodesData.features.filter(item => item.properties.CODE == theSelectedZipcode)[0];
        }
        this.bufferForAddressOrLocationOrZipcode= buffer(zipcode, this.searchDistance, {units: 'miles'});
      }
    },
  },

});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMapStore, import.meta.hot))
};