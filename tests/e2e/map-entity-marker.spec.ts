import { expect, test } from '@playwright/test';

test('uses Unknown color independently from the optional dashed outline @cross-browser', async ({
  page,
}) => {
  await page.goto('/map-entity-marker.html');
  const marker = page.locator('#marker');
  await expect(marker).toHaveAttribute('state', 'moving');
  await marker.evaluate(element => {
    (element as HTMLDsMapEntityMarkerElement).state = 'unknown';
  });
  await expect(marker).toHaveAttribute('state', 'unknown');
  await expect(marker.locator('svg.map-entity-marker__dashed-outline')).toHaveCount(0);
  expect(
    await marker.evaluate(element => {
      const style = getComputedStyle(element);
      return (
        style.getPropertyValue('--_map-marker-background').trim() ===
        style.getPropertyValue('--color-entity-marker-background-stale').trim()
      );
    })
  ).toBe(true);
  await marker.evaluate(element => {
    (element as HTMLDsMapEntityMarkerElement).dashed = true;
  });
  await expect(marker.locator('svg.map-entity-marker__dashed-outline')).toHaveCount(1);
  await expect(marker).toHaveAttribute('state', 'unknown');
  await marker.evaluate(element => {
    Object.assign(element, { state: 'immobilized', bearing: 90 });
  });
  await expect(marker.locator('ds-icon')).toHaveJSProperty('name', 'MapKey');
  await expect(marker.locator('.map-entity-marker__glyph')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)'
  );
  await marker.evaluate(element => {
    (element as HTMLDsMapEntityMarkerElement).dashed = false;
  });
  await expect(marker.locator('svg.map-entity-marker__dashed-outline')).toHaveCount(0);
  await expect(marker).toHaveAttribute('state', 'immobilized');
});

test('rotates directional icons using bearing attributes and properties @cross-browser', async ({
  page,
}) => {
  await page.goto('/map-entity-marker.html');
  const marker = page.locator('#marker');
  const glyph = marker.locator('.map-entity-marker__glyph');
  await expect(glyph).toHaveCSS('transform', 'matrix(0, 1, -1, 0, 0, 0)');
  for (const bearing of [-450, 630]) {
    await marker.evaluate((element, value) => {
      (element as HTMLDsMapEntityMarkerElement).bearing = value;
    }, bearing);
    await expect(glyph).toHaveCSS('transform', 'matrix(0, -1, 1, 0, 0, 0)');
  }
  await marker.evaluate(element => {
    (element as HTMLDsMapEntityMarkerElement).bearing = Number.NaN;
  });
  await expect(glyph).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  await marker.evaluate(element => {
    (element as HTMLDsMapEntityMarkerElement).bearing = 90;
  });
  for (const icon of ['MapEntityVehicle', 'MapEntityAsset', 'MapEntityPerson']) {
    await marker.evaluate((element, value) => {
      (element as HTMLDsMapEntityMarkerElement).icon = value;
    }, icon);
    await expect(glyph).toHaveCSS(
      'transform',
      icon === 'MapEntityVehicle' ? 'matrix(0, 1, -1, 0, 0, 0)' : 'matrix(1, 0, 0, 1, 0, 0)'
    );
  }
  await marker.evaluate(element => {
    Object.assign(element, { icon: 'MapEntityVehicle', state: 'immobilized' });
  });
  await expect(glyph).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
});
