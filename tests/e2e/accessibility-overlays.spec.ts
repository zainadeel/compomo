import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

const openPopupAxe = chromiumOnly(
  'accessibility',
  'Axe audits the integrated open popup in Chromium; popup focus and keyboard behavior remain cross-browser.'
);
const openModalAxe = chromiumOnly(
  'accessibility',
  'Axe audits the integrated open modal in Chromium; top-layer, focus, and dismissal behavior remain cross-browser elsewhere.'
);
const menuGeometry = chromiumOnly(
  'layout-geometry',
  'Token-backed menu spacing is engine-neutral and Chromium is authoritative for its computed geometry.'
);

test.beforeEach(async ({ page }) => {
  await page.goto('/accessibility-overlays.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('plain menu restores focus on Escape but lets Tab continue forward @pr-critical', async ({
  page,
}) => {
  const anchor = page.locator('#menu-anchor');
  await anchor.click();
  const menu = page.getByRole('menu', { name: 'Actions' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveJSProperty('popover', 'manual');
  expect(await menu.evaluate(element => element.matches(':popover-open'))).toBe(true);
  await expect(menu).toHaveCSS('border-top-width', '0px');
  await expect(menu).toHaveCSS('padding-top', '0px');
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(anchor).toBeFocused();
  await expect(anchor).toHaveAttribute('aria-expanded', 'false');

  await anchor.click();
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-menu')).toBeFocused();
  await expect(anchor).toHaveAttribute('aria-expanded', 'false');
});

test('single-selection menu uses selected row styling without a radio glyph', async ({ page }) => {
  await page.locator('#filter-anchor').click();
  const menu = page.getByRole('menu', { name: 'Conversation filter' });
  const selected = menu.getByRole('menuitemradio', { name: 'All chats', checked: true });
  const unselected = menu.getByRole('menuitemradio', { name: 'Unread', checked: false });

  await expect(selected).toBeVisible();
  await expect(selected).toHaveClass(/ds-interaction-fill--selected/);
  await expect(menu.locator('.menu-item__radio-box')).toHaveCount(0);
  const colors = await Promise.all([
    selected.locator('.menu-item__label').evaluate(element => getComputedStyle(element).color),
    unselected.locator('.menu-item__label').evaluate(element => getComputedStyle(element).color),
  ]);
  expect(colors[0]).not.toBe(colors[1]);
});

test('switch menu rows keep an 8px label-to-control gap', menuGeometry, async ({ page }) => {
  await page.locator('#switch-anchor').click();
  const row = page.getByRole('menuitemcheckbox', {
    name: 'Vehicle ID / Make · Model · Year',
  });

  await expect(row).toBeVisible();
  await expect
    .poll(() =>
      row.evaluate(element => {
        const content = element.querySelector('.menu-item__content');
        const control = element.querySelector('.menu-item__switch');
        if (!content || !control) return null;
        return Math.round(
          control.getBoundingClientRect().left - content.getBoundingClientRect().right
        );
      })
    )
    .toBe(8);
});

test(
  'menu prefix and drag handles share Select choice-row density and secondary color',
  menuGeometry,
  async ({ page }) => {
    const leadingMetrics = (row: ReturnType<typeof page.locator>) =>
      row.evaluate(element => {
        const icon = element.querySelector<HTMLElement>('.ds-choice-item__icon');
        const content = element.querySelector<HTMLElement>('.ds-choice-item__content');
        const glyph = element.querySelector<HTMLElement>('.ds-choice-item__icon ds-icon');
        if (!icon || !content || !glyph) return null;
        const rowRect = element.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const contentRect = content.getBoundingClientRect();
        const style = getComputedStyle(element);
        const probe = document.createElement('span');
        probe.style.color = 'var(--color-foreground-secondary)';
        document.body.append(probe);
        const expectedSecondary = getComputedStyle(probe).color;
        probe.remove();
        return {
          paddingInline: style.paddingInline,
          gap: style.gap,
          iconWidth: Math.round(iconRect.width),
          iconHeight: Math.round(iconRect.height),
          leadingInset: Math.round(iconRect.left - rowRect.left),
          iconToContent: Math.round(contentRect.left - iconRect.right),
          colorMatches: getComputedStyle(glyph).color === expectedSecondary,
        };
      });

    const expected = {
      paddingInline: '6px',
      gap: '4px',
      iconWidth: 20,
      iconHeight: 20,
      leadingInset: 6,
      iconToContent: 4,
      colorMatches: true,
    };

    await page.locator('#prefix-anchor').click();
    const prefixRow = page.getByRole('menu', { name: 'File actions' }).getByRole('menuitem', {
      name: 'Edit',
    });
    await expect(prefixRow).toBeVisible();
    await expect.poll(() => leadingMetrics(prefixRow)).toEqual(expected);

    await page.keyboard.press('Escape');
    await page.locator('#reorder-anchor').click();
    const handleRow = page
      .getByRole('menu', { name: 'Customize columns' })
      .getByRole('menuitemcheckbox', { name: 'Driver' });
    await expect(handleRow).toBeVisible();
    await expect(handleRow.locator('[data-menu-handle]')).toHaveCSS('cursor', 'grab');
    await expect.poll(() => leadingMetrics(handleRow)).toEqual(expected);
  }
);

test(
  'reorder drop rail stays centered between rows at every boundary',
  menuGeometry,
  async ({ page }) => {
    await page.locator('#reorder-anchor').click();
    const menu = page.getByRole('menu', { name: 'Customize columns' });
    const rows = menu
      .getByRole('menuitemcheckbox')
      .filter({ has: page.locator('[data-menu-handle]') });
    const driverHandle = rows.nth(0).locator('[data-menu-handle]');
    const boxes = await Promise.all([
      rows.nth(0).boundingBox(),
      rows.nth(1).boundingBox(),
      rows.nth(2).boundingBox(),
    ]);
    expect(boxes.every(Boolean)).toBe(true);
    const [firstBox, middleBox, lastBox] = boxes as [
      NonNullable<(typeof boxes)[number]>,
      NonNullable<(typeof boxes)[number]>,
      NonNullable<(typeof boxes)[number]>,
    ];
    const rowGap = middleBox.y - (firstBox.y + firstBox.height);
    expect(rowGap).toBeGreaterThan(0);

    await driverHandle.dispatchEvent('pointerdown', {
      button: 0,
      pointerId: 51,
      clientY: firstBox.y + firstBox.height / 2,
    });

    const railCenter = () =>
      menu.locator('[data-menu-drop-rail]').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return rect.y + rect.height / 2;
      });
    const movePointer = (clientY: number) =>
      page.evaluate(y => {
        window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 51, clientY: y }));
      }, clientY);

    const middleGapCenter = (middleBox.y + middleBox.height + lastBox.y) / 2;
    await movePointer(middleGapCenter);
    await expect.poll(railCenter).toBeCloseTo(middleGapCenter, 5);

    await movePointer(firstBox.y);
    await expect.poll(railCenter).toBeCloseTo(firstBox.y - rowGap / 2, 5);

    await movePointer(lastBox.y + lastBox.height);
    await expect(menu.locator('[data-menu-drop-rail]')).toHaveCount(1);
    await expect.poll(railCenter).toBeCloseTo(lastBox.y + lastBox.height + rowGap / 2, 5);

    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 51 }));
    });
    await expect(menu.locator('[data-menu-drop-rail]')).toHaveCount(0);
  }
);

