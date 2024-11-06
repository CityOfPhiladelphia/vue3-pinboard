import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
// import VueRouter from 'unplugin-vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    // VueRouter(),
    vue(),
    vueDevTools(),
    AutoImport({
      imports: [
        // 'vue',
        // 'vue-router',
        {
          'pinia': [ 'defineStore', 'storeToRefs', 'acceptHMRUpdate' ],
        }
      ],
      // dirs: [
      //   './src/stores',
      // ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    include: [ '@turf/jsts', 'maplibre-gl', 'concaveman' ],
  }
})
