import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist/lib',
        emptyOutDir: true,
        lib: {
          entry: path.resolve(__dirname, 'index.tsx'),
          name: 'MindCircuit',
          fileName: (format) => `mind-circuit.${format}.js`
        },
        rollupOptions: {
          // 保留 CDN 调用：在库模式下，将这些依赖外部化，不打包进库中
          external: ['react', 'react-dom', 'lucide-react'],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'lucide-react': 'lucide'
            }
          }
        }
      }
    };
});
