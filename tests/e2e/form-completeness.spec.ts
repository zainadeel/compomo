import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/form-completeness.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});

test('length validation retains overflow by default and Field owns accessible counts @cross-browser', async ({
  page,
}) => {
  const input = page.locator('#soft input');
  await input.fill('abcdef');
  await expect(input).toHaveValue('abcdef');
  await expect(page.locator('#soft-field')).toContainText('6/5');
  await expect(page.locator('#soft-field')).toContainText('Use 5 characters or fewer.');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(
    await page.locator('#length-form').evaluate((f: HTMLFormElement) => f.checkValidity())
  ).toBe(false);
  await input.fill('ab');
  await input.blur();
  await expect(page.locator('#soft-field')).toContainText('Use at least 3 characters.');
  await input.fill('abc');
  await expect(page.locator('#soft-field')).toContainText('Enter a name.');
  await expect(input).not.toHaveAttribute('aria-invalid', 'true');
  const described = await input.getAttribute('aria-describedby');
  expect(described).toContain('short-name-count');
  await page.locator('#notes textarea').fill('abcdef');
  await expect(page.locator('#notes textarea')).toHaveValue('abcdef');
  await expect(page.locator('ds-field').filter({ has: page.locator('#notes') })).toContainText(
    '6/5'
  );
  await page.locator('#length-reset').click();
  await expect(input).toHaveValue('');
  await expect(page.locator('#soft-field')).toContainText('0/5');
  await expect(page.locator('#soft-field')).not.toContainText('Use at least');
});

test('hard limits constrain typing and paste for input and textarea @cross-browser', async ({
  page,
}) => {
  for (const selector of ['#hard input', '#hard-notes textarea']) {
    const control = page.locator(selector);
    await control.fill('abcdefgh');
    await expect(control).toHaveValue('abcde');
    await control.press('End');
    await control.pressSequentially('zz');
    await expect(control).toHaveValue('abcde');
  }
});

test('external form owners enforce patterns and programmatic length constraints @cross-browser', async ({
  page,
}) => {
  const valid = () =>
    page.locator('#external-form').evaluate((f: HTMLFormElement) => f.checkValidity());
  expect(await valid()).toBe(false);
  await page.locator('#external input').fill('abc');
  expect(await valid()).toBe(false);
  await expect(page.locator('#external')).toContainText('Use three capital letters.');
  await page.locator('#external input').fill('ABC');
  expect(await valid()).toBe(true);
  expect(
    await page
      .locator('#external-form')
      .evaluate((f: HTMLFormElement) => new FormData(f).get('code'))
  ).toBe('ABC');
  await page.locator('#external').evaluate((el: HTMLDsInputElement) => {
    el.maxLength = 2;
  });
  await expect.poll(valid).toBe(false);
});

test('suggestions keep focus in the free-text field and support keyboard dismissal and selection @cross-browser', async ({
  page,
}) => {
  const input = page.locator('#suggestions input');
  await input.fill('Vi');
  await expect(page.getByRole('option', { name: 'Victoria', exact: true })).toBeVisible();
  await input.press('ArrowDown');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-activedescendant', /suggestion-0/);
  await input.press('Enter');
  await expect(input).toHaveValue('Victoria');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await input.fill('Va');
  await input.press('Escape');
  await expect(input).toHaveValue('Va');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
  await input.fill('Unlisted city');
  await input.press('Tab');
  await expect(input).toHaveValue('Unlisted city');
  await input.fill('Sea');
  await page.getByRole('option', { name: 'Seattle', exact: true }).click();
  await expect(input).toHaveValue('Seattle');
  await expect(input).toBeFocused();
});

test('tokens commit with Enter and comma, deduplicate, remove, submit and reset @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#tokens');
  const input = host.locator('input');
  await input.fill('One');
  await input.press('Enter');
  await input.fill('Two');
  await input.press(',');
  await input.fill('One');
  await input.press('Enter');
  await expect(host).toHaveJSProperty('tokens', ['One', 'Two']);
  const tokenGeometry = await host.evaluate(el => {
    const frame = el.querySelector('.input-control')!.getBoundingClientRect();
    const chip = el.querySelector('ds-chip')!.getBoundingClientRect();
    return { frameHeight: frame.height, chipHeight: chip.height };
  });
  expect(tokenGeometry.frameHeight - tokenGeometry.chipHeight).toBe(8);
  await expect(host).toHaveAttribute('data-dirty', '');
  expect(
    await page
      .locator('#tokens-form')
      .evaluate((f: HTMLFormElement) => new FormData(f).getAll('tag'))
  ).toEqual(['One', 'Two']);
  await input.fill('Draft');
  expect(
    await page.locator('#tokens-form').evaluate((f: HTMLFormElement) => f.checkValidity())
  ).toBe(false);
  await input.fill('');
  await input.press('Backspace');
  await expect(host).toHaveJSProperty('tokens', ['One']);
  await host.getByRole('button', { name: 'Remove One' }).click();
  await expect(host).toHaveJSProperty('tokens', []);
  await input.fill('Third');
  await input.press('Enter');
  await page.locator('#tokens-reset').click();
  await expect(host).toHaveJSProperty('tokens', []);
});

