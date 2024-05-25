/// <reference types="vitest" />
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	base: './', // needed to work in subdirectories
	build: {
		outDir: 'build',
	},
	optimizeDeps: {
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
	plugins: [
		{
      name: 'treat-js-files-as-jsx',
      async transform(code, id) {
        if (!id.match(/src\/.*\.js$/))  return null

        // Use the exposed transform from vite, instead of directly
        // transforming with esbuild
        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        })
      },
		},
		react(), 
		viteTsconfigPaths(),
		svgr({
			include: '**/*.svg?react',
		}),
		VitePWA({
			injectRegister: 'auto'
		}),
	],
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src'),
			'atoms': path.resolve(__dirname, 'src/atoms'),
			'components': path.resolve(__dirname, 'src/components'),
			'helpers': path.resolve(__dirname, 'src/helpers'),
			'types': path.resolve(__dirname, 'src/types'),
			'widgets': path.resolve(__dirname, 'src/widgets'),
		},
	},
	server: {
		open: false, // BROWSER=false
		port: 3015, 
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/setupTests.ts',
		coverage: {
		  reporter: ['text', 'html'],
		  exclude: [
			'node_modules/',
			'src/setupTests.ts',
		  ],
		},
	},
});