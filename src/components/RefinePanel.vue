<script setup>

import $config from '@/config.js';
import appConfig from '@/app/main.js';
console.log('appConfig:', appConfig);
// import { library } from '@fortawesome/fontawesome-svg-core';
import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useI18n } from 'vue-i18n'
const { t } = useI18n()

// import Vue from 'vue';
// import { mapState } from 'vuex';
import Checkbox from './Checkbox.vue';
// import { Radio } from '@phila/phila-ui';

import IconToolTip from './IconToolTip.vue';

import { computed, onBeforeMount, onMounted, watch, ref, reactive, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();

// STORES
import { useMapStore } from '@/stores/MapStore.js';
const MapStore = useMapStore();
import { useMainStore } from '@/stores/MainStore.js'
const MainStore = useMainStore();
import { useGeocodeStore } from '@/stores/GeocodeStore.js'
const GeocodeStore = useGeocodeStore();
import { useDataStore } from '@/stores/DataStore.js'
const DataStore = useDataStore();

// ROUTER
import { useRouter, useRoute } from 'vue-router';
const route = useRoute();
const router = useRouter();

const props = defineProps({
  refineTitle: {
    type: String,
    default: 'FILTER',
  },
  submittedCheckboxValue: {
    type: String,
    default: null,
  },
});

const $emit = defineEmits(['geolocate-control-fire', 'watched-submitted-checkbox-value' ]);

const baseUrl = '/';
const selected = ref([]);
const selectedList = reactive({});


const searchDistance = computed(() => {
  let value = MapStore.searchDistance;
  let word;
  if (value == 1) {
    word = this.$i18n.messages[this.i18nLocale]['mile'];
  } else {
    word = this.$i18n.messages[this.i18nLocale]['miles'];
  }
  return value + ' ' + word;
});

const refineList = computed(() => {
  return MainStore.refineList;
});

const anyValueEntered = computed(() => {
  let value = false;
  if (zipcodeEntered.value != null || addressEntered.value != null || keywordsEntered.value.length != 0) {
    value = true;
  }
  return value;
});

const angleIconWeight = computed(() => {
  let value = 'fas';
  let regularExists = findIconDefinition({ prefix: 'far', iconName: 'angle-down' });
  // console.log('refinePanel.vue computed, library:', library, 'regularExists:', regularExists);
  if (regularExists) {
    value = 'far';
  }
  return value;
});

const timesIconWeight = computed(() => {
  let value = 'fas';
  let regularExists = findIconDefinition({ prefix: 'far', iconName: 'times' });
  if (regularExists) {
    value = 'far';
  }
  return value;
});

const dropdownRefine = computed(() => {
  let value;
  if (appConfig.dropdownRefine) {
    value = true;
  } else {
    value = false;
  }
  return value;
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice;
})

const NumRefineColumns = computed(() => {
  let value;
  if (isMobile.value) {
    value = 1;
  } else {
    value = 4;
  }
  return value;
});

const selectedListCompiled = computed(() => {
  // console.log('selectedListCompiled computed is running');
  let test = selectedList.value;
  let compiled = [];
  for (let value of Object.keys(test)) {
    // console.log('in selectedListCompiled computed, value:', value, value.split('_')[0]);
    if (value.split('_')[0] == 'radio') {
      // console.log('radio button clicked!');
      compiled.push(selectedList.value[value]);
    } else {
      for (let selected of selectedList.value[value]) {
        compiled.push(selected);
      }
    }
  }
  return compiled;
});

const refineListTranslated = computed(() => {
  let mainObject = {};
  let mainArray = [];
  if (refineType.value === 'categoryField_value') {
    for (let category of refineList.value) {
      mainArray.push({
        value: category.data,
        text: t(category.data),
      });
      // console.log('refineListTranslated computed, category:', category, 'mainArray:', mainArray);
    }
    return mainArray;
  } else if (refineType.value !== 'multipleFieldGroups' && refineType.value !== 'multipleDependentFieldGroups') {
    
    if (typeof refineList.value[0] === 'string') {
      for (let refineObject of refineList.value) {
        // console.log('refineObject:', refineObject, 'typeof refineObject:', typeof refineObject);
        mainObject[refineObject] = {textLabel: t(refineObject), value: refineObject};
      }
      return mainObject;
    } else {
      for (let refineObject of refineList.value) {
        let translatedObject = {}
        for (let category of Object.keys(refineObject)) {
          // console.log('in refineListTranslated, category:', category);
          if (category == 'textLabel') {
            translatedObject[category] = t(refineObject[category]);
          } else {
            translatedObject[category] = refineObject[category];
          }
        }
        mainArray.push(translatedObject);
      }
      return mainArray;
      // console.log('in refineListTranslated, refineObject:', refineObject, 'translatedObject:', translatedObject);
      // console.log('refineListTranslated computed, category:', category, 't(category):', t(category), 'mainArray:', mainArray);
    }
  } else if (refineType.value == 'multipleFieldGroups') {
    if (refineList.value) {
      for (let category of Object.keys(refineList.value)) {
        mainObject[category] = {};
        for (let dep of Object.keys(refineList.value[category])) {
          // console.log('dep:', dep);
          if (dep !== 'tooltip') {

            mainObject[category][dep] = [];
            for (let box of Object.keys(refineList.value[category][dep])) {

              let data = refineList.value[category][dep][box].unique_key;
              let textLabel = t(refineList.value[category][dep][box].box_label);
              let tooltip;
              if (refineList.value[category][dep][box].tooltip) {
                tooltip = {};
                tooltip.tip = t(refineList.value[category][dep][box].tooltip.tip);
                tooltip.multiline = refineList.value[category][dep][box].tooltip.multiline
                // console.log('tooltip:', tooltip, 'refineList.value[category][dep][box].tooltip.tip:', refineList.value[category][dep][box].tooltip.tip);
              }
              let keyPairs = {
                data: data,
                textLabel: textLabel,
                tooltip: tooltip,
              };
              mainObject[category][dep].push(keyPairs)
            }
          } else {
            mainObject[category][dep] = t(refineList.value[category][dep].tip);
          }
        }
      }
    }
    return mainObject;
  } else {
    // console.log('in refineListTranslated else');
    for (let category of Object.keys(refineList.value)) {
      // console.log('in refineListTranslated else, first loop');
      mainObject[category] = {};
      for (let dep of Object.keys(refineList.value[category])) {
        // console.log('in loop, dep', dep);
        mainObject[category][dep] = [];
        for (let box of Object.keys(refineList.value[category][dep])) {
          // console.log('in inner loop, box:', box, 'dep:', dep);
          let data = refineList.value[category][dep][box].unique_key;
          let textLabel = t(refineList.value[category][dep][box].box_label);
          let tooltip;
          if (refineList.value[category][dep][box].tooltip) {
            tooltip = t(refineList.value[category][dep][box].tooltip);
          }
          let keyPairs = {
            data: data,
            textLabel: textLabel,
            tooltip: tooltip,
          };
          mainObject[category][dep].push(keyPairs)
        }
      }
    }
    return mainObject;
  }
});

const retractable = computed(() => {
  let value = false;
  if (appConfig.retractableRefine) {
    value = true;
  }
  return value;
});

const refineTitleClass = computed(() => {
  let value;
  if (retractable.value) {
    value = 'retractable-refine-title';
  }
  return value;
});

const refinePanelClass = computed(() => {
  let value;
  if (isMobile.value) {
    if (refineOpen.value) {
      value = 'refine-panel refine-panel-open invisible-scrollbar';
    } else {
      value = 'refine-panel refine-panel-closed invisible-scrollbar';
    }
  } else if (retractable.value) {
    if (!refineOpen.value) {
      value = 'refine-panel refine-retractable-closed refine-panel-non-mobile-closed invisible-scrollbar';
    } else if (refineOpen.value) {
      value = 'refine-panel refine-retractable-open refine-panel-non-mobile invisible-scrollbar';
    }
  } else if (appConfig.dropdownRefine) {
    console.log('dropdownRefine is used');
    value = 'refine-panel refine-dropdown-closed refine-panel-non-mobile-closed invisible-scrollbar';
  } else {
    value = 'refine-panel refine-panel-non-mobile invisible-scrollbar';
  }
  return value;
});

const infoCircles = computed(() => {
  let value = {};
  if (appConfig.infoCircles) {
    value = appConfig.infoCircles;
  }
  return value;
});

const refineType = computed(() => {
  if (appConfig.refine) {
    return appConfig.refine.type;
  }
});

const sources = computed(() => {
  return DataStore.sources;
});

const geocode = computed(() => {
  return GeocodeStore.aisData;
});

const selectedServices = computed(() => {
  return MainStore.selectedServices;
})

const refineOpen = computed (() => {
  return MainStore.refineOpen;
});

const i18nEnabled = computed(() => {
  if (appConfig.i18n && appConfig.i18n.enabled) {
    return true;
  } else {
    return false;
  }
});

const zipcodeEntered = computed(() => {
  return MainStore.selectedZipcode;
});

const addressEntered = computed(() => {
  let address;
  let routeAddress = route.query.address;
  // console.log('addressEntered computed, routeAddress:', routeAddress);
  if (geocode.value && geocode.value.data && geocode.value.data.properties && geocode.value.data.properties.street_address) {
    address = geocode.value.data.properties.street_address;
  } else if (routeAddress) {
    address = routeAddress;
  }
  return address;
});

const keywordsEntered = computed(() => {
  return MainStore.selectedKeywords;
});

const dataStatus = computed(() => {
  let value;
  if (DataStore.sources[appConfig.app.type]) {
    value = DataStore.sources[appConfig.app.type].status;
  }
  return 'success';
});

const database = computed(() => {
  // return DataStore.databaseWithoutHiddenItems;
  return DataStore.covidFreeMealSites.features;
});

const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
});

