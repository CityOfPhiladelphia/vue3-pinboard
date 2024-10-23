<script setup>

import { getCurrentInstance } from 'vue';
const instance = getCurrentInstance();
import { useConfigStore } from '../stores/ConfigStore.js'
const ConfigStore = useConfigStore();
const $config = ConfigStore.config;

import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const isMobile = computed(() => {
  return MainStore.isMobileDevice;
});
  
const i18nLocale = computed(() => {
  return instance.appContext.config.globalProperties.$i18n.locale;
});

const i18nEnabled = computed(() => {
  if ($config.i18n && $config.i18n.enabled) {
    return true;
  } else {
    return false;
  }
});

const alertContent = computed(() => {
  let value;
  if (i18nEnabled.value) {
    value = t(app.bannerAlert);
  } else if ($config.alerts && $config.alerts.header && $config.alerts.header.content) {
    value = $config.alerts.header.content;
  } else {
    value = '<b>Until further notice:</b> Please call ahead or check hours of operation while business restrictions are still in effect.'
  }
  return value;
});

</script>

<template>
  <div class="background-div">
    <div class="alert">
      <font-awesome-icon
        v-if="!isMobile"
        icon="exclamation"
      />
      <p
        class="inline-paragraph no-margin"
        v-html="alertContent"
      />
    </div>
  </div>
</template>

<style>

.background-div {
  background: #ffffff;
  padding: 10px;
}

.alert {
  background: #cc3000;
  font-size: 16px;
  color: white;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 20px;
  padding-right: 20px;
}

.inline-paragraph {
  display: inline-block;
  margin-left: 20px;
}

.no-margin {
  margin-bottom: 0px;
}

.side-padding {
  padding-left: 10px;
  padding-right: 10px;
}

</style>
