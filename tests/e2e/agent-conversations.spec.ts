import { expect, test } from '@playwright/test';
import { chromiumOnly } from './browser-tier';

test.beforeEach(async ({ page }) => {
  await page.goto('/agent-conversations.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('preserves questionnaire drafts across steps and emits normalized ordered answers once', async ({
  page,
}) => {
  const questionnaire = page.locator('#questionnaire');
  const battery = questionnaire.getByLabel('Repeated battery failures');
  await battery.click();
  expect(
    await page
      .locator('#questionnaire-owner-form')
      .evaluate(form => Array.from(new FormData(form as HTMLFormElement).entries()))
  ).toEqual([]);
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await questionnaire.getByLabel('Executive summary').click();
  expect(
    await page
      .locator('#questionnaire-owner-form')
      .evaluate(form => Array.from(new FormData(form as HTMLFormElement).entries()))
  ).toEqual([]);
  await questionnaire.getByRole('button', { name: 'Previous' }).click();
  await expect(battery).toBeChecked();
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await expect(questionnaire.getByLabel('Executive summary')).toBeChecked();
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await questionnaire.getByRole('button', { name: 'Skip' }).click();

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { answerEvents: unknown[] }).answerEvents)
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

test('composes questionnaire choices and actions from DS primitives with isolated form and keyboard behavior', async ({
  page,
}) => {
  const questionnaire = page.locator('#questionnaire');
  const ownerForm = page.locator('#questionnaire-owner-form');
  const radio = questionnaire.locator('ds-radio');
  const battery = questionnaire.getByRole('radio', { name: 'Repeated battery failures' });
  const tires = questionnaire.getByRole('radio', { name: 'Overdue tire inspections' });

  await expect(radio).toHaveCount(1);
  await expect(radio).toHaveJSProperty('size', 'lg');
  await expect(battery).toHaveAccessibleDescription('Three matching visits.');
  await battery.focus();
  await battery.press('ArrowDown');
  await expect(tires).toBeChecked();
  await ownerForm.evaluate((form: HTMLFormElement) => form.reset());
  await expect(tires).toBeChecked();
  expect(
    await ownerForm.evaluate((form: HTMLFormElement) => Array.from(new FormData(form).entries()))
  ).toEqual([]);
  await expect(questionnaire.locator('input[type="radio"], input[type="checkbox"]')).toHaveCount(0);

  const next = questionnaire.locator('ds-button-filled');
  const cancel = questionnaire.locator('ds-button-unfilled').first();
  const cancelTooltip = questionnaire.locator('ds-tooltip').first();
  await expect(next).toHaveJSProperty('size', 'sm');
  await expect(cancel).toHaveJSProperty('size', 'sm');
  await expect(cancel).toHaveJSProperty('hasBorder', false);
  await expect(cancelTooltip).toHaveJSProperty('size', 'sm');
  await questionnaire.getByRole('button', { name: 'Next' }).click();

  const summary = questionnaire.getByRole('checkbox', { name: 'Executive summary' });
  await expect(summary).toHaveAccessibleDescription(
    'Include affected vehicles and recommended next steps.'
  );
  await expect(questionnaire.locator('ds-checkbox')).toHaveCount(2);
  await expect(questionnaire.locator('ds-checkbox').first()).toHaveJSProperty('size', 'lg');
  await summary.click();
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await page.setViewportSize({ width: 420, height: 900 });
  await page.locator('#questionnaire-frame').evaluate((element: HTMLElement) => {
    element.style.width = '320px';
  });
  const actionNames = ['Previous', 'Skip', 'Answer'];
  const actionBoxes = await Promise.all(
    actionNames.map(name => questionnaire.getByRole('button', { name }).boundingBox())
  );
  expect(
    actionBoxes.every(box => box && Math.abs(box.height - actionBoxes[0]!.height) <= 0.5)
  ).toBe(true);
  expect(actionBoxes[0]!.y).toBeLessThan(actionBoxes[1]!.y);
  expect(actionBoxes[1]!.y).toBeLessThan(actionBoxes[2]!.y);
  expect(Math.abs(actionBoxes[0]!.x - actionBoxes[2]!.x)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(actionBoxes[0]!.width - actionBoxes[2]!.width)).toBeLessThanOrEqual(0.5);
});

