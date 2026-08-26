import { expect, test } from '@playwright/test';

test('starts incoming message content without an avatar prefix column', async ({ page }) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('ds-message').first();
  await expect(message.locator('.message__avatar')).toHaveCount(0);
  const author = message.locator('.message__header ds-text').filter({ hasText: 'Avery' });
  await expect(author).toHaveJSProperty('variant', 'text-body-small');
  await expect(author).toHaveJSProperty('emphasis', true);
  await expect(author).toHaveJSProperty('color', 'primary');

  const [rowBox, bodyBox] = await Promise.all([
    message.locator('.message').boundingBox(),
    message.locator('.message__body').boundingBox(),
  ]);
  if (!rowBox || !bodyBox) throw new Error('Message row geometry did not render');
  expect(bodyBox.x).toBeCloseTo(rowBox.x, 0);

  const [headerBox, contentBox, footerBox] = await Promise.all([
    message.locator('.message__header').boundingBox(),
    message.locator('.message__content').boundingBox(),
    message.locator('.message__footer').boundingBox(),
  ]);
  if (!headerBox || !contentBox || !footerBox) {
    throw new Error('Message metadata geometry did not render');
  }
  expect(contentBox.y - (headerBox.y + headerBox.height)).toBeCloseTo(4, 0);
  expect(footerBox.y - (contentBox.y + contentBox.height)).toBeCloseTo(4, 0);
});

test('reports failed delivery in footer metadata without changing the bubble', async ({ page }) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('#failed-message');
  const bubble = message.locator('ds-message-bubble');
  const failure = message.locator('.message__footer ds-text').filter({
    hasText: 'Failed to send',
  });
  const separator = message.locator('.message__footer ds-text').filter({ hasText: '·' });

  await expect(bubble).toHaveClass(/message-bubble--user/);
  await expect(bubble).not.toHaveClass(/message-bubble--error/);
  await expect(failure).toHaveJSProperty('color', 'negative');
  await expect(separator).toHaveJSProperty('color', 'tertiary');
  await expect(separator).toHaveAttribute('aria-hidden', 'true');

  const [contentBox, failureBox] = await Promise.all([
    message.locator('.message__content').boundingBox(),
    failure.boundingBox(),
  ]);
  if (!contentBox || !failureBox) throw new Error('Failed delivery metadata did not render');
  expect(failureBox.y - (contentBox.y + contentBox.height)).toBeCloseTo(4, 0);
});

test('places metadata actions around timestamps without moving metadata on hover', async ({
  page,
}) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const incoming = page.locator('#incoming-actions');
  const incomingActions = incoming.locator('.message__metadata-actions');
  const incomingFooter = incoming.locator('.message__footer');
  const incomingTime = incoming.locator('time');
  const outgoing = page.locator('#outgoing-actions');
  const outgoingActions = outgoing.locator('.message__metadata-actions');
  const outgoingFooter = outgoing.locator('.message__footer');
  const outgoingTime = outgoing.locator('time');

  await expect(incomingFooter).toHaveCSS('opacity', '0');
  const incomingTimeBefore = await incomingTime.boundingBox();
  await incoming.hover();
  await expect(incomingFooter).toHaveCSS('opacity', '1');
  const [incomingActionBox, incomingTimeAfter] = await Promise.all([
    incomingActions.boundingBox(),
    incomingTime.boundingBox(),
  ]);
  if (!incomingActionBox || !incomingTimeBefore || !incomingTimeAfter) {
    throw new Error('Incoming metadata actions did not render');
  }
  expect(incomingActionBox.x + incomingActionBox.width).toBeLessThanOrEqual(incomingTimeAfter.x);
  expect(incomingTimeAfter.x).toBeCloseTo(incomingTimeBefore.x, 0);

  await outgoing.hover();
  await expect(outgoingFooter).toHaveCSS('opacity', '1');
  const [outgoingActionBox, outgoingTimeBox] = await Promise.all([
    outgoingActions.boundingBox(),
    outgoingTime.boundingBox(),
  ]);
  if (!outgoingActionBox || !outgoingTimeBox) {
    throw new Error('Outgoing metadata actions did not render');
  }
  expect(outgoingActionBox.x).toBeGreaterThanOrEqual(outgoingTimeBox.x + outgoingTimeBox.width);
});

test('reveals hover metadata actions for keyboard focus and preserves persistent actions', async ({
  page,
}) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('#incoming-actions');
  const metadataFooter = message.locator('.message__footer');
  const copy = message.locator('ds-button-unfilled[aria-label="Copy message"]');
  await page.mouse.move(0, 0);
  await expect(metadataFooter).toHaveCSS('opacity', '0');
  await copy.focus();
  await expect(metadataFooter).toHaveCSS('opacity', '1');

  const persistent = message.locator('.message__actions #persistent-action');
  await expect(persistent).toBeVisible();
  await expect(message.locator('.message__footer #persistent-action')).toHaveCount(0);
});

