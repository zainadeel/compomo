import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import ts from 'typescript';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '..');
const policyPath = 'tests/test-ownership-policy.json';
const execFileAsync = promisify(execFile);

async function filesBelow(root, predicate) {
  const files = [];
  for (const entry of await fs.readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(absolute, predicate)));
    else if (predicate(absolute)) files.push(absolute);
  }
  return files.sort();
}

function expressionName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) {
    const parent = expressionName(expression.expression);
    return parent ? `${parent}.${expression.name.text}` : expression.name.text;
  }
  return '';
}

function stringValue(node) {
  return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    ? node.text
    : undefined;
}

function isTestCall(name) {
  return ['it', 'it.only', 'it.skip', 'test', 'test.only', 'test.skip', 'test.fixme'].includes(
    name
  );
}

function isDescribeCall(name) {
  return [
    'describe',
    'describe.only',
    'describe.skip',
    'test.describe',
    'test.describe.only',
    'test.describe.skip',
  ].includes(name);
}

function extractSourceTests(filePath, sourceText, layer, policy) {
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const cases = [];

  function visit(node, suites = []) {
    if (ts.isCallExpression(node)) {
      const name = expressionName(node.expression);
      const title = stringValue(node.arguments[0]);
      if (title && isDescribeCall(name)) {
        const callback = node.arguments.find(
          argument => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)
        );
        if (callback) visit(callback.body, [...suites, title]);
        return;
      }
      if (title && isTestCall(name)) {
        const position = source.getLineAndCharacterOfPosition(node.getStart(source));
        const defaults = policy.defaults[layer];
        cases.push({
          id: `${filePath}:${position.line + 1}`,
          file: filePath,
          line: position.line + 1,
          title: [...suites, title].join(' › '),
          layer,
          ...defaults,
          audited: true,
        });
        return;
      }
    }
    ts.forEachChild(node, child => visit(child, suites));
  }

  visit(source);
  return cases;
}

function extractAxeCaseLines(filePath, sourceText) {
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const lines = [];
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      isTestCall(expressionName(node.expression)) &&
      node.getText(source).includes('new AxeBuilder')
    ) {
      lines.push(source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1);
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return lines;
}

function annotationDescription(spec, type) {
  for (const projectTest of spec.tests ?? []) {
    const annotation = projectTest.annotations?.find(candidate => candidate.type === type);
    if (annotation?.description) return annotation.description;
  }
  return undefined;
}

export async function extractRenderedInventory(repositoryRoot, policy) {
  const playwrightCli = path.join(repositoryRoot, 'node_modules/@playwright/test/cli.js');
  const { stdout } = await execFileAsync(
    process.execPath,
    [playwrightCli, 'test', '--list', '--reporter=json'],
    { cwd: repositoryRoot, maxBuffer: 32 * 1024 * 1024 }
  );
  const report = JSON.parse(stdout);
  const cases = new Map();

  function visitSuite(suite, parents = [], root = false) {
    const nextParents = root ? parents : [...parents, suite.title];
    for (const spec of suite.specs ?? []) {
      const file = `tests/e2e/${spec.file}`;
      const title = [...nextParents, spec.title].join(' › ');
      const key = `${file}:${spec.line}:${title}`;
      const existing = cases.get(key);
      const browsers = new Set(existing?.browsers ?? []);
      for (const projectTest of spec.tests ?? []) browsers.add(projectTest.projectName);
      const suitePolicy = policy.auditedRenderedSuites?.[file];
      const owner = annotationDescription(spec, 'test-owner');
      const reason = annotationDescription(spec, 'browser-tier');
      const chromiumOnly = spec.tags?.includes('chromium-only');
      cases.set(key, {
        id: key,
        file,
        line: spec.line,
        title,
        layer: 'rendered',
        owner: owner ?? suitePolicy?.owner ?? policy.defaults.rendered.owner,
        risk: chromiumOnly
          ? 'engine-neutral-rendering'
          : (suitePolicy?.risk ?? policy.defaults.rendered.risk),
        decision: chromiumOnly
          ? 'chromium-only'
          : suitePolicy
            ? 'keep-cross-browser'
            : policy.defaults.rendered.decision,
        browsers: [...browsers].sort(),
        reason: reason ?? suitePolicy?.reason ?? policy.defaults.rendered.reason,
        audited: Boolean(suitePolicy || owner || reason),
      });
    }
    for (const child of suite.suites ?? []) visitSuite(child, nextParents, false);
  }

  for (const suite of report.suites ?? []) visitSuite(suite, [], true);
  return [...cases.values()];
}