test('announces questionnaire validation, retains error drafts, resets requests, and focuses explicitly', async ({
  page,
}) => {
  const questionnaire = page.locator('#questionnaire');
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  await expect(questionnaire.getByRole('alert')).toHaveText('Choose an answer before continuing.');
  await expect(questionnaire.getByLabel('Repeated battery failures')).toBeFocused();

  await questionnaire.getByLabel('Repeated battery failures').click();
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

test('coalesces related questionnaire replacements and accepts later answer seeds', async ({
  page,
}) => {
  const questionnaire = page.locator('#questionnaire');
  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => {
    element.requestId = 'request-coalesced';
    element.questions = [
      {
        id: 'coalesced-context',
        type: 'text',
        question: 'Coalesced context',
      },
    ];
    element.answers = [{ questionId: 'coalesced-context', value: 'Same turn seed' }];
  });
  await expect(questionnaire.getByRole('textbox', { name: 'Coalesced context' })).toHaveValue(
    'Same turn seed'
  );

  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => {
    element.requestId = 'request-later-seed';
    element.questions = [
      {
        id: 'coalesced-context',
        type: 'text',
        question: 'Later context',
      },
    ];
  });
  await expect(questionnaire.getByRole('textbox', { name: 'Later context' })).toHaveValue('');
  await questionnaire.evaluate((element: HTMLDsAgentQuestionnaireElement) => {
    element.answers = [{ questionId: 'coalesced-context', value: 'Later seed' }];
  });
  await expect(questionnaire.getByRole('textbox', { name: 'Later context' })).toHaveValue(
    'Later seed'
  );
});

test('associates Other validation and focuses the invalid free-text input', async ({ page }) => {
  const questionnaire = page.locator('#questionnaire');
  await questionnaire.getByRole('radio', { name: 'Other' }).click();
  const otherInput = questionnaire.locator('.questionnaire__other-input');
  await questionnaire.getByRole('button', { name: 'Next' }).click();
  const alert = questionnaire.getByRole('alert');
  await expect(alert).toHaveText('Enter a response for Other.');
  const alertId = await alert.getAttribute('id');
  await expect(otherInput).toHaveAttribute('aria-describedby', alertId!);
  await expect(otherInput).toBeFocused();
});

test('keeps compact tool rows non-disclosing and emits disclosure changes when diagnostics exist', async ({
  page,
}) => {
  const compact = page.locator('#tool-compact');
  await expect(compact.locator('details')).toHaveCount(0);
  await expect(compact).toContainText('Completed');
  await expect(compact.locator('.agent-tool__chevron')).toHaveCount(0);

  const details = page.locator('#tool-details details');
  await expect(details).toHaveCount(1);
  await details.locator('summary').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { toolOpenEvents: Array<{ open: boolean }> }).toolOpenEvents
      )
    )
    .toContainEqual({ open: false });

  const custom = page.locator('#tool-custom');
  await expect(custom).toContainText('Created issue #443');
  await expect(custom).toContainText('Custom issue result');
  await expect(custom).toContainText('Custom diagnostic detail');
  await expect(custom).toContainText('Completed');
  await expect(custom).not.toContainText('should');
});

test('defaults only plain custom tool results to body-medium typography', async ({ page }) => {
  const typography = await page.evaluate(() => {
    const plain = document.querySelector<HTMLElement>('#tool-custom [slot="result"]')!;
    const structured = document.querySelector<HTMLElement>('#tool-structured ds-text')!;
    const reference = document.querySelector<HTMLElement>('#tool-body-medium-reference')!;
    return {
      plain: getComputedStyle(plain).fontSize,
      structured: getComputedStyle(structured).fontSize,
      reference: getComputedStyle(reference).fontSize,
    };
  });
  expect(typography.plain).toBe(typography.reference);
  expect(Number.parseFloat(typography.structured)).toBeLessThan(
    Number.parseFloat(typography.plain)
  );
});

