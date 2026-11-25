import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/types/auto-imports.d.ts',
      eslintrc: { enabled: false },
    }),
    Components({
      dts: 'src/types/components.d.ts',
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    watch: {
      // 编辑器/工具的原子写入会在项目里留下 .xxx.tmpdir，chokidar 监听它会在 Windows 上抛 EBUSY
      ignored: ['**/.*tmpdir/**', '**/*.tmp', '**/node_modules/**', '**/dist/**'],
    },
    // 真实 FastAPI 后端在 8000 端口，前端开发时用 proxy 解决跨域
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 按「框架 / Markdown 渲染器」拆公共块；
        // 不要在这里把 element-plus 整个入口写进 manualChunks，否则会把整库当成入口打包，按需加载失效。
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('marked') || id.includes('dompurify')) return 'markdown'
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('/pinia/')) return 'vue'
          return undefined
        },
      },
    },
  },
})