test('radio tiles activate anywhere, navigate by arrows and obey form reset and disabled fieldsets @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#tiles');
  await host
    .locator('label')
    .first()
    .click({ position: { x: 140, y: 45 } });
  await expect(host).toHaveJSProperty('value', 'basic');
  const geometry = await host
    .locator('label')
    .first()
    .evaluate(el => {
      const radio = el.querySelector('.radio-tile__indicator')!.getBoundingClientRect();
      const copy = el.querySelector('.radio-tile__copy')!.getBoundingClientRect();
      const title = el.querySelector('ds-text')!;
      const titleRect = title.getBoundingClientRect();
      return {
        gap: copy.left - radio.right,
        textInset: titleRect.left - copy.left,
        centerOffset:
          radio.top +
          radio.height / 2 -
          (titleRect.top + parseFloat(getComputedStyle(title).lineHeight) / 2),
      };
    });
  expect(geometry.gap).toBe(8);
  expect(geometry.textInset).toBe(2);
  expect(Math.abs(geometry.centerOffset)).toBeLessThan(0.5);
  const normalBorder = await host
    .locator('.radio-tile__outline')
    .nth(1)
    .evaluate(el => getComputedStyle(el).boxShadow);
  await expect(host.locator('.radio-tile__outline').first()).toHaveCSS('box-shadow', normalBorder);
  await host.evaluate(el => {
    (el.closest('ds-field') as HTMLDsFieldElement).error = true;
  });
  await expect(host.locator('.radio-tile__outline').first()).not.toHaveCSS(
    'box-shadow',
    normalBorder
  );
  await host.evaluate(el => {
    (el.closest('ds-field') as HTMLDsFieldElement).error = false;
  });
  const basic = host.getByRole('radio', { name: 'Basic', exact: true });
  await basic.focus();
  await basic.press('ArrowRight');
  await expect(host.getByRole('radio', { name: 'Pro', exact: true })).toBeChecked();
  expect(
    await page.locator('#tile-form').evaluate((f: HTMLFormElement) => Array.from(new FormData(f)))
  ).toEqual([['plan', 'pro']]);
  await page.locator('#tile-fieldset').evaluate((el: HTMLFieldSetElement) => {
    el.disabled = true;
  });
  await expect(basic).toBeDisabled();
  expect(
    await page.locator('#tile-form').evaluate((f: HTMLFormElement) => Array.from(new FormData(f)))
  ).toEqual([]);
  await page.locator('#tile-fieldset').evaluate((el: HTMLFieldSetElement) => {
    el.disabled = false;
  });
  await page.locator('#tile-reset').click();
  await expect(host).toHaveJSProperty('value', '');
  expect(await page.locator('#tile-form').evaluate((f: HTMLFormElement) => f.checkValidity())).toBe(
    false
  );
});

test('24-hour entry and picker retain canonical form values without AM/PM @cross-browser', async ({
  page,
}) => {
  await expect(page.locator('#time input')).toHaveValue('13:30');
  await page.locator('#time input').fill('23:45');
  await page.locator('#time input').press('Tab');
  await expect(page.locator('#time')).toHaveJSProperty('value', '23:45');
  expect(
    await page.locator('#time-form').evaluate((f: HTMLFormElement) => new FormData(f).get('time'))
  ).toBe('23:45');
  await expect(page.locator('#picker')).not.toContainText('PM');
  const midnight = page.locator('#picker').getByRole('option', { name: '00', exact: true }).first();
  await midnight.click();
  await expect(page.locator('#picker')).toHaveJSProperty('value', '00:30');
});

