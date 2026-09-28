import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

const docsCss = readFileSync(new URL('../../.storybook/docs.css', import.meta.url), 'utf8');
const docsStyleContract = chromiumOnly(
  'layout-geometry',
  'Storybook docs styling is an engine-neutral CSS integration contract.'
);

test(
  'docs table styling applies to markdown without leaking into ds-table',
  docsStyleContract,
  async ({ page }) => {
    await page.goto('/table.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    const cells = page.locator('ds-table').first().locator('th, td');
    const readStyles = () =>
      cells.evaluateAll(elements =>
        elements.map(element => {
          const style = getComputedStyle(element);
          return {
            padding: style.padding,
            border: style.border,
            background: style.backgroundColor,
            weight: style.fontWeight,
          };
        })
      );
    await expect(cells.first()).toBeVisible();
    const before = await readStyles();
    await page.evaluate(() => {
      document.body.classList.add('sbdocs-content');
      const prose = document.createElement('table');
      prose.id = 'markdown-table';
      prose.innerHTML =
        '<thead><tr><th>Heading</th></tr></thead><tbody><tr><td>Value</td></tr></tbody>';
      document.body.append(prose);
    });
    await page.addStyleTag({ content: docsCss });
    await expect(page.locator('#markdown-table td')).toHaveCSS('padding', '8px 12px');
    await expect(page.locator('#markdown-table')).toHaveCSS('border-collapse', 'collapse');
    expect(await readStyles()).toEqual(before);
  }
);

test(
  'docs content can grow beyond the height of a fullscreen canvas',
  docsStyleContract,
  async ({ page }) => {
    await page.setContent(
      '<html><body><div id="storybook-root"><div id="root-inner"><div id="content" style="height:1200px"></div></div></div></body></html>'
    );
    await page.addStyleTag({ content: docsCss });
    const root = page.locator('#root-inner');
    await expect(root).toHaveCSS('height', `${page.viewportSize()!.height}px`);
    await page.locator('#content').evaluate(element => element.classList.add('sbdocs'));
    await expect(root).toHaveCSS('height', '1200px');
  }
);
