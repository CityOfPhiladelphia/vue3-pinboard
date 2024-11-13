import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useConfigStore } from './stores/ConfigStore.js';

console.log('test, import.meta.env.VITE_DEBUG:', import.meta.env.VITE_DEBUG);

import { createI18n } from 'vue-i18n'

import App from './App.vue'
import router from './router'

import mergeDeep from './util/merge-deep';

import 'vue-good-table-next/dist/vue-good-table-next.css'
import "bulma";
import '@phila/phila-ui-core/dist/styles/scss/all.scss';
// import './assets/main.scss';
import "@fortawesome/fontawesome-pro/css/fontawesome.min.css";
import "@fortawesome/fontawesome-pro/css/solid.min.css";
import './assets/main_pin.scss';
import './assets/style.scss';
import '@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css';

import PhilaUICore from "@phila/phila-ui-core";
import AppHeader from "@phila/phila-ui-app-header";
import AppFooter from "@phila/phila-ui-app-footer";
import Callout from "@phila/phila-ui-callout";
import Dropdown from "@phila/phila-ui-dropdown";
import MobileNav from "@phila/phila-ui-mobile-nav";
import NavLink from "@phila/phila-ui-nav-link";
import Textbox from "@phila/phila-ui-textbox";
import LangSelector from "@phila/phila-ui-lang-selector";
import Radio from "@phila/phila-ui-radio";
import Checkbox from "@phila/phila-ui-checkbox";

import { library } from '@fortawesome/fontawesome-svg-core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { faUniversity } from '@fortawesome/free-solid-svg-icons';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faAngleUp } from '@fortawesome/free-solid-svg-icons';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { faCaretLeft } from '@fortawesome/free-solid-svg-icons';
import { faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faTint } from '@fortawesome/free-solid-svg-icons';
import { faClone } from '@fortawesome/free-solid-svg-icons';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faMinus } from '@fortawesome/free-solid-svg-icons';
import { faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope} from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

library.add(
  faSearch,
  faHome,
  faBook,
  faWrench,
  faUniversity,
  faGavel,
  faMapMarkerAlt,
  faSpinner,
  faBuilding,
  faExternalLinkAlt,
  faAngleUp,
  faAngleDown,
  faCaretLeft,
  faCaretRight,
  faTimes,
  faTint,
  faClone,
  faPhone,
  faPlus,
  faMinus,
  faSlidersH,
  faShareAlt,
  faPrint,
  faGlobe,
  faEnvelope,
  faCircleInfo,
);

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import VueGoodTablePlugin from 'vue-good-table-next';
import i18nFromFiles from './i18n/i18n.js';

export default function pinboard(config) {
  const app = createApp(App);
  if (import.meta.env.VITE_DEBUG) console.log('config:', config, 'app:', app);

  app.component("AppHeader", AppHeader);
  app.component("AppFooter", AppFooter);
  app.component("Callout", Callout);
  app.component("Dropdown", Dropdown);
  app.component("MobileNav", MobileNav);
  app.component("NavLink", NavLink);
  app.component("Textbox", Textbox);
  app.component("LangSelector", LangSelector);
  app.component("Radio", Radio);
  app.component("Checkbox", Checkbox);
  app.use(PhilaUICore);

  app.component('FontAwesomeIcon', FontAwesomeIcon)
  app.use(VueGoodTablePlugin);

  // if (config.i18n.enabled) {
  const i18nProject = config.i18n.data.messages;
  const messages = mergeDeep(i18nFromFiles.i18n.data.messages, i18nProject);
  if (import.meta.env.VITE_DEBUG == 'true') console.log('i18nFromFiles:', i18nFromFiles, 'messages:', messages);
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en-US',
    fallbackLocale: 'en-US',
    messages: messages
  })
  app.use(i18n)
  // }

  app.use(createPinia())

  const ConfigStore = useConfigStore();
  console.log('ConfigStore:', ConfigStore);
  ConfigStore.config = config;

  app.use(router)

  app.mount('#app')
};