test('reorderable switch rows move with keyboard and pointer without closing', async ({ page }) => {
  await page.locator('#reorder-anchor').click();
  const menu = page.getByRole('menu', { name: 'Customize columns' });
  const status = menu.getByRole('menuitemcheckbox', { name: 'Status' });
  await expect(status).toBeVisible();
  await expect(status).toHaveAccessibleDescription(/Drag to reorder/);
  await expect(menu.getByRole('menuitemcheckbox', { name: 'Action' })).toBeDisabled();
  await expect(
    menu.getByRole('menuitemcheckbox', { name: 'Action' }).locator('[data-menu-handle]')
  ).toHaveCount(0);

  const driverHandle = menu
    .getByRole('menuitemcheckbox', { name: 'Driver' })
    .locator('[data-menu-handle]');
  const vehicleBox = await menu.getByRole('menuitemcheckbox', { name: 'Vehicle' }).boundingBox();
  expect(vehicleBox).not.toBeNull();
  await driverHandle.dispatchEvent('pointerdown', {
    button: 0,
    pointerId: 42,
    clientY: vehicleBox!.y,
  });
  await page.evaluate(y => {
    window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 42, clientY: y }));
    window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 42, clientY: y }));
  }, vehicleBox!.y + vehicleBox!.height);
  await expect(menu.getByRole('menuitemcheckbox')).toHaveText([
    'Driver',
    'Status',
    'Vehicle',
    'Action',
  ]);

  await status.press('Meta+ArrowUp');
  await expect(menu.getByRole('menuitemcheckbox')).toHaveText([
    'Driver',
    'Status',
    'Vehicle',
    'Action',
  ]);

  await status.press('Alt+ArrowUp');
  await expect(menu.getByRole('menuitemcheckbox').nth(0)).toHaveAccessibleName('Status');
  await expect(menu.getByRole('menuitemcheckbox').nth(1)).toHaveAccessibleName('Driver');
  await expect(menu).toBeVisible();

  const vehicleHandle = menu
    .getByRole('menuitemcheckbox', { name: 'Vehicle' })
    .locator('[data-menu-handle]');
  await vehicleHandle.dragTo(menu.getByRole('menuitemcheckbox', { name: 'Status' }), {
    targetPosition: { x: 16, y: 4 },
  });
  await expect(menu.getByRole('menuitemcheckbox').nth(0)).toHaveAccessibleName('Vehicle');
  await expect(menu.getByRole('menuitemcheckbox').nth(1)).toHaveAccessibleName('Status');
  await expect(menu).toBeVisible();

  const driverTargetBox = await menu
    .getByRole('menuitemcheckbox', { name: 'Driver' })
    .boundingBox();
  expect(driverTargetBox).not.toBeNull();
  await menu
    .getByRole('menuitemcheckbox', { name: 'Vehicle' })
    .locator('[data-menu-handle]')
    .dragTo(menu.getByRole('menuitemcheckbox', { name: 'Driver' }), {
      targetPosition: { x: 16, y: driverTargetBox!.height - 1 },
    });
  await expect(menu.getByRole('menuitemcheckbox').nth(2)).toHaveAccessibleName('Vehicle');

  await menu
    .getByRole('menuitemcheckbox', { name: 'Vehicle' })
    .locator('[data-menu-handle]')
    .dragTo(menu.getByRole('menuitemcheckbox', { name: 'Status' }), {
      targetPosition: { x: 16, y: 1 },
    });
  await expect(menu.getByRole('menuitemcheckbox').nth(0)).toHaveAccessibleName('Vehicle');
  await expect(menu).toBeVisible();
});

