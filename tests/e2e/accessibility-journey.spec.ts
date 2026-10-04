import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/accessibility-journey.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('keyboard settings journey preserves context through review, cancellation, and save @cross-browser', async ({
  page,
  browserName,
}) => {
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  const name = page.getByRole('textbox', { name: 'Display name' });
  await name.focus();
  await expect(name).toHaveAccessibleDescription('Use the name your team recognizes.');
  await name.fill('Fleet team');
  await page.keyboard.press(tab);
  const choice = page.locator('#delivery').getByRole('combobox');
  await expect(choice).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(choice).toBeFocused();
  await page.keyboard.press(tab);
  const review = page.getByRole('button', { name: 'Review changes' });
  await expect(review).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Review notification settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Fleet team: weekly');
  await page.keyboard.press('Escape');
  await expect(review).toBeFocused();
  await expect(name).toHaveValue('Fleet team');
  await page.keyboard.press('Enter');
  await dialog.getByRole('button', { name: 'Save changes' }).focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('status')).toHaveText('Notification settings saved.');
  await expect(review).toBeFocused();
});

for (const theme of ['light', 'dark']) {
  test(`settings and open review remain reachable at narrow reflow in ${theme} @pr-critical`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.locator('html').evaluate((element, theme) => {
      element.dataset.theme = theme;
      element.style.fontSize = '200%';
    }, theme);
    const review = page.getByRole('button', { name: 'Review changes' });
    await expect(review).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320
    );
    await review.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Review notification settings' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Save changes' })).toBeInViewport();
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    await page.keyboard.press('Escape');
    await expect(review).toBeFocused();
  });
}

for (const theme of ['light', 'dark']) {
  test(
    `settings and review have no serious or critical integrated accessibility findings in ${theme}`,
    chromiumOnly(
      'accessibility',
      'Integrated application-owned form summary and open review dialog are not represented in isolated component stories.'
    ),
    async ({ page }) => {
      await page.locator('html').evaluate((element, theme) => {
        element.dataset.theme = theme;
      }, theme);
      // Theme color transitions must settle before measuring contrast.
      await page.getByRole('main').evaluate(async element => {
        await Promise.all(
          element
            .getAnimations({ subtree: true })
            .map(animation => animation.finished.catch(() => {}))
        );
      });
      const form = await new AxeBuilder({ page }).include('main').analyze();
      expect(
        form.violations.filter(finding => ['serious', 'critical'].includes(finding.impact ?? ''))
      ).toEqual([]);
      await page.getByRole('button', { name: 'Review changes' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      // Contrast belongs to the settled state; entry opacity is tested separately.
      await page.getByRole('dialog').evaluate(async element => {
        await Promise.all(
          element
            .getAnimations({ subtree: true })
            .map(animation => animation.finished.catch(() => {}))
        );
      });
      const result = await new AxeBuilder({ page }).include('#review-dialog').analyze();
      expect(
        result.violations.filter(finding => ['serious', 'critical'].includes(finding.impact ?? ''))
      ).toEqual([]);
    }
  );
}
