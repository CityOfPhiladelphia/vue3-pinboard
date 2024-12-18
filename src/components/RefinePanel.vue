<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onBeforeMount, onMounted, watch } from 'vue';

import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';

const instance = getCurrentInstance();
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

import TooltipCheckbox from './TooltipCheckbox.vue';
import Radio from '@phila/phila-ui-radio';

import IconToolTip from './IconToolTip.vue';

const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

// STORES
const MapStore = useMapStore();
const MainStore = useMainStore();
const GeocodeStore = useGeocodeStore();
const DataStore = useDataStore();

// ROUTER
const route = useRoute();
const router = useRouter();

const props = defineProps({
  refineTitle: {
    type: String,
    default: 'FILTER',
  },
  // submittedCheckboxValue: {
  //   type: String,
  //   default: null,
  // },
});

const $emit = defineEmits(['geolocate-control-fire', 'watched-submitted-checkbox-value' ]);

const selected = ref();
if ($config.refine.type === 'categoryField_value') {
  selected.value = null;
} else {
  selected.value = [];
}
const selectedList = ref({});

const viewerHeight = ref(window.innerHeight);
const appHeaderHeight = ref(document.querySelector('#app-header').offsetHeight);
const refineTopHeight = ref(46);
const bottomHeight = computed(() => {
  return viewerHeight.value - (appHeaderHeight.value + refineTopHeight.value);
});

const searchDistance = computed(() => {
  let value = MapStore.searchDistance;
  let word;
  if (value == 1) {
    word = t('mile');
  } else {
    word = t('miles');
  }
  return value + ' ' + word;
});

const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
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
  if ($config.dropdownRefine) {
    value = true;
  } else {
    value = false;
  }
  return value;
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice || MainStore.windowDimensions.width < 768;
});

const NumRefineColumns = computed(() => {
  let value;
  if (isMobile.value) {
    value = 1;
  } else {
    value = 4;
  }
  return value;
});

const selectedArray = computed(() => {
  if (import.meta.env.VITE_DEBUG) console.log('selectedArray computed is running, selected.value:', selected.value, 'selectedList.value:', selectedList.value);
  let selL = {...selectedList.value};
  // if (import.meta.env.VITE_DEBUG) console.log('selectedArray computed is running, selL:', selL, 'selected.value:', selected.value);
  let compiled = [];
  if (Object.keys(selL).length) {
    for (let value of Object.keys(selL)) {
      if (import.meta.env.VITE_DEBUG) console.log('in selectedArray computed, value:', value, 'selL[value]:', selL[value]);
      if (value.split('_')[0] == 'checkbox') {
        console.log('checkbox clicked!');
        if (Array.isArray(selL[value])) {
          for (let sel of selL[value]) {
            if (import.meta.env.VITE_DEBUG) console.log('in selectedArray computed, loop, sel:', sel, 'value:', value, 'selL[value]:', selL[value]);
            compiled.push(sel);
          }
        } else {
          compiled.push(selL[value]);
        }
      } else if (value.split('_')[0] == 'radio') {
        console.log('radio button clicked!, selL[value]:', selL[value]);
        if (typeof selL[value] === 'string') {
          compiled.push(selL[value]);
        } else {
          compiled.push(selL[value][0]);
        }
      } else {
        for (let sel of selL[value]) {
          compiled.push(sel);
        }
      }
    }
  } else if (refineType.value !== 'categoryField_value') {
    let sel = selected.value;
    if (sel.length) {
      for (let selected of sel) {
        compiled.push(selected);
      }
    }
  } else {
    if (selected.value) {
      compiled.push(selected.value);
    }
  }
  return compiled;
});

const refineListTranslated = computed(() => {
  console.log('refineListTranslated computed is running, refineList.value:', refineList.value);
  if (!refineList.value || !Object.keys(refineList.value).length) {
    return {};
  }
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
  if ($config.retractableRefine) {
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
  } else if ($config.dropdownRefine) {
    console.log('dropdownRefine is used');
    value = 'refine-panel refine-dropdown-closed refine-panel-non-mobile-closed invisible-scrollbar';
  } else {
    value = 'refine-panel refine-panel-non-mobile invisible-scrollbar';
  }
  return value;
});

const infoCircles = computed(() => {
  let value = {};
  if ($config.infoCircles) {
    value = $config.infoCircles;
  }
  return value;
});

