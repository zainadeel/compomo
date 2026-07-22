import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('renderer-neutral prose foundation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prose.html');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  });

  test('maps semantic text to complete TokoMo typography recipes', async ({ page }) => {
    const recipes = await page.locator('#semantic-prose').evaluate(element => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(element.querySelector('p')!);
      const heading = getComputedStyle(element.querySelector('h2')!);
      return {
        body: {
          size: body.fontSize,
          lineHeight: body.lineHeight,
          weight: body.fontWeight,
          spacing: body.letterSpacing,
        },
        expectedBody: {
          size: root.getPropertyValue('--typography-fontsize-md').trim(),
          lineHeight: root.getPropertyValue('--typography-lineheight-md').trim(),
          weight: root.getPropertyValue('--typography-weight-regular').trim(),
          spacing: root.getPropertyValue('--typography-letterspacing-negative-half').trim(),
        },
        heading: {
          size: heading.fontSize,
          lineHeight: heading.lineHeight,
          weight: heading.fontWeight,
          spacing: heading.letterSpacing,
        },
        expectedHeading: {
          size: root.getPropertyValue('--typography-fontsize-xl').trim(),
          lineHeight: root.getPropertyValue('--typography-lineheight-xl').trim(),
          weight: root.getPropertyValue('--typography-weight-semibold').trim(),
          spacing: root.getPropertyValue('--typography-letterspacing-negative-double').trim(),
        },
      };
    });

    expect(recipes.body).toEqual(recipes.expectedBody);
    expect(recipes.heading).toEqual(recipes.expectedHeading);
    await expect(page.locator('#semantic-prose > h2')).toHaveCSS('margin-block-start', '0px');
  });

  test('allows ordinary consumer overrides and opts product UI out as a subtree', async ({ page }) => {
    const result = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const override = getComputedStyle(document.querySelector('#override-prose p')!);
      const optedOut = getComputedStyle(document.querySelector('#opted-out-copy')!);
      const nested = getComputedStyle(document.querySelector('#nested-opted-out-copy')!);
      return {
        override: [override.fontSize, override.lineHeight],
        expectedOverride: [
          root.getPropertyValue('--typography-fontsize-sm').trim(),
          root.getPropertyValue('--typography-lineheight-sm').trim(),
        ],
        optedOut: [optedOut.fontSize, optedOut.lineHeight, optedOut.marginTop, optedOut.color],
        nested: [nested.fontSize, nested.lineHeight, nested.marginTop, nested.color],
      };
    });

    expect(result.override).toEqual(result.expectedOverride);
    expect(result.optedOut).toEqual(['17px', '23px', '11px', 'rgb(123, 45, 67)']);
    expect(result.nested).toEqual(result.optedOut);
    await expect(page.locator('[data-ds-prose="off"] ds-button-filled button')).toBeVisible();
  });

  test('keeps prior streamed blocks stable when later blocks are appended', async ({ page }) => {
    const readFirstBlock = () =>
      page.locator('#stream-first').evaluate(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          top: rect.top,
          height: rect.height,
          marginBlockStart: style.marginBlockStart,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
        };
      });

    const before = await readFirstBlock();
    await page.locator('#stream-prose').evaluate(element => {
      const heading = document.createElement('h3');
      heading.textContent = 'Later streamed heading';
      const paragraph = document.createElement('p');
      paragraph.textContent = 'A later block arrives without changing earlier prose.';
      element.append(heading, paragraph);
    });
    const after = await readFirstBlock();

    expect(after).toEqual(before);
    await expect(page.locator('#stream-prose h3')).not.toHaveCSS('margin-block-start', '0px');
  });

  test('contains long content and wide tables without widening the page', async ({ page }) => {
    const geometry = await page.evaluate(() => {
      const wrapper = document.querySelector('#table-scroll')!;
      const longContent = document.querySelector('#long-content')!;
      return {
        wrapperClientWidth: wrapper.clientWidth,
        wrapperScrollWidth: wrapper.scrollWidth,
        longClientWidth: longContent.clientWidth,
        longScrollWidth: longContent.scrollWidth,
        pageClientWidth: document.documentElement.clientWidth,
        pageScrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.wrapperScrollWidth).toBeGreaterThan(geometry.wrapperClientWidth);
    expect(geometry.longScrollWidth).toBeLessThanOrEqual(geometry.longClientWidth);
    expect(geometry.pageScrollWidth).toBeLessThanOrEqual(geometry.pageClientWidth);
  });

  test('remains usable when browser content is zoomed', async ({ page }) => {
    const before = await page.locator('#semantic-prose h2').evaluate(element =>
      element.getBoundingClientRect().height,
    );
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    const after = await page.locator('#semantic-prose h2').evaluate(element =>
      element.getBoundingClientRect().height,
    );
    const pageOverflow = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));

    expect(after).toBeGreaterThan(before);
    expect(pageOverflow.scroll).toBeLessThanOrEqual(pageOverflow.client);
  });

  test('follows semantic theme tokens in light and dark themes', async ({ page }) => {
    const readColor = () =>
      page.locator('#semantic-prose h2').evaluate(element => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-foreground-primary)';
        document.body.append(probe);
        const expected = getComputedStyle(probe).color;
        probe.remove();
        return {
          actual: getComputedStyle(element).color,
          expected,
        };
      });

    const light = await readColor();
    expect(light.actual).toBe(light.expected);
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    const dark = await readColor();
    expect(dark.actual).toBe(dark.expected);
    expect(dark.actual).not.toBe(light.actual);
  });

  test('uses the same prose contract inside the optional Markdown renderer', async ({ page }) => {
    const renderer = page.locator('#markdown-renderer');
    await expect(renderer.locator('.ds-prose')).toBeVisible();
    await expect(renderer.locator('h1')).toHaveText('Renderer heading');
    await expect(renderer.locator('p')).toContainText('Renderer paragraph');
    await expect(renderer.locator('ds-code-block')).toHaveAttribute('data-ds-prose', 'off');

    const metrics = await renderer.locator('p').evaluate(element => {
      const root = getComputedStyle(document.documentElement);
      const style = getComputedStyle(element);
      return {
        size: style.fontSize,
        expectedSize: root.getPropertyValue('--typography-fontsize-md').trim(),
        lineHeight: style.lineHeight,
        expectedLineHeight: root.getPropertyValue('--typography-lineheight-md').trim(),
      };
    });
    expect(metrics.size).toBe(metrics.expectedSize);
    expect(metrics.lineHeight).toBe(metrics.expectedLineHeight);
  });

  test('preserves semantic accessibility relationships', async ({ page }) => {
    await expect(page.locator('#semantic-prose h2')).toHaveCount(1);
    await expect(page.locator('#semantic-prose ol > li')).toHaveCount(2);
    await expect(page.locator('#semantic-prose blockquote')).toHaveCount(1);
    await expect(page.locator('#semantic-prose th[scope="col"]')).toHaveCount(2);

    const results = await new AxeBuilder({ page }).include('#semantic-prose').analyze();
    const blocking = results.violations.filter(finding =>
      ['critical', 'serious'].includes(finding.impact ?? ''),
    );
    expect(blocking).toEqual([]);
  });
});
