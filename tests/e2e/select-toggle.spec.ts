import { expect, test } from '@playwright/test';
import { expectDefiniteBounds } from './rendered-geometry';

test.beforeEach(async ({ page }) => {
  await page.goto('/select-toggle.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('cycles three choices, wraps, and emits one change per activation', async ({ page }) => {
  const host = page.locator('#toggle');
  const button = host.getByRole('button');

  await expect(host).toHaveJSProperty('value', 'table');
  await expect(button).toHaveAccessibleName('View layout: Table, 1 of 3. Next: Chart');
  await button.click();
  await expect(host).toHaveJSProperty('value', 'chart');
  await expect(button).toHaveAccessibleName('View layout: Chart, 2 of 3. Next: List');
  await expect(host.locator('ds-text')).toHaveText('Chart');
  await expect(host.locator('ds-icon')).toHaveJSProperty('name', 'Chart');
  await button.click();
  await button.click();
  await expect(host).toHaveJSProperty('value', 'table');
  expect(
    await page.evaluate(
      () => (window as Window & { selectToggleChanges: string[] }).selectToggleChanges
    )
  ).toEqual(['chart', 'list', 'table']);
});

test('uses one native button for a two-choice icon-only cycle', async ({ page }) => {
  const host = page.locator('#toggle');
  await host.evaluate(element => {
    const toggle = element as HTMLElement & {
      options: unknown[];
      value: string;
      variant: string;
    };
    toggle.options = [
      { value: 'table', label: 'Table', icon: 'Table' },
      { value: 'chart', label: 'Chart', icon: 'Chart' },
    ];
    toggle.value = 'table';
    toggle.variant = 'icon';
  });

  const button = host.getByRole('button');
  await expect(button).toHaveCount(1);
  await expect(host.locator('ds-text')).toHaveCount(0);
  await expect(host.locator('.trigger__dot')).toHaveCount(2);
  await expect(button).toHaveAccessibleName('View layout: Table, 1 of 2. Next: Chart');
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(host.locator('ds-icon')).toHaveJSProperty('name', 'Chart');
  await page.keyboard.press('Space');
  await expect(host).toHaveJSProperty('value', 'table');
  expect(
    await page.evaluate(
      () => (window as Window & { selectToggleChanges: string[] }).selectToggleChanges
    )
  ).toEqual(['chart', 'table']);
});

test('collapses with table caption controls and restores observation after reinsertion', async ({
  page,
}) => {
  const host = page.locator('#toggle');
  const button = host.getByRole('button');
  await host.evaluate(element => {
    const owner = document.createElement('ds-data-toolbar');
    owner.id = 'caption-owner';
    owner.style.display = 'block';
    owner.style.inlineSize = '900px';
    element.parentElement?.append(owner);
    owner.append(element);
    (element as HTMLElement & { collapseLabel: boolean }).collapseLabel = true;
  });
  const owner = page.locator('#caption-owner');
  await expect(owner).toHaveJSProperty('clientWidth', 900);
  await expect(host.locator('ds-text')).toHaveText('Table');

  await owner.evaluate(element => (element.style.inlineSize = '899px'));
  await expect(owner).toHaveJSProperty('clientWidth', 899);
  await expect(host.locator('ds-text')).toHaveCount(0);
  await expect(button).toHaveAccessibleName('View layout: Table, 1 of 3. Next: Chart');
  await button.click();
  await expect(host.locator('ds-icon')).toHaveJSProperty('name', 'Chart');
  await expect(button).toHaveAccessibleName('View layout: Chart, 2 of 3. Next: List');

  await host.evaluate(element => {
    const replacement = document.createElement('ds-data-toolbar');
    replacement.id = 'replacement-owner';
    replacement.style.display = 'block';
    replacement.style.inlineSize = '900px';
    element.parentElement?.parentElement?.append(replacement);
    replacement.append(element);
  });
  const replacement = page.locator('#replacement-owner');
  await expect(host.locator('ds-text')).toHaveText('Chart');
  await replacement.evaluate(element => (element.style.inlineSize = '899px'));
  await expect(host.locator('ds-text')).toHaveCount(0);
});

test('scales the vertical position dots and slot with control density', async ({ page }) => {
  const host = page.locator('#toggle');
  const button = host.getByRole('button');
  const indicator = host.locator('.trigger__indicator');
  const readDots = () =>
    indicator.evaluate(element => {
      const slot = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll('.trigger__dot')).map(dot => {
        const rect = dot.getBoundingClientRect();
        return {
          x: rect.x - slot.x,
          y: rect.y - slot.y,
          width: rect.width,
          height: rect.height,
        };
      });
    });

  for (const density of [
    {
      size: 'sm',
      height: 24,
      slotWidth: 8,
      slotHeight: 16,
      idle: 1,
      active: 1,
      gap: 1,
      inset: 2.5,
    },
    { size: 'md', height: 32, slotWidth: 12, slotHeight: 20, idle: 2, active: 2, gap: 1, inset: 3 },
    {
      size: 'lg',
      height: 40,
      slotWidth: 16,
      slotHeight: 24,
      idle: 3,
      active: 3,
      gap: 2,
      inset: 2.5,
    },
  ] as const) {
    await host.evaluate((element, size) => {
      const toggle = element as HTMLElement & { size: string; value: string };
      toggle.size = size;
      toggle.value = 'table';
    }, density.size);
    await expect(host.locator('.trigger__dot').first()).toHaveClass(/trigger__dot--active/);
    await expectDefiniteBounds(button, {
      label: `${density.size} select toggle button`,
      height: density.height,
    });
    await expectDefiniteBounds(indicator, {
      label: `${density.size} select toggle indicator slot`,
      width: density.slotWidth,
      height: density.slotHeight,
    });
    const spacing = await indicator.evaluate(element => {
      const slot = element.getBoundingClientRect();
      const positions = Array.from(element.querySelectorAll('.trigger__dot-position')).map(dot =>
        dot.getBoundingClientRect()
      );
      return {
        gap: getComputedStyle(element).gap,
        top: positions[0].top - slot.top,
        bottom: slot.bottom - positions[positions.length - 1].bottom,
      };
    });
    expect(spacing.gap).toBe(`${density.gap}px`);
    expect(spacing.top).toBeCloseTo(density.inset, 1);
    expect(spacing.bottom).toBeCloseTo(density.inset, 1);

    const dots = await readDots();
    expect(dots.map(dot => dot.width)).toEqual([density.active, density.idle, density.idle]);
    expect(dots.map(dot => dot.height)).toEqual([density.active, density.idle, density.idle]);
    expect(dots[0].x + dots[0].width / 2).toBe(dots[1].x + dots[1].width / 2);
    expect(dots[1].x + dots[1].width / 2).toBe(dots[2].x + dots[2].width / 2);
    expect(dots[0].y).toBeLessThan(dots[1].y);
    expect(dots[1].y).toBeLessThan(dots[2].y);

    await button.click();
    await expect(host.locator('.trigger__dot').nth(1)).toHaveClass(/trigger__dot--active/);
    const nextDots = await readDots();
    expect(nextDots.map(dot => dot.width)).toEqual([density.idle, density.active, density.idle]);
    expect(nextDots.map(dot => [dot.x + dot.width / 2, dot.y + dot.height / 2])).toEqual(
      dots.map(dot => [dot.x + dot.width / 2, dot.y + dot.height / 2])
    );
  }

  const colors = await host.locator('.trigger__dot').evaluateAll(elements => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.background = 'var(--color-foreground-secondary)';
    const secondary = getComputedStyle(probe).backgroundColor;
    probe.style.background = 'var(--color-foreground-quaternary)';
    const quaternary = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return {
      actual: elements.map(element => getComputedStyle(element).backgroundColor),
      secondary,
      quaternary,
    };
  });
  expect(colors.actual).toEqual([colors.quaternary, colors.secondary, colors.quaternary]);

  const contentColors = await host.evaluate(element => {
    const trigger = element.querySelector('.trigger');
    const icon = element.querySelector('ds-icon');
    const label = element.querySelector('ds-text');
    return [trigger, icon, label].map(node => getComputedStyle(node!).color);
  });
  expect(contentColors).toEqual([colors.secondary, colors.secondary, colors.secondary]);
});

