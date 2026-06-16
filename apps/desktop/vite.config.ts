import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy pdfkit font data to dist/electron/data
function copyPdfkitFonts() {
  return {
    name: 'copy-pdfkit-fonts',
    closeBundle() {
      const srcDir = path.resolve(__dirname, '../../node_modules/pdfkit/js/data');
      const destDir = path.resolve(__dirname, 'dist/electron/data');
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        for (const file of fs.readdirSync(srcDir)) {
          if (file.endsWith('.afm')) {
            fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    copyPdfkitFonts(),
    electron({
      main: {
        entry: [
          path.resolve(__dirname, 'electron/main.ts'),
          path.resolve(__dirname, '../../packages/workers/src/converter-thread.ts'),
        ],
        vite: {
          resolve: {
            alias: {
              '@papyrus/shared': path.resolve(__dirname, '../../packages/shared/src'),
              '@papyrus/ir': path.resolve(__dirname, '../../packages/ir/src'),
              '@papyrus/database': path.resolve(__dirname, '../../packages/database/src'),
              '@papyrus/parsers': path.resolve(__dirname, '../../packages/parsers/src'),
              '@papyrus/workers': path.resolve(__dirname, '../../packages/workers/src'),
              '@papyrus/orchestrator': path.resolve(__dirname, '../../packages/orchestrator/src'),
              '@papyrus/ui': path.resolve(__dirname, '../../packages/ui/src'),
            },
          },
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              input: {
                main: path.resolve(__dirname, 'electron/main.ts'),
                'converter-thread': path.resolve(__dirname, '../../packages/workers/src/converter-thread.ts'),
              },
              output: {
                entryFileNames: (chunkInfo) => {
                  if (chunkInfo.name === 'converter-thread') return 'converter-thread.js';
                  return '[name]-[hash].js';
                },
                chunkFileNames: '[name]-[hash].js',
                assetFileNames: '[name]-[hash].[ext]',
              },
              external: ['electron', 'sql.js'],
            },
            commonjsOptions: {
              transformMixedEsModules: true,
            },
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'electron/preload.ts'),
        vite: {
          resolve: {
            alias: {
              '@papyrus/shared': path.resolve(__dirname, '../../packages/shared/src'),
            },
          },
          build: {
            outDir: 'dist/electron',
          },
        },
      },
      renderer: {},
    }),
  ],
  root: '.',
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-zustand': ['zustand'],
          'vendor-lucide': ['lucide-react'],
        },
      },
    },
  },
  css: {
    postcss: './postcss.config.mjs',
    modules: {
      localsConvention: 'camelCase',
    },
  },
  resolve: {
    alias: {
      '@papyrus/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@papyrus/ir': path.resolve(__dirname, '../../packages/ir/src'),
      '@papyrus/database': path.resolve(__dirname, '../../packages/database/src'),
      '@papyrus/parsers': path.resolve(__dirname, '../../packages/parsers/src'),
      '@papyrus/workers': path.resolve(__dirname, '../../packages/workers/src'),
      '@papyrus/orchestrator': path.resolve(__dirname, '../../packages/orchestrator/src'),
      '@papyrus/ui': path.resolve(__dirname, '../../packages/ui/src'),
      /* App-level aliases */
      '@app': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@stores': path.resolve(__dirname, 'src/stores'),
      '@views': path.resolve(__dirname, 'src/views'),
    },
  },
  server: {
    host: '127.0.0.1',  // IPv4 loopback only — avoids Windows IPv6 ambiguity
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['mermaid'],
  },
});
