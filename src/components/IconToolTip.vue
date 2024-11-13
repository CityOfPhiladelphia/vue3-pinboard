<script setup>

import { computed } from 'vue';

const props = defineProps({
  tip: {
    type: String,
    default: '',
  },
  circleType: {
    type: String,
    default: 'hover',
  },
  position: {
    type: String,
    default: 'right',
  },
  multiline: {
    type: Boolean,
    default: false,
  },
});
    
//computed
const tooltipPosition = computed(() => {
  let value;
  if (props.position === 'right') {
    value = 'has-tooltip-right';
  } else if (props.position === 'bottom') {
    value = 'has-tooltip-bottom';
  } else if (props.position === 'left') {
    value = 'has-tooltip-left';
  }
  return value;
});

const tooltipMultiline = computed(() => {
  let value;
  if (props.multiline) {
    value = 'has-tooltip-multiline';
  }
  return value;
});

</script>

<template>
  <div
    :class="'inline has-tooltip-hidden-mobile has-tooltip-arrow ' + tooltipPosition + ' ' + tooltipMultiline"
    :data-tooltip="tip"
  >
    <font-awesome-icon
      v-if="circleType === 'hover'"
      icon="info-circle"
      class="fa-infoCircle"
    />
  </div>
</template>

<style lang="scss">

.inline {
  display: inline-block;
  padding-left: 4px;
}

.popup-tip {
  position: absolute;
  margin-left: 5px;
  width: 260px;
  background-color: rgb(15, 77, 144);
  color: white;
  z-index: 10002;
}

.right-side {
  right: 10px;
}

.full-div {
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
}

.half-div {
  position: relative;
  display: inline-block;
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 10px;
  padding-right: 10px;
  width: 130px;
  background-color: rgb(15, 77, 144);
  color: white;
}

ul {
  margin-bottom: 0px;
}

@media screen and (max-width: 749px) {
  .popup-tip {
    position: absolute;
    top: 10px !important;
    right: 10px !important;
    display: inline-block;
    margin-left: 5px;
    width: 220px;
    background-color: rgb(15, 77, 144);
    color: white;
    z-index: 10002;
  }
}

.has-tooltip-right::before {
  height: 24px;
  padding-top: 0px !important;
}


</style>
