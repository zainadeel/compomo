import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type ToastTestWindow = typeof window & {
  __addToast: (options: Record<string, unknown>) => string;
  __toastManager: {
    add?: (options: Record<string, unknown>) => string;
    close: (id: string) => void;
    getSnapshot: () => Array<{ id: string; type?: string; title?: string }>;
  };
  __createToastManager: () => ToastTestWindow['__toastManager'];
  __toastEvents: {
    actions: string[];
    closes: Array<{ id: string; reason: string }>;
    removes: string[];
  };
  __startToastPromise: () => void;
  __resolveToastPromise: (value: string) => void;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/toast.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('renders the minimal primary elevated surface and typed content', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'saved',
      title: 'Settings saved',
      description: 'Your changes are now available.',
      timeout: 0,
    });
  });

  const surface = page.locator('[data-toast-id="saved"] .toast-surface');
  await expect(surface).toBeVisible();
  const textRecipes = await surface.evaluate(element => {
    const title = element.querySelector<HTMLDsTextElement>('.toast-title');
    const description = element.querySelector<HTMLDsTextElement>('.toast-description');
    return {
      title: { variant: title?.variant, color: title?.color },
      description: { variant: description?.variant, color: description?.color },
    };
  });
  expect(textRecipes).toEqual({
    title: { variant: 'text-title-small', color: 'primary' },
    description: { variant: 'text-body-medium', color: 'secondary' },
  });

  const styling = await surface.evaluate(element => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-background-primary)';
    document.body.appendChild(probe);
    const result = {
      background: getComputedStyle(element).backgroundColor,
      expectedBackground: getComputedStyle(probe).backgroundColor,
      shadow: getComputedStyle(element).boxShadow,
    };
    probe.remove();
    return result;
  });
  expect(styling.background).toBe(styling.expectedBackground);
  expect(styling.shadow).not.toBe('none');

  const close = surface.locator('ds-button-unfilled.toast-close');
  await expect(close).not.toHaveAttribute('has-border');
  expect(await close.evaluate(element => {
    const button = element as HTMLDsButtonUnfilledElement;
    return { icon: button.icon, hasBorder: button.hasBorder };
  })).toEqual({ icon: 'Cross', hasBorder: false });
  const [surfaceBox, closeBox] = await Promise.all([
    surface.boundingBox(),
    close.boundingBox(),
  ]);
  if (!surfaceBox || !closeBox) throw new Error('Toast close geometry did not render');
  expect(closeBox.y - surfaceBox.y).toBeCloseTo(8, 0);
  expect(surfaceBox.x + surfaceBox.width - (closeBox.x + closeBox.width)).toBeCloseTo(8, 0);
});

test('centers one copy line in the 48px compact geometry', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'copied',
      description: 'Link copied.',
      timeout: 0,
    });
  });

  const surface = page.locator('[data-toast-id="copied"] .toast-surface');
  const copy = surface.locator('.toast-copy');
  await expect(copy).toBeVisible();
  const [surfaceBox, copyBox] = await Promise.all([
    surface.boundingBox(),
    copy.boundingBox(),
  ]);
  if (!surfaceBox || !copyBox) throw new Error('Compact Toast geometry did not render');
  expect(surfaceBox.height).toBeCloseTo(48, 0);
  expect(copyBox.y + copyBox.height / 2).toBeCloseTo(
    surfaceBox.y + surfaceBox.height / 2,
    0,
  );
});

test('limits the global stack and promotes the next record after close', async ({ page }) => {
  await page.evaluate(() => {
    const add = (window as ToastTestWindow).__addToast;
    for (let index = 1; index <= 4; index += 1) {
      add({ id: `stack-${index}`, title: `Toast ${index}`, timeout: 0 });
    }
  });

  await expect(page.locator('.toast-positioner')).toHaveCount(4);
  await expect(page.locator('.toast-positioner[data-limited]')).toHaveCount(2);
  await expect(page.locator('[data-toast-id="stack-1"]')).toHaveAttribute('inert', '');

  await page.evaluate(() => {
    (window as ToastTestWindow).__toastManager.close('stack-4');
  });
  await expect(page.locator('[data-toast-id="stack-4"]')).toHaveCount(0);
  await expect(page.locator('.toast-positioner[data-limited]')).toHaveCount(1);
  await expect(page.locator('[data-toast-id="stack-2"]')).not.toHaveAttribute('inert');
});

