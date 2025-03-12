import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
    onwarn(warning, warn) {
      return;
    },
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      json(),
      terser(),
      filesize({
        showMinifiedSize: true,
        showGzippedSize: true,
      })
    ],
    external: [...Object.keys(pkg.dependencies || {})]
  }
];