watch(
  () => props.submittedCheckboxValue,
  async nextSubmittedCheckboxValue => {
    // console.log('RefinePanel watch submittedCheckboxValue, nextSubmittedCheckboxValue:', nextSubmittedCheckboxValue);
    if (nextSubmittedCheckboxValue == null) {
      return;
    }
    let refineList = refineList.value;
    for (let key of Object.keys(refineList)) {
      for (let key2 of Object.keys(refineList[key])) {
        if (key2 === 'radio' || key2 === 'checkbox') {
          for (let key3 of Object.keys(refineList[key][key2])) {
            let unique_key = appConfig.refine.multipleFieldGroups[key][key2][key3].unique_key;
            let i18nValue = this.$i18n.messages[this.i18nLocale][key][key3];
            // console.log('in watch submittedCheckboxValue, key:', key, 'key2:', key2, 'key3:', key3, 'unique_key:', unique_key, 'i18nValue:', i18nValue);
            if (i18nValue.toLowerCase() === nextSubmittedCheckboxValue.toLowerCase()) {

              selected.value.push(unique_key);

              let uniq = {};
              let selected = {};
              for (let group of Object.keys(appConfig.refine.multipleFieldGroups)){

                uniq[group] = { expanded: false };
                for (let dep of Object.keys(appConfig.refine.multipleFieldGroups[group])){
                  // console.log('middle loop, dep:', dep, 'group:', group);
                  if (dep !== 'tooltip') {
                    uniq[group][dep] = {};
                    for (let field of Object.keys(appConfig.refine.multipleFieldGroups[group][dep])){
                      uniq[group][dep][field] = {};
                      // console.log('field:', field, 'selected:', selected, 'appConfig.refine.multipleFieldGroups[group][field].unique_key:', appConfig.refine.multipleFieldGroups[group][field].unique_key);
                      if (appConfig.refine.multipleFieldGroups[group][dep][field].i18n_key) {
                        uniq[group][dep][field].box_label = appConfig.refine.multipleFieldGroups[group][dep][field].i18n_key;
                      } else {
                        uniq[group][dep][field].box_label = field;
                      }
                      uniq[group][dep][field].unique_key = appConfig.refine.multipleFieldGroups[group][dep][field].unique_key;
                      uniq[group][dep][field].tooltip = appConfig.refine.multipleFieldGroups[group][dep][field].tooltip;
                    }
                  } else {
                    uniq[group][dep] = appConfig.refine.multipleFieldGroups[group][dep];
                  }
                }
              }

              if (selected.value.length) {
                for (let group of Object.keys(uniq)) {
                  for (let dep of Object.keys(uniq[group])) {
                    for (let field of Object.keys(uniq[group][dep])) {
                      if (dep == 'checkbox' && selected.value.includes(uniq[group][dep][field].unique_key)) {
                        // console.log('RefinePanel end of getRefineSearchList, dependent, group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
                        if (!selected[group]) {
                          selected[group] = [];
                        }
                        selected[group].push(uniq[group][dep][field].unique_key);
                      } else if (dep == 'radio' && selected.value.includes(uniq[group][dep][field].unique_key)) {
                        // console.log('RefinePanel end of getRefineSearchList, independent, selected:', selected, 'group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
                        if (!selected['radio_'+group]) {
                          selected['radio_'+group] = undefined;
                        }
                        selected['radio_'+group] = uniq[group][dep][field].unique_key;
                      }
                    }
                  }
                }
              }

              selectedList.value = selected;
            }
          }
        }
      }
    }
    console.log('RefinePanel about to emit watchedSubmittedCheckboxValue');
    $emit('watched-submitted-checkbox-value');
  }
);

