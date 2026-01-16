import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',

        proxy: {
      // 捕获所有以 /llm-bridge/api 开头的请求
        '/llm-bridge/api': {
        target: 'http://127.0.0.1:8080', // 指向你的 FastAPI 端口
        changeOrigin: true,
        // 如果你的后端实际路径就是 /llm-bridge/api，则不需要 rewrite
        // 如果后端不需要前缀，可以使用 rewrite 去掉
      }
      }
        
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
