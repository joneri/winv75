# Frontend Vite Toolchain Compatibility

## Purpose
Keep the frontend installable and buildable by ensuring Vite and the Vue Vite plugin stay on compatible major versions.

## How it works
The frontend uses `vite` together with `@vitejs/plugin-vue` in [frontend/vite.config.ts](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/vite.config.ts). These packages have a peer dependency relationship, so upgrading `vite` across a major version also requires checking whether `@vitejs/plugin-vue` must move to a newer major.

## Key decisions
We keep the newer `vite` 8 line introduced by the audit-driven update and align `@vitejs/plugin-vue` to the compatible 6 line instead of downgrading Vite back to 4. This preserves the security-driven upgrade while restoring a valid dependency graph.

## Inputs/outputs
Input: `frontend/package.json` dev dependency versions for `vite` and `@vitejs/plugin-vue`.
Output: `npm install` succeeds without `--force`, and `npm run build` can execute with the resolved toolchain.

## Edge cases
If `npm audit fix --force` upgrades `vite` without moving `@vitejs/plugin-vue`, `npm install` fails with `ERESOLVE` because the plugin's peer range no longer includes the installed Vite major.

## Debugging
Run `npm view @vitejs/plugin-vue version peerDependencies engines --json` and confirm that the reported `vite` peer range includes the Vite major declared in [frontend/package.json](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/package.json).

## Related files
- [frontend/package.json](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/package.json)
- [frontend/package-lock.json](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/package-lock.json)
- [frontend/vite.config.ts](/Users/jonaseriksson/dev-stuff/GitHub/winv75/frontend/vite.config.ts)