// watch(
//   () => refineOpen,
//   async nextRefineOpen => {
//     // console.log('RefinePanel.vue watch refineOpen is firing');
//     this.$nextTick(() => {
//       this.$store.map.resize();
//     });
//   }
// );

watch(
  () => database,
  async nextDatabase => {
    // console.log('watch database is calling getRefineSearchList, nextDatabase:', nextDatabase);
    getRefineSearchList();
  }
);

watch(
  () => selected,
  async (nextSelected, oldSelected) => {
    // console.log('watch selected is firing, nextSelected:', nextSelected, 'oldSelected:', oldSelected);
    let newSelection;
    if (refineType.value !== 'categoryField_value') {
      newSelection = nextSelected.filter(x => !oldSelected.includes(x));
      if (newSelection.length) {
        // this.$gtag.event('refine-checkbox-click', {
        //   'event_category': MainStore.gtag.category,
        //   'event_label': newSelection[0],
        // });
      }
    } else {
      newSelection = nextSelected;
      if (newSelection.length) {
        // this.$gtag.event('refine-checkbox-click', {
        //   'event_category': MainStore.gtag.category,
        //   'event_label': newSelection,
        // });
      }
    }
    // console.log('watch selected is firing, nextSelected:', nextSelected, 'oldSelected:', oldSelected, 'newSelection:', newSelection);
    MainStore.selectedServices = nextSelected;

    if (refineType.value !== 'categoryField_value' && nextSelected.length) {
      router.push({ query: { ...route.query, ...{ services: nextSelected.join(',') }}});
    } else {
      router.push({ query: { ...route.query, ...{ services: nextSelected }}});
    }
  }
);

watch(
  () => selectedListCompiled,
  async nextSelected => {
    window.theRouter = router;
    // console.log('selectedListCompiled is firing, nextSelected:', nextSelected);
    MainStore.selectedServices = nextSelected;
    if (typeof nextSelected === 'string') {
      nextSelected = [nextSelected];
    }
    // console.log('RefinePanel watch selectedListCompiled is firing, nextSelected', nextSelected);
    if (!nextSelected.length) {
      return;
    }
    router.push({ query: { ...route.query, ...{ services: nextSelected.join(',') }}});
  }
);

watch(
  () => selectedServices,
  async nextSelectedServices => {
    // console.log('RefinePanel watch selectedServices is firing:', nextSelectedServices);
    selected.value = nextSelectedServices;
  }
);

onBeforeMount(async () => {
  if (route.query.services) {
    // console.log('RefinePanel.vue beforeMount is running, selectedList.value:', selectedList.value, 'route.query:', route.query);//, 'route.query.services.split(','):', route.query.services.split(','));
    if (refineType.value !== 'categoryField_value') {
      selected.value = route.query.services.split(',');
    } else {
      selected.value = route.query.services;
    }
  }
});

onMounted(async () => {
  // console.log('refinePanel.vue mounted, library:', library);
  let divButton = document.querySelector('#refine-top');
  divButton.addEventListener('keypress', activate.bind(this));
  function activate(e) {
    // console.log('activate, e:', e, 'e.path[0]:', e.path[0]);
    if (e.type === 'keypress' && [ 13, 32 ].includes(e.keyCode) && e.srcElement.id == 'refine-top') {
      expandRefine();
    }
  };
  // console.log('RefinePanel.vue mounted is calling getRefineSearchList');
  getRefineSearchList();
  // console.log('mounted still running');
});


const clickFirstBoxes = () => {
  // console.log('clickFirstBoxes is running');
  for (let value of Object.keys(appConfig.refine.multipleFieldGroups)) {
    // console.log('clickFirstBoxes is running, appConfig.refine.multipleFieldGroups[value]:', appConfig.refine.multipleFieldGroups[value]);
    if (Object.keys(appConfig.refine.multipleFieldGroups[value]).includes('checkbox')) {
      let checkbox = appConfig.refine.multipleFieldGroups[value].checkbox;
      let firstValue = Object.keys(checkbox)[0];
      let unique_key = value+'_'+firstValue;
      let element = document.querySelector('[value='+unique_key+']');
      // console.log('clickFirstBoxes is running, element:', element, 'unique_key:', unique_key, 'value:', value, 'firstValue:', firstValue, 'appConfig.refine.multipleFieldGroups[value]:', appConfig.refine.multipleFieldGroups[value]);
    }
  }
};

const manualSelectedListCompiled = (nextSelected) => {
  window.theRouter = router;
  console.log('manualSelectedListCompiled is firing, nextSelected:', nextSelected);
  MainStore.selectedServices = nextSelected;
  if (typeof nextSelected === 'string') {
    nextSelected = [nextSelected];
  }
  console.log('RefinePanel manualSelectedListCompiled is firing, nextSelected', nextSelected);
  if (!nextSelected.length) {
    return;
  }
  router.push({ query: { ...route.query, ...{ services: nextSelected.join(',') }}});
};

const getCategoryFieldValue = (section) => {
  let sectionLower = section.toLowerCase().replaceAll(' ', '');
  let i18nCategories = Object.keys(this.$i18n.messages[this.i18nLocale].sections);
  let selectedCategory;
  for (let category of i18nCategories) {
    let categoryLower = category.toLowerCase().replaceAll(' ', '');
    if (categoryLower === sectionLower || categoryLower === sectionLower + 's') {
      selectedCategory = category;
    }
  }
  return selectedCategory;
};

// findTooltip(test) {
//   console.log('findTooltip is running, test:', test);
//   return 'test';
// };

const getBoxValue = (box) => {
  // console.log('getBoxValue is running, box:', box);
  let value;
  if (box) {
    value = box.replace("_", ".");
  }
  return value;
};

const calculateColumns = (ind, indName) => {
  // console.log('calculateColumns is running, indName:', indName, 'ind:', ind, 'appConfig.refine.columns', appConfig.refine.columns, 'appConfig.refine.multipleFieldGroups', appConfig.refine.multipleFieldGroups);
  let value;
  // if (isMobile.value || appConfig.refine.columns) {
  if (isMobile.value) {
    value = 1;
  } else if (appConfig.refine.columns) {
    if (appConfig.refine.multipleFieldGroups[indName].columns) {
      // console.log('calculateColumns is running, appConfig.refine.multipleFieldGroups[indName].columns:', appConfig.refine.multipleFieldGroups[indName].columns);
      value = appConfig.refine.multipleFieldGroups[indName].columns;
    } else {
      value = 1;
    }
  } else {
    value = Object.keys(ind).length;
  }
  return value;
};