test('respects inactive state and reconciles a removed value without a change event', async ({
  page,
}) => {
  const host = page.locator('#toggle');
  const button = host.getByRole('button');
  await host.evaluate(element => {
    (element as HTMLElement & { isInactive: boolean }).isInactive = true;
  });
  await expect(button).toBeDisabled();
  await button.evaluate(element => (element as HTMLButtonElement).click());
  await expect(host).toHaveJSProperty('value', 'table');

  await host.evaluate(element => {
    const toggle = element as HTMLElement & { options: unknown[]; isInactive: boolean };
    toggle.options = [
      { value: 'chart', label: 'Chart', icon: 'Chart' },
      { value: 'list', label: 'List', icon: 'List' },
    ];
    toggle.isInactive = false;
  });
  await expect(host).toHaveJSProperty('value', 'chart');
  expect(
    await page.evaluate(
      () => (window as Window & { selectToggleChanges: string[] }).selectToggleChanges
    )
  ).toEqual([]);
});

test('offers transparent borderless chrome without changing geometry', async ({ page }) => {
  const host = page.locator('#toggle');
  const button = host.getByRole('button');
  const bordered = await button.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      background: style.backgroundColor,
      borderWidth: style.getPropertyValue('--ds-interaction-border-width').trim(),
    };
  });
  await host.evaluate(element => {
    (element as HTMLElement & { hasBorder: boolean }).hasBorder = false;
  });
  await expect(button).not.toHaveClass(/trigger--bordered/);
  const borderless = await button.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
      background: style.backgroundColor,
      borderWidth: style.getPropertyValue('--ds-interaction-border-width').trim(),
    };
  });
  expect(bordered.background).toMatch(/^rgba\(.+, 0\)$/);
  expect(bordered.borderWidth).not.toBe('0px');
  expect(borderless).toEqual({
    ...bordered,
    borderWidth: '0px',
  });
});

test('retains a visible active dot and control boundary in forced colors', async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const supported = await page.evaluate(
    () =>
      window.matchMedia('(forced-colors: active)').matches &&
      CSS.supports('forced-color-adjust', 'auto')
  );
  test.skip(!supported, `${browserName} does not implement forced-colors CSS emulation`);

  const host = page.locator('#toggle');
  await expect(host.locator('.trigger__dot--active')).toHaveCSS('width', '2px');
  await expect(host.locator('.trigger__dot:not(.trigger__dot--active)').first()).toHaveCSS(
    'width',
    '2px'
  );
  await expect(host.getByRole('button')).toHaveCSS('outline-style', 'solid');
  await expect(host.getByRole('button')).toHaveAccessibleName(
    'View layout: Table, 1 of 3. Next: Chart'
  );
});
