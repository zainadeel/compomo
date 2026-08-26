import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/skeleton.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keeps atomic placeholders hidden while the owner exposes busy state', async ({ page }) => {
  await expect(page.locator('section')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('ds-skeleton')).toHaveCount(4);

  for (const skeleton of await page.locator('ds-skeleton').all()) {
    await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  }
});

test('matches selected metric canvases and resolves numeric width to pixels', async ({ page }) => {
  await expect(page.locator('#text')).toHaveClass(/skeleton--text-text-body-medium/);
  await expect(page.locator('#icon')).toHaveClass(/skeleton--icon-md/);
  await expect(page.locator('#icon')).toHaveClass(/skeleton--rounded/);
  await expect(page.locator('#control')).toHaveClass(/ds-control--md/);
  await expect(page.locator('#control')).toHaveCSS('width', '160px');

  const control = page.locator('#control');
  await control.evaluate(element => {
    (element as HTMLElement).style.setProperty('--ds-control-radius', '10px');
  });
  await expect(control.locator('.skeleton__shape')).toHaveCSS('border-radius', '10px');
});

test('scales icon shape insets proportionally from the medium canvas', async ({ page }) => {
  const icon = page.locator('#icon');
  const geometry = () =>
    icon.evaluate(element => {
      const host = element.getBoundingClientRect();
      const shape = element.shadowRoot!.querySelector<HTMLElement>('.skeleton__shape')!;
      const shapeBounds = shape.getBoundingClientRect();
      const tenth = (value: number) => Math.round(value * 10) / 10;
      return {
        hostSize: tenth(host.width),
        shapeSize: tenth(shapeBounds.width),
        inset: tenth(shapeBounds.left - host.left),
      };
    });

  await expect.poll(geometry).toEqual({ hostSize: 20, shapeSize: 15, inset: 2.5 });

  await icon.evaluate(element => {
    (element as HTMLElement & { iconSize: string }).iconSize = '3xl';
  });
  await expect(icon).toHaveClass(/skeleton--icon-3xl/);
  await expect.poll(geometry).toEqual({ hostSize: 56, shapeSize: 42, inset: 7 });
});

test('scales text bar block insets proportionally from the body-medium canvas', async ({
  page,
}) => {
  const text = page.locator('#text');
  const geometry = () =>
    text.evaluate(element => {
      const host = element.getBoundingClientRect();
      const shape = element.shadowRoot!.querySelector<HTMLElement>('.skeleton__shape')!;
      const shapeBounds = shape.getBoundingClientRect();
      const tenth = (value: number) => Math.round(value * 10) / 10;
      return {
        hostHeight: tenth(host.height),
        shapeHeight: tenth(shapeBounds.height),
        inset: tenth(shapeBounds.top - host.top),
      };
    });

  await expect.poll(geometry).toEqual({ hostHeight: 20, shapeHeight: 15, inset: 2.5 });

  await text.evaluate(element => {
    (element as HTMLElement & { textVariant: string }).textVariant = 'text-display-medium';
  });
  await expect(text).toHaveClass(/skeleton--text-text-display-medium/);
  await expect.poll(geometry).toEqual({ hostHeight: 56, shapeHeight: 42, inset: 7 });
});

test('uses concise background contexts with explicit faint support', async ({ page }) => {
  const skeleton = page.locator('#text');
  const contexts = [
    ['faint', '--color-foreground-quaternary', '--color-shimmer-shimmer'],
    [
      'medium',
      '--color-foreground-on-medium-background-quaternary',
      '--color-shimmer-shimmer-on-medium-background',
    ],
    [
      'bold',
      '--color-foreground-on-bold-background-quaternary',
      '--color-shimmer-shimmer-on-bold-background',
    ],
    [
      'strong',
      '--color-foreground-on-strong-background-quaternary',
      '--color-shimmer-shimmer-on-strong-background',
    ],
    ['translucent', '--color-translucent-foreground-quaternary', '--color-translucent-shimmer'],
    ['inverted', '--color-inverted-foreground-quaternary', '--color-inverted-shimmer'],
    ['media', '--color-media-foreground-quaternary', '--color-media-shimmer'],
    ['navigation', '--color-navigation-foreground-quaternary', '--color-navigation-shimmer'],
    ['always-dark', '--color-always-dark-foreground-quaternary', '--color-always-dark-shimmer'],
  ] as const;
  const tokenValue = (token: string) =>
    page.evaluate(
      name => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
      token
    );

  for (const [background, baseToken, shimmerToken] of contexts) {
    await skeleton.evaluate((element, value) => {
      (element as HTMLElement & { background: string }).background = value;
    }, background);
    await expect(skeleton).toHaveClass(new RegExp(`skeleton--background-${background}`));
    await expect
      .poll(() =>
        skeleton.evaluate(element =>
          getComputedStyle(element).getPropertyValue('--ds-skeleton-base').trim()
        )
      )
      .toBe(await tokenValue(baseToken));
    await expect
      .poll(() =>
        skeleton.evaluate(element =>
          getComputedStyle(element).getPropertyValue('--ds-shimmer').trim()
        )
      )
      .toBe(await tokenValue(shimmerToken));
  }
});

test('supports static mode and removes shimmer motion under reduced motion', async ({ page }) => {
  await expect(page.locator('#static .skeleton__shape')).not.toHaveClass(/ds-shimmer-surface/);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect
    .poll(() =>
      page
        .locator('#text .skeleton__shape')
        .evaluate(element => getComputedStyle(element, '::after').display)
    )
    .toBe('none');
});