test('steps collapsed stack widths by 8px per side and expands to equal widths', async ({
  page,
}) => {
  await page.locator('#toast').evaluate((element: HTMLDsToastElement) => {
    element.limit = 3;
  });
  await page.evaluate(() => {
    const add = (window as ToastTestWindow).__addToast;
    for (let index = 1; index <= 3; index += 1) {
      add({ id: `width-${index}`, title: `Toast ${index}`, timeout: 0 });
    }
  });

  const boxes = await Promise.all(
    ['width-3', 'width-2', 'width-1'].map(id =>
      page.locator(`[data-toast-id="${id}"]`).boundingBox()
    ),
  );
  if (boxes.some(box => !box)) throw new Error('Collapsed stack geometry did not render');
  expect(boxes[0]!.width - boxes[1]!.width).toBeCloseTo(16, 0);
  expect(boxes[1]!.width - boxes[2]!.width).toBeCloseTo(16, 0);
  expect(boxes[0]!.y - boxes[1]!.y).toBeCloseTo(8, 0);
  expect(boxes[1]!.y - boxes[2]!.y).toBeCloseTo(8, 0);
  await expect(page.locator('[data-toast-id="width-2"] .toast-content')).toHaveCSS(
    'opacity',
    '0',
  );
  await expect(page.locator('[data-toast-id="width-1"] .toast-content')).toHaveCSS(
    'opacity',
    '0',
  );

  await page.locator('[data-toast-id="width-3"] .toast-surface').hover();
  await expect(page.locator('.toast-viewport')).toHaveAttribute('data-expanded', '');
  await expect
    .poll(async () => {
      const expandedWidths = await Promise.all(
        ['width-3', 'width-2', 'width-1'].map(id =>
          page.locator(`[data-toast-id="${id}"]`).evaluate(element =>
            element.getBoundingClientRect().width
          )
        ),
      );
      return new Set(expandedWidths.map(width => Math.round(width))).size;
    })
    .toBe(1);
  await expect(page.locator('[data-toast-id="width-2"] .toast-content')).toHaveCSS(
    'opacity',
    '1',
  );
  await expect(page.locator('[data-toast-id="width-1"] .toast-content')).toHaveCSS(
    'opacity',
    '1',
  );
});

test('promotes the correct stacked toast without dismissal jitter', async ({ page }) => {
  await page.locator('#toast').evaluate((element: HTMLDsToastElement) => {
    element.limit = 3;
  });
  await page.evaluate(() => {
    const add = (window as ToastTestWindow).__addToast;
    add({ id: 'jitter-back', title: 'Back', timeout: 0 });
    add({ id: 'jitter-middle', title: 'Middle', timeout: 0 });
    add({ id: 'jitter-front', title: 'Front', timeout: 0 });
  });

  await page.locator('[data-toast-id="jitter-front"] .toast-surface').hover();
  await page.locator('[data-toast-id="jitter-front"] .toast-close').click();
  await expect(page.locator('.toast-viewport')).toHaveAttribute('data-expanded', '');
  await expect
    .poll(() =>
      page.locator('[data-toast-id="jitter-middle"]').evaluate(element => ({
        index: getComputedStyle(element).getPropertyValue('--toast-index').trim(),
        offset: getComputedStyle(element).getPropertyValue('--toast-offset-y').trim(),
      }))
    )
    .toEqual({ index: '0', offset: '0px' });
  await expect(page.locator('[data-toast-id="jitter-front"]')).toHaveCount(0);
  await expect(page.locator('[data-toast-id="jitter-middle"]')).toBeVisible();
});