test(
  'reorderable menu keeps status announcements outside the menu role',
  openPopupAxe,
  async ({ page }) => {
    await page.locator('#reorder-anchor').click();
    const menu = page.getByRole('menu', { name: 'Customize columns' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('status')).toHaveCount(0);
    await expect(page.locator('#reorder-menu').getByRole('status')).toHaveCount(1);

    const results = await new AxeBuilder({ page })
      .include('#reorder-menu')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
);

test('menu flips above a bottom-edge trigger instead of overlapping the viewport edge', async ({
  page,
}) => {
  const anchor = page.locator('#collision-anchor');
  await anchor.click();
  const menu = page.getByRole('menu', { name: 'Collision actions' });
  await expect(menu).toBeVisible();

  const [anchorBox, menuBox] = await Promise.all([anchor.boundingBox(), menu.boundingBox()]);
  expect(anchorBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(anchorBox!.y);
});

test('menu caps itself to adjacent viewport space and scrolls long choices', async ({ page }) => {
  const anchor = page.locator('#scroll-anchor');
  await anchor.click();
  const menu = page.getByRole('menu', { name: 'Scrollable actions' });
  const list = menu.locator('.ds-choice-list');
  await expect(menu).toBeVisible();

  const geometry = await Promise.all([
    anchor.boundingBox(),
    menu.boundingBox(),
    list.evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      overflowY: getComputedStyle(element).overflowY,
    })),
  ]);
  const [anchorBox, menuBox, listMetrics] = geometry;
  expect(anchorBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(menuBox!.y).toBeGreaterThanOrEqual(4);
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height - 4);
  expect(
    menuBox!.y + menuBox!.height <= anchorBox!.y || menuBox!.y >= anchorBox!.y + anchorBox!.height
  ).toBe(true);
  expect(listMetrics.scrollHeight).toBeGreaterThan(listMetrics.clientHeight);
  expect(listMetrics.overflowY).toBe('auto');

  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem', { name: 'Action 30' })).toBeFocused();
  await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
});

