<script setup>
import { useMainStore } from '../stores/MainStore.js';
import { ref, computed, watch } from 'vue';

const MainStore = useMainStore();

import IconToolTip from './IconToolTip.vue';

/**
 * Displays one or more checkboxes
 * @niceName Checkboxes
 * @group Inputs
 * @position 210
 */

const props = defineProps({
  /**
   * The checkboxes options.
   * @values Array of Strings, Array of Objects, Object
   */
  options: {
    type: [Object, Array],
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
    type: [Array],
    default() {
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
    type: [String, Number],
    default: 1,
  },

  /**
   * Use small checkboxes
   */
  small: {
    type: Boolean,
    default: false,
  },

  /**
   * Last checkbox will toggle the group of checkboxes active or inactive
   */
  toggleKey: {
    type: String,
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
    type: [Array, String],
    default() {
      return '';
    },
  },
});

const localValue = ref(props.value);
const $emit = defineEmits(["update:modelValue", "change"]);

// computed
const error = computed(() => {
  if (Array.isArray(props.errors)) {
    return props.errors[0];
  }
  return props.errors;
});

const classes = computed(() => {
  let classes = [];
  if (error.value) {
    classes.push('has-error');
  }
  return classes.join(" ");
});

const isMobile = computed(() => {
  return MainStore.windowDimensions.width < 768;
});

const checkRadioClasses = computed(() => {
  if (props.small) {
    return `${classes.value} small-checkradio`;
  }
  return classes.value;
});

const availableOptions = computed(() => {
  return props.toggleKey ? props.options.splice(0, props.options.length - 1) : props.options;
})

watch(
  () => props.value,
  async newValue => {
    localValue.value = newValue;
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

const optionValue = (option, key) => {
  if (Array.isArray(props.options)) {
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

const onToggle = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('Checkbox onToggle e:', e);
  const toggleOn = Object.values(localValue.value).includes(props.toggleKey);
  if (toggleOn) { MainStore.toggledValues[props.toggleKey] = localValue.value.splice(0).filter((value) => value !== props.toggleKey) };
  const emitObj = toggleOn ? [props.toggleKey] : MainStore.toggledValues[props.toggleKey];
  $emit("change", e);
  $emit("update:modelValue", emitObj)
};

</script>

<template>
  <div class="input-wrap input-checkbox" :class="checkRadioClasses">
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
      <div v-if="desc" class="is-field-info">
        {{ desc }}
      </div>
      <template v-else>
        <div v-if="$slots['desc']" class="is-field-info">
          <!-- @slot Alternative description -->
          <slot name="desc" />
        </div>
      </template>
      <div :id="`cb-group-${id}`" :style="`columns: ${numOfColumns} auto`">
        <div v-for="(option, key) in availableOptions" :key="`k-${key}`">
          <input v-if="localValue.includes(props.toggleKey)" :id="`cb-${key}-${id}`" :name="`cb-${key}-${id}`"
            type="checkbox" class="is-checkradio" disabled>
          <input v-else :id="`cb-${key}-${id}`" v-model="localValue" :name="`cb-${key}-${id}`" type="checkbox"
            :aria-checked="value.includes(optionValue(option, key))" class="is-checkradio" role="checkbox"
            v-bind="option.attrs || {}" :value="optionValue(option, key)" @change="onChange()">
          <label :for="`cb-${key}-${id}`">
            {{ !textKey ? option : option[textKey] }}
            <slot name="tooltip" />
            <div v-if="isMobile && option.tooltip" class="mobile-tooltip">
              <font-awesome-icon icon="info-circle" class="fa-infoCircle" />
              {{ option.tooltip.tip }}
            </div>
          </label>
          <icon-tool-tip v-if="!isMobile && option.tooltip" :tip="option.tooltip.tip" :circle-type="'hover'"
            :multiline="option.tooltip.multiline" />
        </div>
        <!-- If group is toggleable, render final checkbox as toggle for the group -->
        <div v-if="props.toggleKey" :key="`k-${props.options.length}`" class="control">
          <input :id="`toggle-${props.options.length}-${id}`" v-model="localValue"
            :name="`toggle-${props.options.length}-${id}`" type="checkbox"
            :aria-checked="value.includes(optionValue(props.options.at(-1), props.options.length))"
            class="is-checkradio" role="checkbox" v-bind="props.options.at(-1).attrs || {}"
            :value="optionValue(props.options.at(-1), props.options.length)" @change="onToggle()">
          <label :for="`toggle-${props.options.length}-${id}`">
            {{ !textKey ? props.options.at(-1) : props.options.at(-1)[textKey] }}
            <slot name="tooltip" />
            <div v-if="isMobile && props.options.at(-1).tooltip" class="mobile-tooltip">
              <font-awesome-icon icon="info-circle" class="fa-infoCircle" />
              {{ props.options.at(-1).tooltip.tip }}
            </div>
          </label>
          <icon-tool-tip v-if="!isMobile && props.options.at(-1).tooltip" :tip="props.options.at(-1).tooltip.tip"
            :circle-type="'hover'" :multiline="props.options.at(-1).tooltip.multiline" />
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

.inactive {
  cursor: not-allowed;
  opacity: .5;
}
</style>
