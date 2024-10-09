<script setup>

import useSharedFunctions from '@/composables/useSharedFunctions.js';
const { getSiteName } = useSharedFunctions();
// import { library } from '@fortawesome/fontawesome-svg-core';
import { findIconDefinition } from '@fortawesome/fontawesome-svg-core';

import { useMapStore } from '@/stores/MapStore.js'
const MapStore = useMapStore();
import { useDataStore } from '@/stores/DataStore.js'
const DataStore = useDataStore();

import { ref, computed, defineProps, onMounted, watch } from 'vue';

import $config from '@/app/main.js'
console.log('$config:', $config);

const props = defineProps({
  // isMapVisible: Boolean,
  // item: Object,
  // checked: Boolean,
  isMapVisible: {
    type: Boolean,
    default: true,
  },
  item: {
    type: Object,
  },
  checked: {
    type: Boolean,
    default: false,
  }
});
  
const locationOpen = ref(false);

const printCheckboxes = computed(() => {
  return DataStore.printCheckboxes;
})

const allowPrint = computed(() => {
  let value = false;
  if ($config.allowPrint) {
    value = true;
  }
  return value;
});

const locationClass = computed(() => {
  let value;
  if (locationOpen.value && this.isMobile) {
    value = 'location-content-mobile location-open';
  } else if (locationOpen.value) {
    value = 'location-content location-open';
  } else if (props.isMobile) {
    value = 'location-content-mobile';
  } else {
    value = 'location-content';
  }
  return value;
});

const plusIconWeight = computed(() => {
  let value = 'fas';
  let regularExists = findIconDefinition({ prefix: 'far', iconName: 'plus' });
  // console.log('expandCollapse.vue computed, library:', library, 'regularExists:', regularExists);
  if (regularExists) {
    value = 'far';
  }
  return value;
});

const showLabels = computed(() => {
  let value = false;
  if ($config.refine.showLabels) {
    value = true;
  }
  return value;
});

const i18nEnabled = computed(() => {
  let value;
  if ($config.i18n && $config.i18n.enabled) {
    value = true;
  } else {
    value = false;
  }
  return value;
});

const subsections = computed(() => {
  return $config.subsections || {};
});

const section = computed(() => {
  let section;
  let category;
  if (props.item.attributes) {
    category = props.item.attributes['CATEGORY'] || props.item.attributes['category'];
  }
  if (Object.keys(subsections.value).length) {
    section = subsections.value[category];
  } else if ($config.sections) {
    section = props.item.site_type;
  }
  return section;
});

const sectionItem = computed(() => {
  let sectionItem = {};
  if (Object.keys(subsections.value).length) {
    sectionItem = $config.sections;
  }
  return sectionItem;
});

const sectionTitle = computed(() => {
  let sectionTitle;
  if (Object.keys(subsections.value).length) {
    // sectionTitle = section.value;
    sectionTitle = $config.sections[section.value].titleSingular;
  } else if ($config.sections) {
    sectionTitle = props.item.site_type;
  }
  return sectionTitle;
});

const sectionColor = computed(() => {
  let sectionColor;
  if (Object.keys(subsections.value).length) {
    sectionColor = $config.sections[section.value].color;
  } else if ($config.sections) {
    sectionColor = $config.sections[section.value].color;
  }
  return sectionColor;
});

const selectedResources = computed(() => {
  return DataStore.selectedResources;
});

const latestSelectedResourceFromMap = computed(() => {
  return MapStore.latestSelectedResourceFromMap;
});



watch(
  () => selectedResources,
  nextSelectedResources => {
    // console.log('watch selectedResources is running');
    if (locationOpen.value || nextSelectedResources.includes(props.item._featureId)) {
      if (locationOpen.value === false) {
        openLocation();
      } else if (locationOpen.value && !nextSelectedResources.includes(props.item._featureId)) {
        locationOpen.value = false;
      }
    } else {
      locationOpen.value = false;
    }
  }
);