test('pauses and resumes the remaining timeout on hover', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'timed',
      title: 'Timed toast',
      timeout: 1000,
    });
  });

  const surface = page.locator('[data-toast-id="timed"] .toast-surface');
  await surface.hover();
  await page.waitForTimeout(1200);
  await expect(surface).toBeVisible();

  await page.mouse.move(0, 0);
  await expect(page.locator('[data-toast-id="timed"]')).toHaveCount(0);
  const close = await page.evaluate(
    () => (window as ToastTestWindow).__toastEvents.closes.at(-1),
  );
  expect(close).toEqual({ id: 'timed', reason: 'timeout' });
});

test('supports F6 access, actions, Escape dismissal, and focus restoration', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'action',
      title: 'Conversation archived',
      description: 'Undo if this was accidental.',
      actionLabel: 'Undo',
      timeout: 0,
    });
  });

  await page.locator('#before').focus();
  await page.keyboard.press('F6');
  await expect(page.locator('.toast-region')).toBeFocused();
  const undo = page.getByRole('button', { name: 'Undo' });
  await expect(undo).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(undo).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(page.locator('[data-toast-id="action"]')).toBeVisible();
  const actionGeometry = await page.locator('[data-toast-id="action"]').evaluate(element => {
    const content = element.querySelector<HTMLElement>('.toast-content')!;
    const description = element.querySelector<HTMLElement>('.toast-description')!;
    const action = element.querySelector<HTMLDsButtonUnfilledElement>('.toast-action')!;
    return {
      contentLeft: content.getBoundingClientRect().left,
      descriptionBottom: description.getBoundingClientRect().bottom,
      actionLeft: action.getBoundingClientRect().left,
      actionTop: action.getBoundingClientRect().top,
      hasBorder: action.hasBorder,
    };
  });
  expect(actionGeometry.hasBorder).toBe(true);
  expect(actionGeometry.actionLeft).toBeCloseTo(actionGeometry.contentLeft, 0);
  expect(actionGeometry.actionTop - actionGeometry.descriptionBottom).toBeCloseTo(16, 0);
  expect(
    await page.evaluate(() => (window as ToastTestWindow).__toastEvents.actions),
  ).toEqual(['action', 'callback:action']);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-toast-id="action"]')).toHaveCount(0);
  await expect(page.locator('#before')).toBeFocused();
  expect(
    await page.evaluate(() => (window as ToastTestWindow).__toastEvents.closes.at(-1)),
  ).toEqual({ id: 'action', reason: 'escape' });
});

test('announces high priority separately until users enter the region', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'urgent',
      title: 'Connection lost',
      description: 'Changes will sync later.',
      priority: 'high',
      timeout: 0,
    });
  });

  const visual = page.locator('[data-toast-id="urgent"] .toast-surface');
  await expect(visual).toHaveAttribute('role', 'alertdialog');
  await expect(visual).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.toast-assertive-announcer [role="alert"]')).toContainText(
    'Connection lost. Changes will sync later.',
  );

  await page.locator('#before').focus();
  await page.keyboard.press('F6');
  await expect(visual).not.toHaveAttribute('aria-hidden');
});

test('updates one record through promise loading and success states', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__startToastPromise();
  });
  const loading = page.locator('.toast-surface[data-type="loading"]');
  await expect(loading).toContainText('Uploading');

  const id = await page.evaluate(
    () => (window as ToastTestWindow).__toastManager.getSnapshot()[0].id,
  );
  await page.evaluate(() => {
    (window as ToastTestWindow).__resolveToastPromise('report.csv');
  });

  await expect(page.locator(`[data-toast-id="${id}"] .toast-surface`)).toHaveAttribute(
    'data-type',
    'success',
  );
  await expect(page.locator(`[data-toast-id="${id}"]`)).toContainText('report.csv');
  await expect(page.locator('.toast-positioner')).toHaveCount(1);
});

