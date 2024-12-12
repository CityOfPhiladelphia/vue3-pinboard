<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch, onBeforeMount, nextTick } from 'vue';

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;
// if (import.meta.env.VITE_DEBUG) console.log('$config:', $config);

import { format } from 'date-fns';
import { parseISO } from 'date-fns';
import { subWeeks } from 'date-fns';
import { addWeeks } from 'date-fns';

import Fuse from 'fuse.js'

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import { point, featureCollection } from '@turf/helpers';
import buffer from '@turf/buffer';
// import centerOfMass from '@turf/center-of-mass';
import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';
import { pointsWithinPolygon } from '@turf/points-within-polygon';
import distance from '@turf/distance';
import AlertBanner from '../components/AlertBanner.vue';
import PhilaModal from '../components/PhilaModal.vue';

import isMobileDevice from '../util/is-mobile-device';
import isMac from '../util/is-mac'; // this can probably be removed from App.vue, and only run in main.js

// COMPONENTS
import LocationsPanel from '../components/LocationsPanel.vue';
import MapPanel from '../components/MapPanel.vue';
import RefinePanel from '../components/RefinePanel.vue';
import AddressSearchControl from '../components/AddressSearchControl.vue';

const instance = getCurrentInstance();
const locale = computed(() => instance.appContext.config.globalProperties.$i18n.locale);
// if (import.meta.env.VITE_DEBUG) console.log('instance.appContext.config.globalProperties.$i18n:', instance.appContext.config.globalProperties.$i18n);

// STORES
const MapStore = useMapStore();
const MainStore = useMainStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();

// ROUTER
const route = useRoute();
const router = useRouter();

const publicPath = ref('/');
const isMapVisible = ref(false);
const isModalOpen = ref(false);
const isAlertModalOpen = ref(false);
const isLarge = ref(true);
const currentBuffer = ref(null);
const buttonText = ref('app.viewMap');

const myValue = ref('');
const brandingImage = ref(null);
const brandingLink = ref(null);

const searchString = ref(null);
const refineEnabled = ref(true);
const addressInputPlaceholder = ref(null);
const submittedCheckboxValue = ref(null);
const showForceHolidayBanner = ref(false);
const showAutomaticHolidayBanner = ref(false);

console.log('watch test');

if ($config.app.logoLink && $config.app.logoLink == 'none') {
  brandingLink.value = {
    style: 'pointer-events: none',
  }
}

if ($config.refineEnabled === false) {
  refineEnabled.value = false;
}

// computed
const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
});

const refineList = computed(() => {
  return MainStore.refineList;
});

const checkboxText = computed(() => {
  let text = []
  let refineList = refineList.value;
  for (let key of Object.keys(refineList)) {
    for (let key2 of Object.keys(refineList[key])) {
      if (key2 === 'radio' || key2 === 'checkbox') {
        for (let key3 of Object.keys(refineList[key][key2])) {
          text.push(t([key][key3].toLowerCase()));
        }
      }
    }
  }
  return text;
});

const printCheckboxes = computed(() => {
  return MainStore.printCheckboxes;
});

const refineTitle = computed(() => {
  return $config.refine.title;
});

const alertResponse = computed(() => {
  return MainStore.alertResponse || null;
});

// const shouldShowHeaderAlert = computed(() => {
//   let value = false;
//   if ($config.alerts && $config.alerts.header) {
//     value = $config.alerts.header.enabled(store.state);
//   }
//   return value;
// });

const alertModalTitle = computed(() => {
  let value = '';
  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.title) {
    value = $config.alerts.modal.title;
  }
  return value;
});

const alertModalBody = computed(() => {
  let value = '';
  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.body) {
    value = $config.alerts.modal.body;
  }
  return value;
});

const i18nEnabled = computed(() => {
  if ($config.i18n && $config.i18n.enabled) {
    return true;
  } else {
    return false;
  }
});

const i18nSelectorHidden = computed(() => {
  if ($config.i18n && $config.i18n.selectorHidden) {
    return true;
  } else {
    return false;
  }
});

const selectedKeywords = computed(() => {
  return MainStore.selectedKeywords;
});

const selectedServices = computed(() => {
  return MainStore.selectedServices;
});

const dataStatus = computed(() => {
  let value;
  if (DataStore.sources[$config.app.type]) {
    if (DataStore.sources[$config.app.type].status === 200) {
      value = 'success';
    } else if (DataStore.sources[$config.app.type].status === 404) {
      value = 'error';
    } else {
      value = null;
    }
  }
  return value;
});

const database = computed(() => {
  let value = {}
  if (DataStore.sources[DataStore.appType]) {
    // if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);
    value = DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].features;
  }
  return value;
});

// const shouldLoadCyclomediaWidget = computed(() => {
//   return $config.cyclomedia && $config.cyclomedia.enabled && !isMobile.value;
// });

// const cyclomediaActive = computed(() => {
//   return store.state.cyclomedia.active;
// });

// const cycloLatlng = computed(() => {
//   if (store.state.cyclomedia.orientation.xyz !== null) {
//     const xyz = store.state.cyclomedia.orientation.xyz;
//     return [ xyz[1], xyz[0] ];
//   }
//   const center = $config.map.center;
//   return center;
// });

// const cycloRotationAngle = computed(() => {
//   return store.state.cyclomedia.orientation.yaw * (180/3.14159265359);
// });

// const cycloHFov = computed(() => {
//   return store.state.cyclomedia.orientation.hFov;
// });

const selectedResource = computed(() => {
  return DataStore.selectedResource;
});