const clickedRefineBox = (item) => {
  // console.log('clickedRefineBox, item:', item, 'typeof item:', typeof item, 'selected.value:', selected.value);
  let category = MainStore.gtag.category;
  setTimeout(function() {
    if (typeof item === 'object') {
      if (selected.value.includes(item.unique_key)) {
        // gtag.event('refine', {
        //   'event_category': category,
        //   'event_label': item.unique_key,
        // })
      }
    } else if (typeof item === 'string') {
      console.log('selected.value:', selected.value);
      if (selected.value.includes(item)) {
        // gtag.event('refine', {
        //   'event_category': category,
        //   'event_label': item,
        // })
      }
    }
  }, 2000);
};

const clickBox = (e) => {
  console.log('clickBox is running, e:', e);
  e.stopPropagation();
};

const closeZipcodeBox = (box) => {
  console.log('closeZipcodeBox is running');
  let startQuery = { ...route.query };
  console.log('closeZipcodeBox is running, box:', box, 'startQuery:', startQuery);
  delete startQuery['zipcode'];
  router.push({ query: { ...startQuery }});
  MainStore.selectedZipcode = null;
  MapStore.selectedZipcodeCenter = [];
  MainStore.currentSearch = null;
};

const closeAddressBox = (box) => {
  let startQuery = { ...route.query };
  console.log('closeAddressBox is running, box:', box, 'startQuery:', startQuery);
  delete startQuery['address'];
  router.push({ query: { ...startQuery }});
  // $controller.resetGeocode();
  MainStore.currentSearch = null;
  MapStore.bufferShape = null;
};

const closeKeywordsBox = (box) => {
  console.log('closeKeywordsBox is running');
  let startQuery = { ...route.query };
  let keywordsArray;
  if (startQuery.keyword && typeof startQuery.keyword === 'string' && startQuery.keyword != '') {
    keywordsArray = startQuery.keyword.split(',');
  } else if (startQuery.keyword && Array.isArray(startQuery.keyword) && startQuery.keyword.length) {
    keywordsArray = startQuery.keyword;
  } else {
    keywordsArray = [];
  }
  console.log('closeKeywordsBox is running, keywordsArray:', keywordsArray, 'typeof startQuery.keyword:', typeof startQuery.keyword, 'box:', box, 'startQuery.keyword:', startQuery.keyword);
  const index = keywordsArray.indexOf(box);
  if (index > -1) { // only splice array when item is found
    console.log('in closeKeywordsBox in if 1, keywordsArray:', keywordsArray);
    keywordsArray.splice(index, 1); // 2nd parameter means remove one item only
    console.log('in closeKeywordsBox in if 2, keywordsArray:', keywordsArray);
  }
  let newQuery = keywordsArray.toString();
  // console.log('in closeKeywordsBox, route.query:', route.query, 'startQuery:', startQuery, 'newQuery:', newQuery);
  if (newQuery.length) {
    router.push({ query: { ...route.query, ...{ keyword: newQuery }}});
  } else {
    router.push({ query: { ...route.query, ...{ keyword: [] } }});
  }
  searchString.value = '';
  MainStore.selectedKeywords = keywordsArray;
};

const closeBox = (box) => {
  console.log('closeBox is running');
  if (refineType.value === 'categoryField_value') {
    selectedList.value = [];
    // $emit('watched-submitted-checkbox-value');
    return;
  }
  let section = box.split('_')[0];
  // console.log('closeBox is running, section:', section, 'selected.value:', selected.value, 'selected.value[section]:', selected.value[section]);
  if (selectedList.value[section]) {
    // console.log('it\'s there in selectedList');
    let boxIndex = selectedList.value[section].indexOf(box);
    selectedList.value[section].splice(boxIndex, 1);
    // $emit('watched-submitted-checkbox-value');
  } else if (selectedList.value['radio_' + section]) {
    // console.log('1 it\'s there in selectedList WITH radio, box:', box, 'selectedList.value["radio_" + section]:', selectedList.value['radio_' + section]);
    let test = 'radio_' + section;
    const { [test]: removedProperty, ...exceptBoth } = selectedList.value;
    selectedList.value = exceptBoth;
    // console.log('2 exceptBoth:', exceptBoth, 'it\'s there in selectedList WITH radio, box:', box, 'selectedList.value["radio_" + section]:', selectedList.value['radio_' + section]);
    // $emit('watched-submitted-checkbox-value');
  } else if (selected.value.includes(section)) {
    // console.log('its in the array');
    let boxIndex = selected.value.indexOf(section);
    selected.value.splice(boxIndex, 1);
    // $emit('watched-submitted-checkbox-value');
  } else {
    // console.log('not there in selected list');
  }
  // console.log('closeBox is running, box:', box, 'section:', section, 'boxIndex:', boxIndex);
};

const clearAll = (e) => {
  e.stopPropagation();
  console.log('RefinePanel clearAll is running, e:', e);
  if (refineType.value === 'multipleFieldGroups' || refineType.value === 'multipleDependentFieldGroups') {
    for (let checkbox of Object.keys(selectedList.value)) {
      console.log('selectedList.value[checkbox]:', selectedList.value[checkbox]);
      if (Array.isArray(selectedList.value[checkbox])) {
        selectedList.value[checkbox].splice(0);
      } else {
        const { [checkbox]: removedProperty, ...exceptBoth } = selectedList.value;
        selectedList.value = exceptBoth;
      }
    }
  } else {
    selected.value = [];
  }
  MainStore.selectedKeywords = [];
  MainStore.selectedZipcode = null;
  MapStore.zipcodeCenter = [];
  // $controller.resetGeocode();
  MainStore.currentSearch = null;
  MapStore.bufferShape = null;
  let startQuery = { ...route.query };
  delete startQuery['address'];
  delete startQuery['zipcode'];
  delete startQuery['keyword'];
  router.push({ query: { ...startQuery }});
  MapStore.watchPositionOn = false;
  const payload = {
    lat: null,
    lng: null,
  };
  $emit('geolocate-control-fire', payload);
};

