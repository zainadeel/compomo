import { expect, test } from '@playwright/test';

const VARIANT_LINE_HEIGHT_TOKEN: Record<string, string> = {
  'text-display-medium': '--typography-lineheight-3xl',
  'text-display-small': '--typography-lineheight-2xl',
  'text-title-large': '--typography-lineheight-xl',
  'text-title-medium': '--typography-lineheight-lg',
  'text-title-small': '--typography-lineheight-md',
  'text-body-large': '--typography-lineheight-lg',
  'text-body-medium': '--typography-lineheight-md',
  'text-body-small': '--typography-lineheight-sm',
  'text-caption': '--typography-lineheight-xs',
};

test.describe('ds-text metric box', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-metrics.html');
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
  });

  test('one line is one token line-height and N lines are N times it', async ({ page }) => {
    const results = await page.locator('[data-metric]').evaluateAll((elements, tokenMap) => {
      const rootStyle = getComputedStyle(document.documentElement);
      return elements.map(element => {
        const node = element as HTMLElement;
        const variant = node.dataset.variant!;
        const lines = Number(node.dataset.lines);
        const style = getComputedStyle(node);
        return {
          variant,
          lines,
          height: node.getBoundingClientRect().height,
          computedLineHeight: Number.parseFloat(style.lineHeight),
          tokenLineHeight: Number.parseFloat(rootStyle.getPropertyValue(tokenMap[variant])),
        };
      });
    }, VARIANT_LINE_HEIGHT_TOKEN);

    for (const result of results) {
      expect(result.computedLineHeight, `${result.variant} computed leading`).toBeCloseTo(
        result.tokenLineHeight,
        5,
      );
      expect(result.height, `${result.variant} ${result.lines}-line box`).toBeCloseTo(
        result.lines * result.tokenLineHeight,
        5,
      );
    }
  });

  test('streaming content grows in whole line-height increments without remounting', async ({
    page,
  }) => {
    const before = await page.locator('#streaming').evaluate(element => {
      const node = element as HTMLElement;
      return {
        height: node.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(node).lineHeight),
      };
    });

    await page.locator('#streaming').evaluate(element => {
      element.append(' content continues as more tokens arrive from the model');
    });

    const after = await page.locator('#streaming').evaluate(element => {
      const node = element as HTMLElement;
      return {
        height: node.getBoundingClientRect().height,
        lineHeight: Number.parseFloat(getComputedStyle(node).lineHeight),
      };
    });

    expect(after.lineHeight).toBeCloseTo(before.lineHeight, 5);
    expect(after.height).toBeGreaterThan(before.height);
    expect(after.height / after.lineHeight).toBeCloseTo(
      Math.round(after.height / after.lineHeight),
      5,
    );
  });

  test('host-level ellipsis reaches the inner text node', async ({ page }) => {
    const truncation = await page.locator('#truncate-host').evaluate(element => {
      const host = element as HTMLElement;
      const inner = host.querySelector('.ds-text__element') as HTMLElement;
      const hostStyle = getComputedStyle(host);
      const innerStyle = getComputedStyle(inner);
      return {
        hostWidth: host.getBoundingClientRect().width,
        innerWidth: inner.getBoundingClientRect().width,
        hostOverflow: hostStyle.overflow,
        innerOverflow: innerStyle.overflow,
        innerTextOverflow: innerStyle.textOverflow,
        innerWhiteSpace: innerStyle.whiteSpace,
      };
    });

    expect(truncation.hostWidth).toBeCloseTo(72, 5);
    expect(truncation.innerWidth).toBeCloseTo(72, 5);
    expect(truncation.hostOverflow).toBe('hidden');
    expect(truncation.innerOverflow).toBe('hidden');
    expect(truncation.innerTextOverflow).toBe('ellipsis');
    expect(truncation.innerWhiteSpace).toBe('nowrap');
  });

  test('representative controls keep exact outer heights and center text boxes', async ({
    page,
  }) => {
    const cases = [
      { control: '#button-md button', text: '#button-md ds-text', height: 32, leading: 20 },
      { control: '#button-bordered-md button', text: '#button-bordered-md ds-text', height: 32, leading: 20 },
      { control: '#button-borderless-md button', text: '#button-borderless-md ds-text', height: 32, leading: 20 },
      { control: '#tag-sm', text: '#tag-sm ds-text', height: 24, leading: 16 },
      { control: '#select-xs .trigger', text: '#select-xs ds-text', height: 16, leading: 12 },
    ];

    for (const item of cases) {
      const geometry = await page.evaluate(({ control, text }) => {
        const controlRect = document.querySelector(control)!.getBoundingClientRect();
        const textNode = document.querySelector(text) as HTMLElement;
        const textRect = textNode.getBoundingClientRect();
        return {
          controlHeight: controlRect.height,
          textHeight: textRect.height,
          centerDelta:
            (textRect.top + textRect.height / 2) -
            (controlRect.top + controlRect.height / 2),
        };
      }, item);

      expect(geometry.controlHeight, item.control).toBeCloseTo(item.height, 5);
      expect(geometry.textHeight, item.text).toBeCloseTo(item.leading, 5);
      expect(Math.abs(geometry.centerDelta), `${item.text} center`).toBeLessThanOrEqual(0.5);
    }

    await page.locator('#tooltip-xs button').hover();
    const tooltipGeometry = await page.locator('.tooltip-inner').evaluate(element => {
      const controlRect = element.getBoundingClientRect();
      const text = element.querySelector(':scope > ds-text')!;
      const textRect = text.getBoundingClientRect();
      const cs = getComputedStyle(text);
      return {
        controlHeight: controlRect.height,
        controlWidth: controlRect.width,
        textHeight: textRect.height,
        textWidth: textRect.width,
        labelText: text.textContent?.trim() ?? '',
        paddingInline: cs.paddingLeft,
        centerDelta:
          (textRect.top + textRect.height / 2) -
          (controlRect.top + controlRect.height / 2),
      };
    });

    expect(tooltipGeometry.controlHeight).toBeCloseTo(16, 5);
    expect(tooltipGeometry.textHeight).toBeCloseTo(12, 5);
    expect(Math.abs(tooltipGeometry.centerDelta)).toBeLessThanOrEqual(0.5);
    expect(tooltipGeometry.labelText).toBe('Tooltip xs');
    // Control-density label inset (--dimension-space-025 = 2px).
    expect(tooltipGeometry.paddingInline).toBe('2px');
    // ds-text must not collapse under its default min-width:0 flex shrink.
    expect(tooltipGeometry.textWidth).toBeGreaterThan(40);
    expect(tooltipGeometry.controlWidth).toBeGreaterThanOrEqual(tooltipGeometry.textWidth);
  });
});
