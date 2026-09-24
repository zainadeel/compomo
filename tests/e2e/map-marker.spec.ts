import { expect, test } from '@playwright/test';

const INTENTS = ['brand', 'neutral', 'positive', 'warning', 'caution', 'negative'] as const;

test('renders a configured map icon with every semantic intent @cross-browser', async ({
  page,
}) => {
  await page.goto('/map-marker.html');
  const marker = page.locator('#marker');

  await expect(marker).toHaveAttribute('intent', 'neutral');
  await expect(marker.locator('ds-icon')).toHaveJSProperty('name', 'MapShieldCircle');

  for (const intent of INTENTS) {
    await marker.evaluate((element, value) => {
      (element as HTMLDsMapMarkerElement).intent = value;
    }, intent);
    await expect(marker).toHaveAttribute('intent', intent);
    expect(
      await marker.evaluate((element, value) => {
        const style = getComputedStyle(element);
        return (
          style.getPropertyValue('--_map-marker-background').trim() ===
          style.getPropertyValue(`--color-map-marker-intent-background-${value}`).trim()
        );
      }, intent)
    ).toBe(true);
  }
});

test('exposes native button activation and programmatic focus @cross-browser', async ({ page }) => {
  await page.goto('/map-marker.html');
  const marker = page.locator('#marker');
  await marker.evaluate(element => {
    element.addEventListener('dsClick', () => element.setAttribute('data-clicked', ''));
  });

  await marker.getByRole('button', { name: 'Open harsh braking event' }).click();
  await expect(marker).toHaveAttribute('data-clicked', '');

  await marker.evaluate(element => (element as HTMLDsMapMarkerElement).setFocus());
  await expect(marker.getByRole('button')).toBeFocused();
});
