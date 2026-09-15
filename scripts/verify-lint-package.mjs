import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Exercise the optional tooling only after ordinary runtime smoke tests. */
export function verifyLintPackage(consumerDir, root, env) {
  for (const dependency of ['eslint', '@eslint/css'])
    if (fs.existsSync(path.join(consumerDir, 'node_modules', dependency)))
      throw new Error(
        'Optional lint peer was installed during ordinary component consumption: ' + dependency
      );
  const version = name =>
    JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8'))
      .version;
  execFileSync(
    'npm',
    [
      'install',
      '--save-dev',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      ...['eslint', '@eslint/css', 'typescript-eslint'].map(name => `${name}@${version(name)}`),
    ],
    { cwd: consumerDir, stdio: 'inherit', env }
  );
  const source = `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import {ESLint} from 'eslint';
    import tseslint from 'typescript-eslint';
    import {plugin,createConfig} from '@ds-mo/ui/lint';
    assert.equal(createRequire(import.meta.url)('@ds-mo/ui/lint').plugin,plugin);
    for(const strict of [false,true]){
      const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{files:['**/*.tsx'],languageOptions:{parser:tseslint.parser,parserOptions:{ecmaFeatures:{jsx:true}}}},...createConfig({strict})]});
      const [css]=await eslint.lintText('ds-text {font-size:inherit}',{filePath:'consumer.css'});
      const [jsx]=await eslint.lintText("import {DsText as Heading} from '@ds-mo/ui/react';const view=<Heading style={{fontSize:12}}/>;",{filePath:'consumer.tsx'});
      for(const result of [css,jsx]){assert.equal(result.messages.length,1);assert.equal(result.messages[0].severity,strict?2:1);}
    }
    const cssOnly=new ESLint({overrideConfigFile:true,overrideConfig:createConfig({jsxFiles:[]})});
    const [allowed]=await cssOnly.lintText('ds-text {margin:0}',{filePath:'consumer.css'});
    assert.equal(allowed.messages.length,0);
  `;
  fs.writeFileSync(path.join(consumerDir, 'lint-smoke.mjs'), source);
  execFileSync(process.execPath, ['lint-smoke.mjs'], { cwd: consumerDir, stdio: 'inherit', env });
  fs.writeFileSync(
    path.join(consumerDir, 'lint-type-smoke.ts'),
    `import {createConfig,plugin,type LintOptions} from '@ds-mo/ui/lint';\nimport type {Linter,ESLint} from 'eslint';\nconst options:LintOptions={jsxFiles:[],strict:true};const configs:Linter.Config[]=createConfig(options);const rules:ESLint.Plugin=plugin;void [configs,rules];\n`
  );
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--target',
      'ES2022',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      'lint-type-smoke.ts',
    ],
    { cwd: consumerDir, stdio: 'inherit', env }
  );
  // Exercise actual CLI exit codes, rather than inferring them from severity.
  fs.writeFileSync(path.join(consumerDir, 'lint-probe.css'), 'ds-text {font-size:inherit}');
  for (const strict of [false, true]) {
    fs.writeFileSync(
      path.join(consumerDir, 'eslint.config.mjs'),
      `import {createConfig} from '@ds-mo/ui/lint';export default createConfig({jsxFiles:[],strict:${strict}});`
    );
    let status = 0;
    try {
      execFileSync(process.execPath, ['node_modules/eslint/bin/eslint.js', 'lint-probe.css'], {
        cwd: consumerDir,
        stdio: 'pipe',
        env,
      });
    } catch (error) {
      status = error.status;
    }
    if (status !== (strict ? 1 : 0))
      throw new Error('Unexpected consumer lint CLI exit status: ' + status);
  }
}
