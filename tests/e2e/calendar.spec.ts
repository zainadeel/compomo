import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-05T12:00:00'));
  await page.goto('/calendar.html');
  await expect(page.locator('#single').getByRole('grid', { name: 'September 2026' })).toBeVisible();
});

test('supported year boundaries keep inactive dates and navigation out of selection @cross-browser', async ({
  page,
}) => {
  const calendar = page.locator('#single');
  for (const [date, direction, key] of [
    ['0001-01-01', 'Previous month', 'ArrowLeft'],
    ['9999-12-31', 'Next month', 'ArrowRight'],
  ]) {
    await calendar.evaluate((element: HTMLDsCalendarElement, value) => {
      element.value = value;
    }, date);
    const selected = calendar.locator(`[data-date-option="${date}"]`);
    await expect(selected).toHaveAttribute('aria-selected', 'true');
    await expect(calendar.getByRole('button', { name: direction })).toBeDisabled();
    await selected.focus();
    await selected.press(key);
    await expect(selected).toBeFocused();
    await expect(calendar.locator('[role="gridcell"]')).toHaveCount(42);
    for (const unavailable of await calendar.locator('[data-date-option=""]').all()) {
      await expect(unavailable).toBeDisabled();
      await expect(unavailable).toHaveAttribute('aria-selected', 'false');
      await expect(unavailable).toHaveAttribute('tabindex', '-1');
    }
    await expect(calendar).toHaveJSProperty('value', date);
  }
});

test('outside-month dates are inactive until their month is displayed @cross-browser', async ({
  page,
}) => {
  const calendar = page.locator('#single');
  const outside = calendar.locator('.calendar-day--outside');
  await expect(outside).toHaveCount(12);
  await expect(outside.locator('ds-text').first()).toHaveJSProperty('color', 'tertiary');
  for (const day of await outside.all()) {
    await expect(day).toBeDisabled();
    await expect(day).toHaveAttribute('tabindex', '-1');
  }
  await outside.evaluateAll(elements => {
    for (const element of elements) {
      (element as HTMLButtonElement).click();
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await expect(calendar).toHaveAttribute('data-change-count', '0');
  await expect(calendar).toHaveJSProperty('value', '2026-09-30');

  await calendar.getByRole('button', { name: 'Next month' }).click();
  const octoberFirst = calendar.locator('[data-date-option="2026-10-01"]');
  await expect(octoberFirst).toBeEnabled();
  await octoberFirst.click();
  await expect(calendar).toHaveJSProperty('value', '2026-10-01');
  await expect(calendar).toHaveAttribute('data-change-count', '1');
});

test('month navigation keeps one enabled day in the tab order @cross-browser', async ({ page }) => {
  const calendar = page.locator('#single');
  const nextMonth = calendar.getByRole('button', { name: 'Next month' });
  await nextMonth.click();
  const tabStop = calendar.locator('[role="gridcell"][tabindex="0"]');
  await expect(tabStop).toHaveCount(1);
  await expect(tabStop).toBeEnabled();
  await expect(tabStop).toHaveAttribute('data-date-option', '2026-10-01');
  await nextMonth.press('Tab');
  await expect(tabStop).toBeFocused();

  const bounded = page.locator('#bounded');
  await expect(bounded.locator('[role="gridcell"][tabindex="0"]')).toHaveAttribute(
    'data-date-option',
    '2026-09-10'
  );
  await expect(page.locator('#inactive [role="gridcell"][tabindex="0"]')).toHaveCount(0);
});

test('keyboard navigation crosses months and keeps the focused day tabbable @cross-browser', async ({
  page,
}) => {
  const calendar = page.locator('#single');
  await calendar.evaluate(element => (element as HTMLDsCalendarElement).setFocus());
  const septemberLast = calendar.locator('[data-date-option="2026-09-30"]');
  await expect(septemberLast).toBeFocused();
  await septemberLast.press('ArrowRight');
  const octoberFirst = calendar.locator('[data-date-option="2026-10-01"]');
  await expect(calendar.getByRole('grid')).toHaveAttribute('aria-label', 'October 2026');
  await expect(octoberFirst).toBeFocused();
  await expect(octoberFirst).toBeEnabled();
  await expect(octoberFirst).toHaveAttribute('tabindex', '0');
  await octoberFirst.press('ArrowRight');
  const octoberSecond = calendar.locator('[data-date-option="2026-10-02"]');
  await expect(octoberSecond).toBeFocused();
  await expect(octoberSecond).toHaveAttribute('tabindex', '0');
  await expect(octoberFirst).toHaveAttribute('tabindex', '-1');
  await octoberSecond.press('Home');
  const septemberSunday = calendar.locator('[data-date-option="2026-09-27"]');
  await expect(septemberSunday).toBeFocused();
  await expect(calendar.getByRole('grid')).toHaveAttribute('aria-label', 'September 2026');
  await septemberSunday.press('PageDown');
  const octoberTuesday = calendar.locator('[data-date-option="2026-10-27"]');
  await expect(octoberTuesday).toBeFocused();
  await expect(octoberTuesday).toHaveAttribute('tabindex', '0');
  await octoberTuesday.press('Enter');
  await expect(calendar).toHaveJSProperty('value', '2026-10-27');
});

test('keyboard navigation respects inclusive date bounds @cross-browser', async ({ page }) => {
  const calendar = page.locator('#bounded');
  await calendar.evaluate(element => (element as HTMLDsCalendarElement).setFocus());
  const first = calendar.locator('[data-date-option="2026-09-10"]');
  await expect(first).toBeFocused();
  await first.press('ArrowLeft');
  await expect(first).toBeFocused();
  await first.press('PageUp');
  await expect(calendar.getByRole('grid')).toHaveAttribute('aria-label', 'September 2026');
  await expect(first).toBeFocused();
  await calendar.evaluate(element => {
    (element as HTMLDsCalendarElement).value = '2026-09-20';
  });
  const last = calendar.locator('[data-date-option="2026-09-20"]');
  await expect(last).toHaveAttribute('tabindex', '0');
  await calendar.evaluate(element => (element as HTMLDsCalendarElement).setFocus());
  await last.press('ArrowRight');
  await expect(last).toBeFocused();
  await last.press('PageDown');
  await expect(calendar.getByRole('grid')).toHaveAttribute('aria-label', 'September 2026');
  await expect(last).toBeFocused();
});

test('range selection ignores inactive dates and continues through month navigation @cross-browser', async ({
  page,
}) => {
  const calendar = page.locator('#range');
  await calendar.locator('[data-date-option="2026-09-30"]').click();
  await expect(calendar).toHaveJSProperty('value', 'range:2026-09-30/2026-09-30');
  await calendar.locator('[data-date-option="2026-09-29"]').hover();
  await expect(calendar.locator('.calendar-day--range-preview')).toHaveCount(1);
  const outside = calendar.locator('[data-date-option="2026-10-01"]');
  await outside.hover();
  await expect(calendar.locator('.calendar-day--range-preview')).toHaveCount(0);
  await outside.evaluate(element => (element as HTMLButtonElement).click());
  await expect(calendar).toHaveAttribute('data-change-count', '1');

  await calendar.getByRole('button', { name: 'Next month' }).click();
  const end = calendar.locator('[data-date-option="2026-10-03"]');
  await end.hover();
  await expect(end).toHaveClass(/calendar-day--range-preview/);
  await end.click();
  await expect(calendar).toHaveJSProperty('value', 'range:2026-09-30/2026-10-03');
  await expect(calendar).toHaveAttribute('data-change-count', '2');
});
