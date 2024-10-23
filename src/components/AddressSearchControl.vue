<script setup>

import { computed } from 'vue';
import { useConfigStore } from '../stores/ConfigStore.js'
const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

import { useMainStore } from '../stores/MainStore.js'
const MainStore = useMainStore();
import { useMapStore } from '../stores/MapStore.js'
const MapStore = useMapStore();

import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();

defineProps({
  inputId: {
    type: String,
    default: 'address-search-input',
  },
});

const clearSearch = () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearSearch is running');
  MainStore.searchValue = '';
}

// const fullScreenTopicsEnabled = computed(() => {
//   return MainStore.fullScreenTopicsEnabled;
// });
  
// const fullScreenMapEnabled = computed(() => {
//   return MainStore.fullScreenMapEnabled;
// });
    
const holderWidth = computed(() => {
  // if (fullScreenTopicsEnabled.value || fullScreenMapEnabled.value) {
  //   return '40%';
  // } else {
    return '70%';
  // }
});

const yPosition = computed(() => {
  // if (fullScreenTopicsEnabled.value) {
  //   return '88px';
  // } else {
    return '10px';
  // }
});

const setRoute = (input) => {
  let query = {...route.query};
  if (import.meta.env.VITE_DEBUG) console.log('query:', query);
  query.address = address;
  router.push({ name: 'home', query });
}

const handleSubmit = (val) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleSubmit is running, val:', val);
  let query;
  // let searchBarType;
  let valAsFloat = parseFloat(val.substring(0));
  let valToString = valAsFloat.toString();
  let checkVals = val === valToString;
  if (import.meta.env.VITE_DEBUG) console.log('handleSubmit 1, val.substring(0):', val.substring(0), 'valAsFloat:', valAsFloat, 'checkVals:', checkVals, '$config.searchBar.searchTypes:', $config.searchBar.searchTypes);
  
  let startQuery = { ...route.query };
  
  if (isNaN(valAsFloat)) {
    if (!$config.searchBar.searchTypes.includes('keyword')) {
      if (import.meta.env.VITE_DEBUG) console.log('cannot search keywords');
      this.$warning(`Please search an address`, {
        duration: 4000,
        closeOnClick: true,
      });
      return;
    } else {
      if (import.meta.env.VITE_DEBUG) console.log('in handleSubmit, checking checkboxText');
      if (checkboxText.value.includes(val.toLowerCase())) {
        if (import.meta.env.VITE_DEBUG) console.log('in handleSubmit, checking checkboxText - its there');
        // alert('There is already a checkbox or radio button for that search term');
        submittedCheckboxValue.value = val;
        if (MainStore.shouldShowGreeting && !isMobile.value) {
          MainStore.refineOpen = true;
        }
        return;
      }
      MainStore.lastPinboardSearchMethod = 'keyword';
      let startKeyword;
      if (startQuery['keyword'] && startQuery['keyword'] != '') {
        startKeyword = startQuery['keyword'];
        val = startKeyword + ',' + val;
      }
      query = { ...startQuery, ...{ 'keyword': val }};
      // this.searchBarType = 'keyword';
      // searchBarType = 'keyword';
    }
  } else if (checkVals) {
    if (import.meta.env.VITE_DEBUG) console.log('its a zipcode');
    if ($config.allowZipcodeSearch) {

      MapStore.watchPositionOn = false;
      MainStore.lastPinboardSearchMethod = 'zipcode';
      query = { 'zipcode': val };
      // this.searchBarType = 'zipcode';
      // searchBarType = 'zipcode';
    } else if ($config.allowZipcodeInDataSearch) {
      // query = { 'zipcode': val };
      // this.searchBarType = 'zipcode';
      // searchBarType = 'zipcode';

      MapStore.watchPositionOn = false;
      MainStore.lastPinboardSearchMethod = 'zipcodeKeyword';

      clearGeocodeAndZipcode();
      MapStore.bufferShape = null;
      currentBuffer = null;
      
      let startKeyword;
      if (startQuery['keyword'] && startQuery['keyword'] != '') {
        startKeyword = startQuery['keyword'];
        val = startKeyword + ',' + val;
      }
      query = { ...startQuery, ...{ 'keyword': val }};
      // this.searchBarType = 'keyword';
      // searchBarType = 'keyword';
    }
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('its an address');

    if (MainStore.lastPinboardSearchMethod == 'zipcodeKeyword') {
      if (import.meta.env.VITE_DEBUG) console.log('startQuery:', startQuery);
      delete startQuery['keyword'];
      MainStore.selectedKeywords = [];
    }

    MapStore.watchPositionOn = false;

    query = { ...startQuery, ...{ 'address': val }};
    MainStore.lastPinboardSearchMethod = 'geocode';
    // this.searchBarType = 'address';
    // searchBarType = 'address';
  }
  delete startQuery['address'];
  delete startQuery['keyword'];
  delete startQuery['zipcode'];
  if (import.meta.env.VITE_DEBUG) console.log('handleSubmit is running, valAsFloat:', valAsFloat, 'startQuery:', startQuery, 'route.query:', route.query, 'query:', query, 'val:', val, 'val.substring(0, 1):', val.substring(0, 1));
  router.push({ query: { ...startQuery, ...query }});
  // searchString = query[this.searchBarType];
  const searchCategory = Object.keys(query)[0];
  const value = query[searchCategory];
  // $gtag.event(searchBarType + '-search', {
  //   'event_category': store.state.gtag.category,
  //   'event_label': value,
  // })
  MainStore.currentSearch = value;
  MapStore.zipcodeCenter = [];

  // if (store.state.shouldShowGreeting && !isMobile.value) {
  //   store.commit('setRefineOpen', true);
  // }
};

