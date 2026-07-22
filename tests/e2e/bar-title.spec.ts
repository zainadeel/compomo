import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

type BarTitleEventRecord = { type: string; id?: string };

function readEvents(page: import('@playwright/test').Page) {
  return page.evaluate(
    () =>
      (
        window as typeof window & {
          __barTitleEvents: BarTitleEventRecord[];
        }
      ).__barTitleEvents
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('/bar-title.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('composes one page main and semantic h1 with the default content inset', async ({ page }) => {
  const shell = page.locator('#shell-page');
  const header = page.locator('#detail-header');

  await expect(shell).toHaveAttribute('role', 'main');
  await expect(header).toHaveClass(/bar-title-host--expanded/);
  await expect(header.getByRole('heading', { level: 1, name: 'John Smith' })).toHaveCount(1);
  await expect(header.locator('.bar-title__description')).toHaveText(
    'View and manage driver details, activity, timecards, and settings.'
  );
  await expect(header.getByRole('button', { name: 'Back to Drivers' })).toBeVisible();
  await expect(header.locator('.bar-title__breadcrumb-back')).toHaveJSProperty('label', 'Drivers');

  const geometry = await shell.evaluate(element => {
    const header = element.querySelector<HTMLElement>('ds-bar-title');
    const content = element.querySelector<HTMLElement>('.shell-page__content');
    const bar = header?.querySelector<HTMLElement>('.bar-title');
    const breadcrumb = header?.querySelector<HTMLElement>('.bar-title__breadcrumb');
    const heading = header?.querySelector<HTMLElement>('.bar-title__heading');
    const divider = bar ? getComputedStyle(bar, '::after') : null;
    return {
      contentOffset: content?.offsetTop ?? 0,
      headerHeight: header?.getBoundingClientRect().height ?? 0,
      paddingTop: content ? Number.parseFloat(getComputedStyle(content).paddingTop) : 0,
      headingLeftInset:
        header && heading
          ? heading.getBoundingClientRect().left - header.getBoundingClientRect().left
          : 0,
      breadcrumbAboveHeading:
        breadcrumb && heading
          ? breadcrumb.getBoundingClientRect().bottom <= heading.getBoundingClientRect().top
          : false,
      dividerLeft: divider ? Number.parseFloat(divider.left) : 0,
      dividerRight: divider ? Number.parseFloat(divider.right) : 0,
    };
  });

  expect(geometry.contentOffset).toBe(geometry.headerHeight);
  expect(geometry.paddingTop).toBe(32);
  expect(geometry.headingLeftInset).toBe(32);
  expect(geometry.breadcrumbAboveHeading).toBe(true);
  expect(geometry.dividerLeft).toBe(32);
  expect(geometry.dividerRight).toBe(32);
});

test('keeps inline section state controlled and restores trigger focus', async ({ page }) => {
  const header = page.locator('#detail-header');
  const trigger = header.getByRole('button', {
    name: 'Change driver section. Current section: Summary',
  });

  await trigger.click();
  await page.getByRole('menuitem', { name: 'History' }).click();

  await expect(header).toHaveJSProperty('value', 'history');
  await expect(
    header.getByRole('button', {
      name: 'Change driver section. Current section: History',
    })
  ).toBeFocused();

  const events = await readEvents(page);
  expect(events).toContainEqual({ type: 'section', id: 'history' });
});

test('emits the same command ids from visible and overflow actions', async ({ page }) => {
  const header = page.locator('#detail-header');

  await header.getByRole('button', { name: 'Back to Drivers' }).click();
  await header.getByRole('button', { name: 'Call driver' }).click();
  const more = header.getByRole('button', { name: 'More driver actions' });
  await more.click();
  await page.getByRole('menuitem', { name: 'Message driver' }).click();
  await expect(more).toBeFocused();

  await more.click();
  const destructive = page.getByRole('menuitem', { name: 'Remove driver' });
  await expect(destructive).toHaveClass(/menu-item--destructive/);
  await destructive.click();

  const events = await readEvents(page);
  expect(events).toEqual([
    { type: 'back' },
    { type: 'action', id: 'call-driver' },
    { type: 'action', id: 'message-driver' },
    { type: 'action', id: 'remove-driver' },
  ]);
});

test('selects compact and constrained variants from ShellPage capacity', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const header = page.locator('#detail-header');

  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-2xl)';
  });
  await expect(header).toHaveClass(/bar-title-host--compact/);
  await expect(header).not.toHaveClass(/bar-title-host--constrained/);
  await expect(header.locator('.bar-title__description')).toHaveCount(0);
  await expect(header.locator('.bar-title__primary-action')).toHaveCount(1);

  const compactGeometry = await header.evaluate(element => {
    const host = element.getBoundingClientRect();
    const back = element.querySelector<HTMLElement>('.bar-title__back');
    const heading = element.querySelector<HTMLElement>('.bar-title__heading');
    const actions = element.querySelector<HTMLElement>('.bar-title__actions');
    const actionControls = actions
      ? Array.from(actions.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
      : [];
    return {
      height: host.height,
      backRight: back?.getBoundingClientRect().right ?? 0,
      headingLeft: heading?.getBoundingClientRect().left ?? 0,
      actionsRightInset: host.right - (actions?.getBoundingClientRect().right ?? host.right),
      headingPaddingLeft: heading ? Number.parseFloat(getComputedStyle(heading).paddingLeft) : 0,
      actionGap:
        actionControls.length > 1
          ? actionControls[1].getBoundingClientRect().left -
            actionControls[0].getBoundingClientRect().right
          : 0,
    };
  });

  expect(compactGeometry.height).toBe(48);
  expect(compactGeometry.headingLeft - compactGeometry.backRight).toBe(4);
  expect(compactGeometry.headingPaddingLeft).toBe(8);
  expect(compactGeometry.actionsRightInset).toBeCloseTo(8, 3);
  expect(compactGeometry.actionGap).toBe(8);

  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-lg)';
  });
  await expect(header).toHaveClass(/bar-title-host--constrained/);
  await expect(header.locator('.bar-title__primary-action')).toHaveCount(0);

  const more = header.getByRole('button', { name: 'More driver actions' });
  await more.click();
  await expect(page.getByRole('menuitem', { name: 'Call driver' })).toHaveCount(1);
});

