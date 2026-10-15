import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/drawer.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

const drawerEvents = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { drawerEvents: { drawer: string; name: string; detail: unknown }[] })
        .drawerEvents
  );

const openDetails = async (page: Page, row = 0) => {
  await page.locator('.row').nth(row).click();
  await expect(page.locator('#details .drawer-dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close' }).first()).toBeFocused();
};

test('non-modal paging leaves focus with the owner on close @pr-critical', async ({ page }) => {
  await openDetails(page);
  const footer = page.locator('#details .drawer-footer');
  await expect(footer.locator('.drawer-footer__actions > #details-primary')).toHaveCount(1);

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#details-text')).toHaveText('Details for Event 2');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#details-text')).toHaveText('Details for Event 3');

  await page.keyboard.press('Escape');
  await expect(page.locator('.row').nth(2)).toBeFocused();
  const events = await drawerEvents(page);
  expect(events.filter(event => event.name === 'dsNext')).toHaveLength(2);
  expect(events.at(-1)).toEqual({
    drawer: 'details',
    name: 'dsAfterClose',
    detail: { restoreFocus: true },
  });
});

test('modal drawer returns focus to its trigger itself', async ({ page }) => {
  const trigger = page.locator('#modal-trigger');
  await trigger.focus();
  await trigger.press('Enter');
  await expect(page.locator('#settings .drawer-dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-trigger')).toBeFocused();
  const events = await drawerEvents(page);
  expect(events.at(-1)).toEqual({
    drawer: 'settings',
    name: 'dsAfterClose',
    detail: { restoreFocus: false },
  });
});

test('places named-slot content that a framework inserts after first render', async ({ page }) => {
  await openDetails(page);
  const drawer = page.locator('#details');

  // Angular @if inserts next to its anchor comment, which the drawer already moved into the body.
  await drawer.evaluate(element => {
    const body = element.querySelector('.drawer-body')!;
    const anchor = document.createComment('container');
    body.append(anchor);
    const action = document.createElement('button');
    action.id = 'late-action';
    action.slot = 'header-actions';
    action.textContent = 'Open page';
    const secondary = document.createElement('button');
    secondary.id = 'late-secondary';
    secondary.slot = 'footer';
    secondary.textContent = 'Dismiss';
    const nested = document.createElement('section');
    nested.innerHTML = '<span id="nested-footer" slot="footer">Owned by a nested component</span>';
    body.insertBefore(action, anchor);
    body.insertBefore(secondary, anchor);
    body.insertBefore(nested, anchor);
  });

  await expect(drawer.locator('.drawer-header__actions > #late-action')).toHaveCount(1);
  await expect(drawer.locator('.drawer-header__divider')).toHaveCount(1);
  await expect(drawer.locator('.drawer-footer__actions > #late-secondary')).toHaveCount(1);
  await expect(drawer.locator('.drawer-body section > #nested-footer')).toHaveCount(1);

  await drawer.evaluate(element => element.querySelector('#late-action')!.remove());
  await expect(drawer.locator('.drawer-header__actions')).toHaveClass(
    /drawer-header__actions--empty/
  );
  await expect(drawer.locator('.drawer-header__divider')).toHaveCount(0);
});

test('keeps drawer-named events from nested components inside the drawer', async ({ page }) => {
  await openDetails(page);
  await page.locator('#details-text').evaluate(element => {
    element.dispatchEvent(new CustomEvent('dsClose', { bubbles: true, composed: true }));
    element.dispatchEvent(new CustomEvent('dsNext', { bubbles: true, composed: true }));
  });

  await expect(page.locator('#details')).toHaveJSProperty('open', true);
  await expect(page.locator('#details-text')).toHaveText('Details for Event 1');
  expect(await drawerEvents(page)).toEqual([]);
});
