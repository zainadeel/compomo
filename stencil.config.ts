import { Config } from '@stencil/core';
import { angularOutputTarget } from '@stencil/angular-output-target';
import { reactOutputTarget } from '@stencil/react-output-target';
import { vueOutputTarget } from '@stencil/vue-output-target';
import { createRequire } from 'node:module';

export const config: Config = {
  namespace: 'ds-mo',
  srcDir: 'src/wc',
  sourceMap: true,
  rollupPlugins: {
    before: [
      {
        name: 'markdown-entity-decoder-without-dom',
        resolveId(source, importer) {
          // The browser export writes innerHTML; the default export uses data.
          if (source === 'decode-named-character-reference' && importer) {
            return createRequire(importer).resolve(source);
          }
          return null;
        },
      },
    ],
  },
  rollupConfig: {
    inputOptions: {
      // Runtime peer — resolved from the consumer's @ds-mo/icons install at app bundle time.
      external: [/^@ds-mo\/icons(\/.*)?$/],
    },
  },
  outputTargets: [
    {
      type: 'docs-json',
      file: 'dist/docs/components.json',
    },
    {
      type: 'dist-custom-elements',
      customElementsExportBehavior: 'auto-define-custom-elements',
      externalRuntime: false,
    },
    angularOutputTarget({
      componentCorePackage: '@ds-mo/ui',
      outputType: 'standalone',
      esModules: true,
      directivesProxyFile: 'src/.generated/angular/proxies.ts',
      directivesArrayFile: 'src/.generated/angular/index.ts',
      valueAccessorConfigs: [
        {
          elementSelectors: [
            'ds-input:not([type=number]):not([tokenized])',
            'ds-input-date',
            'ds-input-time',
            'ds-textarea',
          ],
          event: 'dsChange',
          targetAttr: 'value',
          type: 'text',
        },
        {
          elementSelectors: 'ds-input[type=number]:not([tokenized])',
          event: 'dsChange',
          targetAttr: 'value',
          type: 'number',
        },
        {
          elementSelectors: ['ds-select', 'ds-slider'],
          event: 'dsChange',
          targetAttr: 'value',
          type: 'select',
        },
        {
          elementSelectors: ['ds-radio', 'ds-radio-tile'],
          event: 'dsChange',
          targetAttr: 'value',
          type: 'radio',
        },
        {
          elementSelectors: ['ds-checkbox', 'ds-switch'],
          event: 'dsChange',
          targetAttr: 'checked',
          type: 'boolean',
        },
      ],
    }),
    reactOutputTarget({
      outDir: 'src/.generated/react',
      esModules: true,
    }),
    vueOutputTarget({
      componentCorePackage: '@ds-mo/ui',
      proxiesFile: 'src/.generated/vue/components.ts',
      includeImportCustomElements: true,
      includeDefineCustomElements: false,
      includePolyfills: false,
      customElementsDir: 'components',
      esModules: true,
      componentModels: [
        {
          elements: ['ds-input', 'ds-input-date', 'ds-input-time', 'ds-textarea'],
          event: 'dsChange',
          targetAttr: 'value',
          eventAttr: 'detail',
        },
        {
          elements: ['ds-select', 'ds-slider'],
          event: 'dsChange',
          targetAttr: 'value',
          eventAttr: 'detail',
        },
        {
          elements: ['ds-radio', 'ds-radio-tile'],
          event: 'dsChange',
          targetAttr: 'value',
          eventAttr: 'detail',
        },
        {
          elements: ['ds-checkbox', 'ds-switch'],
          event: 'dsChange',
          targetAttr: 'checked',
          eventAttr: 'detail',
        },
      ],
    }),
  ],
};