test('keeps hover metadata visible for touch and coarse-pointer input', async ({
  browser,
}, testInfo) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    const baseURL = testInfo.project.use.baseURL as string;
    await page.goto(`${baseURL}/message-row.html`);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await expect
      .poll(() => page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches))
      .toBe(false);
    await expect(page.locator('#incoming-actions .message__footer')).toHaveCSS('opacity', '1');
  } finally {
    await context.close();
  }
});

test('copies message text and emits controlled feedback intent', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          document.documentElement.dataset.copiedText = text;
        },
      },
    });
  });
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const actions = page.locator('#incoming-actions ds-message-actions');
  await actions.evaluate(element => {
    element.addEventListener('dsCopyResult', event => {
      element.setAttribute(
        'data-copy-result',
        (event as CustomEvent<{ status: string }>).detail.status
      );
    });
    element.addEventListener('dsFeedbackChange', event => {
      element.setAttribute(
        'data-feedback-result',
        (event as CustomEvent<string | undefined>).detail ?? 'cleared'
      );
    });
  });

  const copy = actions.locator('ds-button-unfilled[aria-label="Copy message"]');
  await page.locator('#incoming-actions').hover();
  await copy.click();
  await expect(actions).toHaveAttribute('data-copy-result', 'success');
  await expect(page.locator('html')).toHaveAttribute(
    'data-copied-text',
    'The requested summary is ready.'
  );
  await expect(actions.locator('ds-button-unfilled[aria-label="Copied"]')).toBeVisible();
  await expect(actions.locator('ds-button-unfilled[aria-label="Copy message"]')).toBeVisible({
    timeout: 2500,
  });

  const positive = actions.locator('ds-button-unfilled[aria-label="Good response"]');
  await positive.click();
  await expect(actions).toHaveAttribute('data-feedback-result', 'positive');
  await actions.evaluate(element => {
    (element as HTMLElement & { feedback?: string }).feedback = 'positive';
  });
  await expect(positive).toHaveJSProperty('pressed', true);
  await expect(positive).toHaveJSProperty('activeFill', false);
  await expect(positive).toHaveJSProperty('icon', 'ThumbsUpFilled');
  await expect(positive.locator('.button-unfilled')).not.toHaveClass(
    /ds-interaction-fill--selected/
  );
  await positive.click();
  await expect(actions).toHaveAttribute('data-feedback-result', 'cleared');

  const negative = actions.locator('ds-button-unfilled[aria-label="Bad response"]');
  await negative.click();
  await expect(actions).toHaveAttribute('data-feedback-result', 'negative');
});

test('reports clipboard failure without entering copied state', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error('Clipboard denied')),
      },
    });
  });
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const actions = page.locator('#outgoing-actions ds-message-actions');
  await actions.evaluate(element => {
    element.addEventListener('dsCopyResult', event => {
      element.setAttribute(
        'data-copy-result',
        (event as CustomEvent<{ status: string }>).detail.status
      );
    });
  });
  await page.locator('#outgoing-actions').hover();
  await actions.locator('ds-button-unfilled[aria-label="Copy message"]').click();

  await expect(actions).toHaveAttribute('data-copy-result', 'error');
  await expect(actions.locator('ds-button-unfilled[aria-label="Copied"]')).toHaveCount(0);
});

test('ignores an in-flight clipboard result after message actions disconnect', async ({ page }) => {
  await page.addInitScript(() => {
    let finishClipboardWrite: (() => void) | undefined;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>(resolve => {
            finishClipboardWrite = resolve;
          }),
      },
    });
    Object.defineProperty(window, 'finishClipboardWrite', {
      configurable: true,
      value: () => finishClipboardWrite?.(),
    });
  });
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const message = page.locator('#outgoing-actions');
  const actions = message.locator('ds-message-actions');
  await actions.evaluate(element => {
    element.addEventListener('dsCopyResult', () => {
      document.documentElement.dataset.disconnectedCopyResult = 'emitted';
    });
  });
  await message.hover();
  await actions.locator('ds-button-unfilled[aria-label="Copy message"]').click();
  await actions.evaluate(element => element.remove());
  await page.evaluate(() => {
    (
      window as Window & {
        finishClipboardWrite?: () => void;
      }
    ).finishClipboardWrite?.();
  });

  await expect(page.locator('html')).not.toHaveAttribute(
    'data-disconnected-copy-result',
    'emitted'
  );
});

test('suppresses the complete metadata row until the last grouped message', async ({ page }) => {
  await page.goto('/message-row.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  await expect(page.locator('#group-first .message__footer')).toBeHidden();
  await expect(page.locator('#group-last .message__footer')).toBeVisible();
  await expect(
    page.locator('#group-last ds-button-unfilled[aria-label="Copy message"]')
  ).toBeVisible();
});
