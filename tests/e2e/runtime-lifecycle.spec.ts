import { expect, test, type Locator } from '@playwright/test';

async function reconnect(host: Locator) {
  await host.evaluate(async element => {
    const parent = element.parentElement!;
    element.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/runtime-lifecycle.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

for (const id of ['modal', 'menu', 'group', 'filter']) {
  test(`${id} restores controlled open state and dismissal after reconnects @cross-browser`, async ({
    page,
  }) => {
    const host = page.locator(`#${id}`);
    const popup = host.locator(id === 'modal' ? 'dialog' : '[popover="manual"]').first();
    for (let cycle = 0; cycle < 2; cycle++) {
      await page.locator('#outside').focus();
      await host.evaluate(element => {
        (element as HTMLDsModalElement).open = true;
      });
      await expect(popup).toBeVisible();
      await reconnect(host);
      await expect(popup).toBeVisible();
      await expect
        .poll(() => popup.evaluate(element => element.matches('dialog:modal, :popover-open')))
        .toBe(true);
      await expect
        .poll(() => host.evaluate(element => element.contains(element.ownerDocument.activeElement)))
        .toBe(true);
      if (id === 'modal') await page.keyboard.press('Escape');
      else await page.locator('#outside').click();
      await expect(popup).toBeHidden();
      await expect
        .poll(() => host.evaluate(element => (element as HTMLDsModalElement).open))
        .toBe(false);
    }
  });

  test(`${id} respects controlled changes made while detached @cross-browser`, async ({ page }) => {
    const host = page.locator(`#${id}`);
    const popup = host.locator(id === 'modal' ? 'dialog' : '[popover="manual"]').first();
    await host.evaluate(element => {
      (element as HTMLDsModalElement).open = true;
    });
    await expect(popup).toBeVisible();
    await host.evaluate(async element => {
      const parent = element.parentElement!;
      element.remove();
      (element as HTMLDsModalElement).open = false;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      parent.append(element);
    });
    await expect(popup).toBeHidden();
    await host.evaluate(async element => {
      const parent = element.parentElement!;
      element.remove();
      (element as HTMLDsModalElement).open = true;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      parent.append(element);
    });
    await expect(popup).toBeVisible();
    await expect
      .poll(() => popup.evaluate(element => element.matches('dialog:modal, :popover-open')))
      .toBe(true);
  });
}

for (const [id, name] of [
  ['date', 'Choose date'],
  ['time', 'Choose time'],
  ['preferences', 'Configure records'],
] as const) {
  test(`${id} resets its internal picker and can reopen after reconnects @cross-browser`, async ({
    page,
  }) => {
    const host = page.locator(`#${id}`);
    const trigger = host.getByRole('button', { name, exact: true });
    const popup = host.locator('[popover="manual"]').first();
    for (let cycle = 0; cycle < 2; cycle++) {
      await trigger.click();
      await expect(popup).toBeVisible();
      await reconnect(host);
      await expect(popup).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await trigger.click();
      await expect(popup).toBeVisible();
      await page.locator('#outside').click();
      await expect(popup).toBeHidden();
    }
    if (id === 'date') await expect(host.locator('input')).toHaveValue('Sep 10, 2026');
    if (id === 'time') await expect(host.locator('input')).toHaveValue('9:30 AM');
  });
}

test('Markdown resumes cancelled parsing with the latest detached content @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#markdown');
  await expect(host.getByRole('heading')).toHaveText('Initial content');
  for (let cycle = 0; cycle < 2; cycle++) {
    await host.evaluate(async (element, cycle) => {
      const markdown = element as HTMLDsMarkdownElement;
      const parent = element.parentElement!;
      markdown.content = '# Scheduled before removal';
      element.remove();
      markdown.content = `## Updated while detached ${cycle}`;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      parent.append(element);
    }, cycle);
    await expect(host.getByRole('heading', { level: 2 })).toHaveText(
      `Updated while detached ${cycle}`
    );
  }
});

test('an open menu follows changed spacing tokens on its next layout pass @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#menu');
  await host.evaluate(element => {
    document.documentElement.style.setProperty('--runtime-menu-gap', '4px');
    const menu = element as HTMLDsMenuElement;
    menu.sideOffset = 'var(--runtime-menu-gap)';
    menu.open = true;
  });
  const popup = host.getByRole('menu');
  await expect(popup).toBeVisible();
  await popup.evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished));
  });
  const initial = (await popup.boundingBox())!.y;
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--runtime-menu-gap', '32px');
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(async () => (await popup.boundingBox())!.y).toBeCloseTo(initial + 28, 0);
});