test('aligns a compact top-level title with BarNav control text', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const header = page.locator('#detail-header');

  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-2xl)';
  });
  await header.evaluate((element: HTMLDsBarTitleElement) => {
    element.showBack = false;
    element.sections = [];
    element.primaryAction = null;
    element.actions = [];
    element.heading = 'Live Map';
  });
  await expect(header).toHaveClass(/bar-title-host--compact/);

  const geometry = await header.evaluate(element => {
    const host = element.getBoundingClientRect();
    const heading = element.querySelector<HTMLElement>('.bar-title__heading');
    const headingText = heading?.querySelector<HTMLElement>('.ds-text__element');
    return {
      textLeftInset:
        headingText && heading ? headingText.getBoundingClientRect().left - host.left : 0,
      headingHeight: heading?.getBoundingClientRect().height ?? 0,
    };
  });

  expect(geometry.textLeftInset).toBe(16);
  expect(geometry.headingHeight).toBe(32);
});

test('keeps a never-collapse primary action visible when constrained', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const header = page.locator('#detail-header');

  await header.evaluate((element: HTMLDsBarTitleElement) => {
    element.primaryAction = {
      id: 'save-driver',
      label: 'Save driver',
      type: 'submit',
      collapse: 'never',
    };
  });
  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-lg)';
  });

  await expect(header).toHaveClass(/bar-title-host--constrained/);
  await expect(header.getByRole('button', { name: 'Save driver' })).toBeVisible();

  await header.getByRole('button', { name: 'More driver actions' }).click();
  await expect(page.getByRole('menuitem', { name: 'Save driver' })).toHaveCount(0);
});

test('compacts on ShellApp scroll without changing page content flow', async ({ page }) => {
  const shell = page.locator('#shell-page');
  const header = page.locator('#detail-header');
  const scroller = page.locator('#shell-app .shell-app__content');
  const initialOffset = await shell
    .locator('.shell-page__content')
    .evaluate(element => (element as HTMLElement).offsetTop);

  await scroller.evaluate((element: HTMLElement) => {
    element.scrollTop = 120;
  });

  await expect(header).toHaveClass(/bar-title-host--compact/);
  await expect(header).not.toHaveClass(/bar-title-host--constrained/);
  await expect(shell.locator('.shell-page__flow-spacer')).not.toHaveCSS('height', '0px');

  const compactOffset = await shell
    .locator('.shell-page__content')
    .evaluate(element => (element as HTMLElement).offsetTop);
  expect(compactOffset).toBe(initialOffset);
});