test(
  'rich preference popup exposes dialog and radio-group semantics without stealing arrow keys',
  openPopupAxe,
  async ({ page }) => {
    await page.locator('#rich-anchor').click();
    const popup = page.getByRole('dialog', { name: 'Appearance' });
    await expect(popup).toBeVisible();
    await expect(popup.getByRole('menu')).toHaveCount(0);

    const selected = popup.getByRole('radio', { checked: true });
    await expect(selected).toBeFocused();
    const before = await selected.getAttribute('aria-label');
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => popup.getByRole('radio', { checked: true }).getAttribute('aria-label'))
      .not.toBe(before);

    await page.keyboard.press('Tab');
    await expect(popup.getByRole('button', { name: 'System' })).toBeFocused();
    await expect(page.locator('#rich-anchor')).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    const dark = popup.getByRole('button', { name: 'Dark' });
    await expect(dark).toBeFocused();
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Tab');
    await expect(page.locator('#modal-trigger')).toBeFocused();
    await expect(page.locator('#rich-anchor')).toHaveAttribute('aria-expanded', 'false');

    await page.locator('#rich-anchor').click();
    const results = await new AxeBuilder({ page })
      .include('#rich-menu')
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations).toEqual([]);
  }
);

test('menu adds 4px only above headed sections after the first', menuGeometry, async ({ page }) => {
  await page.locator('#rich-anchor').click();
  const sections = page.getByRole('dialog', { name: 'Appearance' }).locator('.ds-choice-section');
  const heading = sections.first().locator('.ds-choice-section__header');

  const geometry = await heading.evaluate(element => {
    const label = element.querySelector<HTMLElement>('.ds-choice-section__header-label')!;
    const style = getComputedStyle(element);
    return {
      height: style.height,
      paddingInline: style.paddingInline,
      labelOffset: new DOMMatrix(getComputedStyle(label).transform).m42,
    };
  });

  expect(geometry).toEqual({
    height: '32px',
    paddingInline: '8px',
    labelOffset: 0,
  });
  await expect
    .poll(() =>
      sections.evaluateAll(elements =>
        elements.map(element => getComputedStyle(element).marginBlockStart)
      )
    )
    .toEqual(['0px', '4px']);
});

