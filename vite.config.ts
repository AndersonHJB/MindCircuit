import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to remove importmap during build
const removeImportMapPlugin = () => {
  return {
    name: 'remove-importmap',
    transformIndexHtml(html) {
      return html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
    }
  }
}

export default defineConfig(({ mode, command }) => {
    const env = loadEnv(mode, '.', '');
    const plugins = [react()];
    
    // Only add the removal plugin during build
    if (command === 'build') {
      plugins.push(removeImportMapPlugin());
    }

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: plugins,
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
