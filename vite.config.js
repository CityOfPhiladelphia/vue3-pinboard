import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
// import VueRouter from 'unplugin-vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'Pinboard',
      fileName: 'index',
    },
    rollupOptions: {
      external: [ 'vue' ],
      output: {
        globals: {
          vue: 'Vue'
        },
        exports: 'named',
        // entryFileNames: `assets/[name].js`,
        // chunkFileNames: `assets/[name].js`,
        // assetFileNames: `assets/[name].[ext]`
      }
    }
  },
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