test('modal surface and backdrop animate together when entering and exiting', async ({ page }) => {
  const modal = page.locator('#modal');
  const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
  const readMotion = () =>
    dialog.evaluate(element => {
      const surface = getComputedStyle(element);
      const backdrop = getComputedStyle(element, '::backdrop');
      return {
        surfaceName: surface.animationName,
        surfaceDuration: surface.animationDuration,
        backdropName: backdrop.animationName,
        backdropDuration: backdrop.animationDuration,
      };
    });

  await modal.evaluate((element: HTMLDsModalElement) => {
    element.open = true;
  });
  await expect(dialog).toBeVisible();
  const openingMotion = await readMotion();
  expect(openingMotion).toMatchObject({
    surfaceName: 'modalDialogIn',
    backdropName: 'modalBackdropIn',
  });
  expect(openingMotion.surfaceDuration).not.toBe('0s');
  expect(openingMotion.backdropDuration).toBe(openingMotion.surfaceDuration);

  const closingMotion = await dialog.evaluate(
    element =>
      new Promise<{
        surfaceName: string;
        surfaceDuration: string;
        backdropName: string;
        backdropDuration: string;
      }>(resolve => {
        const captureClosingMotion = () => {
          if (!element.classList.contains('modal-dialog--closing')) return;
          observer.disconnect();
          const surface = getComputedStyle(element);
          const backdrop = getComputedStyle(element, '::backdrop');
          resolve({
            surfaceName: surface.animationName,
            surfaceDuration: surface.animationDuration,
            backdropName: backdrop.animationName,
            backdropDuration: backdrop.animationDuration,
          });
        };
        const observer = new MutationObserver(captureClosingMotion);
        observer.observe(element, { attributes: true, attributeFilter: ['class'] });
        (element.closest('ds-modal') as HTMLDsModalElement).open = false;
        captureClosingMotion();
      })
  );
  expect(closingMotion).toMatchObject({
    surfaceName: 'modalDialogOut',
    backdropName: 'modalBackdropOut',
    surfaceDuration: openingMotion.surfaceDuration,
    backdropDuration: openingMotion.backdropDuration,
  });
  await expect(dialog).toBeHidden();
});

test(
  'modal uses the top layer, reports dismissal reasons, and restores its trigger @pr-critical',
  openModalAxe,
  async ({ page }) => {
    const trigger = page.locator('#modal-trigger');
    await trigger.focus();
    await trigger.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
    const close = dialog.getByRole('button', { name: 'Close' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
    await expect(close).toBeFocused();
    expect(
      await dialog.evaluate(element => element instanceof HTMLDialogElement && element.open)
    ).toBe(true);
    expect((await dialog.boundingBox())!.width).toBeGreaterThan(1);

    await page.locator('#outside-action').evaluate((element: HTMLButtonElement) => element.focus());
    await expect(close).toBeFocused();

    const chromeHeights = await dialog.evaluate(element => ({
      header: getComputedStyle(element.querySelector('.modal-header')!).height,
      headerPaddingInline: getComputedStyle(element.querySelector('.modal-header')!).paddingInline,
      copyPaddingInline: getComputedStyle(element.querySelector('.modal-copy')!).paddingInline,
      copyPaddingBlock: getComputedStyle(element.querySelector('.modal-copy')!).paddingBlock,
      footer: getComputedStyle(element.querySelector('.modal-footer')!).height,
      titleFontSize: getComputedStyle(element.querySelector('.modal-heading')!).fontSize,
      titleLineHeight: getComputedStyle(element.querySelector('.modal-heading')!).lineHeight,
      titlePaddingInline: getComputedStyle(element.querySelector('.modal-heading')!).paddingInline,
      titleCenter: (() => {
        const bounds = element.querySelector('.modal-heading')!.getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      })(),
      closeCenter: (() => {
        const bounds = element.querySelector('.modal-close')!.getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      })(),
    }));
    expect(chromeHeights).toMatchObject({
      header: '49px',
      headerPaddingInline: '8px',
      copyPaddingInline: '6px',
      copyPaddingBlock: '6px',
      footer: '64px',
      titleFontSize: '14px',
      titleLineHeight: '20px',
      titlePaddingInline: '2px',
    });
    expect(chromeHeights.titleCenter).toBeCloseTo(chromeHeights.closeCenter, 1);

    await dialog.getByRole('button', { name: 'Cancel' }).focus();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();

    const results = await new AxeBuilder({ page }).include('#modal').analyze();
    expect(results.violations).toEqual([]);

    await close.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
      )
    ).toEqual(['close-button']);
    expect(
      await page.evaluate(
        () => (window as typeof window & { __modalAfterClose: number }).__modalAfterClose
      )
    ).toBe(1);

    await trigger.press('Enter');
    await expect(close).toBeFocused();
    const closeTooltip = page.getByRole('tooltip', { name: 'Close' });
    await expect(closeTooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(closeTooltip).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
      )
    ).toEqual(['close-button', 'escape']);

    await trigger.press('Enter');
    await expect(close).toBeFocused();
    await page.mouse.click(0, 0);
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
      )
    ).toEqual(['close-button', 'escape', 'backdrop']);
    expect(
      await page.evaluate(
        () => (window as typeof window & { __modalAfterClose: number }).__modalAfterClose
      )
    ).toBe(3);
  }
);