test('renders safe source hostnames, rejects unsafe links, and reports disclosure changes', async ({
  page,
}) => {
  const sources = page.locator('#sources');
  const sourceLink = sources.getByRole('link', { name: /Maintenance guide/ });
  await expect(sourceLink).toHaveAttribute('href', 'https://docs.example.com/guide');
  const decoration = await sourceLink.evaluate(element => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-foreground-tertiary)';
    probe.style.textDecorationThickness = 'var(--dimension-stroke-width-012)';
    probe.style.textUnderlineOffset = 'var(--dimension-space-025)';
    document.body.append(probe);
    const actual = getComputedStyle(element);
    const expected = getComputedStyle(probe);
    const result = {
      color: actual.textDecorationColor,
      expectedColor: expected.color,
      thickness: actual.textDecorationThickness,
      expectedThickness: expected.textDecorationThickness,
      offset: actual.textUnderlineOffset,
      expectedOffset: expected.textUnderlineOffset,
    };
    probe.remove();
    return result;
  });
  expect(decoration.color).toBe(decoration.expectedColor);
  expect(decoration.thickness).toBe(decoration.expectedThickness);
  expect(decoration.offset).toBe(decoration.expectedOffset);
  await expect(sources).toContainText('docs.example.com');
  await expect(sources.getByText('Unsafe source')).not.toHaveAttribute('href');
  await expect(sources.getByText('Malformed source')).not.toHaveAttribute('href');
  await sources.locator('summary').click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { sourceOpenEvents: Array<{ open: boolean }> }).sourceOpenEvents
      )
    )
    .toContainEqual({ open: false });
});

test('links visible composer error text to the editable draft and clears it on recovery', async ({
  page,
}) => {
  const composer = page.locator('#composer');
  const textarea = composer.locator('textarea');
  const alert = composer.getByRole('alert');
  await expect(alert).toHaveText('The message could not be sent.');
  const errorId = await alert.getAttribute('id');
  await expect(textarea).toHaveAttribute('aria-describedby', errorId!);
  await expect(textarea).toHaveValue('Preserved draft');
  await expect(composer.getByRole('button', { name: 'Retry' })).toBeVisible();
  const attachedGeometry = await composer.evaluate(element => {
    const stack = element.querySelector('.message-composer__stack')!.getBoundingClientRect();
    const support = element
      .querySelector('.message-composer__error-support')!
      .getBoundingClientRect();
    const field = element.querySelector('.message-composer__field')!.getBoundingClientRect();
    return {
      supportAbove: support.top < field.top,
      attachedGap: Math.abs(support.bottom - field.top),
      contained: support.top >= stack.top && field.bottom <= stack.bottom,
    };
  });
  expect(attachedGeometry.supportAbove).toBe(true);
  expect(attachedGeometry.attachedGap).toBeLessThanOrEqual(0.5);
  expect(attachedGeometry.contained).toBe(true);

  await composer.evaluate((element: HTMLDsMessageComposerElement) => {
    element.status = 'ready';
  });
  await expect(composer.getByRole('alert')).toHaveCount(0);
  await expect(textarea).not.toHaveAttribute('aria-describedby');
  await expect(textarea).toHaveValue('Preserved draft');
});