const getRefineSearchList = () => {
  if (import.meta.env.VITE_DEBUG) console.log('getRefineSearchList is running');
  let refineData = database.value;
  if (refineData && refineData.records) {
    refineData = refineData.records;
  }

  let service = '';
  let uniq = [];
  let uniqPrep;
  let selected;

  if (!appConfig.refine || appConfig.refine && ['categoryField_array', 'categoryField_value'].includes(appConfig.refine.type)) {
    console.log('in getRefineSearchList, refineData:', refineData);
    if(refineData) {
      refineData.forEach((item) => {
        if (appConfig.refine) {
          let value = appConfig.refine.value(item);
          service += `${value},`;
        } else if (item.services_offered) {
          service += `${item.services_offered},`;
        }
      });
    }

    // console.log('RefinePanel.vue, service:', service);
    let serviceArray = service.split(/(,|;)/);
    serviceArray = serviceArray.map(s => s.trim());
    // console.log('RefinePanel.vue, serviceArray:', serviceArray);

    const uniqArray = [ ...new Set(serviceArray) ];
    // console.log('RefinePanel.vue, uniqArray:', uniqArray);

    // clean up any dangling , or ;
    uniqPrep = uniqArray.filter(a => a.length > 1);
    uniqPrep.filter(Boolean); // remove empties
    let undef = uniqPrep.indexOf('undefined');
    if (undef > -1) {
      uniqPrep.splice(undef, 1);
    }
    let nullVal = uniqPrep.indexOf('null');
    if (nullVal > -1) {
      uniqPrep.splice(nullVal, 1);
    }
    uniqPrep.sort();

    for (let value of uniqPrep) {
      let theTooltip;
      if (appConfig.infoCircles && Object.keys(appConfig.infoCircles).includes(value)) {
        theTooltip = appConfig.infoCircles[value];
      }
      uniq.push({
        data: value,
        textLabel: value,
        tooltip: theTooltip,
      });
    }


    selected = uniqArray.filter(a => a.length > 2);
    selected.filter(Boolean); // remove empties
    selected.sort();
    console.log('uniq:', uniq, 'uniqPrep:', uniqPrep, 'uniqArray:', uniqArray, 'selected:', selected);

  } else if (appConfig.refine && appConfig.refine.type === 'multipleFields') {
    uniq = Object.keys(appConfig.refine.multipleFields);
    uniq.sort();

    selected = Object.keys(appConfig.refine.multipleFields);
    selected.sort();
  }

  if (import.meta.env.VITE_DEBUG) console.log('getRefineSearchList is still running');
  if (appConfig.refine && appConfig.refine.type === 'multipleFieldGroups') {
    uniq = {};
    selected = {};
    for (let group of Object.keys(appConfig.refine.multipleFieldGroups)){

      // if (Object.keys(appConfig.refine.multipleFieldGroups[group]).includes('checkbox')) {
      //   console.log('selectedList.value:', selectedList.value, 'Object.keys(appConfig.refine.multipleFieldGroups[group]):', Object.keys(appConfig.refine.multipleFieldGroups[group]));
      //   selectedList.value[group] = []
      // }
      if (import.meta.env.VITE_DEBUG) console.log('group:', group);
      uniq[group] = { expanded: false };
      for (let dep of Object.keys(appConfig.refine.multipleFieldGroups[group])){
        // console.log('middle loop, dep:', dep, 'group:', group);
        if (dep !== 'tooltip') {
          uniq[group][dep] = {};
          for (let field of Object.keys(appConfig.refine.multipleFieldGroups[group][dep])){
            uniq[group][dep][field] = {};
            // console.log('field:', field, 'selected:', selected, 'appConfig.refine.multipleFieldGroups[group][field].unique_key:', appConfig.refine.multipleFieldGroups[group][field].unique_key);
            if (appConfig.refine.multipleFieldGroups[group][dep][field].i18n_key) {
              uniq[group][dep][field].box_label = appConfig.refine.multipleFieldGroups[group][dep][field].i18n_key;
            } else {
              uniq[group][dep][field].box_label = field;
            }
            uniq[group][dep][field].unique_key = appConfig.refine.multipleFieldGroups[group][dep][field].unique_key;
            uniq[group][dep][field].tooltip = appConfig.refine.multipleFieldGroups[group][dep][field].tooltip;
          }
        } else {
          uniq[group][dep] = appConfig.refine.multipleFieldGroups[group][dep];
        }
      }
    }

    if (import.meta.env.VITE_DEBUG) console.log('RefinePanel end of getRefineSearchList, uniq:', uniq, 'selected:', selected);
    if (selected.length) {
      for (let group of Object.keys(uniq)) {
        for (let dep of Object.keys(uniq[group])) {
          for (let field of Object.keys(uniq[group][dep])) {
            if (dep == 'checkbox' && selected.value.includes(uniq[group][dep][field].unique_key)) {
              // console.log('RefinePanel end of getRefineSearchList, dependent, group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
              if (!selected[group]) {
                selected[group] = [];
              }
              selected[group].push(uniq[group][dep][field].unique_key);
            } else if (dep == 'radio' && selected.value.includes(uniq[group][dep][field].unique_key)) {
              // console.log('RefinePanel end of getRefineSearchList, independent, selected:', selected, 'group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
              if (!selected['radio_'+group]) {
                selected['radio_'+group] = undefined;
              }
              selected['radio_'+group] = uniq[group][dep][field].unique_key;
            }
          }
        }
      }
    }
    if (import.meta.env.VITE_DEBUG) console.log('RefinePanel end of getRefineSearchList, selected:', selected);
    selectedList.value = selected;
  }

  if (appConfig.refine && appConfig.refine.type === 'multipleDependentFieldGroups') {
    uniq = {};
    selected = {};
    for (let group of Object.keys(appConfig.refine.multipleDependentFieldGroups)){
      // console.log('outer loop, group:', group);
      uniq[group] = {};
      for (let dep of Object.keys(appConfig.refine.multipleDependentFieldGroups[group])){
        // console.log('middle loop, dep:', dep, 'group:', group);
        uniq[group][dep] = {};
        for (let field of Object.keys(appConfig.refine.multipleDependentFieldGroups[group][dep])){
          uniq[group][dep][field] = {};
          // console.log('inner loop field:', field, 'selected:', selected, 'appConfig.refine.multipleDependentFieldGroups[group][field].unique_key:', appConfig.refine.multipleDependentFieldGroups[group][field].unique_key);
          if (appConfig.refine.multipleDependentFieldGroups[group][dep][field].i18n_key) {
            uniq[group][dep][field].box_label = appConfig.refine.multipleDependentFieldGroups[group][dep][field].i18n_key;
          } else {
            uniq[group][dep][field].box_label = field;
          }
          uniq[group][dep][field].unique_key = appConfig.refine.multipleDependentFieldGroups[group][dep][field].unique_key;
        }
      }
    }

    console.log('RefinePanel end of getRefineSearchList, uniq:', uniq, 'selected:', selected, 'selected.value:', selected.value);
    if (selected.value.length) {
      for (let group of Object.keys(uniq)) {
        for (let dep of Object.keys(uniq[group])) {
          for (let field of Object.keys(uniq[group][dep])) {
            if (selected.value.includes(uniq[group][dep][field].unique_key)) {
              // console.log('RefinePanel end of getRefineSearchList, group:', group, 'field:', field, 'uniq[group][field].unique_key', uniq[group][field].unique_key, 'selected.value:', selected.value);
              if (!selected[group]) {
                selected[group] = [];
              }
              selected[group].push(uniq[group][dep][field].unique_key);
            }
          }
        }
      }
    }
    console.log('RefinePanel end of getRefineSearchList, selected:', selected);
    selectedList.value = selected;
  }

  // refineList.value = uniq;
  MainStore.refineList = uniq;

  return uniq;
};

