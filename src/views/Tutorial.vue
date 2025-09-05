<script setup>

import { useMainStore } from '../stores/MainStore.js';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();

import { useConfigStore } from '../stores/ConfigStore.js';
const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

const MainStore = useMainStore();

onMounted(() => {
  console.log('Tutorial component mounted');
  MainStore.firstRouteLoaded = true;
});

</script>

<template>
  <div class="tutorial-scroller">
    <div class="tutorial-container">
      <img :src="$config.tutorial[route.params.file]"/>
    </div>
  </div>
</template>

<style>

.tutorial-scroller {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
}

.tutorial-container {
  width: auto;
  height: auto;
}

</style>
