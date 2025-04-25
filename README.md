# Getting started

## Install

```
pnpm install
```

## Build

```
pnpm build
```

## Release

Each package handles it own release cycle as they are fundamentally independent and should not be locked to be up to date unless we want to.

Check each package's README for more information on how each one releases.

### Summary

- All apps hosted in vercel (dashboard) are built and made public with their own url. Then promotion to production is done manually or when merging to `main`.
- SDK is released by `nx` with `pnpm release` (run at root)

# Ecosystem

## Policies

- Spending Limits Contract
  https://github.com/LIT-Protocol/SpendingLimitsContract
