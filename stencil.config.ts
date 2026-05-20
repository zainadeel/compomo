import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';

export const config: Config = {
  namespace: 'ds-mo',
  srcDir: 'src/wc',
  sourceMap: true,
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
  ],
};