test('dismisses with an allowed swipe gesture', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'swipe',
      title: 'Swipe me',
      timeout: 0,
    });
  });

  const surface = page.locator('[data-toast-id="swipe"] .toast-surface');
  const box = await surface.boundingBox();
  if (!box) throw new Error('Toast surface did not render');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y, { steps: 4 });
  await page.mouse.up();

  await expect(page.locator('[data-toast-id="swipe"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as ToastTestWindow).__toastEvents.closes.at(-1)),
  ).toEqual({ id: 'swipe', reason: 'swipe' });
});

test('positions anchored feedback above its trigger and outside stack limits', async ({ page }) => {
  await page.evaluate(() => {
    const add = (window as ToastTestWindow).__addToast;
    add({ id: 'global-1', title: 'Global one', timeout: 0 });
    add({ id: 'global-2', title: 'Global two', timeout: 0 });
    add({ id: 'global-3', title: 'Global three', timeout: 0 });
    add({
      id: 'anchored',
      description: 'Link copied.',
      timeout: 0,
      positioner: {
        anchor: 'anchor',
        side: 'top',
        align: 'center',
        sideOffset: 8,
      },
    });
  });

  const anchored = page.locator('[data-toast-id="anchored"]');
  await expect(anchored).toHaveAttribute('data-positioned', 'true');
  await expect(anchored).not.toHaveAttribute('data-limited');
  const [toastBox, anchorBox] = await Promise.all([
    anchored.boundingBox(),
    page.locator('#anchor').boundingBox(),
  ]);
  if (!toastBox || !anchorBox) throw new Error('Anchored geometry did not render');
  expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(anchorBox.y);
  await expect(page.locator('.toast-positioner[data-limited]')).toHaveCount(1);
  await page.locator('#anchor').evaluate(element => element.remove());
  await expect(anchored).toHaveAttribute('data-positioned', 'false');
});

test('reattaches after reconnect and isolates manager replacement', async ({ page }) => {
  await page.evaluate(() => {
    const toast = document.getElementById('toast') as HTMLDsToastElement;
    toast.remove();
    document.body.appendChild(toast);
    (window as ToastTestWindow).__addToast({
      id: 'reconnected',
      title: 'Reconnected',
      timeout: 0,
    });
  });
  await expect(page.locator('[data-toast-id="reconnected"]')).toBeVisible();

  await page.evaluate(() => {
    const scope = window as ToastTestWindow;
    const oldManager = scope.__toastManager;
    const nextManager = scope.__createToastManager();
    const toast = document.getElementById('toast') as HTMLDsToastElement;
    toast.manager = nextManager as HTMLDsToastElement['manager'];
    scope.__toastManager = nextManager;
    oldManager.add?.({ id: 'stale', title: 'Stale', timeout: 0 });
    nextManager.add?.({ id: 'replacement', title: 'Replacement', timeout: 0 });
  });
  await expect(page.locator('[data-toast-id="stale"]')).toHaveCount(0);
  await expect(page.locator('[data-toast-id="replacement"]')).toBeVisible();
});

test('routes F6 to an eligible custom-manager region', async ({ page }) => {
  await page.evaluate(() => {
    const scope = window as ToastTestWindow;
    const manager = scope.__createToastManager();
    const toast = document.createElement('ds-toast');
    toast.id = 'secondary-toast';
    toast.manager = manager as HTMLDsToastElement['manager'];
    document.body.appendChild(toast);
    manager.add?.({ id: 'secondary', title: 'Secondary manager', timeout: 0 });
  });

  await page.locator('#before').focus();
  await page.keyboard.press('F6');
  await expect(page.locator('#secondary-toast .toast-region')).toBeFocused();
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
  await page.evaluate(() => {
    (window as ToastTestWindow).__addToast({
      id: 'accessible',
      description: 'Your changes are available.',
      actionLabel: 'Undo',
      timeout: 0,
    });
  });
  await expect(
    page.locator('[data-toast-id="accessible"] .toast-surface'),
  ).toHaveCSS('opacity', '1');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
