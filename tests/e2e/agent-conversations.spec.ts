import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('preserves questionnaire drafts across steps and emits normalized ordered answers once', async ({ page }) => {
  const questionnaire = page.locator('#questionnaire');
  const battery = questionnaire.getByLabel('Repeated battery failures');
  await battery.check();
  expect(
    await page.locator('#questionnaire-owner-form').evaluate(form =>
      Array.from(new FormData(form as HTMLFormElement).entries()),
    ),
  ).toEqual([]);
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await questionnaire.getByLabel('Executive summary').check();
  await questionnaire.getByRole('button', { name: 'Previous' }).click();
  await expect(battery).toBeChecked();
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await expect(questionnaire.getByLabel('Executive summary')).toBeChecked();
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await questionnaire.getByRole('button', { name: 'Skip' }).click();

  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { answerEvents: unknown[] }).answerEvents,
      ),
    )
    .toEqual([
      {
        requestId: 'request-one',
        answers: [
          { questionId: 'priority', value: 'battery' },
          { questionId: 'deliverables', value: ['summary'] },
          { questionId: 'context', value: null },
        ],
      },
    ]);
  await expect(questionnaire.getByRole('button', { name: 'Answer' })).toBeDisabled();
});

test('announces questionnaire validation, retains error drafts, resets requests, and focuses explicitly', async ({ page }) => {
  const questionnaire = page.locator('#questionnaire');
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await expect(questionnaire.getByRole('alert')).toHaveText('Choose an answer before continuing.');
  await expect(questionnaire.getByLabel('Repeated battery failures')).toBeFocused();

  await questionnaire.getByLabel('Repeated battery failures').check();
  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => {
    element.status = 'error';
    element.errorMessage = 'Answers could not be sent.';
  });
  await expect(questionnaire.getByRole('alert')).toContainText('Answers could not be sent.');
  await expect(questionnaire.getByLabel('Repeated battery failures')).toBeChecked();

  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => {
    element.requestId = 'request-two';
    element.status = 'ready';
  });
  await expect(questionnaire.getByLabel('Repeated battery failures')).not.toBeChecked();
  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => element.setFocus());
  await expect(questionnaire.getByLabel('Repeated battery failures')).toBeFocused();
});

test('keeps compact tool rows non-disclosing and emits disclosure changes when diagnostics exist', async ({ page }) => {
  const compact = page.locator('#tool-compact');
  await expect(compact.locator('details')).toHaveCount(0);
  await expect(compact).toContainText('Completed');
  await expect(compact.locator('.agent-tool__chevron')).toHaveCount(0);

  const details = page.locator('#tool-details details');
  await expect(details).toHaveCount(1);
  await details.locator('summary').click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { toolOpenEvents: Array<{ open: boolean }> }).toolOpenEvents,
      ),
    )
    .toContainEqual({ open: false });

  const custom = page.locator('#tool-custom');
  await expect(custom).toContainText('Created issue #443');
  await expect(custom).toContainText('Custom issue result');
  await expect(custom).toContainText('Custom diagnostic detail');
  await expect(custom).toContainText('Completed');
  await expect(custom).not.toContainText('should');
});

test('renders safe source hostnames, rejects unsafe links, and reports disclosure changes', async ({ page }) => {
  const sources = page.locator('#sources');
  await expect(sources.getByRole('link', { name: /Maintenance guide/ })).toHaveAttribute(
    'href',
    'https://docs.example.com/guide',
  );
  await expect(sources).toContainText('docs.example.com');
  await expect(sources.getByText('Unsafe source')).not.toHaveAttribute('href');
  await expect(sources.getByText('Malformed source')).not.toHaveAttribute('href');
  await sources.locator('summary').click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { sourceOpenEvents: Array<{ open: boolean }> }).sourceOpenEvents,
      ),
    )
    .toContainEqual({ open: false });
});

test('links visible composer error text to the editable draft and clears it on recovery', async ({ page }) => {
  const composer = page.locator('#composer');
  const textarea = composer.locator('textarea');
  const alert = composer.getByRole('alert');
  await expect(alert).toHaveText('The message could not be sent.');
  const errorId = await alert.getAttribute('id');
  await expect(textarea).toHaveAttribute('aria-describedby', errorId!);
  await expect(textarea).toHaveValue('Preserved draft');
  await expect(composer.getByRole('button', { name: 'Retry' })).toBeVisible();

  await composer.evaluate((element: HTMLDsMessageComposerElement) => {
    element.status = 'ready';
  });
  await expect(composer.getByRole('alert')).toHaveCount(0);
  await expect(textarea).not.toHaveAttribute('aria-describedby');
  await expect(textarea).toHaveValue('Preserved draft');
});

