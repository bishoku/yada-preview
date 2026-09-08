import { defineConfig } from 'tsup';
import { copyFileSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  noExternal: ['lz-string'],
  external: ['react', 'react-dom'],
  treeshake: true,
  splitting: false,
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.mjs' : '.cjs',
    };
  },
  onSuccess: async () => {
    copyFileSync('src/components/styles.css', 'dist/style.css');
  },
});
