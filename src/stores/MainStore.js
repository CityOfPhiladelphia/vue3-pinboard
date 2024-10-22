import { ref, computed } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useMainStore = defineStore('MainStore', {
  state: () => {
    return {
      refineOpen: false,
      selectedZipcode: null,
      refineList: {},
      printCheckboxes: [],
      lastPinboardSearchMethod: null,
      shouldShowGreeting: true,
      currentSearch: null,
      fullScreen: {},
      alertResponse: null,
      gtag: {
        category: 'unspecified-pinboard-app'
      },
      holiday: {
        holiday_label: '',
        coming_soon: false,
        current: false,
        start_date: '',
      },
      agoToken: null,
      selectedKeywords: [],
      selectedServices: [],
      lastSelectMethod: '',
      publicPath: null,
      isMobileDevice: null,
      isMac: null,

      addressSearchRunning: false,
      searchValue: '',
      windowDimensions: {},
      currentAddress: '',
      currentLang: null,

      // pageTitle: '',
      // datafetchRunning: false,
      // lastClickCoords: [0,0],
      // currentParcelGeocodeParameter: '',
      // otherParcelGeocodeParameter: '',
      // currentParcelAddress:'',
      // otherParcelAddress:'',
      // currentTopic: 'property',
      // currentNearbyDataType: null,
      // currentNearbyTimeInterval: {},
      // dataSourcesLoadedArray: [],
      // clickedRow: [],
      // clickedMarkerId: null,
      // hoveredStateId: null,
      // selectedParcelId: null,
      // fullScreenMapEnabled: false,
      // fullScreenTopicsEnabled: false,
    };
  },

  actions: {
    setCurrentAddress(address) {
      this.currentAddress = address;
    },
    setCurrentGeocodeParameter(value) {
      this.currentGeocodeParameter = value;
    },
    // setLastSearchMethod(searchMethod) {
    //   this.lastSearchMethod = searchMethod;
    // },
    setCurrentNearbyDataType(data) {
      this.currentNearbyDataType = data;
    },
    clearDataSourcesLoadedArray() {
      this.dataSourcesLoadedArray = [];
    },
    addToDataSourcesLoadedArray(data) {
      this.dataSourcesLoadedArray.push(data);
    },
  },
});

// this is from https://pinia.vuejs.org/cookbook/hot-module-replacement.html
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot))
};