test('measures prose without narrowing tables or code', async ({ page }) => {
  const response = page.locator('#response');
  const paragraph = response.locator('ds-markdown p').first();
  await expect(paragraph).toContainText('measured paragraph');
  const geometry = await response.evaluate(element => {
    const paragraphRect = element.querySelector('p')!.getBoundingClientRect();
    const tableWrapRect = element.querySelector('.ds-prose__table-scroll')!.getBoundingClientRect();
    const codeRect = element.querySelector('ds-code-block')!.getBoundingClientRect();
    return {
      paragraph: paragraphRect.width,
      table: tableWrapRect.width,
      code: codeRect.width,
    };
  });
  expect(geometry.paragraph).toBeLessThanOrEqual(600.5);
  expect(geometry.table).toBeGreaterThan(geometry.paragraph);
  expect(geometry.code).toBeGreaterThan(geometry.paragraph);

  await page.locator('#response-frame').evaluate((element: HTMLElement) => {
    element.style.width = '320px';
  });
  const narrow = await response.evaluate(element => ({
    paragraph: element.querySelector('p')!.getBoundingClientRect().width,
    table: element.querySelector('.ds-prose__table-scroll')!.getBoundingClientRect().width,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }));
  expect(Math.abs(narrow.table - narrow.paragraph)).toBeLessThanOrEqual(1);
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
});

test('keeps parts as the default, lets composed content ignore parts, and renders answered records', async ({ page }) => {
  await expect(page.locator('#response ds-markdown')).toHaveCount(1);
  await expect(page.locator('#response-composed #composed-marker')).toBeVisible();
  await expect(page.locator('#response-composed')).not.toContainText('Ignored parts content');
  const history = page.locator('#response-history ds-agent-questionnaire');
  await expect(history).toContainText('Which issue should I investigate first?');
  await expect(history).toContainText('Repeated battery failures');
  await expect(history.locator('button, input, textarea')).toHaveCount(0);
});

test('anchors only newly appended turns and clears the combined interaction and composer stack', async ({ page }) => {
  const scroller = page.locator('#scroller');
  const viewport = scroller.locator('.message-scroller__viewport');
  const overlay = await scroller.evaluate(element =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size')),
  );
  const interactionHeight = await page.locator('#interaction-wrap').evaluate(element =>
    element.getBoundingClientRect().height,
  );
  expect(overlay).toBeGreaterThan(interactionHeight);
  await page.locator('#interaction-surface').evaluate((element: HTMLElement) => {
    element.style.height = '160px';
  });
  await expect
    .poll(() =>
      scroller.evaluate(element =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'),
        ),
      ),
    )
    .toBeGreaterThan(overlay + 50);

  await page.evaluate(() =>
    (window as unknown as { appendAnchoredTurn: () => HTMLElement }).appendAnchoredTurn(),
  );
  const relativeTop = async () =>
    scroller.evaluate(element => {
      const anchor = element.querySelector('ds-message[scroll-anchor]')!;
      const viewportElement = element.querySelector('.message-scroller__viewport')!;
      return anchor.getBoundingClientRect().top - viewportElement.getBoundingClientRect().top;
    });
  await expect.poll(relativeTop).toBeGreaterThanOrEqual(63);
  await expect.poll(relativeTop).toBeLessThanOrEqual(65);

  const beforePrepend = await viewport.evaluate(element => element.scrollTop);
  await page.evaluate(() =>
    (window as unknown as { prependHistory: () => void }).prependHistory(),
  );
  await expect.poll(() => viewport.evaluate(element => element.scrollTop)).toBeGreaterThan(beforePrepend);
  await expect.poll(relativeTop).toBeGreaterThanOrEqual(48);
  await expect.poll(relativeTop).toBeLessThanOrEqual(80);
});

test('streams only while following and lets reader input release and restore the live edge', async ({ page }) => {
  const scroller = page.locator('#scroller');
  const viewport = scroller.locator('.message-scroller__viewport');
  const distanceFromLiveEdge = () =>
    viewport.evaluate(element =>
      element.scrollHeight - element.clientHeight - element.scrollTop,
    );
  const grow = () =>
    page.evaluate(() =>
      (window as unknown as { growLatestMessage: () => void }).growLatestMessage(),
    );
  const returnToLatest = async () => {
    await scroller.evaluate((element: HTMLDsMessageScrollerElement) => element.scrollToEnd());
    await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);
  };

  await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);

  await viewport.dispatchEvent('wheel', { deltaY: -80 });
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
  await expect(
    scroller.locator('ds-button-unfilled[aria-label="Scroll to latest message"]'),
  ).toBeVisible();
  await returnToLatest();

  await viewport.press('ArrowUp');
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
  await returnToLatest();

  await viewport.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
  await returnToLatest();

  await page.evaluate(() => {
    const bubble = document.querySelector('ds-message-bubble');
    if (!bubble) return;
    const range = document.createRange();
    range.selectNodeContents(bubble);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
});
