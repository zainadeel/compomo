import { expect, test, type Locator } from '@playwright/test';

async function reconnect(host: Locator) {
  await host.evaluate(async element => {
    const parent = element.parentElement!;
    element.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(element);
  });
}

async function chromeTransition(owner: Locator, phase: 'Start' | 'End') {
  await owner.evaluate((element, eventPhase) => {
    element.dispatchEvent(
      new CustomEvent(`dsChromeTransition${eventPhase}`, {
        detail: { source: 'panel-nav' },
        bubbles: true,
        composed: true,
      })
    );
  }, phase);
}

test('shell resumes viewport changes after repeated reconnects @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/shell-mobile.html');
  const shell = page.locator('#shell');
  await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
  await page.locator('#persistent-value').evaluate(element => {
    (element as HTMLInputElement).value = 'Keep this search';
  });

  for (const [width, mode] of [
    [390, 'mobile'],
    [1000, 'tablet'],
    [1280, 'desktop'],
  ] as const) {
    await reconnect(shell);
    await page.setViewportSize({ width, height: 800 });
    await expect(shell).toHaveAttribute('responsive-mode', mode);
    await expect(page.locator('#tools')).toHaveAttribute('responsive-mode', mode);
    await expect(page.locator('#persistent-value')).toHaveValue('Keep this search');
  }
});

test('shell reconciles a viewport changed while detached @cross-browser', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/shell-mobile.html');
  const shell = page.locator('#shell');
  await expect(shell).toHaveAttribute('responsive-mode', 'desktop');
  const detached = await shell.elementHandle();
  await detached!.evaluate(element => element.remove());
  await page.setViewportSize({ width: 390, height: 800 });
  await detached!.evaluate(element => document.querySelector('#app-root')!.append(element));
  await expect(shell).toHaveAttribute('responsive-mode', 'mobile');
  await expect(page.locator('#mobile-bar-nav')).toBeVisible();
});

test('panel navigation restores breakpoint and scroll-region observers @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/shell-app-chrome.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const panel = page.locator('#panel');
  const navigation = panel.locator('.panel-nav');
  await expect(navigation).not.toHaveClass(/panel-nav--breakpoint-locked/);

  for (const width of [1000, 1400]) {
    await reconnect(panel);
    await page.setViewportSize({ width, height: 800 });
    if (width < 1200) {
      await expect(navigation).toHaveClass(/panel-nav--breakpoint-locked/);
    } else {
      await expect(navigation).not.toHaveClass(/panel-nav--breakpoint-locked/);
    }
    await expect(navigation).not.toHaveClass(/panel-nav--animating/);
  }

  const body = panel.locator('.panel-nav__body');
  await body.evaluate(element => ((element as HTMLElement).style.maxHeight = '20px'));
  await expect(body).toHaveAttribute('role', 'region');
  await expect(body).toHaveAttribute('tabindex', '0');
  await body.evaluate(element => ((element as HTMLElement).style.maxHeight = ''));
  await expect(body).not.toHaveAttribute('role', 'region');
});

for (const fixture of [
  {
    name: 'bar navigation',
    path: '/',
    host: '#nav',
    parent: '#shell',
    trigger: '.bar-nav__overflow-trigger',
  },
  {
    name: 'page title',
    path: '/bar-page-title.html',
    host: '#resize-header',
    parent: '#resize-frame',
    trigger: '.bar-page-title__section-trigger',
  },
]) {
  test(`${fixture.name} restores overflow measurement after repeated reconnects @cross-browser`, async ({
    page,
  }) => {
    await page.goto(fixture.path);
    const host = page.locator(fixture.host);
    await expect(host.getByRole('tablist')).toBeVisible();
    for (const width of [280, 960]) {
      await reconnect(host);
      await page.locator(fixture.parent).evaluate((element, size) => {
        (element as HTMLElement).style.width = `${size}px`;
      }, width);
      if (width === 280) {
        await expect(host.locator(fixture.trigger)).toBeVisible();
      } else {
        await expect(host.locator(fixture.trigger)).toHaveCount(0);
        await expect(host.getByRole('tablist')).toBeVisible();
      }
    }
  });

  test(`${fixture.name} releases old transition gates and binds the current shell @cross-browser`, async ({
    page,
  }) => {
    await page.goto(fixture.path);
    const host = page.locator(fixture.host);
    await expect(host.getByRole('tablist')).toBeVisible();
    await host.evaluate(element => {
      // These event owners intentionally have no managed shell implementation.
      for (const id of ['previous-shell', 'current-shell']) {
        const owner = document.createElement('ds-shell-app');
        owner.id = id;
        owner.style.display = 'block';
        owner.style.width = '960px';
        element.parentElement!.append(owner);
      }
      document.getElementById('previous-shell')!.append(element);
    });
    const previous = page.locator('#previous-shell');
    const current = page.locator('#current-shell');
    await chromeTransition(previous, 'Start');
    await host.evaluate(element => {
      const owner = document.getElementById('current-shell')!;
      owner.style.width = '280px';
      owner.append(element);
    });
    await expect(host.locator(fixture.trigger)).toBeVisible();

    await chromeTransition(previous, 'Start');
    await current.evaluate(element => ((element as HTMLElement).style.width = '960px'));
    await expect(host.locator(fixture.trigger)).toHaveCount(0);

    await chromeTransition(current, 'Start');
    await current.evaluate(async element => {
      (element as HTMLElement).style.width = '280px';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await expect(host.locator(fixture.trigger)).toHaveCount(0);
    await chromeTransition(current, 'End');
    await expect(host.locator(fixture.trigger)).toBeVisible();
  });
}

test('shell drops interrupted transition measurements on reconnect @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/shell-mobile.html');
  const shell = page.locator('#shell');
  await expect(shell).toHaveCSS('--ds-shell-gradient-size', '1280px 800px');
  for (let depth = 0; depth < 2; depth++) {
    await chromeTransition(shell, 'Start');
  }
  const detached = await shell.elementHandle();
  await detached!.evaluate(element => element.remove());
  await page.setViewportSize({ width: 1440, height: 900 });
  await detached!.evaluate(element => document.querySelector('#app-root')!.append(element));
  await expect(shell).toHaveCSS('--ds-shell-gradient-size', '1440px 900px');
  await page.setViewportSize({ width: 1360, height: 850 });
  await expect(shell).toHaveCSS('--ds-shell-gradient-size', '1360px 850px');
});