const refineType = computed(() => {
  if ($config.refine) {
    return $config.refine.type;
  }
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
  if ($config.i18n && $config.i18n.enabled) {
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
  if (DataStore.sources[$config.app.type]) {
    value = DataStore.sources[$config.app.type].status;
  }
  return 'success';
});

const database = computed(() => {
  let value = {}
  if (DataStore.sources[DataStore.appType]) {
    // if (import.meta.env.VITE_DEBUG) console.log('DataStore.appType:', DataStore.appType, 'DataStore.sources[DataStore.appType]:', DataStore.sources[DataStore.appType]);
    value = DataStore.sources[DataStore.appType].data.rows || DataStore.sources[DataStore.appType].data.features || DataStore.sources[DataStore.appType].data;
  }
  return value;
});

watch(
  () => database,
  async nextDatabase => {
    // console.log('watch database is calling getRefineSearchList, nextDatabase:', nextDatabase);
    getRefineSearchList();
  }
);

watch(
  () => selectedServices.value.length,
  async nextSelectedServices => {
    console.log('RefinePanel watch selectedServices is firing:', selectedServices.value);
    selected.value = selectedServices.value;
    for (let key of Object.keys(refineList.value)) {
      for (let key2 of Object.keys(refineList.value[key])) {
        if (key2 === 'radio' || key2 === 'checkbox') {
          for (let key3 of Object.keys(refineList.value[key][key2])) {
            let unique_key = $config.refine.multipleFieldGroups[key][key2][key3].unique_key;
            console.log('in watch selectedServices, key:', key, 'key2:', key2, 'key3:', key3, 'unique_key:', unique_key);

            let uniq = {};
            let selectedNow = {};
            for (let group of Object.keys($config.refine.multipleFieldGroups)){

              uniq[group] = { expanded: false };
              for (let dep of Object.keys($config.refine.multipleFieldGroups[group])){
                // console.log('middle loop, dep:', dep, 'group:', group);
                if (dep !== 'tooltip') {
                  uniq[group][dep] = {};
                  for (let field of Object.keys($config.refine.multipleFieldGroups[group][dep])){
                    uniq[group][dep][field] = {};
                    // console.log('field:', field, 'selected:', selected, '$config.refine.multipleFieldGroups[group][field].unique_key:', $config.refine.multipleFieldGroups[group][field].unique_key);
                    if ($config.refine.multipleFieldGroups[group][dep][field].i18n_key) {
                      uniq[group][dep][field].box_label = $config.refine.multipleFieldGroups[group][dep][field].i18n_key;
                    } else {
                      uniq[group][dep][field].box_label = field;
                    }
                    uniq[group][dep][field].unique_key = $config.refine.multipleFieldGroups[group][dep][field].unique_key;
                    uniq[group][dep][field].tooltip = $config.refine.multipleFieldGroups[group][dep][field].tooltip;
                  }
                } else {
                  uniq[group][dep] = $config.refine.multipleFieldGroups[group][dep];
                }
              }
            }

            if (selected.value.length) {
              for (let group of Object.keys(uniq)) {
                console.log('group:', group);
                for (let dep of Object.keys(uniq[group])) {
                  for (let field of Object.keys(uniq[group][dep])) {
                    if (dep == 'checkbox' && selected.value.includes(uniq[group][dep][field].unique_key)) {
                      // console.log('RefinePanel end of getRefineSearchList, dependent, group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
                      if (!selectedNow['checkbox_'+group]) {
                        selectedNow['checkbox_'+group] = [];
                      }
                      selectedNow['checkbox_'+group].push(uniq[group][dep][field].unique_key);
                    } else if (dep == 'radio' && selected.value.includes(uniq[group][dep][field].unique_key)) {
                      // console.log('RefinePanel end of getRefineSearchList, independent, selected:', selected, 'group:', group, 'dep:', dep, 'field:', field, 'uniq[group][dep][field].unique_key', uniq[group][dep][field].unique_key, 'selected.value:', selected.value);
                      if (!selectedNow['radio_'+group]) {
                        selectedNow['radio_'+group] = undefined;
                      }
                      selectedNow['radio_'+group] = uniq[group][dep][field].unique_key;
                    }
                  }
                }
              }
            }

            selectedList.value = selectedNow;
          }
        }
      }
    }
  }
);

// watch(
//   () => selected.value,
//   async (nextSelected, oldSelected) => {
//     console.log('watch selected is firing, nextSelected:', nextSelected, 'oldSelected:', oldSelected);
//     let newSelection;
//     if (refineType.value !== 'categoryField_value') {
//       newSelection = nextSelected.filter(x => !oldSelected.includes(x));
//       if (newSelection.length) {
//         // this.$gtag.event('refine-checkbox-click', {
//         //   'event_category': MainStore.gtag.category,
//         //   'event_label': newSelection[0],
//         // });
//       }
//     } else {
//       newSelection = nextSelected;
//       if (newSelection.length) {
//         // this.$gtag.event('refine-checkbox-click', {
//         //   'event_category': MainStore.gtag.category,
//         //   'event_label': newSelection,
//         // });
//       }
//     }
//   }
// );

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

watch(
  () => selectedArray.value,
  async (nextSelected, lastSelected) => {
    if (nextSelected === lastSelected) return;
    if (import.meta.env.VITE_DEBUG) console.log('watch selectedArray is firing, nextSelected:', nextSelected, 'lastSelected:', lastSelected);
    // MainStore.selectedServices = nextSelected;
    // if (typeof nextSelected === 'string') {
    //   nextSelected = [nextSelected];
    // }
    // if (import.meta.env.VITE_DEBUG) console.log('RefinePanel watch selectedArray is firing, nextSelected', nextSelected);
    // if (!nextSelected.length) {
    //   return;
    // }
    if (!arraysEqual(nextSelected, lastSelected)) {
      let startQuery = { ...route.query };
      if (nextSelected.length) {
        console.log('RefinePanel watch selectedArray is firing, nextSelected', nextSelected);
        router.push({ query: { ...startQuery, ...{ services: nextSelected.join(',') }}});
      } else {
        delete startQuery['services'];
        router.push({ query: { ...startQuery }});
      }
    }
    await nextTick();
    refineTopHeight.value = document.querySelector('#refine-top').offsetHeight;
  }
);

// watch(
//   () => route.query,
//   async (newQuery, oldQuery) => {
//     if (import.meta.env.VITE_DEBUG) console.log('RefinePanel watch route.query is firing, newQuery:', newQuery, 'oldQuery:', oldQuery);
//     // if (newQuery.services) {
//     selectedList.value = {};
//     if (newQuery.services && refineType.value !== 'categoryField_value') {
//       const newServices = newQuery.services.split(',');
//       if (import.meta.env.VITE_DEBUG) console.log('RefinePanel watch.query route is firing, newServices:', newServices, 'newQuery.services:', newQuery.services);
//       for (let service of newServices) {
//         const serviceType = service.split('_')[0];
//         let checkboxOrRadio = Object.keys($config.refine.multipleFieldGroups[serviceType])[0];
//         if (import.meta.env.VITE_DEBUG) console.log('RefinePanel watch.query route is firing, service:', service, 'checkboxOrRadio:', checkboxOrRadio);
//         let category = checkboxOrRadio + '_' + serviceType;
//         selectedList.value[category] = service;
//       }
//     } else if (newQuery.services) {
//       // this will need to be changed
//       selectedList.value = newQuery.services;
//     }
//     // }
//   }
// );

// watch(
//   () => selectedServices,
//   async nextSelectedServices => {
//     // console.log('RefinePanel watch selectedServices is firing:', nextSelectedServices);
//     selected.value = nextSelectedServices;
//   }
// );

// onBeforeMount(async () => {
  
// });

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
  console.log('RefinePanel.vue mounted is calling getRefineSearchList');
  await getRefineSearchList();

  if (route.query.services) {
    // console.log('RefinePanel.vue beforeMount is running, selectedList.value:', selectedList.value, 'route.query:', route.query);//, 'route.query.services.split(','):', route.query.services.split(','));
    if (refineType.value !== 'categoryField_value') {
      selected.value = route.query.services.split(',');
    } else {
      selected.value = route.query.services;
    }
  }

  if (refineType.value === 'multipleFieldGroups') {
    for (let service of selected.value) {
      const serviceType = service.split('_')[0];
      if (import.meta.env.VITE_DEBUG) console.log('RefinePanel.vue beforeMount 0, serviceType:', serviceType)//, $config.refine.multipleFieldGroups[serviceType]:', $config.refine.multipleFieldGroups[serviceType]);
      let checkboxOrRadio = Object.keys($config.refine.multipleFieldGroups[serviceType])[0];
      let category = checkboxOrRadio + '_' + serviceType;
      if (import.meta.env.VITE_DEBUG) console.log('RefinePanel.vue beforeMount 1 is running, service:', service, 'serviceType:', serviceType, 'checkboxOrRadio:', checkboxOrRadio, 'category:', category, 'selectedList.value:', selectedList.value);
      if (checkboxOrRadio == 'checkbox') {
        if (import.meta.env.VITE_DEBUG) console.log('RefinePanel.vue beforeMount 2 is running, service:', service, 'serviceType:', serviceType, 'checkboxOrRadio:', checkboxOrRadio, 'category:', category, 'selectedList.value:', selectedList.value);
        if (selectedList.value[category] && !selectedList.value[category].includes(service)) {
          selectedList.value[category].push(service);
        } else {
          selectedList.value[category] = [];
          selectedList.value[category].push(service);
        }
      } else {
        selectedList.value[category] = service;
      }
    }
  }
});