function extractStories(filePath, sourceText, policy) {
  const source = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);
  const defaults = policy.defaults.storybook;
  const stories = [];
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const exported = statement.modifiers?.some(
      modifier => modifier.kind === ts.SyntaxKind.ExportKeyword
    );
    if (!exported) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const position = source.getLineAndCharacterOfPosition(declaration.getStart(source));
      stories.push({
        id: `${filePath}:${position.line + 1}`,
        file: filePath,
        line: position.line + 1,
        title: declaration.name.text,
        layer: 'storybook',
        ...defaults,
        audited: true,
      });
    }
  }
  return stories;
}

export function summarizeTestInventory(cases, policy) {
  const byLayer = Object.fromEntries(
    ['unit', 'rendered', 'storybook'].map(layer => [
      layer,
      cases.filter(testCase => testCase.layer === layer).length,
    ])
  );
  const byDecision = {};
  for (const testCase of cases) {
    byDecision[testCase.decision] = (byDecision[testCase.decision] ?? 0) + 1;
  }
  for (const retiredCase of policy.retiredRenderedCases ?? []) {
    byDecision[retiredCase.decision] = (byDecision[retiredCase.decision] ?? 0) + 1;
  }
  const rendered = cases.filter(testCase => testCase.layer === 'rendered');
  return {
    byLayer,
    byDecision,
    renderedBrowserExecutions: rendered.reduce(
      (total, testCase) => total + testCase.browsers.length,
      0
    ),
    retiredRenderedCases: policy.retiredRenderedCases?.length ?? 0,
    activeRenderedAxeCases: rendered.filter(testCase => testCase.accessibilityAudit).length,
    baselineRenderedBrowserExecutions: policy.baseline.renderedBrowserExecutions,
  };
}

export function validateTestInventory(inventory, policy) {
  const errors = [];
  const allowedOwners = new Set([
    'accessibility',
    'controlled-behavior',
    'forms',
    'interaction',
    'layout-geometry',
    'motion-lifecycle',
    'responsive-shell',
    'unit-contract',
    'rendered-behavior',
    'storybook-accessibility',
  ]);
  for (const testCase of inventory.tests) {
    if (!allowedOwners.has(testCase.owner)) {
      errors.push(`${testCase.id} has unknown owner ${JSON.stringify(testCase.owner)}.`);
    }
    if (!testCase.reason?.trim()) errors.push(`${testCase.id} is missing an ownership reason.`);
    if (testCase.layer === 'rendered') {
      const expectedBrowsers =
        testCase.decision === 'chromium-only'
          ? ['chromium']
          : ['chromium', 'firefox', 'webkit'];
      if (JSON.stringify(testCase.browsers) !== JSON.stringify(expectedBrowsers)) {
        errors.push(
          `${testCase.id} resolves ${testCase.decision} to ${testCase.browsers.join(', ') || 'no browsers'}.`
        );
      }
      if (testCase.accessibilityAudit) {
        if (testCase.owner !== 'accessibility') {
          errors.push(`${testCase.id} runs Axe without accessibility ownership.`);
        }
        if (testCase.decision !== 'chromium-only') {
          errors.push(`${testCase.id} runs redundant cross-browser Axe coverage.`);
        }
      }
    }
  }
  for (const suite of Object.keys(policy.auditedRenderedSuites)) {
    const cases = inventory.tests.filter(testCase => testCase.file === suite);
    if (!cases.length) errors.push(`${suite} is marked audited but contains no discovered tests.`);
    if (cases.some(testCase => !testCase.audited)) {
      errors.push(`${suite} contains rendered tests without an audited suite policy.`);
    }
  }
  const storyFiles = new Set(
    inventory.tests
      .filter(testCase => testCase.layer === 'storybook')
      .map(testCase => testCase.file)
  );
  const retiredKeys = new Set();
  for (const retiredCase of inventory.retiredRenderedCases ?? []) {
    const key = `${retiredCase.file}:${retiredCase.title}`;
    if (retiredKeys.has(key)) errors.push(`${key} is listed as retired more than once.`);
    retiredKeys.add(key);
    if (retiredCase.owner !== 'storybook-accessibility') {
      errors.push(`${key} must transfer ownership to Storybook accessibility.`);
    }
    if (retiredCase.decision !== 'remove-redundant') {
      errors.push(`${key} must use the remove-redundant decision.`);
    }
    if (!retiredCase.reason?.trim()) errors.push(`${key} is missing a retirement reason.`);
    if (!storyFiles.has(retiredCase.replacementFile)) {
      errors.push(`${key} references missing Storybook coverage ${retiredCase.replacementFile}.`);
    }
    if (
      inventory.tests.some(
        testCase =>
          testCase.layer === 'rendered' &&
          testCase.file === retiredCase.file &&
          testCase.title === retiredCase.title
      )
    ) {
      errors.push(`${key} is still active after being classified as retired.`);
    }
  }
  if (
    inventory.summary.renderedBrowserExecutions >=
    inventory.summary.baselineRenderedBrowserExecutions
  ) {
    errors.push('The audited policy does not reduce rendered browser executions from baseline.');
  }
  return errors;
}