test('removing an animating panel releases its original shell and settles the panel @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/shell-app-chrome.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const panel = page.locator('#panel');
  const completionCount = await panel.evaluate(async element => {
    const host = element as HTMLDsPanelNavElement;
    const parent = host.parentElement!;
    const shell = host.closest('ds-shell-app')!;
    let ends = 0;
    const onEnd = () => ends++;
    shell.addEventListener('dsChromeTransitionEnd', onEnd);
    host.collapsed = true;
    host.remove();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(host);
    shell.removeEventListener('dsChromeTransitionEnd', onEnd);
    return ends;
  });
  expect(completionCount).toBe(1);
  await expect(panel.locator('.panel-nav')).toHaveClass(/panel-nav--collapsed/);
  await expect(panel.locator('.panel-nav')).not.toHaveClass(/panel-nav--animating/);
  await panel.getByRole('button', { name: 'Expand navigation' }).click();
  await expect(panel.locator('.panel-nav')).not.toHaveClass(/panel-nav--collapsed/);
  await expect(panel.locator('.panel-nav')).not.toHaveClass(/panel-nav--animating/);
});

test('breadcrumbs resume label measurement after repeated reconnects @cross-browser', async ({
  page,
}) => {
  await page.goto('/bar-title.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const host = page.locator('#long-breadcrumb');
  const oldestLabel = host.locator('.breadcrumb__label').first();
  await expect(oldestLabel).toHaveText('Operations and workforce management');
  for (const width of [180, 1200]) {
    await reconnect(host);
    await page.locator('#breadcrumb-viewport').evaluate((element, size) => {
      (element as HTMLElement).style.width = `${size}px`;
    }, width);
    await expect(oldestLabel).toHaveText(
      width === 180 ? '…' : 'Operations and workforce management'
    );
  }
});

test('breadcrumbs recover a canceled measurement and detached input changes @cross-browser', async ({
  page,
}) => {
  await page.goto('/bar-title.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const host = page.locator('#long-breadcrumb');
  await host.evaluate(async element => {
    const breadcrumb = element as HTMLDsBreadcrumbElement;
    const parent = breadcrumb.parentElement!;
    // The property update queues a measurement that disconnect must cancel.
    breadcrumb.items = [...breadcrumb.items];
    breadcrumb.remove();
    breadcrumb.items = [
      {
        id: 'new-ancestor',
        label: 'Updated long ancestor label while detached',
        href: '#ancestor',
      },
      { id: 'new-current', label: 'Current page', isCurrent: true },
    ];
    parent.style.width = '80px';
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    parent.append(breadcrumb);
  });
  await expect(host.locator('.breadcrumb__label').first()).toHaveText('…');
  await expect(
    host.getByRole('link', { name: 'Updated long ancestor label while detached' })
  ).toBeVisible();
  await expect(host.locator('[aria-current="page"]')).toHaveText('Current page');
});

test('panel navigation clears interrupted drag state when disconnected @cross-browser', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/shell-app-chrome.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.locator('body').evaluate(element => {
    element.style.cursor = 'crosshair';
    element.style.userSelect = 'text';
  });
  const panel = page.locator('#panel');
  const handle = panel.locator('.panel-nav__resize-handle');
  const bounds = await handle.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
  await page.mouse.down();
  await expect(page.locator('body')).toHaveCSS('cursor', 'ew-resize');
  await reconnect(panel);
  await expect(page.locator('body')).toHaveCSS('cursor', 'crosshair');
  // Check the owned inline property without relying on engine-specific computed CSS names.
  await expect
    .poll(() => page.locator('body').evaluate(element => element.style.userSelect))
    .toBe('text');
  await page.mouse.up();
  await expect(panel.locator('.panel-nav')).not.toHaveClass(/panel-nav--collapsed/);
});