const scrollToTop = () => {
  const container = document.querySelector('.refine-panel');
  container.scrollTo(0, 0);
};

const expandCheckbox = (ind) => {
  console.log('expandCheckbox is running');
  refineList.value[ind].expanded = !refineList.value[ind].expanded;
};

const expandRefine = () => {
  let tagValue;
  if (MainStore.refineOpen) {
    tagValue = 'retract refine panel';
  } else {
    tagValue = 'expand refine panel';
  }
  console.log('expandRefine is running, tagValue:', tagValue);
  // if (window.innerWidth <= 767) { // converted from rems
  // $gtag.event('refine-panel-open', {
  //   'event_category': MainStore.gtag.category,
  //   'event_label': tagValue,
  // })
  MainStore.refineOpen = !MainStore.refineOpen;
  // }
};

const closeRefinePanel = () => {
  console.log('closeRefinePanel is running');
  scrollToTop();
  expandRefine();
  clearAll();
};
  
</script>

<template>
  <div
    id="refine-panel-component"
    :class="refinePanelClass"
  >

    <div
      id="refine-top"
      :class="refineTitleClass + ' refine-title'"
      tabindex="0"
      role="button"
      @click="expandRefine"
    >

      <div
        class="slider-icon"
      >
        <font-awesome-icon icon="sliders-h" />
      </div>

      <h2
        v-if="!i18nEnabled"
        class="refine-label-text"
      >
        {{ refineTitle }}
      </h2>

      <h2
        v-if="i18nEnabled"
        class="refine-label-text"
      >
        {{ $t('refinePanel.refine') }}
      </h2>

      <div
        class="open-close-icon"
      >
        <font-awesome-icon
          v-if="refineOpen && retractable  || refineOpen && isMobile"
          :icon="[angleIconWeight, 'angle-up']"
        />

        <font-awesome-icon
          v-if="!refineOpen && retractable  || !refineOpen && isMobile"
          :icon="[angleIconWeight, 'angle-down']"
        />
      </div>

      <button
        v-if="!i18nEnabled && (selected.length || anyValueEntered)"
        class="clear-all"
        @click.prevent="clearAll"
      >
        Clear all
      </button>

      <button
        v-if="i18nEnabled && (selected.length || anyValueEntered)"
        class="clear-all"
        @click.prevent="clearAll"
        v-html="$t('refinePanel.clearAll')"
      />

      <div
        v-if="!isMobile"
        id="selected-boxes"
        class="selected-boxes columns is-mobile"
        @click="clickBox"
      >
        <button
          v-for="box in keywordsEntered"
          class="box-value column is-narrow"
          @click="closeKeywordsBox(box)"
        >
          {{ $t(getBoxValue(box)) }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>

        <button
          v-if="zipcodeEntered"
          class="box-value column is-narrow"
          @click="closeZipcodeBox(zipcodeEntered)"
        >
          {{ $t(getBoxValue(zipcodeEntered)) + ' - ' + searchDistance }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>

        <button
          v-if="addressEntered"
          class="box-value column is-narrow"
          @click="closeAddressBox(addressEntered)"
        >
          <!-- {{ $t(getBoxValue(addressEntered)) + ' - ' + searchDistance }} -->
          {{ $t(getBoxValue(addressEntered)) }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>

        <button
          v-if="refineType !== 'categoryField_value'"
          v-for="box in selected"
          class="box-value column is-narrow"
          @click="closeBox(box)"
        >
          {{ $t(getBoxValue(box)) }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>
        <button
          v-if="refineType == 'categoryField_value' && selected.length && i18nEnabled"
          class="box-value column is-narrow"
          @click="closeBox(selected)"
        >
          {{ $t('sections.' + getCategoryFieldValue(selected) + '.header') }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>
        <button
          v-if="refineType == 'categoryField_value' && selected.length && !i18nEnabled"
          class="box-value column is-narrow"
          @click="closeBox(selected)"
        >
          {{ selected }}
          <font-awesome-icon
            class="fa-x"
            :icon="[timesIconWeight,'times']"
          />
        </button>
      </div>

    </div>

    <div
      v-if="dataStatus === 'success' && ['categoryField_array', 'multipleFields'].includes(refineType)"
      v-show="!retractable && !isMobile || refineOpen"
      id="field-div"
      class="refine-holder"
    >
      <checkbox
        :options="refineListTranslated"
        :numOfColumns="NumRefineColumns"
        :small="!isMobile"
        v-model="selected"
        text-key="textLabel"
        value-key="data"
      >
      </checkbox>
    </div>

    <div
      v-if="dataStatus === 'success' && refineType == 'categoryField_value'"
      v-show="!retractable && !isMobile || refineOpen"
      id="field-div"
      class="refine-holder"
    >
      <radio
        v-model="selected"
        :options="refineListTranslated"
        text-key="text"
        value-key="value"
        :numOfColumns="NumRefineColumns"
        :small="!isMobile"
      >
      </radio>
    </div>

    <!-- if using multipleFieldGroups option and NOT dropdownRefine -->
    <div
      v-if="dataStatus === 'success' && refineType === 'multipleFieldGroups' && !dropdownRefine"
      v-show="!retractable && !isMobile || refineOpen"
      id="multiple-field-groups-div"
      class="columns is-multiline multiple-field-groups"
    >
      <div
        v-for="(ind) in Object.keys(refineListTranslated)"
        :id="'refine-list-'+ind"
        :key="ind"
        class="column is-narrow service-group-holder-x"
      >
        <div
          id="columns-div-for-checkboxes"
          class="columns"
        >
          <radio
            v-model="selectedList['radio_'+ind]"
            v-if="refineListTranslated[ind]['radio']"
            :options="refineListTranslated[ind]['radio']"
            text-key="textLabel"
            value-key="data"
            :small="!isMobile"
            :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)"
          >
            <div
              :class="isMobile ? 'large-label': 'small-label'"
              slot="label"
            >
              {{ $t(ind + '.category') }}
            </div>
          </radio>

          <checkbox
            v-if="refineListTranslated[ind]['checkbox']"
            :options="refineListTranslated[ind]['checkbox']"
            :small="!isMobile"
            v-model="selectedList[ind]"
            text-key="textLabel"
            value-key="data"
            shrinkToFit="true"
            :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)"
          >
            <div
              :class="isMobile ? 'large-label': 'small-label'"
              slot="label"
            >
              {{ $t(ind + '.category') }}
              <icon-tool-tip
                v-if="!isMobile && refineListTranslated[ind]['tooltip']"
                :tip="refineListTranslated[ind]['tooltip']"
                :circle-type="click"
                :position="refineList[ind]['tooltip']['position']"
                :multiline="refineList[ind]['tooltip']['multiline']"
              />
              <div
                v-if="isMobile && refineListTranslated[ind]['tooltip']"
                class="mobile-tooltip"
              >
                <font-awesome-icon
                  icon="info-circle"
                  class="fa-infoCircle"
                />
                {{ $t(refineListTranslated[ind]['tooltip']) }}
              </div>
            </div>
          </checkbox>
        </div>
      </div>
    </div>

    <!-- if using multipleFieldGroups option and NOT dropdownRefine -->
    <div
      v-if="dataStatus === 'success' && refineType === 'multipleFieldGroups' && dropdownRefine"
      id="multiple-field-groups-dropdown-div"
      class="columns is-multiline multiple-field-groups"
    >
      <div
        v-for="(ind) in Object.keys(refineListTranslated)"
        :id="'refine-list-'+ind"
        :key="ind"
        class="column"
      >

        <div
          id="columns-div-for-checkboxes"
          class="columns"
        >
          <div
            class="column dropdown-checkbox-div"
            :style="{ 'width': 100/Object.keys(refineListTranslated).length+'%' }"
          >
            <div
              class="dropdown-checkbox-header"
              @click="expandCheckbox(ind)"
            >
              {{ $t(ind + '.category') }}
            </div>
            <div
              v-if="refineList[ind].expanded"
              class="refine-dropdown"
            >
              <radio
                v-model="selectedList['radio_'+ind]"
                v-if="refineListTranslated[ind]['radio']"
                :options="refineListTranslated[ind]['radio']"
                text-key="textLabel"
                value-key="data"
                :small="!isMobile"
                :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)"
              >
                <div
                  slot="label"
                >
                </div>
              </radio>

              <checkbox
                v-if="refineListTranslated[ind]['checkbox']"
                :options="refineListTranslated[ind]['checkbox']"
                :small="!isMobile"
                v-model="selectedList[ind]"
                text-key="textLabel"
                value-key="data"
                shrinkToFit="true"
                :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)"
              >
                <div
                  slot="label"
                >
                </div>
              </checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- if using multipleDependentFieldGroups option -->
    <div
      v-if="dataStatus === 'success' && refineType === 'multipleDependentFieldGroups'"
      id="multiple-dependent-field-groups-div"
      class="columns is-multiline multiple-field-groups"
    >
      <div
        v-for="(ind) in Object.keys(refineListTranslated)"
        :id="'refine-list-'+ind"
        :key="ind"
        class="column is-narrow service-group-holder-x"
      >

        <div
          id="columns-div-for-checkboxes"
          class="columns"
        >
          <div class="column">
            <radio
              v-model="selectedList['radio_'+ind]"
              v-if="refineListTranslated[ind]['radio']"
              :options="refineListTranslated[ind]['radio']"
              text-key="textLabel"
              value-key="data"
              :num-of-columns="1"
              :small="!isMobile"
            >
              <div
                slot="label"
              >
                {{ $t(ind + '.category') }}
                <icon-tool-tip
                  v-if="Object.keys(infoCircles).includes(ind)"
                  :item="ind"
                  :circleData="infoCircles[ind]"
                  :circleType="'click'"
                >
                </icon-tool-tip>
              </div>
            </radio>

            <checkbox
              :options="refineListTranslated[ind]['checkbox']"
              :num-of-columns="1"
              :small="!isMobile"
              v-model="selectedList[ind]"
              text-key="textLabel"
              value-key="data"
              shrinkToFit="true"
            >
              <div
                v-if="!refineListTranslated[ind]['radio']"
                slot="label"
              >
                {{ $t(ind + '.category') }}
                <icon-tool-tip
                  v-if="Object.keys(infoCircles).includes(ind)"
                  :item="ind"
                  :circleData="infoCircles[ind]"
                  :circleType="'click'"
                >
                </icon-tool-tip>
              </div>
            </checkbox>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isMobile && refineOpen"
      class="columns is-mobile mobile-clear-all"
    >
      <div
        class="column is-narrow add-margin-left small-side-padding"
        v-if="!i18nEnabled"
      >
        <button
          class="button apply-filters-button medium-side-padding"
          @click="expandRefine(); scrollToTop();"
        >
          <div class="apply-filters-text">
            Apply filters
          </div>
        </button>
      </div>

      <div
        class="column is-narrow add-margin-left small-side-padding"
        v-if="i18nEnabled"
      >
        <div
          class="button apply-filters-button medium-side-padding"
          @click="expandRefine(); scrollToTop();"
        >
          <div
            v-html="$t('refinePanel.applyFilters')"
            class="apply-filters-text"
          />
        </div>
      </div>

    </div>

  </div>
</template>

<style lang="scss">
@import "../assets/main_pin.scss";

#refine-panel-component {
  // background: $ghost-grey;
  background: #f0f0f0;
  overflow-x: hidden;
}

