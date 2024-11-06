<script setup>
import { useMainStore } from '../stores/MainStore.js';
import { useMapStore } from '../stores/MapStore.js';
import { useGeocodeStore } from '../stores/GeocodeStore.js';
import { useDataStore } from '../stores/DataStore.js';
import { useConfigStore } from '../stores/ConfigStore.js';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, getCurrentInstance, onMounted, watch, onBeforeMount } from 'vue';

const MainStore = useMainStore();

import IconToolTip from './IconToolTip.vue';

/**
 * Displays one or more checkboxes
 * @niceName Checkboxes
 * @group Inputs
 * @position 210
 */

  // inheritAttrs: false,

const props = defineProps({
  /**
   * The checkboxes options.
   * @values Array of Strings, Array of Objects, Object
   */
  options: {
    type: [ Object, Array ],
    default: () => {
      return {
        'option-1': 'Option 1',
        'option-2': 'Option 2',
        'option-3': 'Option 3',
      };
    },
  },
  /**
   * The Object key containing the checkbox text. Required when using options as an Array of Objects.
   */
  textKey: {
    type: String,
    default: "",
  },

  /**
   * The Object key containing the checkbox value. Required when using options as an Array of Objects.
   */
  valueKey: {
    type: String,
    default: "",
  },

  value: {
    type: [ Array ],
    default () {
      return [];
    },
  },

  /**
   * The label used for the checkbox or group of checkboxes
   */
  label: {
    type: String,
    default: '',
  },

  /**
   * The description used for the checkbox or group of checkboxes
   */
  desc: {
    type: String,
    default: '',
  },

  /**
   * Splits a group of checkboxes into columns 1 or more columns
   */
  numOfColumns: {
    type: [ String, Number ],
    default: 1,
  },

  /**
   * Use small checkboxes
   */
  small: {
    type: Boolean ,
    default: false,
  },
  /**
   * Random id is generated if none provided
   */
    id: {
    type: String,
    default: () => `ta_${Math.random().toString(12).substring(2, 8)}`,
  },
  /**
   * Error message
   */
  errors: {
    type: [ Array, String ],
    default () {
      return '';
    },
  },
});

const localValue = ref(props.value);
const $emit = defineEmits(["update:modelValue", "change"]);

//computed
const error = computed(() => {
  if (Array.isArray(props.errors)) {
    return props.errors[0];
  }
  return props.errors;
});

const classes = computed(() => {
  let classes = [];
  // if (this.$attrs.required !== undefined) {
  //   classes.push('required');
  // }
  if (error.value) {
    classes.push('has-error');
  }
  // if (this.innerLabel) {
  //   classes.push('inner-label');
  // }
  // if (this.forceInputBoxSize) {
  //   classes.push('input-width');
  // }
  return classes.join(" ");
});

const isMobile = computed(() => {
  return MainStore.isMobileDevice;
});

const tooltipType = computed(() => {
  let value;
  if (isMobile) {
    value = 'hover';
  } else {
    value = 'hover';
  }
  return value;
})

// const inputListeners = computed(() => {
//   console.log('this:', this);
//   delete this.$listeners['input'];

//   var vm = this;
//   return Object.assign({},
//     this.$listeners,
//     {
//       change: function (event) {

//         //IE11 needs the change event to be emitted as it does not listen to input
//         vm.$emit('change', vm.localValue);

//         //VeeValidate needs the input event to be emitted.
//         vm.$emit('input', vm.localValue);

//       },
//     },
//   );
// });

const checkRadioClasses = computed(() => {
  if (props.small) {
    return `${classes.value} small-checkradio`;
  }
  return classes.value;
});

// onMounted(async () => {
//   hasError();
// });

watch(
  () => props.value,
  async newValue => {
    localValue = newValue;
  }
)

watch(
  () => error,
  async => {
    if (Array.isArray(props.errors)) {
      return props.errors[0];
    }
    return props.errors;
  }
)

// methods: {
// const hasError = () => {
//   if (error.value) {
//     this.$parent.$emit('hasError', { [this.id]: this.error !== '' ? true : false });
//   }
// };

const optionValue = (option, key) => {
  let options = props.options;
  // if (this.optgroup) {
  //   options = this.ungroupedOptions;
  // }
  if (Array.isArray(options)) {
    if (typeof option === 'string') {
      return option;
    }
    if (typeof option === 'object') {
      return option[props.valueKey];
    }
  } else {
    return key;
  }
};

const onChange = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('Checkbox onChange e:', e);
  $emit("change", e);
  $emit("update:modelValue", localValue.value);
};

</script>

<template>
  <div
    class="input-wrap input-checkbox"
    :class="checkRadioClasses"
  >
    <fieldset>
      <legend>
        <template v-if="label">
          {{ label }}
        </template>
        <template v-else>
          <!-- @slot Alternative label -->
          <slot name="label" />
        </template>
      </legend>
      <template v-if="error">
        <div class="input-error-msg">
          <span class="icon"><i class="fas fa-exclamation-circle" /></span>
          <span>{{ error }}</span>
        </div>
      </template>
      <div
        v-if="desc"
        class="is-field-info"
      >
        {{ desc }}
      </div>
      <template v-else>
        <div
          v-if="$slots['desc']"
          class="is-field-info"
        >
          <!-- @slot Alternative description -->
          <slot name="desc" />
        </div>
      </template>
      <div
        :id="`cb-group-${id}`"
        :style="`columns: ${numOfColumns} auto`"
      >
      <!-- class="checkbox-margin-top" -->
        <div
          v-for="(option, key) in options"
          :key="`k-${key}`"
          class="control"
        >
        <!-- class="control ovvis" -->
          <input
            :id="`cb-${key}-${id}`"
            v-model="localValue"
            :name="`cb-${key}-${id}`"
            type="checkbox"
            :aria-checked="value.includes(optionValue(option, key))"
            class="is-checkradio"
            role="checkbox"
            v-bind="option.attrs || {}"
            :value="optionValue(option, key)"
            @change="onChange()"
          >
            <!-- v-on="inputListeners" -->
          <label
            :for="`cb-${key}-${id}`"
          >
            {{ !textKey ? option : option[textKey] }}
            <div
              v-if="isMobile && option.tooltip"
              class="mobile-tooltip"
            >
              <font-awesome-icon
                icon="info-circle"
                class="fa-infoCircle"
              />
              {{ option.tooltip.tip }}
            </div>
          </label>
          <icon-tool-tip
            v-if="!isMobile && option.tooltip"
            :tip="option.tooltip.tip"
            :circle-type="tooltipType"
            :multiline="option.tooltip.multiline"
          />
          <!-- :position="'bottom'" -->

        </div>
      </div>
    </fieldset>
  </div>
</template>

<style>

.mobile-tooltip {
  font-size: .85rem;
  line-height: 1rem;
}
/* .checkbox-margin-top {
  overflow: visible;
}

.checkbox-margin-top:before, .checkbox-margin-top:after {
  content: ' ';
  display: block;
  height: 5px;
}

.ovvis {
  overflow: visible;
} */

</style>
