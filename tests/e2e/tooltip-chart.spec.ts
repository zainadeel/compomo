import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';
import { expectGeometryClose } from './rendered-geometry';

test.beforeEach(async ({ page }) => {
  await page.goto('/tooltip-chart.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test(
  'uses one menu-like content grid for single, grouped, mixed-swatch, and long rows',
  chromiumOnly(
    'layout-geometry',
    'The section spacing and medium control anatomy are static token-backed geometry.'
  ),
  async ({ page }) => {
    const single = page.locator('#single-tooltip');
    await expect(single).toBeVisible();
    await expect(single.locator('.tooltip-chart__item')).toHaveCount(1);
    await expect(single.locator('.tooltip-chart__heading')).toHaveCount(0);
    await expect(single.locator('.tooltip-chart__swatch-box')).toHaveCount(0);
    await expect(single.locator('.tooltip-chart__item')).toHaveCSS('height', '32px');
    await expect(single.locator('.tooltip-chart__item')).toHaveCSS('border-radius', '2px');
    await expect(single).toHaveCSS('padding', '4px');
    await expect(single).toHaveCSS('pointer-events', 'none');
    await expect(single.locator('button, a, input, select, textarea, [tabindex]')).toHaveCount(0);

    const grouped = page.locator('#grouped-tooltip');
    const groupedGeometry = await grouped.evaluate(element => {
      const host = element.getBoundingClientRect();
      const heading = element
        .querySelector<HTMLElement>('.tooltip-chart__heading')!
        .getBoundingClientRect();
      const rows = [...element.querySelectorAll<HTMLElement>('.tooltip-chart__item')].map(row =>
        row.getBoundingClientRect()
      );
      const labels = [...element.querySelectorAll<HTMLElement>('.tooltip-chart__label')].map(
        label => label.getBoundingClientRect()
      );
      const values = [...element.querySelectorAll<HTMLElement>('.tooltip-chart__value')].map(
        value => value.getBoundingClientRect()
      );
      const style = getComputedStyle(element);
      return {
        hostPadding: Number.parseFloat(style.paddingLeft),
        sectionGap: Number.parseFloat(style.gap),
        headingHeight: heading.height,
        headingRowGap: rows[0].top - heading.bottom,
        headingRowLeftDelta: heading.left - rows[0].left,
        rowHeights: rows.map(row => row.height),
        rowGaps: rows.slice(1).map((row, index) => row.top - rows[index].bottom),
        labelLefts: labels.map(label => label.left),
        valueRights: values.map(value => value.right),
        hostContainsRows: rows.every(row => row.left >= host.left && row.right <= host.right),
      };
    });

    expectGeometryClose(groupedGeometry.hostPadding, 4, 'tooltip section inset');
    expectGeometryClose(groupedGeometry.sectionGap, 4, 'tooltip section gap');
    expectGeometryClose(groupedGeometry.headingHeight, 32, 'tooltip heading height');
    expectGeometryClose(groupedGeometry.headingRowGap, 4, 'heading-to-row gap');
    expectGeometryClose(groupedGeometry.headingRowLeftDelta, 0, 'heading and row grid edge');
    groupedGeometry.rowHeights.forEach((height, index) =>
      expectGeometryClose(height, 32, `grouped row ${index + 1} height`)
    );
    groupedGeometry.rowGaps.forEach((gap, index) =>
      expectGeometryClose(gap, 4, `grouped row ${index + 1} gap`)
    );
    groupedGeometry.labelLefts
      .slice(1)
      .forEach((left, index) =>
        expectGeometryClose(left, groupedGeometry.labelLefts[0], `grouped label ${index + 2} inset`)
      );
    groupedGeometry.valueRights
      .slice(1)
      .forEach((right, index) =>
        expectGeometryClose(
          right,
          groupedGeometry.valueRights[0],
          `grouped value ${index + 2} edge`
        )
      );
    expect(groupedGeometry.hostContainsRows).toBe(true);

    const mixed = page.locator('#mixed-tooltip');
    await expect(mixed.locator('.tooltip-chart__swatch-box')).toHaveCount(3);
    await expect(mixed.locator('.tooltip-chart__swatch')).toHaveCount(2);
    const mixedGeometry = await mixed.evaluate(element => ({
      labelLefts: [...element.querySelectorAll<HTMLElement>('.tooltip-chart__label')].map(
        label => label.getBoundingClientRect().left
      ),
      valueRights: [...element.querySelectorAll<HTMLElement>('.tooltip-chart__value')].map(
        value => value.getBoundingClientRect().right
      ),
    }));
    mixedGeometry.labelLefts
      .slice(1)
      .forEach((left, index) =>
        expectGeometryClose(left, mixedGeometry.labelLefts[0], `mixed label ${index + 2} inset`)
      );
    mixedGeometry.valueRights
      .slice(1)
      .forEach((right, index) =>
        expectGeometryClose(right, mixedGeometry.valueRights[0], `mixed value ${index + 2} edge`)
      );

    const long = page.locator('#long-tooltip');
    const longGeometry = await long.evaluate(element => {
      const host = element.getBoundingClientRect();
      const content = [
        ...element.querySelectorAll<HTMLElement>('.tooltip-chart__heading, .tooltip-chart__item'),
      ].map(child => child.getBoundingClientRect());
      return {
        rowCount: element.querySelectorAll('.tooltip-chart__item').length,
        containsContent: content.every(
          child =>
            child.left >= host.left &&
            child.right <= host.right &&
            child.top >= host.top &&
            child.bottom <= host.bottom
        ),
        clipsInlineContent: element.scrollWidth > element.clientWidth,
        clipsBlockContent: element.scrollHeight > element.clientHeight,
      };
    });
    expect(longGeometry).toEqual({
      rowCount: 2,
      containsContent: true,
      clipsInlineContent: false,
      clipsBlockContent: false,
    });
  }
);

test('keeps immediate feedback while removing motion when reduced motion is requested', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const tooltip = page.locator('#grouped-tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveCSS('animation-name', 'none');
  await expect(tooltip).toHaveCSS('opacity', '1');
});
