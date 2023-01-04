import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';
import type { Options } from 'tsup';

type BuildTarget = 'cli' | 'lib';

function createMerge(common: Options) {
  return (config: Options) => {
    return {
      ...common,
      ...config,
    };
  };
}
export default defineConfig((options) => {
  const isDev = !!options.watch;
  const isProd = !isDev;

  const common: Options = {
    clean: true,
    target: 'node16',
    shims: true,
    dts: true,
    sourcemap: isDev,
    minify: isProd,
    esbuildPlugins: [
      {
        name: 'alias',
        setup(build) {
          build.onLoad(
            {
              filter: /.tsx?$/,
            },
            async ({ path: modulePath }) => {
              const raw = (
                await fs.promises.readFile(modulePath, 'utf-8')
              ).toString();
              const rootSrc = path.resolve(__dirname, 'src');
              const ext = modulePath.endsWith('ts') ? 'ts' : 'js';
              const matchResult = raw.match(/(['"])@\/(.+)\1/);
              if (!matchResult) {
                return {
                  contents: raw,
                  loader: ext,
                };
              }
              const [rawContent, quota, remainPath] = matchResult;
              const finalContent = raw.replace(
                rawContent,
                `${quota}${path.join(rootSrc as string, remainPath)}${quota}`
              );
              return {
                contents: finalContent,
                loader: ext,
              };
            }
          );
        },
      },
    ],
  };

  const merge = createMerge(common);

  const cliConfig = merge({
    entry: ['src/cli.ts'],
    outDir: 'dist',
    format: ['cjs'],
  });
  const libConfig = merge({
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['cjs', 'esm'],
  });

  if (options.env) {
    const { target } = options.env as {
      target: BuildTarget;
    };
    return target === 'cli' ? cliConfig : libConfig;
  }
  // build all
  return [cliConfig, libConfig];
});