test('irregular ticks snap keyboard and pointer values while ranges cannot cross @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#ticks');
  const slider = host.getByRole('slider');
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(host).toHaveJSProperty('value', 75);
  await expect(slider).toHaveAttribute('aria-valuetext', 'High');
  await slider.press('End');
  await expect(host).toHaveJSProperty('value', 100);
  await slider.press('Home');
  await expect(host).toHaveJSProperty('value', 0);
  const box = await host.locator('.slider__control').boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * 0.7, box!.y + box!.height / 2);
  await expect(host).toHaveJSProperty('value', 75);
  const range = page.locator('#tick-range');
  await range.getByRole('slider').first().press('End');
  await expect(range).toHaveJSProperty('value', [20, 75]);
  const smooth = page.locator('#smooth').getByRole('slider');
  await smooth.evaluate((el: HTMLInputElement) => {
    el.value = '22.25';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#smooth')).toHaveJSProperty('value', 22.25);
});

test('counters align opposite supporting text or begin at the field edge when alone @cross-browser', async ({
  page,
}) => {
  const measure = () =>
    page.evaluate(() => {
      return ['#soft-field', 'ds-field:has(#notes)'].map(selector => {
        const field = document.querySelector(selector)!;
        const input = field.querySelector('input,textarea')!.getBoundingClientRect();
        const count = field.querySelector('.text-field-count')!.getBoundingClientRect();
        const frame = field.querySelector('ds-input,ds-textarea')!.getBoundingClientRect();
        return {
          inputTop: input.top,
          countTop: count.top,
          left: count.left - frame.left,
          right: frame.right - count.right,
        };
      });
    });
  await expect.poll(async () => (await measure())[0].right).toBeLessThan(1);
  const geometry = await measure();
  expect(geometry[1].left).toBeLessThan(1);
  for (const field of geometry) expect(field.countTop).toBeGreaterThan(field.inputTop);
});

test('token paste preserves overflow by default, supports hard limits, and required checks committed values @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#tokens');
  const input = host.locator('input');
  await host.evaluate((el: HTMLDsInputElement) => {
    el.required = true;
    el.maxLength = 3;
  });
  // Exercise a real clipboard event: Firefox discards constructor-supplied
  // clipboardData on synthetic ClipboardEvents.
  const paste = async (text: string) => {
    await page.evaluate(value => {
      const source = document.createElement('textarea');
      source.id = 'clipboard-source';
      source.value = value;
      document.body.append(source);
      source.select();
    }, text);
    await page.keyboard.press('ControlOrMeta+C');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+V');
    await page.locator('#clipboard-source').evaluate(el => el.remove());
  };
  await paste('One, Two, Longer');
  await expect(host).toHaveJSProperty('tokens', ['One', 'Two', 'Longer']);
  expect(
    await page.locator('#tokens-form').evaluate((f: HTMLFormElement) => f.checkValidity())
  ).toBe(false);
  await expect(host).toContainText('Use 3 characters or fewer.');
  await host.getByRole('button', { name: 'Remove Longer' }).click();
  expect(
    await page.locator('#tokens-form').evaluate((f: HTMLFormElement) => f.checkValidity())
  ).toBe(true);
  await host.evaluate((el: HTMLDsInputElement) => {
    el.lengthBehavior = 'restrict';
  });
  await paste('Four, Five');
  await expect(host).toHaveJSProperty('tokens', ['One', 'Two', 'Fou', 'Fiv']);
});

test('24-hour bounds disable unavailable hours while preserving valid minute choices @cross-browser', async ({
  page,
}) => {
  const picker = page.locator('#picker');
  await picker.evaluate((el: HTMLDsTimePickerElement) => {
    el.min = '09:30';
    el.max = '17:15';
  });
  const hour = picker.getByRole('listbox', { name: 'Hour', exact: true });
  await expect(hour.getByRole('option', { name: '08', exact: true })).toBeDisabled();
  await hour.getByRole('option', { name: '17', exact: true }).click();
  await expect(picker).toHaveJSProperty('value', '17:00');
  const minute = picker.getByRole('listbox', { name: 'Minute', exact: true });
  await minute.getByRole('option', { name: '15', exact: true }).click();
  await expect(picker).toHaveJSProperty('value', '17:15');
});