test('measures prose without narrowing tables or code', async ({ page }) => {
  const response = page.locator('#response');
  await response.scrollIntoViewIfNeeded();
  await expect(response).toBeInViewport();
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
  const narrow = await page.locator('#response-frame').evaluate(element => {
    const responseElement = element.querySelector<HTMLElement>('#response')!;
    return {
      frameClientWidth: element.clientWidth,
      responseClientWidth: responseElement.clientWidth,
      paragraph: responseElement.querySelector('p')!.getBoundingClientRect().width,
      table: responseElement.querySelector('.ds-prose__table-scroll')!.getBoundingClientRect()
        .width,
      scrollWidth: responseElement.scrollWidth,
      clientWidth: responseElement.clientWidth,
    };
  });
  expect(Math.abs(narrow.frameClientWidth - 320)).toBeLessThanOrEqual(1);
  expect(Math.abs(narrow.responseClientWidth - narrow.frameClientWidth)).toBeLessThanOrEqual(1);
  expect(Math.abs(narrow.table - narrow.paragraph)).toBeLessThanOrEqual(1);
  expect(narrow.scrollWidth).toBeLessThanOrEqual(narrow.clientWidth);
});

test('keeps parts as the default, lets composed content ignore parts, and renders answered records', async ({
  page,
}) => {
  await expect(page.locator('#response ds-markdown')).toHaveCount(1);
  await expect(page.locator('#response-composed #composed-marker')).toBeVisible();
  await expect(page.locator('#response-composed')).not.toContainText('Ignored parts content');
  const history = page.locator('#response-history ds-agent-questionnaire');
  await expect(history).toContainText('Which issue should I investigate first?');
  await expect(history).toContainText('Repeated battery failures');
  await expect(history.locator('button, input, textarea')).toHaveCount(0);
});

test('anchors only newly appended turns and clears the combined interaction and composer stack', async ({
  page,
}) => {
  const scroller = page.locator('#scroller');
  const viewport = scroller.locator('.message-scroller__viewport');
  const overlay = await scroller.evaluate(element =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size'))
  );
  const interactionHeight = await page
    .locator('#interaction-wrap')
    .evaluate(element => element.getBoundingClientRect().height);
  expect(overlay).toBeGreaterThan(interactionHeight);
  await page.locator('#interaction-surface').evaluate((element: HTMLElement) => {
    element.style.height = '160px';
  });
  await expect
    .poll(() =>
      scroller.evaluate(element =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue('--ds-scroll-overlay-block-size')
        )
      )
    )
    .toBeGreaterThan(overlay + 50);

  await page.evaluate(() =>
    (window as unknown as { appendAnchoredTurn: () => HTMLElement }).appendAnchoredTurn()
  );
  const relativeTop = async () =>
    scroller.evaluate(element => {
      const anchor = element.querySelector('ds-message[scroll-anchor]')!;
      const viewportElement = element.querySelector('.message-scroller__viewport')!;
      return anchor.getBoundingClientRect().top - viewportElement.getBoundingClientRect().top;
    });
  await expect.poll(relativeTop).toBeGreaterThanOrEqual(63);
  await expect.poll(relativeTop).toBeLessThanOrEqual(65);

  await viewport.evaluate(element => {
    element.scrollTop -= 200;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect.poll(relativeTop).toBeGreaterThan(200);
  const beforePrependTop = await relativeTop();
  const beforePrepend = await viewport.evaluate(element => element.scrollTop);
  await page.evaluate(() => (window as unknown as { prependHistory: () => void }).prependHistory());
  await expect
    .poll(() => viewport.evaluate(element => element.scrollTop))
    .toBeGreaterThan(beforePrepend);
  await expect
    .poll(async () => Math.abs((await relativeTop()) - beforePrependTop))
    .toBeLessThanOrEqual(50);
});

test('resets a replaced transcript baseline without retaining its previous turn anchor', async ({
  page,
}) => {
  const scroller = page.locator('#scroller');
  const viewport = scroller.locator('.message-scroller__viewport');
  const distanceFromLiveEdge = () =>
    viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop);

  await page.evaluate(() =>
    (window as unknown as { appendAnchoredTurn: () => HTMLElement }).appendAnchoredTurn()
  );
  await expect
    .poll(() =>
      scroller.evaluate(element => {
        const anchor = element.querySelector('ds-message[scroll-anchor]');
        const viewportElement = element.querySelector('.message-scroller__viewport');
        if (!anchor || !viewportElement) return -1;
        return anchor.getBoundingClientRect().top - viewportElement.getBoundingClientRect().top;
      })
    )
    .toBeGreaterThanOrEqual(63);

  const replacedCount = await page.evaluate(() =>
    (window as unknown as { replaceTranscript: () => number }).replaceTranscript()
  );
  expect(replacedCount).toBe(13);
  await expect
    .poll(() =>
      scroller.evaluate(element =>
        [...element.querySelectorAll('ds-message')].map(
          message => (message as HTMLElement & { messageId?: string }).messageId
        )
      )
    )
    .toEqual(Array.from({ length: 12 }, (_, index) => `replacement-${index}`));
  await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);
  await expect
    .poll(() =>
      scroller.evaluate(element =>
        getComputedStyle(element).getPropertyValue('--ds-message-scroller-turn-clearance').trim()
      )
    )
    .toBe('');

  await page.evaluate(() =>
    (window as unknown as { appendAnchoredTurn: () => HTMLElement }).appendAnchoredTurn()
  );
  await expect
    .poll(() =>
      scroller.evaluate(element => {
        const anchor = element.querySelector('ds-message[scroll-anchor]');
        const viewportElement = element.querySelector('.message-scroller__viewport');
        if (!anchor || !viewportElement) return -1;
        return anchor.getBoundingClientRect().top - viewportElement.getBoundingClientRect().top;
      })
    )
    .toBeGreaterThanOrEqual(63);
});

