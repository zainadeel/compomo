import { expect, test } from '@playwright/test';

test('uses Chrome primary and secondary surfaces with secondary bubble text', async ({ page }) => {
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
    probe.style.color = 'var(--color-foreground-secondary)';
    const text = getComputedStyle(probe).color;
    probe.style.backgroundColor = 'var(--color-chrome-background-primary)';
    const primary = getComputedStyle(probe).backgroundColor;
    probe.style.backgroundColor = 'var(--color-chrome-background-secondary)';
    const secondary = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { text, primary, secondary };
  });

  await expect(outgoing).toHaveCSS('background-color', surfaces.primary);
  await expect(incoming).toHaveCSS('background-color', surfaces.secondary);
  await expect(outgoing).toHaveCSS('color', surfaces.text);
  await expect(incoming).toHaveCSS('color', surfaces.text);
});