test('keeps an open header menu in the top layer while the sticky header compacts', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const header = page.locator('#detail-header');
  const scroller = page.locator('#shell-app .shell-app__content');

  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-2xl)';
  });

  const trigger = header.getByRole('button', { name: 'More driver actions' });
  await trigger.click();
  const menu = page.getByRole('menu', { name: 'More driver actions' });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveJSProperty('popover', 'manual');
  expect(await menu.evaluate(element => element.matches(':popover-open'))).toBe(true);

  await scroller.evaluate((element: HTMLElement) => {
    element.scrollTop = 120;
  });
  await expect(header).toHaveClass(/bar-title-host--compact/);
  await expect(menu).toBeVisible();

  const compactGeometry = await Promise.all([
    trigger.boundingBox(),
    menu.boundingBox(),
  ]);
  expect(compactGeometry[0]).not.toBeNull();
  expect(compactGeometry[1]).not.toBeNull();
  expect(compactGeometry[1]!.y - (compactGeometry[0]!.y + compactGeometry[0]!.height)).toBe(4);

  await scroller.evaluate((element: HTMLElement) => {
    element.scrollTop = 240;
  });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

  expect(await trigger.boundingBox()).toEqual(compactGeometry[0]);
  expect(await menu.boundingBox()).toEqual(compactGeometry[1]);
  expect(await menu.evaluate(element => element.matches(':popover-open'))).toBe(true);
});

test('honors explicit ShellPage presentation overrides', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const shell = page.locator('#shell-page');
  const header = page.locator('#detail-header');

  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'var(--dimension-panel-width-lg)';
  });
  await shell.evaluate((element: HTMLDsShellPageElement) => {
    element.headerPresentation = 'expanded';
  });
  await expect(header).toHaveClass(/bar-title-host--expanded/);
  await expect(header.locator('.bar-title__description')).toHaveCount(1);
  await expect(header.locator('.bar-title__primary-action')).toHaveCount(1);

  await shell.evaluate((element: HTMLDsShellPageElement) => {
    element.headerPresentation = 'constrained';
  });
  await expect(header).toHaveClass(/bar-title-host--constrained/);
  await expect(header.locator('.bar-title__primary-action')).toHaveCount(0);
});

test('supports full-bleed content without changing header inset', async ({ page }) => {
  const shell = page.locator('#shell-page');
  const headerPaddingBefore = await page
    .locator('#detail-header .bar-title__inner')
    .evaluate(element => getComputedStyle(element).paddingInlineStart);

  await shell.evaluate((element: HTMLDsShellPageElement) => {
    element.contentInset = 'none';
  });

  await expect(shell.locator('.shell-page__content')).toHaveCSS('padding', '0px');
  await expect(page.locator('#detail-header .bar-title__inner')).toHaveCSS(
    'padding-left',
    headerPaddingBefore
  );
});

test('truncates a long heading before it can crowd fixed controls', async ({ page }) => {
  const viewport = page.locator('#app-viewport');
  const header = page.locator('#detail-header');
  await viewport.evaluate((element: HTMLElement) => {
    element.style.width = 'calc(var(--dimension-panel-width-2xl) + var(--dimension-space-200))';
  });
  await header.evaluate((element: HTMLDsBarTitleElement) => {
    element.heading =
      'A deliberately long driver name that must truncate safely before it can crowd page controls';
  });

  const geometry = await header.evaluate(element => {
    const host = element.getBoundingClientRect();
    const heading = element.querySelector<HTMLElement>('.bar-title__heading');
    const headingText = heading?.querySelector<HTMLElement>('.ds-text__element') ?? null;
    const section = element.querySelector<HTMLElement>('.bar-title__section-selector');
    const actions = element.querySelector<HTMLElement>('.bar-title__actions');
    const range = document.createRange();
    if (headingText) range.selectNodeContents(headingText);
    return {
      hostRight: host.right,
      sectionRight: section?.getBoundingClientRect().right ?? 0,
      actionsRight: actions?.getBoundingClientRect().right ?? 0,
      headingRight: heading?.getBoundingClientRect().right ?? 0,
      sectionLeft: section?.getBoundingClientRect().left ?? Number.POSITIVE_INFINITY,
      headingTruncated: headingText
        ? range.getBoundingClientRect().width > headingText.clientWidth
        : false,
    };
  });

  expect(geometry.headingTruncated).toBe(true);
  expect(geometry.headingRight).toBeLessThanOrEqual(geometry.sectionLeft);
  expect(geometry.sectionRight).toBeLessThanOrEqual(geometry.hostRight);
  expect(geometry.actionsRight).toBeLessThanOrEqual(geometry.hostRight);
});

test('omits a redundant section menu when only one section exists', async ({ page }) => {
  const header = page.locator('#detail-header');
  await header.evaluate((element: HTMLDsBarTitleElement) => {
    element.sections = [{ id: 'general', label: 'General' }];
    element.value = 'general';
  });

  await expect(header.locator('.bar-title__section-trigger')).toHaveCount(0);
  await expect(header.locator('.bar-title__section-menu')).toHaveCount(0);
});

test('has no automatically detectable accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
