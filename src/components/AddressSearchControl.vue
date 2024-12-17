<script setup>

import { useMainStore } from '../stores/MainStore.js';
// import { useMapStore } from '../stores/MapStore.js';
// import { useGeocodeStore } from '../stores/GeocodeStore.js';
// import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch } from 'vue';

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

const MainStore = useMainStore();
// const MapStore = useMapStore();

const router = useRouter();
const route = useRoute();

const submittedCheckboxValue = ref(null);

defineProps({
  // searchPlaceholder: {
  //   type: String,
  //   default: 'Search by address',
  // },
  inputId: {
    type: String,
    default: 'address-search-input',
  },
});

const clearSearch = () => {
  if (import.meta.env.VITE_DEBUG == 'true') console.log('clearSearch is running');
  MainStore.searchValue = '';
}

const searchPlaceholder = computed(() => {
  const searchTypes = $config.searchBar.searchTypes;
  const searchTypesLength = searchTypes.length;
  console.log('searchTypes:', searchTypes, 'searchTypes.length:', searchTypes.length);
  let value = 'Search by '
  for (let i=0; i<searchTypes.length; i++) {
    console.log('i:', i, 'searchTypes[i]:', searchTypes[i]);
    value += searchTypes[i];
    if (searchTypes.length > 2 && i == searchTypesLength - 2) {
      value += ', or ';
    } else if (i == searchTypesLength - 1) {
      break
    } else if (searchTypes.length > 2) {
      value += ', ';
    } else {
      value += ' or ';
    }
  }
  return value;
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const holderWidth = computed(() => {
  if (isMobile.value) {
    return '100%';
  } else {
    return '70%';
  }
});

const yPosition = computed(() => {
  return '10px';
});

const refineList = computed(() => {
  return MainStore.refineList;
});

const checkboxText = computed(() => {
  let text = {};
  let refList = refineList.value;
  if (Array.isArray(refList)) {
    for (let ref of refList) text[ref.textLabel] = ref.textLabel;
  } else {
    for (let key of Object.keys(refList)) {
      for (let key2 of Object.keys(refList[key])) {
        if (key2 === 'radio' || key2 === 'checkbox') {
          for (let key3 of Object.keys(refList[key][key2])) {
            text[t(key+'.'+key3).toLowerCase()] = refList[key][key2][key3].unique_key;
          }
        }
      }
    }
  }
  return text;
});

const handleSubmit = (val) => {
  if (import.meta.env.VITE_DEBUG) console.log('handleSubmit is running, val:', val);
  let query;
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
      // let match = checkboxText.value.filter((value) => value.toLowerCase() === val.toLowerCase());
      for (let key of Object.keys(checkboxText.value)) {
        console.log('key:', key);
        if (key.toLowerCase() == val.toLowerCase()) {
          if (import.meta.env.VITE_DEBUG) console.log('in handleSubmit, checking checkboxText - its there');
          // alert('There is already a checkbox or radio button for that search term');
          MainStore.selectedServices.push(checkboxText.value[key]);
          if (MainStore.shouldShowGreeting && !isMobile.value) {
            MainStore.refineOpen = true;
          }
          return;
        }
      }
      MainStore.lastPinboardSearchMethod = 'keyword';
      MainStore.selectedKeywords.push(val);
      let startKeyword;
      if (startQuery['keyword'] && startQuery['keyword'] != '') {
        startKeyword = startQuery['keyword'];
        val = startKeyword + ',' + val;
      }
      query = { ...startQuery, ...{ 'keyword': val }};
    }
  } else if (checkVals) {
    if (import.meta.env.VITE_DEBUG) console.log('its a zipcode');
    // MapStore.geolocation = null;
    if ($config.allowZipcodeSearch) {
      // MapStore.watchPositionOn = false;
      MainStore.lastPinboardSearchMethod = 'zipcode';
      query = { 'zipcode': val };
    } else if ($config.allowZipcodeInDataSearch) {
      // MapStore.watchPositionOn = false;
      MainStore.lastPinboardSearchMethod = 'zipcodeKeyword';
      let startKeyword;
      if (startQuery['keyword'] && startQuery['keyword'] != '') {
        startKeyword = startQuery['keyword'];
        val = startKeyword + ',' + val;
      }
      query = { ...startQuery, ...{ 'keyword': val }};
    }
  } else {
    if (import.meta.env.VITE_DEBUG) console.log('its an address');

    if (MainStore.lastPinboardSearchMethod == 'zipcodeKeyword') {
      if (import.meta.env.VITE_DEBUG) console.log('startQuery:', startQuery);
      delete startQuery['keyword'];
      MainStore.selectedKeywords = [];
    }
    // MapStore.watchPositionOn = false;
    query = { 'address': val };
    MainStore.lastPinboardSearchMethod = 'geocode';
  }
  delete startQuery['address'];
  delete startQuery['keyword'];
  delete startQuery['zipcode'];
  if (import.meta.env.VITE_DEBUG) console.log('handleSubmit is running, valAsFloat:', valAsFloat, 'startQuery:', startQuery, 'route.query:', route.query, 'query:', query, 'val:', val, 'val.substring(0, 1):', val.substring(0, 1));
  router.push({ query: { ...startQuery, ...query }});
  if (query) {
    const searchCategory = Object.keys(query)[0];
    const value = query[searchCategory];
    MainStore.currentSearch = value;
  }
  // $gtag.event(searchBarType + '-search', {
  //   'event_category': store.state.gtag.category,
  //   'event_label': value,
  // })
};

const holder = computed(() => {
  let value = '';
  if (isMobile.value) {
    value = 'address-search-holder';
  } else {
    value = 'holder holder-map';
  }
  return value;
});

</script>

<template>
  <div
    id="address-search-holder"
    :class="holder"
    :style="{ top: yPosition, width: holderWidth }"
  >
    <div class="field has-addons" :style="{ width: '100%' }">
      <div class="control has-icons-right" :style="{ width: '100%' }">
        <label
          :for="inputId"
          class="search-label"
        >{{ searchPlaceholder }}</label>
        <input
          :id="inputId"
          v-model="MainStore.searchValue"
          class="input address-input"
          type="text"
          :placeholder="searchPlaceholder"
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