test('tick labels center on marks and shift inside the control edges @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#ticks');
  for (const width of [400, 260]) {
    for (const inset of [0, 8]) {
      await host.evaluate(
        (el: HTMLDsSliderElement, { width, inset }) => {
          el.style.width = `${width}px`;
          el.ticks = [
            { value: inset, label: 'Minimum intensity' },
            { value: 50, label: 'Balanced' },
            { value: 100 - inset, label: 'Maximum intensity' },
          ];
        },
        { width, inset }
      );
      await expect
        .poll(async () =>
          host.evaluate(el => {
            const frame = el.querySelector('.slider__control')!.getBoundingClientRect();
            return Array.from(el.querySelectorAll('.slider__tick')).every(tick => {
              const mark = tick.querySelector('.slider__tick-mark')!.getBoundingClientRect();
              const label = tick.querySelector('.slider__tick-label')!.getBoundingClientRect();
              const centeredLeft = (mark.left + mark.right - label.width) / 2;
              const expectedLeft = Math.max(
                frame.left,
                Math.min(centeredLeft, frame.right - label.width)
              );
              return (
                mark.width === 2 &&
                mark.height === 2 &&
                Math.abs(label.left - expectedLeft) < 0.5 &&
                label.left >= frame.left - 0.5 &&
                label.right <= frame.right + 0.5
              );
            });
          })
        )
        .toBe(true);
    }
  }
  const gaps = await host.evaluate(el => {
    const rail = el.querySelector('.slider__rail')!.getBoundingClientRect();
    const mark = el.querySelector('.slider__tick-mark')!.getBoundingClientRect();
    const label = el.querySelector('.slider__tick-label')!.getBoundingClientRect();
    return { track: mark.top - rail.bottom, label: label.top - mark.bottom };
  });
  expect(gaps).toEqual({ track: 5, label: 4 });
});

test('token insets balance after adding values and preserve empty-field padding @cross-browser', async ({
  page,
}) => {
  const host = page.locator('#tokens');
  await host.evaluate((el: HTMLDsInputElement) => {
    el.style.width = '360px';
    el.placeholder = 'Add region';
  });
  const textInset = () =>
    host.evaluate(el => {
      const frame = el.querySelector('.input-control')!.getBoundingClientRect();
      const input = el.querySelector('input')!;
      return (
        input.getBoundingClientRect().left -
        frame.left +
        parseFloat(getComputedStyle(input).paddingLeft)
      );
    });
  const emptyInset = await textInset();
  expect(emptyInset).toBe(8);
  await host.evaluate((el: HTMLDsInputElement) => {
    el.tokens = ['North', 'An overlong token'];
    el.maxLength = 12;
  });
  await expect(host.locator('ds-chip')).toHaveCount(2);
  const geometry = await host.evaluate(el => {
    const frame = el.querySelector('.input-control')!.getBoundingClientRect();
    const chip = el.querySelector('ds-chip')!.getBoundingClientRect();
    const input = el.querySelector('input')!.getBoundingClientRect();
    return {
      left: chip.left - frame.left,
      top: chip.top - frame.top,
      bottom: frame.bottom - chip.bottom,
      chipTop: chip.top,
      inputTop: input.top,
      height: frame.height,
    };
  });
  expect(geometry.left).toBe(4);
  expect(geometry.top).toBe(geometry.left);
  expect(geometry.bottom).toBe(geometry.left);
  expect(geometry.inputTop).toBe(geometry.chipTop);
  expect(geometry.height).toBe(32);
  await host.evaluate((el: HTMLDsInputElement) => {
    el.style.width = '180px';
  });
  await expect
    .poll(() =>
      host.evaluate(el => el.querySelector('.input-control')!.getBoundingClientRect().height)
    )
    .toBeGreaterThan(32);
  const wrapped = await host.evaluate(el => {
    const frame = el.querySelector('.input-control')!.getBoundingClientRect();
    const chips = Array.from(el.querySelectorAll('ds-chip')).map(chip =>
      chip.getBoundingClientRect()
    );
    const input = el.querySelector('input')!.getBoundingClientRect();
    return {
      top: chips[0].top - frame.top,
      bottom: frame.bottom - input.bottom,
      lefts: chips.map(chip => chip.left - frame.left),
      heights: [...chips.map(chip => chip.height), input.height],
    };
  });
  expect(wrapped.top).toBe(4);
  expect(wrapped.bottom).toBe(4);
  expect(wrapped.lefts).toEqual([4, 4]);
  expect(wrapped.heights).toEqual([24, 24, 24]);
  await host.evaluate((el: HTMLDsInputElement) => {
    el.tokens = [];
  });
  await expect(host.locator('ds-chip')).toHaveCount(0);
  expect(await textInset()).toBe(emptyInset);
});