watch(
  () => props.isMapVisible,
  nextIsMapVisible => {
    console.log('ExpandCollapse watch isMapVisible');
    if (!nextIsMapVisible) {
      if (this.latestSelectedResourceFromMap) {
        console.log('ExpandCollapse is reporting map is invisible and there is a this.latestSelectedResourceFromMap:', this.latestSelectedResourceFromMap);
        if (this.latestSelectedResourceFromMap === props.item._featureId) {
          const el = this.$el;
          const visible = this.isElementInViewport(el);
          if (!visible) {
            console.log('ExpandCollapse in if in if');
            el.scrollIntoView({ block: 'center' });
          }
        }
      }
    }
  }
)

onMounted(async () => {
    // console.log('ExpColl mounted:', evaluateSlot(slots.siteName));
    if (selectedResources.value.includes(props.item._featureId)) {
      openLocation();
    }

    let values = []
    // if (this.printCheckboxes.length) {
    //   for (let checkbox of this.printCheckboxes) {
    //     if (checkbox == props.item._featureId) {
    //       values.push(true);
    //     }
    //   }
    // }
    if (values.includes(true)) {
      // console.log('ExpandCollapse mounted, values includes true, this.printCheckboxes:', this.printCheckboxes, 'props.item._featureId:', props.item._featureId, 'this.printCheckboxes.includes(props.item_featureId):', this.printCheckboxes.includes(props.item_featureId));
      document.getElementById('checkbox'+props.item._featureId).checked = true;
    }

    // window.addEventListener('keydown', (e) => {
    //   console.log('keydown is running, e', e);
    //   if (e.keyCode === 32 && e.target === document.body) {
    //     e.preventDefault();
    //   }
    // });

    // let divButton = document.querySelector('#refine-top');
    // divButton.addEventListener('keypress', activate.bind(this));
    // function activate(e) {
    //   console.log('activate, e:', e, 'e.path[0]:', e.path[0]);
    //   if (e.type === 'keypress' && [ 13, 32 ].includes(e.keyCode) && e.srcElement.id == 'refine-top') {
    //     this.expandRefine();
    //   }
    // };
});

const clickCheckBox = (e) => {
  console.log('clickCheckBox is running, e:', e, 'props.item._featureId:', props.item._featureId);
  this.$emit('print-box-checked', props.item._featureId);
};

const openPrintView = (e) => {
  e.stopPropagation();
  console.log('openPrintView is running, e:', e, 'props.item._featureId:', props.item._featureId);
  window.open('./resource-view/' + props.item._featureId, '_blank');
};

const openLocation = () => {
  locationOpen.value = true;
  const el = document.getElementsByClassName(props.item._featureId)[0];
  console.log('ExpandCollapse openLocation is running, el:', el);
  let visible = this.isElementInViewport(el);
  console.log('ExpandCollapse visible 1:', visible)
  if (!visible) {
    el.scrollIntoView({ block: 'center' });
  }
};

const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect();
  // console.log('bounding box', rect);
  const visibility = {
    // TODO the 108 below is account for the combined height of the
    // app header and address header. this is not a good long-term
    // solution - instead, use the `bottom` value of the address header's
    // bounding rect. however, this should only fire on small devices,
    // which would require again hard-coding screen breakpoints from
    // standards or some other magic, which might not a huge
    // improvement in terms of decoupling logic and presentation. hmm.
    top: rect.top >= 108,
    left: rect.left >= 0,
    bottom: rect.bottom <= (window.innerHeight || document.documentElement.clientHeight),
    right: rect.right <= (window.innerWidth || document.documentElement.clientWidth),
  };
  // console.log('visibility', visibility);

  // return if all sides are visible
  return Object.values(visibility).every(val => val);
};

