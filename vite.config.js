import path from 'path'
import { defineConfig } from '@dian/vite'
import react from '@dian/vite-preset-react'

const cwd = process.cwd()

export default defineConfig({
  server: {
    // 等同于 webpack-dev-server的配置
    port: 9009,
    proxy: require('./config/proxy.config').proxyConfig,
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.join(cwd, './src') },
      { find: /^~/, replacement: '' },
      { find: /antd\/lib/, replacement: 'antd/es' },
      { find: /^antd$/, replacement: 'antd/es' },
      { find: 'moment', replacement: '@dian/dayjs' },
    ],
  },
  plugins: [react({
    injectReact: true, // 如果开启，不需要在jsx中手动引入react
    legacy: {}, // 是否需要支持旧版本的浏览器(false=>不支持)
  })],
  css: {
    modules: { // css模块化 文件以.module.[css|less|scss]结尾
      generateScopedName: '[name]__[local]___[hash:base64:5]',
      hashPrefix: 'prefix',
    },
  },
})