const getCategoryFieldValue = (section) => {
  if (import.meta.env.VITE_DEBUG) console.log('getCategoryFieldValue is running, section:', section);
  let selectedCategory;
  if (section.length) {
    let sectionLower = section.toLowerCase().replaceAll(' ', '');
    let i18nCategories = Object.keys(ConfigStore.config.i18n.data.messages[i18nLocale.value].sections);
    console.log('18nCategories:', i18nCategories);
    for (let category of i18nCategories) {
      let categoryLower = category.toLowerCase().replaceAll(' ', '');
      if (categoryLower === sectionLower || categoryLower === sectionLower + 's') {
        selectedCategory = category;
      }
    }
  }
  return selectedCategory;
};

const getBoxValue = (box) => {
  let value;
  if (box && typeof box != 'object') {
    value = box.replace("_", ".");
  }
  console.log('getBoxValue is running, box:', box, 'value:', value);
  return value;
};

const calculateColumns = (ind, indName) => {
  // console.log('calculateColumns is running, indName:', indName, 'ind:', ind, '$config.refine.columns', $config.refine.columns, '$config.refine.multipleFieldGroups', $config.refine.multipleFieldGroups);
  let value;
  if (isMobile.value) {
    value = 1;
  } else if ($config.refine.columns) {
    if ($config.refine.multipleFieldGroups[indName].columns) {
      // console.log('calculateColumns is running, $config.refine.multipleFieldGroups[indName].columns:', $config.refine.multipleFieldGroups[indName].columns);
      value = $config.refine.multipleFieldGroups[indName].columns;
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

const closeZipcodeBox = (e, box) => {
  e.stopPropagation();
  console.log('closeZipcodeBox is running');
  let startQuery = { ...route.query };
  console.log('closeZipcodeBox is running, box:', box, 'startQuery:', startQuery);
  delete startQuery['zipcode'];
  router.push({ query: { ...startQuery }});
  MainStore.selectedZipcode = null;
  MapStore.zipcodeCenter = [];
  MainStore.currentSearch = null;
};

const closeAddressBox = (e, box) => {
  e.stopPropagation();
  let startQuery = { ...route.query };
  console.log('closeAddressBox is running, e:', e, 'box:', box, 'startQuery:', startQuery);
  delete startQuery['address'];
  router.push({ query: { ...startQuery }});
  MainStore.currentSearch = null;
};

const closeKeywordsBox = (e, box) => {
  e.stopPropagation();
  console.log('closeKeywordsBox is running, e:', e);
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
  // searchString.value = '';
  MainStore.selectedKeywords = keywordsArray;
};

const closeBox = (e, box) => {
  e.stopPropagation();
  // console.log('closeBox is running, box:', box);
  console.log('closeBox is running, box:', box, 'e:', e);
  if (refineType.value === 'categoryField_value') {
    selected.value = null;
    selectedList.value = [];
    // $emit('watched-submitted-checkbox-value');
    return;
  }
  let section = box.split('_')[0];
  console.log('closeBox is running, section:', section, 'selected.value:', selected.value, 'selected.value[section]:', selected.value[section]);
  if (selectedList.value['checkbox_'+section]) {
    // console.log('it\'s there in selectedList');
    let boxIndex = selectedList.value['checkbox_'+section].indexOf(box);
    selectedList.value['checkbox_'+section].splice(boxIndex, 1);
    // $emit('watched-submitted-checkbox-value');
  } else if (selectedList.value['radio_' + section]) {
    if (import.meta.env.VITE_DEBUG) console.log('1 it\'s there in selectedList WITH radio, box:', box, 'selectedList.value["radio_" + section]:', selectedList.value['radio_' + section]);
    let test = 'radio_' + section;
    const { [test]: removedProperty, ...exceptBoth } = selectedList.value;
    console.log('2 exceptBoth:', exceptBoth, 'it\'s there in selectedList WITH radio, box:', box, 'selectedList.value["radio_" + section]:', selectedList.value['radio_' + section]);
    selectedList.value = exceptBoth;
    // $emit('watched-submitted-checkbox-value');
  } else if (selected.value.includes(section)) {
    // console.log('its in the array');
    let boxIndex = selected.value.indexOf(section);
    selected.value.splice(boxIndex, 1);
    // $emit('watched-submitted-checkbox-value');
  } else {
    console.log('not there in selected list');
  }
  // console.log('closeBox is running, box:', box, 'section:', section, 'boxIndex:', boxIndex);
};

const clearAll = (e) => {
  console.log('RefinePanel clearAll is running, e:', e);
  let startQuery = { ...route.query };
  // if (import.meta.env.VITE_DEBUG) console.log('RefinePanel clearAll is running, startQuery1:', startQuery);
  delete startQuery['address'];
  delete startQuery['zipcode'];
  delete startQuery['keyword'];
  delete startQuery['services'];
  if (import.meta.env.VITE_DEBUG) console.log('RefinePanel clearAll is running, startQuery2:', startQuery);
  router.push({ query: { ...startQuery }});
  const payload = {
    lat: null,
    lng: null,
  };
  for (let selected of Object.keys(selectedList.value)) {
    if (import.meta.env.VITE_DEBUG) console.log('clearAll is running, selected:', selected, 'selectedList.value[selected]:', selectedList.value[selected]);
    if (Array.isArray(selectedList.value[selected])) {
      for (let i=selectedList.value[selected].length-1;i>=0;i--) {
        console.log('clearAll is running, i:', i);
        closeBox(e, selectedList.value[selected][i]);
      }
    } else {
      closeBox(e, selectedList.value[selected]);
    }
  }
  
  for (let keyword of keywordsEntered.value) {
    closeKeywordsBox(e, keyword);
  }

  if (refineType.value === 'categoryField_value') {
    selected.value = null;
  } else {
    selected.value = [];
  }
  // $emit('geolocate-control-fire', payload);
};

const getRefineSearchList = async() => {
  let refineData = database.value;
  if (import.meta.env.VITE_DEBUG) console.log('getRefineSearchList is running, refineData:', refineData);
  if (refineData && refineData.records) {
    refineData = refineData.records;
  }

  let service = '';
  let uniq = [];
  let uniqPrep;
  let selected;

  if (!$config.refine || $config.refine && ['categoryField_array', 'categoryField_value'].includes($config.refine.type)) {
    console.log('in getRefineSearchList, refineData:', refineData);
    if(refineData) {
      refineData.forEach((item) => {
        if ($config.refine) {
          let value = $config.refine.value(item);
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
      if ($config.infoCircles && Object.keys($config.infoCircles).includes(value)) {
        theTooltip = $config.infoCircles[value];
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

  } else if ($config.refine && $config.refine.type === 'multipleFields') {
    uniq = Object.keys($config.refine.multipleFields);
    uniq.sort();

    selected = Object.keys($config.refine.multipleFields);
    selected.sort();
  }

  if (import.meta.env.VITE_DEBUG) console.log('getRefineSearchList is still running');
  if ($config.refine && $config.refine.type === 'multipleFieldGroups') {
    uniq = {};
    selected = {};
    for (let group of Object.keys($config.refine.multipleFieldGroups)){

      if (import.meta.env.VITE_DEBUG) console.log('group:', group);
      uniq[group] = { expanded: false };
      for (let dep of Object.keys($config.refine.multipleFieldGroups[group])){
        // console.log('middle loop, dep:', dep, 'group:', group);
        if (dep !== 'tooltip') {
          uniq[group][dep] = {};
          for (let field of Object.keys($config.refine.multipleFieldGroups[group][dep])){
            uniq[group][dep][field] = {};
            // console.log('field:', field, 'selected:', selected, '$config.refine.multipleFieldGroups[group][field].unique_key:', $config.refine.multipleFieldGroups[group][field].unique_key);
            if ($config.refine.multipleFieldGroups[group][dep][field].i18n_key) {
              uniq[group][dep][field].box_label = $config.refine.multipleFieldGroups[group][dep][field].i18n_key;
            } else {
              uniq[group][dep][field].box_label = field;
            }
            uniq[group][dep][field].unique_key = $config.refine.multipleFieldGroups[group][dep][field].unique_key;
            uniq[group][dep][field].tooltip = $config.refine.multipleFieldGroups[group][dep][field].tooltip;
          }
        } else {
          uniq[group][dep] = $config.refine.multipleFieldGroups[group][dep];
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
  if (import.meta.env.VITE_DEBUG) console.log('expandRefine is running');
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

const checkboxChange = (e) => {
  console.log('checkboxChange is running, e:', e);
  // e.stopPropagation();
};
  
</script>

<template>
  <div
    id="refine-panel-component"
    :class="refinePanelClass"
  >

    <div
      id="refine-top"
      :class="refineTitleClass + ' refine-title is-flex is-flex-direction-row'"
      tabindex="0"
      role="button"
      @click="expandRefine"
    >
      <div class="refine-top-left is-flex is-flex-direction-row">

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

        <button
          v-if="!i18nEnabled && (selectedArray.length || anyValueEntered)"
          class="clear-all"
          @click.prevent="clearAll"
        >
          Clear all
        </button>

        <button
          v-if="i18nEnabled && (selectedArray.length || anyValueEntered)"
          class="clear-all"
          @click.prevent="clearAll"
          v-html="$t('refinePanel.clearAll')"
        />

        <!-- v-if="!isMobile" -->
        <div
          id="selected-boxes"
          class="selected-boxes columns is-mobile"
        >
        <!-- @click="clickBox" -->
          <button
            v-for="box in keywordsEntered"
            class="box-value column is-narrow"
            @click="(e) => closeKeywordsBox(e, box)"
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
            @click="(e) => closeZipcodeBox(e, zipcodeEntered)"
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
            @click="(e) => closeAddressBox(e, addressEntered)"
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
            v-for="box in selectedArray"
            class="box-value column is-narrow"
            @click="(e) => closeBox(e, box)"
          >
            {{ $t(getBoxValue(box)) }}
            <font-awesome-icon
              class="fa-x"
              :icon="[timesIconWeight,'times']"
            />
          </button>
          <button
            v-if="refineType == 'categoryField_value' && selected != null && i18nEnabled"
            class="box-value column is-narrow"
            @click="(e) => closeBox(e, selected)"
          >
            {{ $t('sections.' + getCategoryFieldValue(selected) + '.header') }}
            <font-awesome-icon
              class="fa-x"
              :icon="[timesIconWeight,'times']"
            />
          </button>
          <button
            v-if="refineType == 'categoryField_value' && selected != null && !i18nEnabled"
            class="box-value column is-narrow"
            @click="(e) => closeBox(e, selected)"
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
        class="open-close-icon is-flex is-pulled-right"
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

    </div>

    <div
      id="refine-bottom"
      class="refine-bottom invisible-scrollbar"
      v-show="!retractable && !isMobile || refineOpen"
      :style="isMobile ? { 'height': bottomHeight + 'px' } : null"
    >

      <div
        v-if="dataStatus === 'success' && ['categoryField_array', 'multipleFields'].includes(refineType)"
        v-show="!retractable && !isMobile || refineOpen"
        id="field-div"
        class="refine-holder"
      >
        <tooltip-checkbox
          :options="refineListTranslated"
          :numOfColumns="NumRefineColumns"
          :small="!isMobile"
          v-model="selected"
          :value="selected"
          value-key="data"
          text-key="textLabel"
        >
        </tooltip-checkbox>
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
              :id="'radio_'+ind"
              v-model="selectedList['radio_'+ind]"
              v-if="refineListTranslated[ind]['radio']"
              :options="refineListTranslated[ind]['radio']"
              text-key="textLabel"
              value-key="data"
              :small="!isMobile"
              :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)"
            >
              <template v-slot:label>
                <div :class="isMobile ? 'large-label': 'small-label'">
                  {{ $t(ind + '.category') }}
                </div>
              </template>
            </radio>

            <tooltip-checkbox
              v-if="refineListTranslated[ind]['checkbox']"
              :options="refineListTranslated[ind]['checkbox']"
              :small="!isMobile"
              v-model="selectedList['checkbox_'+ind]"
              :value="selectedList['checkbox_'+ind]"
              text-key="textLabel"
              value-key="data"
              shrinkToFit="true"
              :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)"
            >
              <template v-slot:label>
                <div :class="isMobile ? 'large-label': 'small-label'">
                  {{ $t(ind + '.category') }}
                  <icon-tool-tip
                    v-if="!isMobile && refineListTranslated[ind]['tooltip']"
                    :tip="refineListTranslated[ind]['tooltip']"
                    :circle-type="'click'"
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
              </template>
            </tooltip-checkbox>
          </div>
        </div>
      </div>

      <!-- if using multipleFieldGroups option and dropdownRefine -->
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
                  :id="'radio_'+ind"
                  v-model="selectedList['radio_'+ind]"
                  v-if="refineListTranslated[ind]['radio']"
                  :options="refineListTranslated[ind]['radio']"
                  text-key="textLabel"
                  value-key="data"
                  :small="!isMobile"
                  :num-of-columns="calculateColumns(refineList[ind]['radio'], ind)"
                >
                </radio>

                <tooltip-checkbox
                  v-if="refineListTranslated[ind]['checkbox']"
                  :options="refineListTranslated[ind]['checkbox']"
                  :small="!isMobile"
                  v-model="selectedList['checkbox_'+ind]"
                  text-key="textLabel"
                  value-key="data"
                  shrinkToFit="true"
                  :num-of-columns="calculateColumns(refineList[ind]['checkbox'], ind)"
                >
                </tooltip-checkbox>
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
                <template v-slot:label>
                  {{ $t(ind + '.category') }}
                  <icon-tool-tip
                    v-if="Object.keys(infoCircles).includes(ind)"
                    :item="ind"
                    :circleData="infoCircles[ind]"
                    :circleType="'click'"
                  >
                  </icon-tool-tip>
                </template>
              </radio>

              <tooltip-checkbox
                :options="refineListTranslated[ind]['checkbox']"
                :num-of-columns="1"
                :small="!isMobile"
                v-model="selectedList[ind]"
                text-key="textLabel"
                value-key="data"
                shrinkToFit="true"
                @change="checkboxChange()"
                @update:modelValue="checkboxChange()"
              >
                <template
                  v-slot:label
                  v-if="!refineListTranslated[ind]['radio']"
                >
                  {{ $t(ind + '.category') }}
                  <icon-tool-tip
                    v-if="Object.keys(infoCircles).includes(ind)"
                    :item="ind"
                    :circleData="infoCircles[ind]"
                    :circleType="'click'"
                  >
                  </icon-tool-tip>
                </template>
              </tooltip-checkbox>
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
  </div>
</template>

<style lang="scss">
@import "../assets/main_pin.scss";

#refine-panel-component {
  background: #f0f0f0;
  overflow-x: hidden;
}

#columns-div-for-checkboxes {

  .input-checkbox, .input-radio {
    padding-bottom: 8px;
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
    flex: 1 0 100%;
    color: #0f4d90;
    margin: 0px !important;

    .refine-top-left {
      flex-grow: 11;
    }

    .open-close-icon {
      flex-grow: 1;
      flex-direction: row-reverse;
    }

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

    .refine-bottom {
      // height: calc(100vh - 130px);
      overflow-y: auto;
    }

    .clear-all {
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
      border-style: none;
      background-color: rgb(240, 240, 240);
      color: #0f4d90;
      padding-left: 0px;
      padding-top: 9px;
      padding-right: 0px;
    }

    .refine-title{
      cursor: pointer;
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
      // overflow-y: scroll;
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
  // z-index: 1001;
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
  color: #0f4d90;
  font-size: 14px;
  margin-bottom: .5rem;
  padding-left: 10px;
}

.fa-infoCircle {
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

.input-wrap {
  padding-top: 0px !important;
}

.input-wrap.input-checkbox .is-checkradio+label:hover::before, .input-wrap.input-radio .is-checkradio+label:hover::before {
  border-width: 2px !important;
}

.is-checkradio[type=checkbox]:focus:not([disabled])+label::before, .is-checkradio[type=checkbox]:focus:not([disabled])+label:before, .is-checkradio[type=radio]:focus:not([disabled])+label::before, .is-checkradio[type=radio]:focus:not([disabled])+label:before {
  border-width: 2px !important;
  border-color: #2176d2 !important;
}

.open-close-icon {
  padding-top: 10px;
  padding-right: 6px;
  font-size: 24px;
}

</style>