const expandLocation = () => {
  let siteName = getSiteName(props.item);
  // console.log('ExpandCollapse expandLocation is starting, siteName:', siteName);
  locationOpen.value = !locationOpen.value;
  const selectedResource = props.item._featureId;
  const selectedResources = [];
  let latestSelectedResourceFromExpand = null;
  if (locationOpen.value) {
    selectedResources.push(selectedResource);
    latestSelectedResourceFromExpand = selectedResource;
    // this.$gtag.event('list-click', {
    //   'event_category': this.$store.state.gtag.category,
    //   'event_label': siteName,
    // });
  } else {
    selectedResources.splice(selectedResources.indexOf(selectedResource), 1);
  }
  // console.log('ExpandCollapse expandLocation after selectedResources is defined');

  this.$store.commit('setSelectedResources', selectedResources);
  this.$store.commit('setLatestSelectedResourceFromExpand', latestSelectedResourceFromExpand);
};

const makeID = (itemTitle) =>{
  // console.log('itemTitle:', itemTitle);
  let value;
  if (itemTitle) {
    value = itemTitle.replace(/\s+/g, '-').toLowerCase();
  } else {
    value = '';
  }
  return value;
};

</script>

<template>
  <div class="whole-item">
    <div
      class="location-item columns is-mobile pr-2"
      :class="{ 'open': locationOpen }"
    >
      <div
        v-if="allowPrint && !isMobile"
        class="field column expand-collapse-checkbox is-1 pt-4 pb-0"
      >
        <div class="checkbox-height-fixer">
          <input
            class="is-checkradio location-checkbox"
            :id="'checkbox'+item._featureId"
            type="checkbox"
            :name="'checkbox'+item._featureId"
            @click="clickCheckBox"
          >
          <label
            :for="'checkbox'+item._featureId"
            class="checkbox-label"
          >
          </label>
        </div>
      </div>
      <div
        class="column is-12-mobile p-0"
        :class="allowPrint ? 'is-11-tablet': 'is-12-tablet pl-3'"
      >
        <div
          class="columns location-row is-mobile"
          :class="allowPrint ? 'pl-0': 'pl-2'"
          tabindex="0"
          @click="expandLocation"
          @keypress.space.prevent
          @keyup.space="expandLocation"
          @keyup.enter="expandLocation"
        >
          <div
            class="location-title column"
            :class="{ 'is-8': locationOpen && $config.printView, 'is-11': !locationOpen }"
          >
            <span
              class="h5 location-name"
              :class="item._featureId"
              :aria-expanded="locationOpen"
            >
              {{ getSiteName(item) }}
              <div
                v-if="section && !i18nEnabled"
                class="section-name"
                :style="{ 'background-color': sectionColor }"
                >
                {{ sectionTitle }}
              </div>
              <div
                v-if="section && i18nEnabled"
                class="section-name"
                :style="{ 'background-color': sectionColor }"
                v-html="'<b>'+$t('categoryType.' + sectionTitle)+'</b>'"
              >
              </div>
            </span>
          </div>

          <div class="location-icon column is-1">
            <font-awesome-icon
              v-if="!locationOpen"
              :icon="[plusIconWeight, 'plus']"
              class="plus-icon"
            />
            <font-awesome-icon
              v-if="locationOpen"
              :icon="[plusIconWeight, 'minus']"
            />
          </div>
        </div>
      </div>
    </div>

    <div :class="locationClass">
      <slot />
    </div>

  </div>
</template>


<!-- @import "../assets/scss/main.scss"; -->
<style lang="scss">

.expand-collapse-checkbox {
  margin-bottom: 0px !important;
}

.checkbox-height-fixer {
  height: 40px !important
}

// .is-checkradio[type=checkbox]+label {
//   border-width: 2px !important;
//   border-color: #2176d2 !important;
// }

// .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label:before, .is-checkradio[type=radio]:not([disabled])+label::before, .is-checkradio[type=radio]:not([disabled])+label:before {
.is-checkradio[type=checkbox].location-checkbox:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled])+label:before {
  background-color: white;
}

