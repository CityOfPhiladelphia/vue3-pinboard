import { defineStore, acceptHMRUpdate } from 'pinia'

export const useMainStore = defineStore('MainStore', {
  state: () => {
    return {
      refineOpen: false,
      selectedZipcode: null,
      refineList: {},
      printCheckboxes: [],
      shouldShowGreeting: true,
      currentSearch: null,
      // alertResponse: null,
      gtag: {
        category: 'unspecified-pinboard-app'
      },
      holiday: {
        holiday_label: '',
        coming_soon: false,
        current: false,
        start_date: '',
      },
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
      subsections: [],
      firstRouteLoaded: false,
      submittedCheckboxValue: null,
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
