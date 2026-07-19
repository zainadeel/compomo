import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/conversation-list-item.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('uses body-medium emphasis, one preview line, and read-aware title color', async ({
  page,
}) => {
  const item = page.locator('#conversation');
  const title = item.locator('.conversation-list-item__title');
  const preview = item.locator('.conversation-list-item__preview');
  const unreadTitle = page
    .locator('#unread-conversation')
    .locator('.conversation-list-item__title');

  await expect(title).toHaveCSS('font-size', '14px');
  await expect(title).toHaveCSS('line-height', '20px');
  await expect(title).toHaveCSS('font-weight', '500');
  await expect(preview).toHaveCSS('-webkit-line-clamp', '1');

  const colors = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.color = 'var(--color-foreground-primary)';
    const primary = getComputedStyle(probe).color;
    probe.style.color = 'var(--color-foreground-secondary)';
    const secondary = getComputedStyle(probe).color;
    probe.remove();
    return { primary, secondary };
  });
  await expect(title).toHaveCSS('color', colors.secondary);
  await expect(unreadTitle).toHaveCSS('color', colors.primary);
});

test('renders one unread dot centered on the title action track', async ({ page }) => {
  const item = page.locator('#unread-conversation');
  const rowButton = item.getByRole('button', { name: /Review inspection notes/ });
  const title = item.locator('.conversation-list-item__title');
  const badge = item.locator('ds-badge');
  const mark = badge.locator('.badge__mark');

  await expect(badge).toHaveClass(/badge--dot/);
  await expect(mark).toHaveText('');
  await rowButton.hover();
  await expect(item.locator('.conversation-list-item__unread')).toHaveCSS('opacity', '1');

  const [rowBox, titleBox, badgeBox] = await Promise.all([
    rowButton.boundingBox(),
    title.boundingBox(),
    badge.boundingBox(),
  ]);
  expect(rowBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(badgeBox).not.toBeNull();
  expect(
    Math.abs(titleBox!.y + titleBox!.height / 2 - (badgeBox!.y + badgeBox!.height / 2))
  ).toBeLessThanOrEqual(1);
  expect(Math.round(rowBox!.x + rowBox!.width - (badgeBox!.x + badgeBox!.width / 2))).toBe(16);
});

test('overlays a centered rounded action at the 8px right inset', async ({ page }) => {
  const item = page.locator('#conversation');
  const row = item.locator('.conversation-list-item__row');
  const actions = item.locator('.conversation-list-item__actions');
  const trigger = item.locator('#conversation-actions-trigger');

  await expect(actions).toHaveCSS('opacity', '0');
  await row.hover();
  await expect(actions).toHaveCSS('opacity', '1');

  const actionBlur = await actions.evaluate(element => {
    const styles = getComputedStyle(element);
    const blurToken = styles.getPropertyValue('--effect-blur-sm').trim();
    return { actual: styles.backdropFilter, expected: `blur(${blurToken})` };
  });
  expect(actionBlur.actual).toBe(actionBlur.expected);

  const actionBackground = await actions.evaluate(
    element => getComputedStyle(element).backgroundColor
  );
  expect(actionBackground).toMatch(/^rgba\(.*,[ ]?0\)$/);

  const layers = await item.evaluate(element => ({
    action: Number.parseInt(
      getComputedStyle(element.querySelector('.conversation-list-item__actions')!).zIndex,
      10
    ),
    hover: Number.parseInt(
      getComputedStyle(element.querySelector('.conversation-list-item')!, '::after').zIndex,
      10
    ),
  }));
  expect(layers.action).toBeGreaterThan(layers.hover);

  const [rowBox, triggerBox] = await Promise.all([row.boundingBox(), trigger.boundingBox()]);
  expect(rowBox).not.toBeNull();
  expect(triggerBox).not.toBeNull();
  expect(Math.round(rowBox!.x + rowBox!.width - (triggerBox!.x + triggerBox!.width))).toBe(8);
  expect(
    Math.abs(rowBox!.y + rowBox!.height / 2 - (triggerBox!.y + triggerBox!.height / 2))
  ).toBeLessThanOrEqual(1);
  await expect(trigger.locator('button')).toHaveCSS('border-radius', '9999px');
});

test('reveals the action for keyboard focus without selecting the conversation', async ({
  page,
}) => {
  const item = page.locator('#conversation');
  const rowButton = item.getByRole('button', { name: /Plan a service route/ });
  const trigger = item.getByRole('button', { name: 'Chat options' });
  await item.evaluate(element => {
    (element as HTMLElement & { selectCount?: number }).selectCount = 0;
    element.addEventListener('dsSelect', () => {
      (element as HTMLElement & { selectCount?: number }).selectCount! += 1;
    });
  });

  await rowButton.focus();
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await expect(item.locator('.conversation-list-item__actions')).toHaveCSS('opacity', '1');
  await trigger.click();
  const selectCount = await item.evaluate(
    element => (element as HTMLElement & { selectCount?: number }).selectCount ?? 0
  );
  expect(selectCount).toBe(0);
});
