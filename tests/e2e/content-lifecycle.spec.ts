import { expect, test, type Locator } from '@playwright/test';

async function reconnect(host: Locator) {
  await host.evaluate(async element => {
    const parent = element.parentElement!;
    element.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
}

const columnCount = (card: Locator) =>
  card
    .locator('.card-overview__metrics')
    .evaluate(
      element => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length
    );

test('overview restores responsive measurement after repeated reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-overview.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#default');
  await expect.poll(() => columnCount(card)).toBe(3);
  for (const [width, columns] of [
    [420, 2],
    [1200, 6],
  ] as const) {
    await reconnect(card);
    await card.evaluate((element, size) => {
      element.style.width = `${size}px`;
    }, width);
    await expect.poll(() => columnCount(card)).toBe(columns);
  }
});

test('overview reconciles layout inputs changed while detached @cross-browser', async ({
  page,
}) => {
  await page.goto('/card-overview.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const card = page.locator('#default');
  await expect.poll(() => columnCount(card)).toBe(3);
  await card.evaluate(async element => {
    const host = element as HTMLDsCardOverviewElement;
    const parent = host.parentElement!;
    host.remove();
    host.metricMinWidth = '400px';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(host);
  });
  await expect.poll(() => columnCount(card)).toBe(2);
  await card.evaluate(element => {
    element.style.width = '420px';
  });
  await expect.poll(() => columnCount(card)).toBe(1);
});

test('tool calls restore custom-detail detection after repeated reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const tool = page.locator('#tool-compact');
  for (let cycle = 0; cycle < 2; cycle++) {
    await reconnect(tool);
    await tool.evaluate(element => {
      const detail = document.createElement('span');
      detail.slot = 'details';
      detail.textContent = 'Late custom diagnostic';
      element.append(detail);
    });
    await expect(tool.locator('summary')).toBeVisible();
    await tool.locator('summary').click();
    await expect(tool.locator('.agent-tool__details')).toHaveText('Late custom diagnostic');
    await tool.locator('[slot="details"]').evaluate(element => element.remove());
    await expect(tool.locator('details')).toHaveCount(0);
  }
});

test('tool calls reconcile slots changed while detached @cross-browser', async ({ page }) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const tool = page.locator('#tool-compact');
  await tool.evaluate(async element => {
    const parent = element.parentElement!;
    element.remove();
    const result = document.createElement('span');
    result.slot = 'result';
    result.textContent = 'Result supplied while detached';
    element.append(result);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
  await expect(tool.locator('.agent-tool__result')).toHaveText('Result supplied while detached');
  await tool.locator('[slot="result"]').evaluate(element => element.remove());
  await expect(tool.locator('.agent-tool__result')).toHaveCount(0);
});

test('tool result typography follows text and structured content after reconnect @cross-browser', async ({
  page,
}) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const tool = page.locator('#tool-custom');
  const result = tool.locator('[slot="result"]');
  const surface = tool.locator('.agent-tool__result');
  await reconnect(tool);
  await expect(surface).toHaveClass(/agent-tool__result--plain-text/);
  await result.evaluate(element => {
    const content = document.createElement('ds-text');
    content.setAttribute('variant', 'text-body-small');
    content.textContent = 'Structured result';
    element.replaceChildren(content);
  });
  await expect(surface).not.toHaveClass(/agent-tool__result--plain-text/);
  await expect(result.locator('ds-text')).toHaveText('Structured result');
  await result.evaluate(element =>
    element.replaceChildren(document.createTextNode('Plain result'))
  );
  await expect(surface).toHaveClass(/agent-tool__result--plain-text/);
  await result.evaluate(element => {
    element.firstChild!.textContent = '';
  });
  await expect(surface).not.toHaveClass(/agent-tool__result--plain-text/);
  await result.evaluate(element => {
    element.firstChild!.textContent = 'Result arrived';
  });
  await expect(surface).toHaveClass(/agent-tool__result--plain-text/);
});

test('tool calls follow named-slot reassignment after reconnect @cross-browser', async ({
  page,
}) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const tool = page.locator('#tool-compact');
  await reconnect(tool);
  await tool.evaluate(element => {
    const content = document.createElement('span');
    content.id = 'reassigned-tool-content';
    content.slot = 'result';
    content.textContent = 'Application-owned tool content';
    element.append(content);
  });
  const content = tool.locator('#reassigned-tool-content');
  await expect(tool.locator('.agent-tool__result')).toHaveText('Application-owned tool content');
  await content.evaluate(element => {
    element.slot = 'summary';
  });
  await expect(tool.locator('.agent-tool__title')).toContainText('Application-owned tool content');
  await expect(tool.locator('.agent-tool__result')).toHaveCount(0);
  await expect(tool.locator('.agent-tool__title')).not.toContainText('Searched 8 sources');
  await content.evaluate(element => {
    element.slot = 'details';
  });
  await tool.locator('summary').click();
  await expect(tool.locator('.agent-tool__details')).toHaveText('Application-owned tool content');
  await expect(tool.locator('.agent-tool__title')).toContainText('Searched 8 sources');
  await content.evaluate(element => element.remove());
  await expect(tool.locator('details')).toHaveCount(0);
});

test('conversation lists restore dynamic empty-state placement after reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/conversation-list-item.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const list = page.locator('#conversation-list');
  for (let cycle = 0; cycle < 2; cycle++) {
    await reconnect(list);
    await list.evaluate(element => {
      const empty = document.createElement('div');
      empty.slot = 'empty';
      empty.textContent = 'No matching conversations';
      element.append(empty);
    });
    const empty = list.locator('[slot="empty"]');
    await expect(empty).toHaveCSS('position', 'absolute');
    const bounds = await list.evaluate(element => {
      const host = element.getBoundingClientRect();
      const empty = element.querySelector('[slot="empty"]')!.getBoundingClientRect();
      return {
        host: { top: host.top, height: host.height },
        empty: { top: empty.top, height: empty.height },
      };
    });
    expect(bounds.empty.top).toBeCloseTo(bounds.host.top, 1);
    expect(bounds.empty.height).toBeCloseTo(bounds.host.height, 1);
    await empty.evaluate(element => element.remove());
  }
});

test('conversation lists reconcile empty content added while detached @cross-browser', async ({
  page,
}) => {
  await page.goto('/conversation-list-item.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const list = page.locator('#conversation-list');
  await list.evaluate(async element => {
    const parent = element.parentElement!;
    element.remove();
    const empty = document.createElement('div');
    empty.slot = 'empty';
    empty.textContent = 'No matching conversations';
    element.append(empty);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
  await expect(list.locator('[slot="empty"]')).toHaveCSS('position', 'absolute');
});
