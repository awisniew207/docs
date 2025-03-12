import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'vincentSDK',
      file: 'dist/vincent-sdk.umd.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      json(),
      terser(),
      typescript({ tsconfig: './tsconfig.json' }),
      filesize({
        showMinifiedSize: true,
        showGzippedSize: true,
      })
    ]
  },
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.main, format: 'cjs', sourcemap: true },
      { file: pkg.module, format: 'es', sourcemap: true }
    ],
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