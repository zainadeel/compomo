import { expect, test } from '@playwright/test';
import type { ChartDefinition } from '../../src/wc/utils/chart-grammar';

test('resumes responsive sizing after repeated reconnects @cross-browser', async ({ page }) => {
  await page.goto('/chart.html');
  const container = page.locator('#chart-container');
  const svg = page.locator('#chart svg');
  await expect(svg).toHaveAttribute('width', '720');

  for (const width of [520, 360]) {
    await container.evaluate((element, nextWidth) => {
      const chart = element.querySelector('ds-chart')!;
      chart.remove();
      (element as HTMLElement).style.width = `${nextWidth}px`;
      element.append(chart);
    }, width);
    await expect(svg).toHaveAttribute('width', String(width));
    await expect(svg).toHaveAttribute('viewBox', `0 0 ${width} 260`);

    await container.evaluate((element, nextWidth) => {
      (element as HTMLElement).style.width = `${nextWidth}px`;
    }, width - 40);
    await expect(svg).toHaveAttribute('width', String(width - 40));
  }
});

test('recovers a pending update when reconnected at the same size @cross-browser', async ({
  page,
}) => {
  await page.goto('/chart.html');
  const chart = page.locator('#chart');
  const svg = chart.locator('svg');
  await expect(svg).toHaveAttribute('viewBox', '0 0 720 260');

  await chart.evaluate(async element => {
    const host = element as HTMLElement & { height: number };
    const parent = host.parentElement!;
    host.height = 300;
    host.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(host);
  });

  await expect(svg).toHaveAttribute('viewBox', '0 0 720 300');
});

test('defers prop and font work while detached and uses current inputs on reconnect @cross-browser', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const ready = new Promise<FontFaceSet>(resolve => {
      (window as unknown as { finishFonts: () => void }).finishFonts = () =>
        resolve(document.fonts);
    });
    Object.defineProperty(document.fonts, 'ready', { value: ready });
  });
  await page.goto('/chart.html');
  const chart = page.locator('#chart');
  const svg = chart.locator('svg');
  await expect(svg).toHaveAttribute('viewBox', '0 0 720 260');

  const detachedCompiles = await chart.evaluate(async element => {
    const host = element as HTMLElement & { definition: ChartDefinition; height: number };
    const parent = host.parentElement!;
    const previous = host.definition.chart;
    let compiles = 0;
    host.remove();
    host.height = 310;
    host.definition = {
      chart: context => {
        compiles += 1;
        const spec = typeof previous === 'function' ? previous(context) : previous;
        return { ...spec, y: { ...spec.y, axis: { label: 'Updated minutes' } } };
      },
    };
    (window as unknown as { finishFonts: () => void }).finishFonts();
    // Allow the font promise and any incorrectly scheduled work to finish.
    for (let frame = 0; frame < 4; frame += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    const whileDetached = compiles;
    parent.append(host);
    return whileDetached;
  });

  expect(detachedCompiles).toBe(0);
  await expect(svg).toHaveAttribute('viewBox', '0 0 720 310');
  await expect(svg.locator('text').filter({ hasText: 'Updated minutes' })).toBeVisible();
});
