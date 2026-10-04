/** Exercise generated adapters through real renderers, resolving only the installed tarball. */
import assert from 'node:assert/strict';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium, firefox, webkit, expect } from '@playwright/test';

export async function verifyFrameworkConsumers(consumerDir) {
  const fixtureDir = join(consumerDir, 'fixtures');
  const outputDir = join(consumerDir, 'browser');
  await cp(
    fileURLToPath(new URL('../tests/fixtures/framework-consumers', import.meta.url)),
    fixtureDir,
    { recursive: true }
  );
  await mkdir(outputDir);
  const frameworks = ['angular', 'react', 'vue'];
  for (const framework of frameworks) {
    await build({
      entryPoints: [join(fixtureDir, `${framework}.mjs`)],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2022',
      outfile: join(outputDir, `${framework}.js`),
      define: {
        'process.env.NODE_ENV': '"development"',
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      },
    });
  }
  // A fixed route allowlist avoids exposing temporary install contents to the browser.
  const assets = new Map(
    await Promise.all(
      frameworks.flatMap(name =>
        ['js', 'css'].map(async extension => [
          `/${name}.${extension}`,
          await readFile(join(outputDir, `${name}.${extension}`)),
        ])
      )
    )
  );
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (assets.has(pathname)) {
      response.setHeader(
        'Content-Type',
        pathname.endsWith('.css') ? 'text/css' : 'text/javascript'
      );
      response.end(assets.get(pathname));
    } else if (frameworks.includes(pathname.slice(1))) {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        `<!doctype html><html lang="en"><meta charset="utf-8"><title>Packaged consumer</title><link rel="stylesheet" href="${pathname}.css"><body><consumer-root></consumer-root><script type="module" src="${pathname}.js"></script></body></html>`
      );
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const engines = { chromium, firefox, webkit };
  try {
    for (const name of (process.env.FRAMEWORK_BROWSERS ?? 'chromium').split(',')) {
      assert.ok(engines[name], `Unknown framework browser: ${name}`);
      const browser = await engines[name].launch();
      try {
        for (const framework of frameworks) {
          const page = await browser.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          try {
            await page.goto(`http://127.0.0.1:${server.address().port}/${framework}`);
            await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
            if (framework === 'angular') await verifyAngular(page);
            else await verifyReactiveRenderer(page, framework);
            await verifyShellIdentity(page);
            assert.deepEqual(errors, [], `${framework} browser errors`);
            console.log(`✅ Packed ${framework} consumer (${name})`);
          } catch (error) {
            const markup = await page
              .locator('consumer-root')
              .innerHTML()
              .catch(() => 'unavailable');
            throw new Error(`${framework}/${name}: ${errors.join('\n')}\n${markup.slice(-8000)}`, {
              cause: error,
            });
          } finally {
            await page.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    await new Promise((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  }
}

async function verifyShellIdentity(page) {
  await page.evaluate(() => {
    window.retainedInput = document.querySelector('#text');
  });
  for (const [width, mode] of [
    [375, 'mobile'],
    [900, 'tablet'],
    [1280, 'desktop'],
  ]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(page.locator('#shell')).toHaveAttribute('responsive-mode', mode);
    assert.equal(
      await page.evaluate(() => window.retainedInput === document.querySelector('#text')),
      true
    );
    await expect(page.locator('#text input')).toHaveValue('cycle-1');
  }
}

async function verifyAngular(page) {
  const input = id => page.locator(`#${id} input`);
  const snapshot = () => page.evaluate(() => window.consumer.snapshot());
  await expect(input('text')).toHaveValue('initial');
  await input('text').fill('edited');
  await page.locator('#after').focus();
  assert.deepEqual((await snapshot()).text, {
    value: 'edited',
    dirty: true,
    touched: true,
    disabled: false,
    valid: true,
  });
  await input('text').fill('');
  assert.equal((await snapshot()).text.valid, false);
  await input('numeric').fill('7.25');
  assert.equal((await snapshot()).numeric.value, 7.25);
  await input('numeric').fill('');
  assert.equal((await snapshot()).numeric.value, null);
  await input('blur').fill('blurred');
  assert.equal((await snapshot()).blur.value, 'initial');
  await page.locator('#after').focus();
  assert.equal((await snapshot()).blur.value, 'blurred');
  await input('submit').fill('submitted');
  await page.locator('#after').focus();
  assert.equal((await snapshot()).submit.value, 'initial');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  assert.equal((await snapshot()).submit.value, 'submitted');
  await page.evaluate(() => window.consumer.form.controls.text.disable());
  await expect(input('text')).toBeDisabled();
  await page.evaluate(() => {
    const { form } = window.consumer;
    form.controls.text.enable();
    form.reset({
      text: 'reset',
      numeric: null,
      range: [0, 100],
      selection: 'two',
      blur: null,
      submit: null,
    });
    window.consumer.options.set([{ value: 'two', label: 'Second option' }]);
  });
  await expect(input('text')).toHaveValue('reset');
  await expect(input('numeric')).toHaveValue('');
  await expect(page.locator('#range')).toHaveJSProperty('value', [0, 100]);
  await page.locator('#range').getByRole('slider').first().focus();
  await page.keyboard.press('ArrowRight');
  assert.deepEqual((await snapshot()).range.value, [1, 100]);
  await expect(page.locator('#selection')).toContainText('Second option');
  const afterReset = await snapshot();
  assert.equal(afterReset.text.dirty, false);
  assert.equal(afterReset.text.touched, false);
  assert.equal(
    await page.evaluate(() => new FormData(document.querySelector('#owner')).get('external')),
    'external value'
  );
  // Angular destroys and recreates the generated adapter while the form model survives.
  for (let pass = 0; pass < 2; pass += 1) {
    await page.evaluate(() => window.consumer.mounted.set(false));
    await expect(page.locator('#text')).toHaveCount(0);
    await page.evaluate(() => {
      window.consumer.form.controls.text.setValue('reinserted');
      window.consumer.mounted.set(true);
    });
    await expect(input('text')).toHaveValue('reinserted');
    await input('text').fill(`cycle-${pass}`);
    assert.equal((await snapshot()).text.value, `cycle-${pass}`);
  }
}

async function verifyReactiveRenderer(page, framework) {
  const input = page.locator('#text input');
  await expect(input).toHaveValue('initial');
  await expect(page.getByRole('button', { name: 'Open review' })).toBeVisible();
  assert.deepEqual(
    await page
      .locator('[aria-label], [aria-labelledby], [aria-describedby]')
      .evaluateAll(elements =>
        elements.flatMap(element =>
          Array.from(element.attributes)
            .filter(
              attribute => attribute.name.startsWith('aria-') && attribute.value.includes('Symbol(')
            )
            .map(attribute => attribute.name)
        )
      ),
    [],
    'Omitted ARIA props must not become serialized framework sentinels'
  );
  await input.fill('edited');
  await expect(page.locator('#value')).toHaveText('edited');
  assert.deepEqual(await page.evaluate(() => window.consumer.events), ['edited']);
  await page.evaluate(() => window.consumer.setValue('controlled'));
  await expect(input).toHaveValue('controlled');
  assert.deepEqual(await page.evaluate(() => window.consumer.events), ['edited']);
  if (framework === 'react') {
    assert.equal(
      await page.evaluate(
        () => window.consumer.inputRef.current === document.querySelector('#text')
      ),
      true
    );
  } else {
    await page.getByRole('switch').click();
    await expect(page.locator('#checked')).toHaveText('true');
  }
  for (let pass = 0; pass < 2; pass += 1) {
    await page.evaluate(() => {
      window.detachedInput = document.querySelector('#text');
      window.consumer.setMounted(false);
    });
    await expect(page.locator('#text')).toHaveCount(0);
    const eventCount = await page.evaluate(() => window.consumer.events.length);
    await page.evaluate(() =>
      window.detachedInput.dispatchEvent(
        new CustomEvent('dsChange', { detail: 'stale', bubbles: true })
      )
    );
    assert.equal(
      await page.evaluate(() => window.consumer.events.length),
      eventCount,
      'Removed wrapper retained a listener'
    );
    await page.evaluate(() => window.consumer.setMounted(true));
    await expect(input).toHaveValue(pass === 0 ? 'controlled' : 'cycle-0');
    await input.fill(`cycle-${pass}`);
    assert.equal(await page.evaluate(() => window.consumer.events.length), eventCount + 1);
  }
  await page.getByRole('button', { name: 'Open review' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Review' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Review' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open review' })).toBeFocused();
}
