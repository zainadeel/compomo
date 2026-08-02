import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

const reducedMotionAxe = chromiumOnly(
  'accessibility',
  'This integrated reduced-motion fixture scan is authoritative in Chromium; announcement and motion behavior retain dedicated coverage.',
);

test.beforeEach(async ({ page }) => {
  await page.goto('/banner.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders required description, optional heading, actions, and localized dismissal', async ({ page }) => {
  const controlled = page.locator('#controlled');
  await expect(controlled.locator('.banner-heading')).toHaveText('Connection interrupted');
  await expect(controlled.locator('.banner-heading')).toHaveClass(/ds-text--title-small/);
  await expect(controlled.locator('.banner-description')).toHaveText(
    'Changes will sync when service returns.',
  );
  await expect(controlled.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(controlled.getByRole('button', { name: 'View status' })).toBeVisible();
  await expect(controlled.locator('#extra-action')).toBeHidden();
  await expect(controlled.locator('#unsupported-action')).toBeHidden();
  await expect(controlled.getByRole('button', { name: 'Dismiss connection notice' })).toBeVisible();
  const wideCopy = await controlled.evaluate(element => {
    const surface = element.querySelector('.banner-surface')!;
    const copy = element.querySelector('.banner-copy')!;
    return {
      surfacePaddingInline: getComputedStyle(surface).paddingInlineStart,
      copyPaddingInline: getComputedStyle(copy).paddingInlineStart,
      copyPaddingBlock: getComputedStyle(copy).paddingBlockStart,
      flowPaddingInline: getComputedStyle(element.querySelector('.banner-copy-flow')!).paddingInlineStart,
    };
  });
  expect(wideCopy).toMatchObject({
    surfacePaddingInline: '8px',
    copyPaddingInline: '6px',
    copyPaddingBlock: '6px',
    flowPaddingInline: '2px',
  });

  const descriptionOnly = page.locator('#description-only');
  await expect(descriptionOnly.locator('.banner-heading')).toHaveCount(0);
  await expect(descriptionOnly.locator('.banner-description')).toHaveText('Reporting data is current.');
  await expect(descriptionOnly.locator('.banner-actions')).toBeHidden();
  await expect(descriptionOnly.getByRole('button', { name: 'Dismiss banner' })).toBeVisible();
});

test('flows wrapped description beneath its heading and top-aligns horizontal actions with dismiss', async ({ page }) => {
  const banner = page.locator('#inline-wrap');
  await expect(banner).toHaveAttribute('orientation', 'horizontal');
  await expect(banner).toHaveClass(/banner--orientation-horizontal/);

  const geometry = await banner.evaluate(element => {
    const flow = element.querySelector('.banner-copy-flow')!;
    const heading = element.querySelector('.banner-heading')!.getBoundingClientRect();
    const description = element.querySelector('.banner-description')!;
    const descriptionLines = Array.from(description.getClientRects());
    const action = element.querySelector('ds-button-unfilled[slot="actions"]')!.getBoundingClientRect();
    const dismiss = element.querySelector('.banner-dismiss')!.getBoundingClientRect();
    const flowBounds = flow.getBoundingClientRect();
    const flowPadding = Number.parseFloat(getComputedStyle(flow).paddingInlineStart);

    return {
      headingEnd: heading.right,
      firstDescriptionStart: descriptionLines[0]?.left,
      continuationStart: descriptionLines[1]?.left,
      descriptionLineCount: descriptionLines.length,
      textStart: flowBounds.left + flowPadding,
      actionTop: action.top,
      dismissTop: dismiss.top,
    };
  });

  expect(geometry.descriptionLineCount).toBeGreaterThan(1);
  expect(geometry.firstDescriptionStart).toBeGreaterThan(geometry.headingEnd);
  expect(geometry.continuationStart).toBeCloseTo(geometry.textStart, 0);
  expect(geometry.actionTop).toBeCloseTo(geometry.dismissTop, 0);
});

test('keeps announcement urgency independent from visual intent', async ({ page }) => {
  await expect(page.locator('#description-only .banner-surface')).not.toHaveAttribute('role');
  await expect(page.locator('#description-only .banner-surface')).not.toHaveAttribute('aria-live');
  await expect(page.locator('#polite .banner-surface')).toHaveAttribute('role', 'status');
  await expect(page.locator('#polite .banner-surface')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#assertive .banner-surface')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#assertive .banner-surface')).toHaveAttribute('aria-live', 'assertive');
});

test('maps every intent and contrast to a resolved surface recipe', async ({ page }) => {
  const intents = ['neutral', 'brand', 'positive', 'warning', 'caution', 'negative'];
  const contrasts = ['faint', 'medium', 'strong', 'bold'];

  for (const intent of intents) {
    for (const contrast of contrasts) {
      const banner = page.locator(`#matrix-${intent}-${contrast}`);
      await expect(banner).toHaveClass(new RegExp(`banner--intent-${intent}`));
      await expect(banner).toHaveClass(new RegExp(`banner--contrast-${contrast}`));
      const colors = await banner.locator('.banner-surface').evaluate((element, recipe) => {
        const style = getComputedStyle(element);
        const probe = document.createElement('span');
        probe.style.backgroundColor = `var(--color-background-${recipe.contrast}-${recipe.intent})`;
        probe.style.borderColor = recipe.contrast === 'faint'
          ? 'var(--color-border-tertiary)'
          : `var(--color-border-on-${recipe.contrast}-background-tertiary)`;
        const headingProbe = document.createElement('span');
        const descriptionProbe = document.createElement('span');
        headingProbe.style.color = recipe.contrast === 'faint'
          ? 'var(--color-foreground-primary)'
          : `var(--color-foreground-on-${recipe.contrast}-background-primary)`;
        descriptionProbe.style.color = recipe.contrast === 'faint'
          ? 'var(--color-foreground-secondary)'
          : `var(--color-foreground-on-${recipe.contrast}-background-secondary)`;
        probe.append(headingProbe, descriptionProbe);
        document.body.append(probe);
        const expected = getComputedStyle(probe);
        const result = {
          background: style.backgroundColor,
          heading: getComputedStyle(element.querySelector('.banner-heading')!).color,
          description: getComputedStyle(element.querySelector('.banner-description')!).color,
          border: style.borderBottomColor,
          borderWidth: Number.parseFloat(style.borderBottomWidth),
          expectedBackground: expected.backgroundColor,
          expectedHeading: getComputedStyle(headingProbe).color,
          expectedDescription: getComputedStyle(descriptionProbe).color,
          expectedBorder: expected.borderColor,
        };
        probe.remove();
        return {
          ...result,
        };
      }, { intent, contrast });
      expect(colors.background).toBe(colors.expectedBackground);
      expect(colors.heading).toBe(colors.expectedHeading);
      expect(colors.description).toBe(colors.expectedDescription);
      expect(colors.border).toBe(colors.expectedBorder);
      expect(colors.borderWidth).toBeGreaterThan(0);
    }
  }
});

test('emits controlled close and one post-exit event, and supports reopening', async ({ page }) => {
  const controlled = page.locator('#controlled');
  const close = controlled.getByRole('button', { name: 'Dismiss connection notice' });
  await close.focus();
  await expect(close).toBeFocused();
  await close.press('Enter');

  await expect.poll(() => controlled.evaluate((element: HTMLDsBannerElement) => element.open))
    .toBe(false);
  await expect(controlled).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.bannerEvents)).toEqual({
    close: 1,
    afterClose: 1,
  });

  await controlled.evaluate((element: HTMLDsBannerElement) => { element.open = true; });
  await expect(controlled.locator('.banner-surface')).toBeVisible();
  await expect.poll(() => controlled.evaluate(element => getComputedStyle(element).gridTemplateRows))
    .not.toBe('0px');
});

test('cancels a pending close when controlled state reopens', async ({ page }) => {
  const controlled = page.locator('#controlled');
  await controlled.evaluate((element: HTMLDsBannerElement) => {
    element.open = false;
    requestAnimationFrame(() => { element.open = true; });
  });

  await expect(controlled.locator('.banner-surface')).toBeVisible();
  await page.waitForTimeout(350);
  await expect.poll(() => page.evaluate(() => window.bannerEvents.afterClose)).toBe(0);
});

test('synchronizes surface and shell-space motion with directional panel easing', async ({ page }) => {
  const controlled = page.locator('#controlled');
  const opening = await controlled.evaluate(element => {
    const surface = element.querySelector('.banner-surface')!;
    const probe = document.createElement('span');
    probe.style.transitionDuration = 'var(--effect-animation-duration-short-3)';
    probe.style.transitionTimingFunction = 'var(--effect-animation-easing-ease-out)';
    document.body.append(probe);
    const result = {
      hostDuration: getComputedStyle(element).transitionDuration,
      hostEasing: getComputedStyle(element).transitionTimingFunction,
      surfaceProperties: getComputedStyle(surface).transitionProperty,
      surfaceDuration: getComputedStyle(surface).transitionDuration,
      surfaceEasing: getComputedStyle(surface).transitionTimingFunction,
      surfaceOpacity: getComputedStyle(surface).opacity,
      expectedDuration: getComputedStyle(probe).transitionDuration,
      expectedEasing: getComputedStyle(probe).transitionTimingFunction,
    };
    probe.remove();
    return result;
  });

  expect(opening.hostDuration).toBe(opening.expectedDuration);
  expect(opening.surfaceProperties).toBe('transform');
  expect(opening.surfaceDuration).toBe(opening.expectedDuration);
  expect(opening.hostEasing).toBe(opening.expectedEasing);
  expect(opening.surfaceEasing).toBe(opening.expectedEasing);
  expect(opening.surfaceOpacity).toBe('1');

  await controlled.evaluate((element: HTMLDsBannerElement) => { element.open = false; });
  await expect(controlled).toHaveClass(/banner--closing/);
  const closing = await controlled.evaluate(element => {
    const surface = element.querySelector('.banner-surface')!;
    const probe = document.createElement('span');
    probe.style.transitionDuration = 'var(--effect-animation-duration-short-3)';
    probe.style.transitionTimingFunction = 'var(--effect-animation-easing-ease-in)';
    document.body.append(probe);
    const result = {
      hostDuration: getComputedStyle(element).transitionDuration,
      hostEasing: getComputedStyle(element).transitionTimingFunction,
      surfaceProperties: getComputedStyle(surface).transitionProperty,
      surfaceDuration: getComputedStyle(surface).transitionDuration,
      surfaceEasing: getComputedStyle(surface).transitionTimingFunction,
      surfaceOpacity: getComputedStyle(surface).opacity,
      expectedEasing: getComputedStyle(probe).transitionTimingFunction,
    };
    probe.remove();
    return result;
  });

  expect(closing.hostDuration).toBe(opening.hostDuration);
  expect(closing.surfaceProperties).toBe(opening.surfaceProperties);
  expect(closing.surfaceDuration).toBe(opening.surfaceDuration);
  expect(closing.hostEasing).toBe(closing.expectedEasing);
  expect(closing.surfaceEasing).toBe(closing.expectedEasing);
  expect(closing.surfaceOpacity).toBe('1');
});

test('keeps one moving clip boundary flush with the shell edge', async ({ page }) => {
  const banner = page.locator('#shell-banner');
  await banner.evaluate((element: HTMLDsBannerElement) => { element.open = false; });
  await expect(banner).toBeHidden();

  const motion = await banner.evaluate(async (element: HTMLDsBannerElement) => {
    element.open = true;
    const deltas: number[] = [];
    const surfaceHeights: number[] = [];
    for (let frame = 0; frame < 16; frame += 1) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const surface = element.querySelector('.banner-surface');
      if (!surface) continue;
      const hostBounds = element.getBoundingClientRect();
      const surfaceBounds = surface.getBoundingClientRect();
      if (hostBounds.height > 0) {
        deltas.push(Math.abs(hostBounds.bottom - surfaceBounds.bottom));
        surfaceHeights.push(surfaceBounds.height);
      }
    }
    const overflow = element.querySelector('.banner-overflow')!;
    return {
      hostOverflow: getComputedStyle(element).overflow,
      innerOverflow: getComputedStyle(overflow).overflow,
      maximumEdgeDelta: Math.max(0, ...deltas),
      surfaceHeightRange: Math.max(...surfaceHeights) - Math.min(...surfaceHeights),
    };
  });

  expect(motion.hostOverflow).toBe('hidden');
  expect(motion.innerOverflow).toBe('visible');
  // WebKit can expose adjacent composited rectangles up to two CSS pixels apart
  // while a frame settles; a three-pixel ceiling still rejects a visible gap.
  expect(motion.maximumEdgeDelta).toBeLessThan(3);
  expect(motion.surfaceHeightRange).toBeLessThan(0.5);
});

test('uses an explicit vertical orientation without horizontal overflow', async ({ page }) => {
  const owner = page.locator('#narrow-owner');
  const banner = page.locator('#narrow');
  expect(await banner.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await owner.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(banner).toHaveAttribute('orientation', 'vertical');
  await expect(banner).toHaveClass(/banner--orientation-vertical/);
  await expect(banner.locator('.banner-trailing')).toHaveCSS('flex-wrap', 'nowrap');
  await expect(banner.locator('.banner-trailing')).toHaveCSS('padding-bottom', '8px');
  await expect(banner.locator('.banner-description')).toHaveCSS('display', 'block');
  await expect(banner.locator('.banner-description')).toHaveCSS('margin-top', '4px');
  const lanes = await banner.evaluate(element => {
    const heading = element.querySelector('.banner-heading')!.getBoundingClientRect();
    const description = element.querySelector('.banner-description')!.getBoundingClientRect();
    const copy = element.querySelector('.banner-copy')!.getBoundingClientRect();
    const flow = element.querySelector('.banner-copy-flow')!;
    const flowBounds = flow.getBoundingClientRect();
    const trailing = element.querySelector('.banner-trailing')!.getBoundingClientRect();
    const surfaceElement = element.querySelector('.banner-surface')!;
    const surface = surfaceElement.getBoundingClientRect();
    const dismiss = element.querySelector('.banner-dismiss')!.getBoundingClientRect();
    const action = element.querySelector('ds-button-unfilled[slot="actions"]')!.getBoundingClientRect();
    const flowPadding = Number.parseFloat(getComputedStyle(flow).paddingInlineStart);
    const borderWidth = Number.parseFloat(getComputedStyle(surfaceElement).borderBottomWidth);
    const expectedInset = Number.parseFloat(
      getComputedStyle(element).getPropertyValue('--dimension-space-100'),
    );
    return {
      copyTop: copy.top,
      headingBottom: heading.bottom,
      descriptionTop: description.top,
      trailingTop: trailing.top,
      dismissTopInset: dismiss.top - surface.top,
      dismissEndInset: surface.right - dismiss.right,
      actionStart: action.left,
      textStart: flowBounds.left + flowPadding,
      actionBottomInset: surface.bottom - borderWidth - action.bottom,
      expectedInset,
    };
  });
  expect(lanes.descriptionTop - lanes.headingBottom).toBeCloseTo(
    lanes.expectedInset / 2,
    3,
  );
  expect(lanes.trailingTop).toBeGreaterThan(lanes.copyTop);
  expect(lanes.actionStart).toBeCloseTo(lanes.textStart, 0);
  expect(lanes.actionBottomInset).toBeCloseTo(lanes.expectedInset * 2, 3);
  expect(lanes.dismissTopInset).toBeCloseTo(lanes.expectedInset, 1);
  expect(lanes.dismissEndInset).toBeCloseTo(lanes.expectedInset, 1);
});

test('occupies one full shell row and preserves application-owned content identity', async ({ page }) => {
  const shell = page.locator('#shell');
  const banner = page.locator('#shell-banner');
  const row = shell.locator('.shell-app__row');
  const geometry = await page.evaluate(() => ({
    shell: document.querySelector('#shell').getBoundingClientRect().toJSON(),
    banner: document.querySelector('#shell-banner').getBoundingClientRect().toJSON(),
    row: document.querySelector('#shell .shell-app__row').getBoundingClientRect().toJSON(),
  }));

  expect(geometry.banner.x).toBeCloseTo(geometry.shell.x, 0);
  expect(geometry.banner.width).toBeCloseTo(geometry.shell.width, 0);
  expect(geometry.row.y).toBeCloseTo(geometry.banner.y + geometry.banner.height, 0);
  expect(geometry.row.y + geometry.row.height).toBeCloseTo(
    geometry.shell.y + geometry.shell.height,
    0,
  );
  expect(geometry.banner.height + geometry.row.height).toBeCloseTo(
    geometry.shell.height,
    0,
  );

  const expandedOffset = geometry.row.y - geometry.shell.y;
  expect(expandedOffset).toBeGreaterThan(0);
  await banner.evaluate((element: HTMLDsBannerElement) => { element.open = false; });
  await expect(banner).toBeHidden();
  expect(await page.evaluate(() => {
    const shellRect = document.querySelector('#shell')!.getBoundingClientRect();
    const rowRect = document.querySelector('#shell .shell-app__row')!.getBoundingClientRect();
    return {
      rowOffset: rowRect.y - shellRect.y,
      rowBottomDelta: rowRect.bottom - shellRect.bottom,
      rowHeightDelta: rowRect.height - shellRect.height,
    };
  })).toEqual({ rowOffset: 0, rowBottomDelta: 0, rowHeightDelta: 0 });
  await expect.poll(() => page.locator('#shell-content').evaluate(
    element => (element as HTMLElement & { identityMarker: string }).identityMarker,
  )).toBe('stable');
});

test('removes transition delay under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const controlled = page.locator('#controlled');

  await controlled.evaluate((element: HTMLDsBannerElement) => { element.open = false; });
  await expect(controlled).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.bannerEvents.afterClose)).toBe(1);
});

test('preserves a real boundary in forced colors', async ({ page, browserName }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const supported = await page.evaluate(() => window.matchMedia('(forced-colors: active)').matches);
  test.skip(!supported, `${browserName} does not implement forced-colors emulation`);

  const surface = page.locator('#controlled .banner-surface');
  await expect(surface).toHaveCSS('border-bottom-style', 'solid');
  expect(await surface.evaluate(element => Number.parseFloat(getComputedStyle(element).borderBottomWidth)))
    .toBeGreaterThan(0);
});

test('has no detectable accessibility violations', reducedMotionAxe, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
