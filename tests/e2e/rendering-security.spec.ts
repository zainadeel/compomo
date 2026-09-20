import { expect, test, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/rendering-security.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('#first svg')).toHaveCount(1);
}
async function setIcon(page: Page, svg: string) {
  await page.evaluate(async svg => {
    (window as unknown as { setSecurityIcon(svg: string): void }).setSecurityIcon(svg);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, svg);
}

test('static glyphs retain paint, isolated references and valid replacement @cross-browser', async ({
  page,
}) => {
  await open(page);
  const firstId = await page.locator('#first linearGradient').getAttribute('id');
  const secondId = await page.locator('#second linearGradient').getAttribute('id');
  expect(firstId).not.toBe(secondId);
  await expect(page.locator('#first svg > rect')).toHaveAttribute('fill', `url(#${firstId})`);
  await expect(page.locator('#second svg > rect')).toHaveAttribute('fill', `url(#${secondId})`);
  await expect(page.locator('#flag svg')).toHaveCount(1);
  expect(await page.locator('#flag path[style]').count()).toBeGreaterThan(0);
  const box = await page.locator('#dynamic .icon').boundingBox();
  await setIcon(page, '<svg><path></svg>');
  await expect(page.locator('#dynamic svg')).toHaveCount(0);
  const rejectedBox = await page.locator('#dynamic .icon').boundingBox();
  expect(rejectedBox?.width).toBe(box?.width);
  expect(rejectedBox?.height).toBe(box?.height);
  await setIcon(page, '<svg><path d="M0 0h24v24z" fill="currentColor"/></svg>');
  await expect(page.locator('#dynamic path')).toHaveCount(1);
});

test('hostile SVG never executes, changes page styles or requests resources without CSP @cross-browser', async ({
  page,
}) => {
  const external: string[] = [];
  await page.route('https://example.invalid/**', route => {
    external.push(route.request().url());
    return route.abort();
  });
  await open(page);
  const background = await page
    .locator('body')
    .evaluate(element => getComputedStyle(element).backgroundColor);
  for (const svg of [
    '<svg onload="window.iconExecuted=true"><path/></svg>',
    '<svg><style>body{background:rgb(1,2,3)}</style></svg>',
    '<svg><image href="https://example.invalid/image"/></svg>',
    '<svg><path fill="url(https://example.invalid/paint)"/></svg>',
    '<svg><path style="fill:u\\72l(https://example.invalid/paint)"/></svg>',
    '<svg><foreignObject><iframe src="https://example.invalid/frame"/></foreignObject></svg>',
    '<svg><use href="#page-owned-id"/></svg>',
  ]) {
    await setIcon(page, svg);
    await expect(page.locator('#dynamic svg')).toHaveCount(0);
  }
  expect(
    await page.evaluate(() => (window as unknown as { iconExecuted?: boolean }).iconExecuted)
  ).toBeUndefined();
  await expect(page.locator('body')).toHaveCSS('background-color', background);
  expect(external).toEqual([]);
});

test('Markdown treats executable markup as inert and rejects encoded unsafe links @cross-browser', async ({
  page,
}) => {
  const external: string[] = [];
  await page.route('https://example.invalid/**', route => {
    external.push(route.request().url());
    return route.abort();
  });
  await open(page);
  const markdown = page.locator('#markdown');
  await markdown.evaluate(element => {
    (element as HTMLDsMarkdownElement).content = [
      '# Safe heading',
      '<script>window.markdownExecuted=true</script>',
      '<img src="https://example.invalid/image" onerror="window.markdownExecuted=true">',
      '[Unsafe](javascript:alert%281%29)',
      '[Encoded](java&colon;script:alert%281%29)',
      '[Entity scheme](javascript&colon;alert%281%29)',
      '[Data](data:text/html,script)',
      '[Good](https://example.com/docs)',
      '![Image](https://example.com/image.png)',
      '`<script>inert code</script>`',
    ].join('\n\n');
  });
  await expect(markdown.getByRole('heading')).toHaveText('Safe heading');
  await expect(markdown.locator('script,img,iframe,style')).toHaveCount(0);
  await expect(markdown.getByRole('link', { name: 'Unsafe', exact: true })).toHaveCount(0);
  await expect(markdown.getByRole('link', { name: 'Encoded', exact: true })).toHaveCount(0);
  await expect(markdown.getByRole('link', { name: 'Entity scheme', exact: true })).toHaveCount(0);
  await expect(markdown.getByRole('link', { name: 'Data', exact: true })).toHaveCount(0);
  await expect(markdown.getByRole('link', { name: 'Good', exact: true })).toHaveAttribute(
    'rel',
    'noopener noreferrer'
  );
  await expect(markdown.getByRole('link', { name: 'Image', exact: true })).toHaveAttribute(
    'href',
    'https://example.com/image.png'
  );
  await expect(markdown.locator('code')).toHaveText('<script>inert code</script>');
  expect(
    await page.evaluate(
      () => (window as unknown as { markdownExecuted?: boolean }).markdownExecuted
    )
  ).toBeUndefined();
  expect(external).toEqual([]);
});

test('icons and Markdown work with Trusted Types enforcement and no allowed policy @pr-critical @chromium-only', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/rendering-security.html', async route => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'none'; object-src 'none'; base-uri 'none'; connect-src 'self' ws://127.0.0.1:5199; require-trusted-types-for 'script'; trusted-types 'none'",
      },
    });
  });
  await open(page);
  await expect(page.locator('#flag svg')).toHaveCount(1);
  await expect(page.locator('#markdown h2')).toHaveText('Safe & sound');
  await expect(page.locator('#markdown strong')).toHaveText('Formatted');
  await expect(page.locator('#markdown')).toContainText('© ✓');
  await setIcon(page, '<svg><path d="M0 0h24v24z"/></svg>');
  await expect(page.locator('#dynamic path')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { securityViolations: string[] }).securityViolations
    )
  ).toEqual([]);
  // Confirm the fixture actually enforces the sink restriction.
  expect(
    await page.evaluate(() => {
      try {
        document.createElement('div').innerHTML = '<b>probe</b>';
        return false;
      } catch (error) {
        return error instanceof TypeError;
      }
    })
  ).toBe(true);
});