test('Switch resumes interrupted motion setup and keeps its value @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#switch');
  await host.evaluate(async element => {
    const parent = element.parentElement!;
    (element as HTMLDsSwitchElement).checked = true;
    element.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
  await expect(host).toHaveAttribute('aria-checked', 'true');
  await expect
    .poll(() => host.evaluate(element => parseFloat(getComputedStyle(element).transitionDuration)))
    .toBeGreaterThan(0);
  await host.click();
  await expect(host).toHaveAttribute('aria-checked', 'false');
});

test('scroll overlay restores footer observation and live token measurements @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#scroll');
  const geometry = () =>
    host.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        clearance: parseFloat(style.getPropertyValue('--ds-scroll-overlay-block-size')),
        fade: parseFloat(style.getPropertyValue('--ds-scroll-overlay-fade-block-size')),
      };
    });
  await expect.poll(geometry).toEqual({ clearance: 40, fade: 48 });
  for (const height of [80, 120]) {
    await reconnect(host);
    await host.evaluate((element, height) => {
      element.style.setProperty('--dimension-space-100', '12px');
      element.querySelector<HTMLElement>('[slot="overlay"]')!.style.height = `${height}px`;
    }, height);
    await expect.poll(geometry).toEqual({ clearance: height, fade: height + 12 });
  }
});

test('delayed chart callouts recover when removal interrupts their first show @cross-browser', async ({
  page,
}) => {
  await page.locator('#callout').evaluate(element => element.remove());
  await page.locator('#chart-frame').evaluate(async frame => {
    const callout = document.createElement('ds-tooltip-chart');
    callout.id = 'delayed-callout';
    callout.delay = 200;
    callout.label = 'Driving';
    callout.value = '12';
    frame.append(callout);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    callout.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    frame.append(callout);
  });
  const callout = page.locator('#delayed-callout');
  await expect(callout).toHaveCSS('opacity', '1');
  await reconnect(callout);
  await expect(callout).toHaveCSS('opacity', '1');
});

test('mobile section sheets restore keyboard and visibility observers @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#sections');
  const trigger = host.getByRole('button', { name: /Change page section/ });
  for (let cycle = 0; cycle < 2; cycle++) {
    await trigger.click();
    await expect(host.locator('dialog')).toBeVisible();
    await reconnect(host);
    await expect(host.locator('dialog')).toBeHidden();
    await trigger.click();
    await expect(host.locator('dialog')).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(host).not.toHaveClass(/mobile-section-switcher--pointer-focus/);
    await host.evaluate(element => {
      element.style.display = 'none';
    });
    await expect(host.locator('dialog')).not.toHaveAttribute('open');
    await host.evaluate(element => element.style.removeProperty('display'));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  }
});

for (const id of ['banner', 'modal', 'menu', 'filter']) {
  test(`${id} cancels obsolete exit completions on removal @cross-browser`, async ({ page }) => {
    const host = page.locator(`#${id}`);
    await host.evaluate(element => {
      element.dataset.afterClose = '0';
      element.addEventListener('dsAfterClose', () => {
        element.dataset.afterClose = String(Number(element.dataset.afterClose) + 1);
      });
      (element as HTMLDsModalElement).open = true;
    });
    const surface = host
      .locator(
        id === 'banner' ? '.banner-surface' : id === 'modal' ? 'dialog' : '[popover="manual"]'
      )
      .first();
    await expect(surface).toBeVisible();
    await host.evaluate(async element => {
      const parent = element.parentElement!;
      (element as HTMLDsModalElement).open = false;
      // Let the closing state paint, then interrupt before its completion timer.
      await new Promise(resolve => requestAnimationFrame(resolve));
      element.remove();
      await new Promise(resolve => setTimeout(resolve, 300));
      parent.append(element);
    });
    await expect(surface).toBeHidden();
    await expect(host).toHaveAttribute('data-after-close', '0');
    await host.evaluate(element => {
      (element as HTMLDsModalElement).open = true;
    });
    await expect(surface).toBeVisible();
    await host.evaluate(element => {
      (element as HTMLDsModalElement).open = false;
    });
    await expect(surface).toBeHidden();
    await expect(host).toHaveAttribute('data-after-close', '1');
  });
}