export async function buildTestInventory(repositoryRoot = defaultRepositoryRoot) {
  const policy = JSON.parse(await fs.readFile(path.join(repositoryRoot, policyPath), 'utf8'));
  const unitFiles = await filesBelow(path.join(repositoryRoot, 'tests'), absolute =>
    /\.test\.ts$/.test(absolute)
  );
  const storyFiles = await filesBelow(path.join(repositoryRoot, 'src/wc/components'), absolute =>
    /\.stories\.ts$/.test(absolute)
  );
  const tests = [];
  for (const absolute of unitFiles) {
    const relative = path.relative(repositoryRoot, absolute);
    tests.push(
      ...extractSourceTests(relative, await fs.readFile(absolute, 'utf8'), 'unit', policy)
    );
  }
  const renderedTests = await extractRenderedInventory(repositoryRoot, policy);
  const renderedFiles = await filesBelow(path.join(repositoryRoot, 'tests/e2e'), absolute =>
    /\.spec\.ts$/.test(absolute)
  );
  for (const absolute of renderedFiles) {
    const relative = path.relative(repositoryRoot, absolute);
    const sourceText = await fs.readFile(absolute, 'utf8');
    for (const line of extractAxeCaseLines(relative, sourceText)) {
      const testCase = renderedTests.find(
        candidate => candidate.file === relative && candidate.line === line
      );
      if (testCase) testCase.accessibilityAudit = true;
    }
  }
  tests.push(...renderedTests);
  for (const absolute of storyFiles) {
    const relative = path.relative(repositoryRoot, absolute);
    tests.push(...extractStories(relative, await fs.readFile(absolute, 'utf8'), policy));
  }
  tests.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
  return {
    schemaVersion: policy.schemaVersion,
    summary: summarizeTestInventory(tests, policy),
    tests,
    retiredRenderedCases: policy.retiredRenderedCases ?? [],
  };
}

async function run() {
  const inventory = await buildTestInventory();
  const policy = JSON.parse(
    await fs.readFile(path.join(defaultRepositoryRoot, policyPath), 'utf8')
  );
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);
  } else {
    const summary = inventory.summary;
    process.stdout.write(
      `Test inventory: ${summary.byLayer.unit} unit, ${summary.byLayer.rendered} rendered, ` +
        `${summary.byLayer.storybook} Storybook; ${summary.renderedBrowserExecutions} rendered ` +
        `browser executions, ${summary.activeRenderedAxeCases} active and ` +
        `${summary.retiredRenderedCases} retired rendered Axe cases ` +
        `(baseline ${summary.baselineRenderedBrowserExecutions}).\n`
    );
  }
  if (process.argv.includes('--check')) {
    const errors = validateTestInventory(inventory, policy);
    if (errors.length) {
      for (const error of errors) process.stderr.write(`- ${error}\n`);
      process.exitCode = 1;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