test(
  'releases replaced transcript nodes after garbage collection',
  chromiumOnly(
    'interaction',
    'The retention assertion requires Chromium CDP to request deterministic garbage collection.'
  ),
  async ({ page }) => {
    await page.goto('/message-scroller-retention.html');
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    await page.evaluate(() =>
      (
        window as unknown as {
          replaceRetentionTranscript: () => number;
        }
      ).replaceRetentionTranscript()
    );
    await expect(page.locator('#retention-scroller ds-message')).toHaveCount(12);

    const session = await page.context().newCDPSession(page);
    await expect
      .poll(
        async () => {
          await session.send('HeapProfiler.collectGarbage');
          await page.evaluate(
            () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
          );
          return page.evaluate(
            () =>
              (
                window as unknown as {
                  replacedTranscriptWeakRefs: WeakRef<HTMLElement>[];
                }
              ).replacedTranscriptWeakRefs.filter(reference => reference.deref()).length
          );
        },
        { timeout: 5000 }
      )
      .toBe(0);
    await session.detach();
  }
);

test('streams only while following and lets reader input release and restore the live edge', async ({
  page,
}) => {
  const scroller = page.locator('#scroller');
  const viewport = scroller.locator('.message-scroller__viewport');
  const distanceFromLiveEdge = () =>
    viewport.evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop);
  const grow = () =>
    page.evaluate(() =>
      (window as unknown as { growLatestMessage: () => void }).growLatestMessage()
    );
  const returnToLatest = async () => {
    await scroller.evaluate((element: HTMLDsMessageScrollerElement) => element.scrollToEnd());
    await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);
  };

  await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeLessThanOrEqual(24);

  await viewport.dispatchEvent('wheel', { deltaY: -80 });
  // A scroll event queued by the preceding auto-follow must not overwrite the
  // newer reader intent while the viewport is still at the live edge.
  await viewport.dispatchEvent('scroll');
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
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
    const selectionTarget = document.createElement('span');
    selectionTarget.textContent = 'Reader-selected transcript text.';
    bubble.append(selectionTarget);
    const range = document.createRange();
    range.selectNodeContents(selectionTarget);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await grow();
  await expect.poll(distanceFromLiveEdge).toBeGreaterThan(100);
});