test('modal Escape dismissal remains authoritative while its close tooltip is open @cross-browser', async ({
  page,
}) => {
  const trigger = page.locator('#modal-trigger');
  const dialog = page.getByRole('dialog', { name: 'Confirm changes' });
  const close = dialog.getByRole('button', { name: 'Close' });

  await trigger.focus();
  await trigger.press('Enter');
  await expect(close).toBeFocused();
  await expect(page.getByRole('tooltip', { name: 'Close' })).toBeVisible();

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __modalCloseReasons: string[] }).__modalCloseReasons
    )
  ).toEqual(['escape']);
});

test('modal omits the footer block when no footer actions are assigned', async ({ page }) => {
  const modal = page.locator('#modal-no-footer');
  await modal.evaluate((element: HTMLDsModalElement) => {
    element.open = true;
  });

  const dialog = page.getByRole('dialog', { name: 'Update complete' });
  const footer = dialog.locator('.modal-footer');
  await expect(dialog).toBeVisible();
  await expect(footer).toHaveClass(/modal-footer--empty/);
  await expect(footer).toBeHidden();
  await expect(dialog.locator('.modal-description')).toHaveText(
    'Changes are already available to everyone.'
  );
  await expect(dialog.locator('.modal-heading')).toHaveClass(/ds-text--title-small/);
  await expect(dialog.locator('.modal-copy')).toHaveCSS('gap', '4px');
  await expect(dialog.locator('.modal-copy')).toHaveCSS('padding-inline', '6px');
  await expect(dialog.locator('.modal-copy')).toHaveCSS('padding-block', '6px');
  await expect(dialog.locator('.modal-heading')).toHaveCSS('padding-inline', '2px');
  await expect(dialog.locator('.modal-description')).toHaveCSS('padding-inline', '2px');
  const stackedHeader = await dialog.evaluate(element => {
    const header = element.querySelector('.modal-header')!.getBoundingClientRect();
    const heading = element.querySelector('.modal-heading')!.getBoundingClientRect();
    const description = element.querySelector('.modal-description')!.getBoundingClientRect();
    const close = element.querySelector('.modal-close')!.getBoundingClientRect();
    return {
      headerHeight: header.height,
      copyGap: description.top - heading.bottom,
      titleCenter: heading.top + heading.height / 2,
      closeCenter: close.top + close.height / 2,
    };
  });
  expect(stackedHeader.headerHeight).toBeGreaterThan(49);
  expect(stackedHeader.copyGap).toBeCloseTo(4, 0);
  expect(stackedHeader.titleCenter).toBeCloseTo(stackedHeader.closeCenter, 1);
  await expect(dialog).toHaveAttribute('aria-describedby', /ds-modal-title-\d+-description/);
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});
