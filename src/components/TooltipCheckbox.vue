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
   * Must match the unique_key of the checkbox that acts as the toggle for the group
   */
  toggleKey: {
    type: String,
    default: '',
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
const toggledValues = ref([]);
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

// split the options into checkboxes and a toggle
const checkboxes = computed(() => { return props.toggleKey ? props.options.filter((option) => option.data !== props.toggleKey) : props.options });
const toggle = computed(() => { return props.toggleKey ? props.options.filter((option) => option.data === props.toggleKey)[0] : {} })

watch(
  () => props.value,
  async newValue => {
    localValue.value = newValue;
  }
)

watch(
  () => error,
  async () => {
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

// check if the key of the toggle is in the selected group
// if so, then save all the other selected items in the toggledValues ref and emit only the toggle key
// if toggle key is not present, then emit the values saved in the toggledValues
const onToggle = (e) => {
  if (import.meta.env.VITE_DEBUG) console.log('Checkbox onToggle e:', e);
  const toggleOn = Object.values(localValue.value).includes(props.toggleKey);
  if (toggleOn) {
    toggledValues.value = localValue.value.splice(0).filter((value) => value !== props.toggleKey)
  };
  const emitObj = toggleOn ? [props.toggleKey] : toggledValues.value;
  $emit("change", e);
  $emit("update:modelValue", emitObj)
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
        <div
          v-for="(option, key) in checkboxes"
          :key="`k-${key}`"
        >
          <input
            v-if="localValue.includes(props.toggleKey)"
            :id="`cb-${key}-${id}`"
            :name="`cb-${key}-${id}`"
            type="checkbox"
            class="is-checkradio"
            disabled
          >
          <input
            v-else
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
          <label :for="`cb-${key}-${id}`">
            {{ !textKey ? option : option[textKey] }}
            <slot name="tooltip" />
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
            :circle-type="'hover'"
            :multiline="option.tooltip.multiline"
          />
        </div>
        <!-- If group is toggleable, render final checkbox as toggle for the group -->
        <div
          v-if="props.toggleKey"
          :key="`k-${props.options.length}`"
          class="checkbox-toggle"
        >
          <label
            :for="`toggle-${props.options.length}-${id}`"
            :class="isMobile ? 'toggle-text-mobile' : 'toggle-text'"
          >
            <input
              :id="`toggle-${props.options.length}-${id}`"
              v-model="localValue"
              :name="`toggle-${props.options.length}-${id}`"
              type="checkbox"
              :aria-checked="value.includes(optionValue(toggle, props.options.length))"
              class="toggle"
              role="checkbox"
              v-bind="toggle.attrs || {}"
              :value="optionValue(toggle, props.options.length)"
              @change="onToggle()"
            >
            {{ !textKey ? toggle : toggle[textKey] }}
            <slot name="tooltip" />
            <div
              v-if="isMobile && toggle.tooltip"
              class="mobile-tooltip"
            >
              <font-awesome-icon
                icon="info-circle"
                class="fa-infoCircle"
              />
              {{ toggle.tooltip.tip }}
            </div>
          </label>
          <icon-tool-tip
            v-if="!isMobile && toggle.tooltip"
            :tip="toggle.tooltip.tip"
            :circle-type="'hover'"
            :multiline="toggle.tooltip.multiline"
          />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<style>

.checkbox-toggle {
  margin-top: 0.5rem;
}

.checkbox-toggle input[type=checkbox] {
  cursor: pointer;
}

.toggle {
  top: 0.1875rem;
  left: -0.0625rem;
  appearance: none;
  background-color: #cfcfcf;
  border-radius: 1rem;
  border-style: none;
  position: relative;
  width: 1.8rem;
  height: 1.125rem;
}

.toggle-text-mobile {
  font-size: 1.063rem !important;
  margin-top: .25rem;
  margin-left: -2rem;
}

.toggle-text {
  font-size: .875rem !important;
}

.toggle::before {
  bottom: -0.375rem;
  left: -0.375rem;
  position: absolute;
  right: -0.375rem;
  top: -0.375rem;
}

.toggle::after {
  transition: all 100ms ease-out;
}

.toggle::after {
  background-color: #ffffff;
  border-radius: 50%;
  content: "";
  height: .875rem;
  width: .875rem;
  position: absolute;
  top: 0.125rem;
  left: 0.175rem;
}

.toggle:checked {
  background-color: #2176d2;
}

.toggle:checked::after {
  background-color: #ffffff;
  left: 0.775rem;
}

.mobile-tooltip {
  font-size: .85rem;
  line-height: 1rem;
}
</style>