</script>

<template>
  <div
    :class="fullScreenTopicsEnabled ? 'holder holder-topics' : 'holder holder-map'"
    :style="{ top: yPosition, width: holderWidth }"
  >
    <div class="field has-addons" :style="{ width: '100%' }">
      <div class="control has-icons-right" :style="{ width: '100%' }">
        <label
          :for="inputId"
          class="search-label"
        >Search for an address, OPA account, or DOR number</label>
        <input
          :id="inputId"
          v-model="MainStore.searchValue"
          class="input address-input"
          type="text"
          placeholder="Search for an address, OPA account, or DOR number"
          @keydown.enter="handleSubmit(MainStore.searchValue)"
        >
      </div>
      <div class="control">
        <button
          v-if="MainStore.searchValue != ''"
          class="button is-info address-clear-button"
          title="Clear Address Button"
          @click="clearSearch"
        >
          <font-awesome-icon
            :icon="['fas', 'times']"
            size="xl"
          />
        </button>
      </div>
      <div class="control">
        <button
          class="button is-info address-search-button"
          type="submit"
          title="Address Search Button"
          @click="handleSubmit(MainStore.searchValue)"
        >
          <font-awesome-icon
            :icon="['fas', 'search']"
            size="xl"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.search-label {
  /* display: none !important */
  position: absolute;
  top: -9999px;
  left: -9999px;
}

.holder {
  position: absolute;
  display: flex;
  flex-direction: row;
}

.holder-map {
  left: 10px;
}

.holder-topics {
  right: 10px;
}

.address-input {
  border-radius: 0px !important;
  border-style: solid;
  border-width: 2px;
  border-color: #0f4d90;
  background-color: white;
  border-radius: 3px;
  z-index: 2;
}

.address-input:hover {
  border-color: #2176d2;
}

.address-clear-button {
  background-color: #0f4d90 !important;
  height: 2.5em !important;
  z-index: 2;
  border-right: solid 3px white !important;
}

.address-clear-button:hover {
  background-color: #2176d2 !important;
}

.address-search-button {
  background-color: #0f4d90 !important;
  height: 2.5em !important;
  padding-left: 10px !important;
  padding-right: 10px !important;
  border-top-right-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
  z-index: 2;
}

.address-search-button:hover {
  background-color: #2176d2 !important;
}

</style>