#columns-div-for-checkboxes {

  .input-checkbox, .input-radio {
    padding-bottom: 8px;
    // padding-top: 24px;
  }

  .checkbox-div {
    margin-left: 0px;
    margin-right: 0px;
    margin-top: 0px;

    .control {
      margin-right: 12px;
    }
  }
}

.refine-dropdown-closed {
  height: 6rem;
}

.refine-retractable-closed {
  // height: 3rem;
  // height: 4rem;
}

.box-value {
  margin-left: 4px;
  margin-right: 4px;
  margin-bottom: 8px;
  padding: 4px 4px 2px 4px !important;
  height: 30px;
  border-width: 2px !important;
  border-style: solid;
  border-color: #cfcfcf;
  border-radius: 4px;
  background-color: #cfcfcf;
  box-sizing: border-box;
  font-family: "ArialMT", "Arial", sans-serif;
  font-size: 1em;
  color: #333333;
  text-align: left;
  line-height: normal;
}

.box-value:hover {
  border-color: #2176d2 !important;
}

.invisible-x-button {
  border-style: none;
  background-color: #cfcfcf;
  cursor: pointer;
}

.fa-x {
  margin-left: 4px;
  margin-right: 4px;
}

.refine-panel {
  overflow-y: hidden;
  // padding: 1rem;

  .legend-title{
    margin-bottom: 0;
    font-weight: bold;
    font-size: 1.2rem;
    text-transform: uppercase;
  }

  @media screen and (min-width: 768px) {
    .service-group-holder-x {
      margin-bottom: 24px !important;
      padding-top: 0px;
      padding-bottom: 0px;
      margin-bottom: 10px;
      padding-left: 24px;
      padding-right: 24px;
      border-right: 1px solid #cfcfcf;
      &:first-of-type{
        // padding-left: 0px;
      }
      &:last-of-type{
        border-right: none;
      }
    }

    .refine-title {
      border-style: solid;
      border-width: 2px;
      border-color: #f0f0f0;
    }

    .retractable-refine-title {
      cursor: pointer;
    }

    .retractable-refine-title:hover {
      border-color: #2176d2;
    }

    // .refine-title-open {
    //   cursor: pointer;
    // }

    // .retractable-refine-title-open:hover {
    //   border-color: #f0f0f0;
    // }

    .close-button {
      height: 20px;
      // position: absolute;
      // top: 115px;
      // right: 12px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      // color: $ben-franklin-blue-dark;
      color: #0f4d90;
      cursor: pointer;
      padding-left: 0px;
      padding-top: 8px;
      // padding-bottom: 12px;
      padding-right: 0px;
    }

    .refine-holder {
      padding-left: 12px;
      padding-right: 12px;
    }
  }

  .refine-title {
    // color: $ben-franklin-blue-dark;
    color: #0f4d90;
    margin: 0px !important;
    display: flex;
    flex-direction: row;

    .clear-all {
      margin-top: 10px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      height: 20px;
      font-weight: bold;
      font-size: .8rem;
      color: #0f4d90 !important;
      text-decoration: underline;
      padding-left: 16px;
      padding-right: 12px;
      cursor: pointer;
    }

    .clear-button {
      background-color: rgb(0, 204, 255);
      height: 30px;
      width: 80px;
      margin-left: 10px;
      margin-right: 10px;
    }
  }

  label {
    font-weight: normal;
    cursor: pointer;
  }

  @media screen and (max-width: 767px) {
    // height: 3rem;
    position: relative;

    .clear-all {
      // margin-top: 8px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      height: 30px;
      font-weight: bold;
      font-size: 1.063rem;
      color: #0f4d90 !important;
      text-decoration: underline;
      padding-left: 16px;
      padding-right: 12px;
      cursor: pointer;
    }

    .slider-icon {
      padding-top: 11px;
      padding-left: 14px;
      padding-bottom: 11px;
    }

    .refine-label-text {
      padding-top: 13px;
      padding-bottom: 13px;
    }

    .open-close-icon {
      padding-top: 9px;
      font-size: 26px;
    }

    #columns-div-for-checkboxes {

      .input-checkbox, .input-radio {
        padding-bottom: 24px;
        padding-top: 24px;
      }
    }

    .close-button {
      height: 30px;
      // position: absolute;
      // top: 10px;
      // right: 5px;
      border-style: none;
      background-color: rgb(240, 240, 240);
      // color: $ben-franklin-blue-dark;
      color: #0f4d90;
      padding-left: 0px;
      padding-top: 9px;
      // padding-bottom: 12px;
      padding-right: 0px;
    }

    .refine-title{
      // margin-bottom: 14px !important;
      cursor: pointer;
      // height:7vh;
    }

    .service-group-holder-x {
      padding-top: 0px;
      padding-bottom: 12px;
      margin-bottom: 12px;
      padding-left: 6px !important;
      padding-right: 6px !important;
      border-bottom: 1px solid black;
      &:first-of-type{
        // padding-left: 0px;
      }
      &:last-of-type{
        border-bottom: none;
      }
    }

    .add-margin-left {
      margin-left: 24px;
    }

    .small-side-padding {
      padding-left: 6px !important;
      padding-right: 6px !important;
    }

    .medium-side-padding {
      padding-left: 12px !important;
      padding-right: 12px !important;
    }

    #multiple-field-groups-div {
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  &.refine-panel-open {
    overflow-y: hidden;
    height: 100%;
  }
}