const layoutDescription = computed(() => {
  let value;
  if (isMobile.value && !refineEnabled.value) {
    value = 'mobileNoRefine';
  } else if (isMobile.value && refineEnabled.value && refineOpen.value) {
    value = 'mobileRefineOpen';
  } else if (isMobile.value && refineEnabled.value && !refineOpen.value) {
    value = 'mobileRefineClosed';
  } else if (!refineEnabled.value) {
    value = 'nonMobileNoRefine';
  } else {
    value = 'nonMobileRefine';
  }
  return value;
});

const locationsPanelVisible = computed(() => {
  return !isMobile.value || layoutDescription.value !== 'mobileRefineOpen' && !isMapVisible.value;
});

const mapPanelVisible = computed(() => {
  return !isMobile.value || layoutDescription.value !== 'mobileRefineOpen' && isMapVisible.value;
});

const toggleButtonsVisible = computed(() => {
  return isMobile.value && layoutDescription.value !== 'mobileRefineOpen' && !MainStore.shouldShowGreeting;
});

const refineOpen = computed(() => {
  return MainStore.refineOpen;
});

const lastPinboardSearchMethod = computed(() => {
  return MainStore.lastPinboardSearchMethod;
});

const searchDistance = computed(() => {
  return MapStore.searchDistance;
});

const holidays = computed(() => {
  return DataStore.holidays;
});

const holiday = computed(() => {
  return MainStore.holiday;
});

const futureHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.coming_soon) {
    return true;
  } 
  return false;
});

const currentHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.current) {
    return true;
  } 
  return false;
});

const justPassedHolidayClosure = computed(() => {
  let holiday = MainStore.holiday;
  if (holiday.just_passed) {
    return true;
  } 
  return false;
});

