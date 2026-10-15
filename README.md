# Repro: `DEPLOYER_BUNDLE_EXTERNALS_SHARED_CHUNK` in `@mastra/deployer` 1.77.0

Minimal reproduction of the Mastra deployer bug where `mastra build` fails with:

```
Please open an issue. We found a shared chunk "shared" used by multiple workspace packages: repro-leaf, repro-core.
```

## Structure

```
packages/leaf   → standalone leaf package ("@ivg/service-metadata" role).
                  NOT a dependency of the app — only of core.
packages/core   → multi-export workspace package ("@ivg/betterauth" role):
                  exports ./server and ./roles, both import leaf.
apps/agent      → Mastra app. Depends on core only. Mastra config sets
                  bundler.transpilePackages = ["repro-core", "repro-leaf"].
```

## The three ingredients that trigger it

1. **Leaf is not an app dependency.** The analyze phase can't resolve it from the
   app root, so it never becomes an optimize-phase entry on its own
   (`Could not resolve path for workspace dependency`).
2. **A tsconfig `paths` mapping in the intermediate package** (`packages/core/tsconfig.json`
   maps `repro-leaf` → `../leaf/src/index.ts`). The deployer's `tsconfig-paths`
   plugin resolves leaf's source during the optimize-phase bundle, so its modules
   get **inlined into the Rollup graph** even though leaf has no entry.
3. **Identical dependent-entry sets.** `shared.ts` (core) and leaf's `index.ts`
   are both reachable only from the `./server` and `./roles` entries, so Rollup
   merges them into **one shared chunk spanning two workspace packages** — which
   the 1.77.0 guard rejects.

In 1.66.0 the analyze phase created one virtual entry per workspace *package*
(so leaf got its own entry chunk); 1.77.0 creates one entry per *export subpath*,
which is what enables the cross-package chunk merge.

## Run

```sh
pnpm install
cd apps/agent
npx mastra build   # mastra 1.29.0 / @mastra/deployer 1.77.0
```

Requires `mastra` CLI **1.29.0** (the version used in the project where the bug
was found). CLI 1.20.3 does not pass `externals: true` into the analysis phase,
so the guard never fires there.

## Verified contrast

- With `@mastra/deployer` **1.77.0** (pinned via the lockfile): the build fails
  with `DEPLOYER_BUNDLE_EXTERNALS_SHARED_CHUNK`.
- With `@mastra/deployer` **1.66.0** (forced via a temporary
  `overrides: {'@mastra/deployer': 1.66.0}` in `pnpm-workspace.yaml`, everything
  else unchanged): the build **succeeds**.
