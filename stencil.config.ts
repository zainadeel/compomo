import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';

export const config: Config = {
  namespace: 'ds-mo',
  srcDir: 'src/wc',
  sourceMap: true,
  rollupConfig: {
    inputOptions: {
      // Runtime peer — resolved from the consumer's @ds-mo/icons install at app bundle time.
      external: [/^@ds-mo\/icons(\/.*)?$/],
    },
  },
  outputTargets: [
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    angularOutputTarget({
      componentCorePackage: '@ds-mo/ui',
      outputType: 'component',
      directivesProxyFile: 'src/angular/proxies.ts',
      directivesArrayFile: 'src/angular/index.ts',
    }),
    reactOutputTarget({
      outDir: 'src/react',
      esModules: true,
    }),
  ],
};