const closureMessage = computed(() => {
  let holiday = MainStore.holiday;
  let message;
  if (currentHolidayClosure.value) {
    message = t('holidayClosure') + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
  } else if (futureHolidayClosure.value) {
    message = t('futureHolidayClosure') + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else {
    message = null;
  }
  return message;
});

const closureMessageAllSites = computed(() => {
  let holiday = MainStore.holiday;
  let message;
  if ($config.holidays && $config.holidays.forceBannerMessage) {
    message = t($config.holidays.forceBannerMessage);
  } else if (currentHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('holidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
  } else if (futureHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('futureHolidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else if (justPassedHolidayClosure.value) {
    message = t(holiday.holiday_label) + ' - ' + t('holidayClosureAllSites');// + holiday.holiday_label + ' ' + format(parseISO(holiday.start_date), 'MM/dd/yyyy');
    // message = t('futureHolidayClosure') + transforms.toLocaleDateString.transform(item.attributes.close_holiday_start);
  } else {
    message = null;
  }
  return message;
});

  // watch
watch(
  () => holidays,
  async nextHolidays => {
    if (import.meta.env.VITE_DEBUG) console.log('watch holidays, nextHolidays:', nextHolidays);
    let currentYear = format(new Date(), 'yyyy');
    let currentMonth = format(new Date(), 'MM');
    let currentDay = format(new Date(), 'dd');
    let dateStart = new Date(currentYear, currentMonth-1, currentDay);
    // let dateStart = new Date(2023, 0, 2);
    // if (import.meta.env.VITE_DEBUG) console.log('currentYear:', currentYear, 'currentMonth:', currentMonth, 'currentDay:', currentDay, 'dateStart:', dateStart, 'dateStartUnix:', parseInt(format(dateStart, 'T')));
    let currentUnixDate = parseInt(format(dateStart, 'T'));

    let holi = {
      holiday_label: '',
      start_date: '',
      coming_soon: false,
      current: false,
      just_passed: false,
    };

    for (let holiday of nextHolidays.holidays) {
      // if (import.meta.env.VITE_DEBUG) console.log('holiday.start_date:', holiday.start_date, parseISO(format(holiday.start_date, 'T')));
      // if (import.meta.env.VITE_DEBUG) console.log('currentUnixDate:', currentUnixDate, 'holiday.start_date:', holiday.start_date, parseInt(format(parseISO(holiday.start_date), 'T')));

      let oneWeekAhead = parseInt(format(subWeeks(parseISO(holiday.start_date), 1), 'T'));
      let actualHoliday = parseInt(format(parseISO(holiday.start_date), 'T'));
      let oneWeekBehind = parseInt(format(addWeeks(parseISO(holiday.start_date), 1), 'T'));

      if (currentUnixDate >= oneWeekAhead && currentUnixDate < actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.coming_soon = true;
        holi.start_date = holiday.start_date;
      } else if (currentUnixDate == actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.current = true;
        holi.start_date = holiday.start_date;
      } else if (currentUnixDate <= oneWeekBehind && currentUnixDate > actualHoliday) {
        holi.holiday_label = holiday.holiday_label;
        holi.just_passed = true;
        // holi.start_date = holiday.start_date;
      }

      // if (import.meta.env.VITE_DEBUG) console.log('holiday.start_date:', holiday.start_date, format(holiday.start_date, 'T'));
    }
    // if (import.meta.env.VITE_DEBUG) console.log('watch holidays, holi.holiday_label:', holi.holiday_label, 'holi.coming_soon:', holi.coming_soon, 'holi.current:', holi.current);
    MainStore.holiday = holi;
  }
);

watch(
  () => database,
  async nextDatabase => {
    DataStore.databaseWithoutHiddenItems = nextDatabase;
  }
);

watch(
  () => i18nLocale,
  async nexti18nLocale => {
    // if (import.meta.env.VITE_DEBUG) console.log('watch i18nLocale, nexti18nLocale:', nexti18nLocale);
    let startQuery = { ...route.query };

    delete startQuery['lang'];
    if (import.meta.env.VITE_DEBUG) console.log('watch i18nLocale, startQuery:', startQuery);

    if (nexti18nLocale !== 'en-US') {
      let query = { 'lang': nexti18nLocale };
      router.push({ query: { ...startQuery, ...query }});
    } else {
      router.push({ query: { ...startQuery }});
    }

    // $gtag.event('language-click', {
    //   'event_category': store.state.gtag.category,
    //   'event_label': nexti18nLocale,
    // })
  }
);

// this has to do with using the compiled data source
// watch(
//   () => sourcesWatched,
//   async nextSourcesWatched => {
//     if (import.meta.env.VITE_DEBUG) console.log('watch sourcesWatched, nextSourcesWatched:', nextSourcesWatched);
//     let allSourceValues = [];
//     for (let value of Object.keys(nextSourcesWatched)) {
//       allSourceValues.push(nextSourcesWatched[value]);
//     }
//     if (!allSourceValues.includes(null)) {
//       setUpData(nextSourcesWatched);
//     }
//   }
// );

// watch(
//   () => geocodeStatus,
//   async nextGeocodeStatus => {
//     if (nextGeocodeStatus === 'success') {
//       runBuffer();
//     } else if (nextGeocodeStatus === null && lastPinboardSearchMethod.value != 'zipcode' && lastPinboardSearchMethod.value != 'zipcodeKeyword') {
//       currentBuffer.value = null;
//     } else if (nextGeocodeStatus === 'error') {
//       if (import.meta.env.VITE_DEBUG) console.log('Main.vue watch geocodeStatus, nextGeocodeStatus is an error:', nextGeocodeStatus);
//       geocodeFailed();
//     }
//   }
// );

watch(
  () => MapStore.bufferForAddressOrZipcode,
  async => {
    if (import.meta.env.VITE_DEBUG) console.log('watch MapStore.bufferForAddressOrZipcode is calling filterPoints');
    filterPoints();
  }
);

watch(
  () => selectedServices.value,
  async => {
    if (import.meta.env.VITE_DEBUG) console.log('watch selectedServices is firing');
    if (database.value) {
      if (import.meta.env.VITE_DEBUG) console.log('watch selectedServices is calling filterPoints');
      filterPoints();
    }
  }
);

watch(
  () => selectedKeywords,
  async => {
    if (database.value) {
      filterPoints();
    }
  }
);

watch(
  () => dataStatus.value,
  async nextDataStatus => {
    console.log('watch dataStatus, nextDataStatus:', nextDataStatus);
    if (nextDataStatus === 'success') {
      filterPoints();
    }
  }
);

const setHeights = () => {
  // if (import.meta.env.VITE_DEBUG) console.log('setHeights is running');
  let header = document.querySelector("#app-header");
  let headerOffsetHeight = header.offsetHeight;
  // if (import.meta.env.VITE_DEBUG) console.log('header:', header, 'header.offsetHeight:', header.offsetHeight);
  let addressSearchHolder = document.querySelector("#address-search-holder");
  let addressSearchHolderOffsetHeight = addressSearchHolder.offsetHeight;
  const refinePanel = document.querySelector('#refine-panel-component');
  let refinePanelOffsetHeight = refinePanel.offsetHeight;
  const mainRow = document.querySelector('#main-row');
  if (isMobile.value && MainStore.shouldShowGreeting) {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+addressSearchHolderOffsetHeight}px)`);
  } else if (isMobile.value) {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else {
    mainRow.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+46}px)`);
  }
  const map = document.querySelector('#map');
  if (isMobile.value) {
    map.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+addressSearchHolderOffsetHeight+46}px)`);
  } else {
    map.style.setProperty('height', `calc(100vh - ${refinePanelOffsetHeight+headerOffsetHeight+46}px)`);
  }
}

watch(
  () => refineOpen.value,
  async() => {
    await nextTick();
    setHeights();
  }
);

watch(
  () => MainStore.shouldShowGreeting,
  async() => {
    if (isMobile.value) {
      await nextTick();
      setHeights();
    }
  }
)

onMounted(async() => {
  let body = document.body;
  body.classList.remove('print-view');
  body.classList.add('main-view');

  await nextTick();
  setHeights();

  $config.searchBar.searchTypes.forEach(item => {
    if (route.query[item]) {
      searchString.value = route.query[item];
    }
  });

  if (route.query.address) {
    MainStore.lastPinboardSearchMethod = 'geocode';
  } else if (route.query.zipcode) {
    MainStore.lastPinboardSearchMethod = 'zipcode';
  }

  if (route.query.resource) {
    if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted, route.query.resource:', route.query.resource);
    let selectedResource = [ route.query.resource ];
    DataStore.selectedResource = selectedResource;
  }
  
  if (route.query.lang) {
    // if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted language:', route.query.lang);
    i18nLocale.value = route.query.lang;
  }

  if ($config.searchBar) {
    let routeQuery = Object.keys(route.query);
    // if (import.meta.env.VITE_DEBUG) console.log('App.vue mounted in searchTypes section, route:', route, 'routeQuery:', routeQuery, 'Object.keys(route.query)[0]', Object.keys(route.query)[0]);
    let value;
    for (let query of routeQuery) {
      if (query === 'address' || query === 'keyword') {
        value = route.query[query];
      }
    }
    MainStore.currentSearch = value

    addressInputPlaceholder.value = $config.searchBar.placeholder;
  }

  // if ($config.appLink) {
  //   appLink.value = $config.appLink;
  // } else {
  //   appLink.value = '.';
  // }

  if (!i18nEnabled.value) {
    buttonText.value = isMapVisible.value ? 'List' : 'Map';
  } else {
    buttonText.value = isMapVisible.value ? 'app.list' : 'app.map';
  }

  if ($config.alerts && $config.alerts.modal && $config.alerts.modal.enabled) {
    isAlertModalOpen.value = true;
  }

  // if ($config.gtag && $config.gtag.category) {
  //   store.commit('setGtagCategory', $config.gtag.category);
  // }

  if ($config.app.trustedSite && $config.app.trustedSite === 'hidden') {
    let trusted = document.getElementById('trusted-site');
    if (import.meta.env.VITE_DEBUG) console.log('trusted:', trusted);
    trusted.classList.add("trusted-site-hidden");
  }

  if ($config.app.skipGreeting) {
    MainStore.shouldShowGreeting = false;
  }

  if ($config.holidays && $config.holidays.automaticBanner) {
    showAutomaticHolidayBanner.value = true;
  }

  if ($config.holidays && $config.holidays.forceBanner) {
    showForceHolidayBanner.value = true;
  }

  filterPoints();

});

// METHODS
const closeHolidayBanner = () => {
  showAutomaticHolidayBanner.value = false;
  showForceHolidayBanner.value = false;
  // let holiday = {
  //   holiday_label: '',
  //   coming_soon: false,
  //   current: false,
  //   start_date: '',
  // };
  // store.commit('setHoliday', holiday);
};

const geolocateControlFire = async(e) => {
  // if (import.meta.env.VITE_DEBUG) console.log('Pinboard Main.vue geolocateControlFire is running, e.coords.latitude:', e.coords.latitude, 'e.coords.longitude:', e.coords.longitude);
  if (e.lng != null) {

    clearGeocodeAndZipcode();

    await nextTick()
    MainStore.lastPinboardSearchMethod = 'geolocate';
    runBuffer({ coordinates: [ e.lng, e.lat ] });
    if (MainStore.shouldShowGreeting) {
      MainStore.shouldShowGreeting = false;
    }
    
  } else {
    // if (import.meta.env.VITE_DEBUG) console.log('Main.vue geolocateControlFire is running, remove currentBuffer.value');
    MapStore.bufferShape = null;
    currentBuffer.value = null;
  }
};

const clearGeocodeAndZipcode = async() => {
  let startQuery = { ...route.query };
  delete startQuery['address'];
  delete startQuery['zipcode'];
  if (lastPinboardSearchMethod.value == 'zipcodeKeyword') {
    delete startQuery['keyword'];
    MainStore.selectedKeywords = [];
  }
  router.push({ query: { ...startQuery }});
  // MainStore.selectedZipcode = null;
  // MapStore.zipcodeCenter = [];
  // MainStore.currentSearch = null;
};

const watchedSubmittedCheckboxValue = () => {
  if (import.meta.env.VITE_DEBUG) console.log('Main.vue watchedSubmittedCheckboxValue is running');
  submittedCheckboxValue.value = null;
};

const clearBadAddress = () => {
  if (import.meta.env.VITE_DEBUG) console.log('clearBadAddress is running');
  let startQuery = { ...route.query };
  delete startQuery['address'];
  router.push({ query: startQuery });
  searchString.value = '';
  // $controller.resetGeocode();
  MainStore.currentSearch = null;
};

// const geocodeFailed = () => {
//   if (import.meta.env.VITE_DEBUG) console.log('geocodeFailed is running');
//   MapStore.bufferShape = null;
// };

// const compareArrays = (arr1, arr2) => {
//   const finalArray = [];
//   arr1.forEach((e1) => arr2.forEach((e2) =>
//     {
//       if (e1 === e2) {
//         finalArray.push(e1);
//       }
//     }
//   ));
//   return finalArray;
// };


const clearSearchTriggered = () => {
  let startQuery = { ...route.query };
  // if (import.meta.env.VITE_DEBUG) console.log('in clearSearchTriggered1, route.query:', route.query, 'startQuery:', startQuery);
  delete startQuery['address'];
  delete startQuery['zipcode'];
  delete startQuery['keyword'];
  // if (import.meta.env.VITE_DEBUG) console.log('in clearSearchTriggered2, route.query:', route.query, 'startQuery:', startQuery);
  router.push({ query: startQuery });
  searchString.value = '';
  MainStore.selectedKeywords = [];
  MainStore.selectedZipcode = null;
  MapStore.bufferShape = null;
  MainStore.currentSearch = null;
};

const getProjection = (item) => {
  let val;
  if ($config && $config.projection) {
    let valOrGetter = $config.projection;
    const valOrGetterType = typeof valOrGetter;

    if (valOrGetterType === 'function') {
      const getter = valOrGetter;
      if (item) {
        val = getter(item);
      }
    } else {
      val = valOrGetter;
    }
  }
  return val;
};

const checkServices = (index, row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running, index:', index, 'row:', row);
  const selectedServices = MainStore.selectedServices;
  if (!selectedServices.length) {
    return true;
  }
  if ($config.refine && $config.refine.type && ['multipleFields', 'multipleFieldGroups', 'multipleDependentFieldGroups'].includes($config.refine.type)) {
    let booleanConditions = [];

    if (selectedServices.length === 0) {
      booleanConditions.push(true);
    } else {

      // if refine.type = multipleFields
      if ($config.refine.type === 'multipleFields') {
        for (let field in $config.refine.multipleFields) {
          if (selectedServices.includes(field)) {

            let getter = $config.refine.multipleFields[field];
            let val = getter(row);
            booleanConditions.push(val);
          }
        }
      } else if ($config.refine.type === 'multipleFieldGroups') {
        // if refine.type = multipleFieldGroups
        let selectedGroups = [];
        for (let value of selectedServices) {
          // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices value:', value);
          let valueGroup;
          if (value) {
            valueGroup = value.split('_', 1)[0];
          }
          if (valueGroup && !selectedGroups.includes(valueGroup)) {
            selectedGroups.push(valueGroup)
          }
        }
        // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running on multipleFieldGroups, selectedServices:', selectedServices, 'selectedGroups:', selectedGroups);
        let groupValues = [];
        for (let group of selectedGroups) {
          let groupBooleanConditions = [];
          for (let service of selectedServices) {
            // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices loop, service:', service, 'group:', group);
            if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['radio']) {
              // if (import.meta.env.VITE_DEBUG) console.log('group:', group, '$config.refine.multipleFieldGroups[group]["radio"]:', $config.refine.multipleFieldGroups[group]['radio']);
              let dependentGroups = $config.refine.multipleFieldGroups[group]['radio'][service.split('_')[1]]['dependentGroups'] || [];
              // if (import.meta.env.VITE_DEBUG) console.log('dependentGroup:', dependentGroup, 'service.split("_", 1)[0]:', service.split('_', 1)[0], 'service.split("_")[1]:', service.split('_')[1], 'group', group, '$config.refine.multipleFieldsGroups[group]', $config.refine.multipleFieldsGroups[group], '$config.refine.multipleFieldsGroups[group][service.split("_")[1]]:', $config.refine.multipleFieldsGroups[group][service.split('_')[1]]);
              let getter = $config.refine.multipleFieldGroups[group]['radio'][service.split('_')[1]]['value'];
              let dependentServices = [];
              for (let service of selectedServices) {
                if (dependentGroups.length && dependentGroups.includes(service.split('_')[0])) {
                  dependentServices.push(service.split('_')[1]);
                }
              }
              // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'dependentGroups:', dependentGroups, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices);
              let val = getter(row, dependentServices);
              groupBooleanConditions.push(val);
            }
            if (group !== 'keyword' && service.split('_', 1)[0] === group && $config.refine.multipleFieldGroups[group]['checkbox']) {
              // if (import.meta.env.VITE_DEBUG) console.log('group:', group, '$config.refine.multipleFieldGroups[group]["dependent"]:', $config.refine.multipleFieldGroups[group]['dependent']);
              let dependentGroups = $config.refine.multipleFieldGroups[group]['checkbox'][service.split('_')[1]]['dependentGroups'] || [];
              // if (import.meta.env.VITE_DEBUG) console.log('dependentGroup:', dependentGroup, 'service.split("_", 1)[0]:', service.split('_', 1)[0], 'service.split("_")[1]:', service.split('_')[1], 'group', group, '$config.refine.multipleFieldsGroups[group]', $config.refine.multipleFieldsGroups[group], '$config.refine.multipleFieldsGroups[group][service.split("_")[1]]:', $config.refine.multipleFieldsGroups[group][service.split('_')[1]]);
              let getter = $config.refine.multipleFieldGroups[group]['checkbox'][service.split('_')[1]]['value'];
              let dependentServices = [];
              for (let service of selectedServices) {
                if (dependentGroups.length && dependentGroups.includes(service.split('_')[0])) {
                  dependentServices.push(service.split('_')[1]);
                }
              }
              // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'dependentGroups:', dependentGroups, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices);
              let val = getter(row, dependentServices);
              groupBooleanConditions.push(val);
            }
          }
          // if (import.meta.env.VITE_DEBUG) console.log('$config.refine.andOr:', $config.refine.andOr, 'group:', group, 'groupBooleanConditions:', groupBooleanConditions);
          if ($config.refine.andOr) {
            if ($config.refine.andOr == 'and') {
              if (groupBooleanConditions.includes(false)) {
                booleanConditions.push(false);
              } else {
                booleanConditions.push(true);
              }
            } else if ($config.refine.andOr == 'or') {
              if (groupBooleanConditions.includes(true)) {
                booleanConditions.push(true);
              } else {
                booleanConditions.push(false);
              }
            }
          } else {
            if (groupBooleanConditions.includes(true)) {
              booleanConditions.push(true);
            } else if (groupBooleanConditions.length) {
              booleanConditions.push(false);
            }
          }
        }
      } else {
        // if refine.type = multipleDependentFieldGroups
        let selectedGroups = [];
        for (let value of selectedServices) {
          let valueGroup = value.split('_', 1)[0]
          if (!selectedGroups.includes(valueGroup)) {
            selectedGroups.push(valueGroup)
          }
        }
        // if (import.meta.env.VITE_DEBUG) console.log('Main.vue checkServices is running on multipleDependentFieldGroups, selectedServices:', selectedServices, 'selectedGroups:', selectedGroups);
        let groupValues = [];
        for (let group of selectedGroups) {
          let groupBooleanConditions = [];
          for (let service of selectedServices) {
            if (service.split('_', 1)[0] === group) {
              let ind = $config.refine.multipleDependentFieldGroups[group]['independent'];
              let serviceEnd = service.split('_')[1];
              // if (import.meta.env.VITE_DEBUG) console.log('ind:', ind, 'serviceEnd:', serviceEnd, 'selectedServices:', selectedServices);
              let getter;
              if ($config.refine.multipleDependentFieldGroups[group]['dependent'][service.split('_')[1]]) {
                getter = $config.refine.multipleDependentFieldGroups[group]['dependent'][service.split('_')[1]]['value'];
                let dependentServices = [];
                if (ind) {
                  for (let service of selectedServices) {
                    if (Object.keys(ind).includes(service.split('_')[1])) {
                      dependentServices.push(service.split('_')[1]);
                    }
                  }
                }
                let val = getter(row, dependentServices);
                // if (import.meta.env.VITE_DEBUG) console.log('getter:', getter, 'selectedServices:', selectedServices, 'dependentServices:', dependentServices, 'val:', val);
                groupBooleanConditions.push(val);
              }
            }
          }
          // if (import.meta.env.VITE_DEBUG) console.log('groupBooleanConditions:', groupBooleanConditions);
          if (groupBooleanConditions.includes(true) || !groupBooleanConditions.length) {
            booleanConditions.push(true);
          } else {
            booleanConditions.push(false);
          }
        }
      }
    }
    // if (import.meta.env.VITE_DEBUG) console.log('booleanConditions:', booleanConditions);
    if (!booleanConditions.includes(false)) {
      return true
    }

  // if refine.type = categoryField_value
  } else if ($config.refine && $config.refine.type === 'categoryField_value') {
    if (selectedServices.length === 0) {
      return true;
    } else {
      let value = $config.refine.value(row);
      return selectedServices.includes(value);
    }

  } else {
    // the original default version, or refine.type = 'categoryField_array'
    // if (import.meta.env.VITE_DEBUG) console.log('in else, row:', row, 'row.services_offered:', row.services_offered);
    let servicesSplit;
    if ($config.refine) {
      servicesSplit = $config.refine.value(row);
    } else if (row.services_offered) {
      servicesSplit = row.services_offered;
    }

    // if (import.meta.env.VITE_DEBUG) console.log('1 servicesSplit:', servicesSplit, 'typeof servicesSplit:', typeof servicesSplit);
    if (typeof servicesSplit === 'string') {
      servicesSplit = servicesSplit.split(',');
    }
    // if (import.meta.env.VITE_DEBUG) console.log('2 servicesSplit:', servicesSplit, 'typeof servicesSplit:', typeof servicesSplit);

    if (selectedServices.length === 0) {
      return true;
    } else {
      let servicesFiltered = [];
      if (servicesSplit) {
        servicesFiltered = servicesSplit.filter(f => selectedServices.includes(f));
      }
      // if (import.meta.env.VITE_DEBUG) console.log('servicesFiltered:', servicesFiltered, 'selectedServices:', selectedServices);
      return servicesFiltered.length == selectedServices.length;
    }
    // if (import.meta.env.VITE_DEBUG) console.log('services else is running, row:', row, 'selectedServices:', selectedServices, 'booleanServices:', booleanServices);
  }
};

const checkBuffer = (row) => {
  const buffer = MapStore.bufferForAddressOrZipcode;
  if (!buffer) {
    // if (import.meta.env.VITE_DEBUG) console.log('!MapStore.bufferForAddressOrZipcode');
    return true;
  } else if (row.geometry) {
    let comparePoint;
    if (GeocodeStore.aisData.features) {
      comparePoint = GeocodeStore.aisData.features[0].geometry;
    } else if (MapStore.zipcodeCenter) {
      comparePoint = MapStore.zipcodeCenter;
    }
    row.distance = distance(comparePoint, row.geometry, { units: 'miles' });
    return true;
  }
};

const checkKeywords = (row) => {
  // if (import.meta.env.VITE_DEBUG) console.log('checkKeywords, row:', row, '$config.tags', $config.tags, 'selectedKeywords.value:', selectedKeywords.value, 'selectedKeywords.value.length:', selectedKeywords.value.length);
  let booleanKeywords;
  if (selectedKeywords.value.length > 0) {
    booleanKeywords = false;
    let description = [];
    if (Array.isArray(row.tags)) {
      description = row.tags;
    } else if (row.tags) {
      description = row.tags.split(', ');
    } else if ($config.tags && $config.tags.type == 'tagLocation') {
      if (Array.isArray($config.tags.location(row))) {
        description = $config.tags.location(row);
      } else if ($config.tags.location(row)) {
        description = $config.tags.location(row).split(', ');
      }
    } else if ($config.tags && $config.tags.type == 'fieldValues') {
      for (let tag of $config.tags.tags) {
        // if (import.meta.env.VITE_DEBUG) console.log('tag:', tag, 'tag.field:', tag.field, 'row.attributes[tag.field]:', row.attributes[tag.field]);
        if (tag.type == 'boolean' && row.attributes[tag.field] == 'Yes') {
          description.push(tag.value);
        } else if (tag.type == 'value' && row.attributes[tag.field] !== null && row.attributes[tag.field] != ' ') {
          // if (import.meta.env.VITE_DEBUG) console.log('in else if, row.attributes[tag.field]:', row.attributes[tag.field]);
          // description.push(row.attributes[tag.field].charAt(0) + row.attributes[tag.field].substring(1).toLowerCase());
          let value = row.attributes[tag.field].toLowerCase();
          // if (import.meta.env.VITE_DEBUG) console.log('value.split(","):', value.split(','));
          description = description.concat(value.split(','));
        }
      }
    }
    // if (import.meta.env.VITE_DEBUG) console.log('still going, selectedKeywords.value[0]:', selectedKeywords.value[0], 'row.tags:', row.tags, 'description:', description);

    let threshold = 0.2;
    if ($config.searchBar.fuseThreshold) {
      threshold = $config.searchBar.fuseThreshold;
    };

    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      // shouldSort: true,
      // includeMatches: false,
      // findAllMatches: true,
      minMatchCharLength: 3,
      location: 0,
      threshold: threshold,
      // distance: 100,
      // useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,

      // keys: [
      //   "title",
      //   "author.firstName"
      // ]
    };

    const fuse = new Fuse(description, options);
    let results = {};
    for (let keyword of selectedKeywords.value) {
      // if (import.meta.env.VITE_DEBUG) console.log('in selectedKeywords loop, keyword.toString():', keyword.toString(), 'description:', description);//'description[0].split(","):', description[0].split(','));
      if ($config.skipFuse) {
        let keywordString = '' + keyword;
        // if (import.meta.env.VITE_DEBUG) console.log('skipFuse, keywordString:', keywordString);
        if (description.includes(keywordString)) {
          // if (import.meta.env.VITE_DEBUG) console.log('19148 is in description');
          results[keyword] = ['true'];
        }
      } else {
        // if (import.meta.env.VITE_DEBUG) console.log('fuse.search(keyword):', fuse.search(keyword), 'description:', description);
        results[keyword] = fuse.search(keyword);
      }
    }
    // const result = fuse.search(selectedKeywords.value[0]);
    // if (import.meta.env.VITE_DEBUG) console.log('App.vue filterPoints booleanKeywords section, result:', result, 'results:', results);
    // if (result.length > 0) {
    //   booleanKeywords = true;
    // }
    for (let keyword of Object.keys(results)) {
      if (results[keyword].length > 0) {
        booleanKeywords = true;
      }
    }
  } else {
    // console.log('no selectedKeywords');
    booleanKeywords = true;
  }
  return booleanKeywords;
}

const filterPoints = () => {
  if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, database.value:', database.value);
  const filteredRows = [];

  if (!database.value) {
    return;
  }
  let startQuery = { ...route.query };
  if (!Object.keys(startQuery)) {
    if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, no startQuery');
    DataStore.currentData = database.value;
    return;
  }

  const buffer = MapStore.bufferForAddressOrZipcode;
  let pointsAfterBuffer = database.value;
  if (buffer) {
    if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is running, buffer:', buffer);
    pointsAfterBuffer = pointsWithinPolygon(featureCollection(database.value), buffer).features;
  }
  console.log('pointsAfterBuffer', pointsAfterBuffer);

  for (const [index, row] of [ ...pointsAfterBuffer.entries() ]) {
    // if (import.meta.env.VITE_DEBUG) console.log('row:', row, 'index:', index);
    // if (import.meta.env.VITE_DEBUG) console.log('row.services_offered:', row.services_offered);

    let booleanBuffer = true;
    let booleanKeywords = true;

    let booleanServices = checkServices(index, row);
    if (booleanServices) {
      booleanBuffer = checkBuffer(row);
    }
    if (booleanServices && booleanBuffer) {
      booleanKeywords = checkKeywords(row);
    }

    // if (import.meta.env.VITE_DEBUG) console.log('booleanServices:', booleanServices, 'booleanBuffer:', booleanBuffer, 'booleanKeywords:', booleanKeywords);

    if (booleanServices && booleanBuffer && booleanKeywords) {
      // if (import.meta.env.VITE_DEBUG) console.log('Main.vue filterPoints is pushing a row, row:', row);
      filteredRows.push(row);
    }
  }
  // if (import.meta.env.VITE_DEBUG) console.log('filteredRows:', filteredRows);

  DataStore.currentData = filteredRows;
};

// todo move to Map.vue
const toggleToMap = () => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleToMap is running');
  isMapVisible.value = true;
  // if (import.meta.env.VITE_DEBUG) console.log('setTimeout function is running');
  // let themap = store.map;
  // setTimeout(function() {
  //   if (import.meta.env.VITE_DEBUG) console.log('mapbox running map resize now');
  //   themap.resize();
  //   if (import.meta.env.VITE_DEBUG) console.log('mapbox ran map resize');
  // }, 250);
};

const toggleToList = () => {
  if (import.meta.env.VITE_DEBUG) console.log('toggleToList is running');
  isMapVisible.value = false;
};

const toggleModal = () => {
  isModalOpen.value = !isModalOpen.value;
  toggleBodyClass('no-scroll');
};

const showModal = () => {
  isModalOpen.value = true;
  toggleBodyClass('no-scroll');
};

const closeModal = () => {
  isModalOpen.value = false;
  isAlertModalOpen.value = false;
  // toggleBodyClass('no-scroll');
};

const toggleBodyClass = (className) => {
  console.log('toggleBodyClass is running, className:', className);
  const el = document.body;
  return isOpen ? el.classList.add(className) : el.classList.remove(className);
};

</script>

<template>
  <PhilaModal
    v-show="isModalOpen"
    @close="closeModal"
  >
    <div slot="body">
      <p>The resource finder helps you locate services related to a particular topic. You can browse the list of providers, search by keyword or address, and narrow your results by category.</p>

      <p>The providers are listed alphabetically. To learn about what they offer and where they are, select their name. This will expand their listing and locate them on the map. You can also:
        <ul>
      <li><b>Search by location or keyword.</b> To find service providers near you, select “Address” in the dropdown and enter a street address. To search for a specific term, select “Keyword” in the dropdown and enter your term.</li>
      <li><b>Choose a category.</b> If you’re looking for a specific type of resource, select the appropriate topic under “Filter list by category.” You can pick multiple categories.</li>
        </ul></p>
      <p>If you’re interested in a particular service or resource, contact the provider to learn more and confirm that it’s still available.</p>

    </div>
  </PhilaModal>

  <div
    v-show="isAlertModalOpen"
    class="modalWrapper"
    @click="closeModal"
  >
    <modal
      type="none"
      :hide-close-button="true"
      :close="closeModal"
    >
      <template #title>
        {{ alertModalTitle }}
      </template>
      <slot>
        <div class="content">
          <div
            v-html="alertModalBody"
          ></div>
        </div>
      </slot>
      <template #actions-before>
        <button
          class="button is-secondary"
          @click="closeModal"
        >
          Close
        </button>
      </template>
    </modal>
  </div>

  <div
    v-if="showForceHolidayBanner || showAutomaticHolidayBanner && holiday.coming_soon || showAutomaticHolidayBanner && holiday.current"
    class="holiday-banner"
  >
    {{ closureMessageAllSites }}
    <button
      class="button is-primary is-small is-pulled-right holiday-banner-close-button"
      @click="closeHolidayBanner"
    >
      x
    </button>
  </div>

    <!-- <div
      v-show="isMobile && !$config.searchBar.hide"
      class="search-bar-container-class"
    >
      <phila-ui-address-input
        :over-map="false"
        :placeholder="addressInputPlaceholder"
        @clear-search="clearSearchTriggered"
        @handle-search-form-submit="handleSubmit"
      />
    </div> -->

    
  <div
    id="main-column"
    class="main-column invisible-scrollbar"
  >
    <address-search-control
      v-if="isMobile"
      :input-id="'address-search-input'"
    />

    <div>
      <refine-panel
        :refine-title="refineTitle"
        :submitted-checkbox-value="submittedCheckboxValue"
        @watched-submitted-checkbox-value="watchedSubmittedCheckboxValue"
        @geolocate-control-fire="geolocateControlFire"
      />
    </div>

    <div
      v-show="!isMobile || isMobile && !refineOpen"
      id="main-row"
      class="main-row"
    >
      <div
        v-show="locationsPanelVisible"
        class="locations-holder"
      >
        <locations-panel
          :is-map-visible="isMapVisible"
          @clear-bad-address="clearBadAddress"
          @clicked-view-map="toggleToMap"
        />
      </div>
      <div
        v-show="mapPanelVisible"
        id="map-panel-holder"
        class="map-panel-holder"
      >
        <map-panel
          @clear-search="clearSearchTriggered"
          @toggleMap="toggleToMap"
          @geolocate-control-fire="geolocateControlFire"
        />
      </div>
    </div>

  </div>
  <div
    v-show="toggleButtonsVisible"
  >
    <button
      class="capitalized toggle-button toggle-button-left"
      :class="isMapVisible ? 'toggle-button-inactive' : 'toggle-button-active'"
      @click="toggleToList"
    >
      <div class="text-div">
        <font-awesome-icon
          icon="fa-solid fa-rectangle-list"
          class="toggle-button-icon"
        />
        {{ $t('app.list') }}
      </div>
    </button>
    <button
      class="capitalized toggle-button toggle-button-right"
      :class="isMapVisible ? 'toggle-button-active' : 'toggle-button-inactive'"
      @click="toggleToMap"
    >
      <div class="text-div">
        <font-awesome-icon
          icon="fa-solid fa-map-marker-alt"
          class="toggle-button-icon"
        />
        {{ $t('app.map') }}
      </div>
    </button>
  </div>


</template>

<style lang="scss">

.text-div {
  height: 100%;
  width: 100%;
  padding: 10px;
}

.skip-to-main-content-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: .5em;
  background-color: #0f4d90;
  color: white;
  opacity: 0;
  text-decoration: underline;
}

.skip-to-main-content-link:focus {
  left: 0px;
  opacity: 1;
}

.skip-to-main-content-link:hover {
  color: white;
}

#app-header {
  .trusted-site-hidden {
    display: none;
  }
}

.capitalized {
  text-transform: uppercase;
}

.mobile-refine-panel-holder-open {
  flex-grow: 1;
  background: #f0f0f0;
}

.refine-panel-holder-open {
  background: #f0f0f0;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  border-color: #cfcfcf;
}

.refine-panel-holder {
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  border-color: #cfcfcf;
}

.toggle-button {
  padding: 0px;
  font-family: "Montserrat-Bold", "Montserrat Bold", "Montserrat", sans-serif;
  // font-family: "ArialMT", "Arial", sans-serif !important;
  font-weight: 700 !important;
  font-size: 18px;
  height: 46px;
  border-top-width: 1px;
  border-bottom-width: 0px;
  background-color: #f0f0f0;
  border-color: #cfcfcf !important;
  color: #0f4d90 !important;
  width: 50%;
}

.toggle-button-icon {
  color: inherit;
}

.toggle-button-active {
 background-color: #ffffff;
}

.toggle-button-inactive {
  background-color: #f0f0f0;
  cursor: pointer;
}

.toggle-button-inactive :hover {
  background-color: #0f4d90;
  color: #ffffff;
}

.toggle-button-left {
  border-left-width: 0px;
  border-right-width: 1px;
}

.toggle-button-right {
  border-left-width: 1px;
  border-right-width: 0px;
}

.no-scroll{
  overflow: hidden;
  height: 100vh;
}

@media print {

  .locations-panel-holder {
    overflow-y: visible;
  }

  .locations-panel {
    overflow-y: visible;
  }

  .no-scroll {
    overflow: visible;
  }

  .locations-and-map-panels-holder {
    overflow-y: visible;
  }
}

.holiday-banner {
  padding-left: 1rem;
  background-color: #fff7d0;
}

.holiday-banner-close-button {
  height: 28px !important;
}

.modalWrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

</style>
