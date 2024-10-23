import { defineStore } from 'pinia';

export const useConfigStore = defineStore('ConfigStore', {
  state: () => {
    return {
      config: {},
    };
  },
  actions: {
    setConfig(config) {
      this.config = config;
    }
  }
});