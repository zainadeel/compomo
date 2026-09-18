import { expect, test } from '@playwright/test';

test('uses Chrome primary and secondary surfaces with readable bubble text', async ({ page }) => {
  await page.goto('/message-bubble.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');

  const outgoing = page.locator('#outgoing .message-bubble');
  const incoming = page.locator('#incoming .message-bubble');
  await expect(outgoing).toHaveCSS('font-size', '14px');
  await expect(outgoing).toHaveCSS('line-height', '20px');
  await expect(outgoing).toHaveCSS('font-weight', '400');
  await expect(outgoing).toHaveCSS('border-radius', '8px');
  await expect(incoming).toHaveCSS('border-radius', '8px');
  await expect(outgoing).toHaveCSS('box-shadow', 'none');

  const surfaces = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.color = 'var(--color-foreground-primary)';
    const userText = getComputedStyle(probe).color;
    probe.style.color = 'var(--color-foreground-secondary)';
    const receivedText = getComputedStyle(probe).color;
    probe.style.backgroundColor = 'var(--color-chrome-background-primary)';
    const primary = getComputedStyle(probe).backgroundColor;
    probe.style.backgroundColor = 'var(--color-chrome-background-secondary)';
    const secondary = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { userText, receivedText, primary, secondary };
  });

  await expect(outgoing).toHaveCSS('background-color', surfaces.primary);
  await expect(incoming).toHaveCSS('background-color', surfaces.secondary);
  await expect(outgoing).toHaveCSS('color', surfaces.userText);
  await expect(incoming).toHaveCSS('color', surfaces.receivedText);
});

test('uses neutral faint user and secondary received surfaces on mobile', async ({ page }) => {
  await page.goto('/message-bubble.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.setViewportSize({ width: 390, height: 844 });

  const surfaces = await page.evaluate(() => {
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.backgroundColor = 'var(--color-background-faint-neutral)';
    const user = getComputedStyle(probe).backgroundColor;
    probe.style.backgroundColor = 'var(--color-background-secondary)';
    const received = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { user, received };
  });

  await expect(page.locator('#outgoing .message-bubble')).toHaveCSS(
    'background-color',
    surfaces.user
  );
  await expect(page.locator('#incoming .message-bubble')).toHaveCSS(
    'background-color',
    surfaces.received
  );
});