.is-checkradio[type=checkbox].location-checkbox:not([disabled]):checked+label::before, .is-checkradio[type=checkbox].location-checkbox:not([disabled]):checked+label:before, .is-checkradio[type=radio]:not([disabled]):checked+label::before, .is-checkradio[type=radio]:not([disabled]):checked+label:before {
  background-color: #2176d2 !important;
}

// .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label:before, .is-checkradio[type=radio]:hover:not([disabled])+label::before, .is-checkradio[type=radio]:hover:not([disabled])+label:before {
.is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label::before, .is-checkradio[type=checkbox].location-checkbox:hover:not([disabled])+label:before {
  border-width: 2px !important;
  border-color: #2176d2 !important;
  background-color: white;
}

.is-checkradio[type=checkbox].location-checkbox+label:after {
  border-width: 2px !important;
  border-color: #2176d2 !important;
  background-color: white;
}

// .is-checkradio[type=checkbox]:checked+label::after, .is-checkradio[type=checkbox]:checked+label:after, .is-checkradio[type=radio]:checked+label::after, .is-checkradio[type=radio]:checked+label:after {
.is-checkradio[type=checkbox]:checked+label::after, .is-checkradio[type=checkbox]:checked+label:after {
  border-width: 2px !important;
  border-color: white !important;
  background-color: #2176d2 !important;
}

.location-name {
  line-height: .5rem;
}

.checkbox-label {
  width: 10px !important;
  margin-right: 0px !important;
  height: 56px;
}

.whole-item {
  border-bottom: 1px solid black;
}

.location-item {
  // border-bottom: 1px solid black;
  position: relative;
  height: 100%;
  padding-top: 12px;
  margin-bottom: 0px !important;

  &:hover .location-row{
    background: #2176d2;
    color: white;

    .plus-icon {
      color: white;
    }
  }

  &:hover .expand-collapse-checkbox{
    background: #2176d2;
    color: white;

    .plus-icon {
      color: white;
    }
  }

  .location-row {
    cursor: pointer;
    padding: 0px;
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    margin-left: 0px !important;
    margin-right: 0px !important;

    &:hover{
      background: #2176d2;
      color: white;

      .plus-icon {
        color: white;
      }
    }
  }

  .location-icon {
    padding-top: 1rem;
    padding-bottom: 1rem;
    text-align: right;
  }

  .section-name {
    text-transform: uppercase;
    position: relative;
    top: -3px;
    padding-left: 14px;
    padding-right: 14px;
    padding-top: 7px;
    font-size: 12px;
    border-style: solid;
    border-width: 1px;
    display: inline-block;
    color: white;
    height: 24px;
  }

  &.open{
    .location-row {
      color:white;
      background-color: #0f4d90;
    }

    .expand-collapse-checkbox {
      color:white;
      background-color: #0f4d90;
    }

    h2 {
      font-weight: 900 !important;
    }
  }

  .location-content{
    overflow: hidden;
    height:0;

    &.location-open{
      padding-top: 1rem;
      padding-bottom: 1rem;
      padding-right: 0px;
      padding-left: 0px;
      height: 100%;
      overflow: initial;
    }
  }

  .location-content-mobile{
    overflow: hidden;
    height:0;

    &.location-open{
      padding-top: 1rem;
      padding-bottom: 1rem;
      padding-right: 0px;
      padding-left: 0px;
      height: 100%;
      overflow: initial;
    }
  }
}

.plus-icon {
  color: #0f4d90;
}

.print-view-button {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.print-button {
  padding-left: 5px !important;
  padding-right: 5px !important;
}

.location-item {
  .location-title {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
}

@media (max-width: 499px) {
  .print-view-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
} 

@media (min-width: 500px) and (max-width: 767px) {
  .print-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
} 

@media (min-width: 768px) and (max-width: 1049px) {
  .print-view-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 1rem;
    }
  }
}

@media (min-width: 1050px) {
  .print-button {
    display: none !important;
  }

  .location-item {
    .location-title {
      padding-left: 0rem;
    }
  }
} 

</style>