.mobile-clear-all {
  padding-bottom: 1.5rem;
}

.small-label {
  font-size: 16px;
}

.large-label {
  font-size: 20px;
  margin-bottom: 4px;
}

.multiple-field-groups {
  margin-left: 0px !important;
  margin-right: 0px !important;
  margin-bottom: 0px !important;
  margin-top: 12px !important;
}

.selected-boxes {
  flex-wrap: wrap;
  max-width: 80%;
  padding-top: 6px;
  margin-left: 0px !important;
  margin-right: 0px !important;
  margin-bottom: 0px !important;
  margin-top: 0px !important;
}

.dropdown-checkbox-div {
  padding: 0px !important;
  position: absolute;
  z-index: 1001;
  border-style: solid;
  border-width: 1px;
}

.dropdown-checkbox-header {
  padding: 0.75rem;
}

.refine-dropdown {
  background-color: rgb(240, 240, 240);
}

.input-label {
  display: inline-block;
  // color: $ben-franklin-blue-dark;
  color: #0f4d90;
  font-size: 14px;
  margin-bottom: .5rem;
  padding-left: 10px;
}

.fa-infoCircle {
  // color: $ben-franklin-blue-dark;
  color: #0f4d90;
  cursor: pointer;
}

.apply-filters-button {
  background-color: #0f4d90 !important;
}

.apply-filters-text {
  display: inline-block;
  color: #ffffff;
}

.slider-icon {
  padding-top: 10px;
  padding-left: 14px;
  padding-bottom: 10px;
}

.refine-label-text {
  box-sizing: border-box;
  font-family: "Montserrat-Bold", "Montserrat Bold", "Montserrat", sans-serif;
  font-weight: 700;
  color: #0f4d90;
  text-align: left;
  line-height: normal;
  padding-left: 4px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-right: 8px;
  text-transform: uppercase;
}

.input-wrap.input-checkbox .is-checkradio+label:hover::before, .input-wrap.input-radio .is-checkradio+label:hover::before {
  border-width: 2px !important;
}

.is-checkradio[type=checkbox]:focus:not([disabled])+label::before, .is-checkradio[type=checkbox]:focus:not([disabled])+label:before, .is-checkradio[type=radio]:focus:not([disabled])+label::before, .is-checkradio[type=radio]:focus:not([disabled])+label:before {
  border-width: 2px !important;
  border-color: #2176d2 !important;
}

.open-close-icon {
  padding-top: 8px;
  font-size: 26px;
}

</style>
