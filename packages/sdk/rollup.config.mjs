import { createRequire } from 'module';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import nodePolyfills from 'rollup-plugin-polyfill-node';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const umdExternals = [
  '@walletconnect/modal',
  '@lit-protocol/auth-helpers',
  '@lit-protocol/constants'
];

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'vincentSDK',
      file: 'dist/vincent-sdk.umd.js',
      format: 'umd',
      sourcemap: true,
      globals: {
        '@walletconnect/modal': 'WalletConnectModal',
        '@lit-protocol/auth-helpers': 'LitAuthHelpers',
        '@lit-protocol/constants': 'LitConstants'
      }
    },
    onwarn(warning, warn) {
      return;
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        transformMixedEsModules: true,
        ignoreDynamicRequires: true,
        requireReturnsDefault: 'auto'
      }),
      nodePolyfills({
        include: ['buffer', 'process']
      }),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser({
        format: {
          comments: false
        },
        compress: {
          passes: 2
        }
      }),
      filesize({
        showMinifiedSize: true,
        showGzippedSize: true,
      })
    ],
    external: umdExternals
  },
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