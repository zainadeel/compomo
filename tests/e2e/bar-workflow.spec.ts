import { expect, test } from '@playwright/test';

type WorkflowEvent = { type: string; id?: string };

declare global {
  interface Window {
    __barWorkflowEvents: WorkflowEvent[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/bar-workflow.html');
  await page.waitForFunction(() => document.documentElement.dataset['ready'] === 'true');
});

test('keeps compact workflow navigation available through the final submit step', async ({
  page,
}) => {
  const header = page.locator('#workflow-header');
  const previous = header.getByRole('button', { name: 'Previous step' });
  const next = header.getByRole('button', { name: 'Next step' });

  await expect(header.getByRole('heading', { name: 'Create driver · 1/3', level: 1 })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Exit driver creation' })).toBeVisible();
  await expect(previous).toHaveCount(0);
  await expect(next).toBeVisible();
  await expect(header.locator('.bar-workflow__submit')).toHaveCount(0);

  const surface = await header.evaluate(element => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--color-background-bold-brand)';
    document.body.append(probe);
    const expectedBackground = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const actions = element.querySelector<HTMLElement>('.bar-workflow__actions');
    return {
      height: element.getBoundingClientRect().height,
      background: getComputedStyle(element).backgroundColor,
      expectedBackground,
      actionCount: actions?.querySelectorAll('ds-button-filled, ds-button-unfilled').length ?? 0,
    };
  });
  expect(surface.height).toBe(48);
  expect(surface.background).toBe(surface.expectedBackground);
  expect(surface.actionCount).toBe(1);

  await next.click();
  await expect(header.getByRole('heading', { name: 'Create driver · 2/3', level: 1 })).toBeVisible();
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();

  await next.click();
  await expect(header.getByRole('heading', { name: 'Create driver · 3/3', level: 1 })).toBeVisible();
  const submit = header.getByRole('button', { name: 'Save driver' });
  await expect(previous).toBeVisible();
  await expect(submit).toBeVisible();
  await expect(header.locator('.bar-workflow__next')).toHaveCount(0);
  await expect(header.locator('.bar-workflow__submit')).toHaveJSProperty('icon', 'Check');
  await expect(header.locator('.bar-workflow__submit')).toHaveJSProperty('type', 'submit');

  await submit.click();
  await header.getByRole('button', { name: 'Exit driver creation' }).click();

  const events = await page.evaluate(() => window.__barWorkflowEvents);
  expect(events).toEqual([
    { type: 'step', id: 'employment' },
    { type: 'step', id: 'qualifications' },
    { type: 'submit' },
    { type: 'form-submit' },
    { type: 'exit' },
  ]);
});

test('uses a plain title and submit action for the default single-step flow', async ({ page }) => {
  const header = page.locator('#workflow-header');
  await header.evaluate((element: HTMLDsBarWorkflowElement) => {
    element.steps = [];
    element.value = '';
  });

  await expect(header.getByRole('heading', { name: 'Create driver', exact: true })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Previous step' })).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Next step' })).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Save driver' })).toBeVisible();
});

test('keeps an inactive Next visible when forward validation blocks progress', async ({ page }) => {
  const header = page.locator('#workflow-header');
  await header.evaluate((element: HTMLDsBarWorkflowElement) => {
    element.isNextInactive = true;
  });

  await expect(header.getByRole('button', { name: 'Previous step' })).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Next step' })).toBeDisabled();
});
