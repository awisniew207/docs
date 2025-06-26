## 0.2.1 (2025-06-26)

### 🩹 Fixes

- Fix mkdtemp not found in production deployment to Heroku ([92733bbd](https://github.com/LIT-Protocol/Vincent/commit/92733bbd))

  - The ESM version of `fs-extra` doesn't pass through methods through; when we deploy to production, that's the package that gets used
  - This was working coincidentally for local dev because of transpilation / CJS references. :sad_panda:

### ❤️ Thank You

- Daryl Collins

## 0.2.0 (2025-06-25)

### 🚀 Features

- Implement detection of `supportedPolicies` and `policiesNotInRegistry` during toolVersion creation ([72881266](https://github.com/LIT-Protocol/Vincent/commit/72881266))
- Implement loading of IPFS CID, uiSchema, jsonSchema from `vincent-tool-metadata.json` or `vincent-policy-metadata.json` files published in the NPM package. ([23dc7be0](https://github.com/LIT-Protocol/Vincent/commit/23dc7be0))

### 🧱 Updated Dependencies

- Updated registry-sdk to 2.2.0

### ❤️ Thank You

- Daryl Collins

## 0.1.0 (2025-06-25)

### 🚀 Features

- Implemented routes for managing app tools ([13a0ce44](https://github.com/LIT-Protocol/Vincent/commit/13a0ce44))

### 🧱 Updated Dependencies

- Updated registry-sdk to 2.1.0

### ❤️ Thank You

- Daryl Collins
