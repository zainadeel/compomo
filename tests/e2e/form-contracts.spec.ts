import { expect, test, type Page } from '@playwright/test';

interface FormCase {
  id: string;
  tag: string;
  props?: Record<string, unknown>;
  initial: Record<string, unknown>;
  updated: Record<string, unknown>;
  initialEntries: string[];
  updatedEntries: string[];
}

declare global {
  interface Window {
    formContracts: {
      mount(cases: FormCase[]): void;
      inspect(id: string): {
        state: string | null;
        owner: string | null;
        valid: boolean;
        message: string;
        changes: number;
      };
      restore(id: string, state: string | null): void;
    };
  }
}

const options = [
  { value: 'a', label: 'First' },
  { value: 'b', label: 'Second' },
];
const cases: FormCase[] = [
  {
    id: 'text',
    tag: 'input',
    initial: { value: 'First' },
    updated: { value: 'Second' },
    initialEntries: ['First'],
    updatedEntries: ['Second'],
  },
  {
    id: 'tokens',
    tag: 'input',
    props: { tokenized: true },
    initial: { tokens: ['a'] },
    updated: { tokens: ['b', 'c'] },
    initialEntries: ['a'],
    updatedEntries: ['b', 'c'],
  },
  {
    id: 'notes',
    tag: 'textarea',
    initial: { value: 'First\nline' },
    updated: { value: 'Second\nline' },
    initialEntries: ['First\nline'],
    updatedEntries: ['Second\nline'],
  },
  {
    id: 'date',
    tag: 'input-date',
    initial: { value: '2026-09-10' },
    updated: { value: '2026-09-20' },
    initialEntries: ['2026-09-10'],
    updatedEntries: ['2026-09-20'],
  },
  {
    id: 'time',
    tag: 'input-time',
    initial: { value: '09:00' },
    updated: { value: '13:30' },
    initialEntries: ['09:00'],
    updatedEntries: ['13:30'],
  },
  {
    id: 'check',
    tag: 'checkbox',
    props: { label: 'Consent', value: 'yes' },
    initial: { checked: false, indeterminate: true },
    updated: { checked: true, indeterminate: false },
    initialEntries: [],
    updatedEntries: ['yes'],
  },
  {
    id: 'toggle',
    tag: 'switch',
    props: { value: 'yes', uncheckedValue: 'no' },
    initial: { checked: false },
    updated: { checked: true },
    initialEntries: ['no'],
    updatedEntries: ['yes'],
  },
  {
    id: 'radio',
    tag: 'radio',
    props: { options },
    initial: { value: 'a' },
    updated: { value: 'b' },
    initialEntries: ['a'],
    updatedEntries: ['b'],
  },
  {
    id: 'tiles',
    tag: 'radio-tile',
    props: { options },
    initial: { value: 'a' },
    updated: { value: 'b' },
    initialEntries: ['a'],
    updatedEntries: ['b'],
  },
  {
    id: 'select',
    tag: 'select',
    props: { options },
    initial: { value: 'a' },
    updated: { value: 'b' },
    initialEntries: ['a'],
    updatedEntries: ['b'],
  },
  {
    id: 'multi',
    tag: 'select',
    props: { options, multiple: true },
    initial: { value: ['a'] },
    updated: { value: ['a', 'b'] },
    initialEntries: ['a'],
    updatedEntries: ['a', 'b'],
  },
  {
    id: 'slider',
    tag: 'slider',
    props: { label: 'Level' },
    initial: { value: 20 },
    updated: { value: 40 },
    initialEntries: ['20'],
    updatedEntries: ['40'],
  },
  {
    id: 'range',
    tag: 'slider',
    props: { label: 'Range' },
    initial: { value: [20, 80] },
    updated: { value: [30, 70] },
    initialEntries: ['20', '80'],
    updatedEntries: ['30', '70'],
  },
];

const entries = (phase: 'initial' | 'updated') =>
  cases.flatMap(control => control[`${phase}Entries`].map(value => [control.id, value]));
const formData = (page: Page, id = 'owner') =>
  page.evaluate(
    id => [...new FormData(document.getElementById(id) as HTMLFormElement).entries()],
    id
  );
const inspectAll = (page: Page) =>
  page.evaluate(
    ids => ids.map(id => window.formContracts.inspect(id)),
    cases.map(control => control.id)
  );
const setPhase = (page: Page, phase: 'initial' | 'updated') =>
  page.evaluate(
    ({ cases, phase }) => {
      for (const control of cases)
        Object.assign(document.getElementById(control.id)!, control[phase]);
    },
    { cases, phase }
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/form-contracts.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(cases => window.formContracts.mount(cases), cases);
  await expect.poll(() => formData(page)).toEqual(entries('initial'));
});

test('all form controls submit current values and reset to their initial state without change events @cross-browser', async ({
  page,
}) => {
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  await page.locator('#owner').evaluate((form: HTMLFormElement) => form.reset());
  await expect.poll(() => formData(page)).toEqual(entries('initial'));
  await expect(page.locator('#check')).toHaveAttribute('aria-checked', 'mixed');
  expect((await inspectAll(page)).map(info => info.changes)).toEqual(cases.map(() => 0));
});

test('disabled fieldsets omit every control and restore submission when enabled @cross-browser', async ({
  page,
}) => {
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  await page.locator('#controls').evaluate((fieldset: HTMLFieldSetElement) => {
    fieldset.disabled = true;
  });
  await expect.poll(() => formData(page)).toEqual([]);
  // Native form omission is synchronous; custom tab stops update on Stencil's
  // next render. Wait for that public state before testing keyboard traversal.
  for (const target of await page.locator('#check, #toggle, #radio [role=radio]').all()) {
    await expect(target).toHaveAttribute('tabindex', '-1');
  }
  await page.locator('#check').evaluate((el: HTMLElement) => el.click());
  await page.locator('#toggle').evaluate((el: HTMLElement) => el.click());
  await page
    .locator('#radio [role=radio]')
    .first()
    .evaluate((el: HTMLElement) => el.click());
  await page.locator('#after').focus();
  await expect(page.locator('#after')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#before')).toBeFocused();
  await page.locator('#controls').evaluate((fieldset: HTMLFieldSetElement) => {
    fieldset.disabled = false;
  });
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  expect((await inspectAll(page)).map(info => info.changes)).toEqual(cases.map(() => 0));
});

test('inactive and unnamed controls retain restoration state while omitting submission @cross-browser', async ({
  page,
}) => {
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  const states = (await inspectAll(page)).map(info => info.state);
  for (const property of ['isInactive', 'name'] as const) {
    await page.evaluate(
      ({ ids, property }) => {
        for (const id of ids)
          Object.assign(document.getElementById(id)!, {
            [property]: property === 'name' ? '' : true,
          });
      },
      { ids: cases.map(control => control.id), property }
    );
    await expect.poll(() => formData(page)).toEqual([]);
    expect((await inspectAll(page)).map(info => info.state)).toEqual(states);
    await page.evaluate(
      ({ ids, property }) => {
        for (const id of ids)
          Object.assign(document.getElementById(id)!, {
            [property]: property === 'name' ? id : false,
          });
      },
      { ids: cases.map(control => control.id), property }
    );
    await expect.poll(() => formData(page)).toEqual(entries('updated'));
  }
});

test('form ownership can be reassigned through properties and external owners reset every control @cross-browser', async ({
  page,
}) => {
  await page.evaluate(
    ids => {
      for (const id of ids) Object.assign(document.getElementById(id)!, { form: 'external' });
    },
    cases.map(control => control.id)
  );
  await expect.poll(() => formData(page)).toEqual([]);
  await expect.poll(() => formData(page, 'external')).toEqual(entries('initial'));
  expect((await inspectAll(page)).map(info => info.owner)).toEqual(cases.map(() => 'external'));
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page, 'external')).toEqual(entries('updated'));
  await page.locator('#external').evaluate((form: HTMLFormElement) => form.reset());
  await expect.poll(() => formData(page, 'external')).toEqual(entries('initial'));
});

test('recorded browser state restores scalar, boolean and repeated values without change events @cross-browser', async ({
  page,
}) => {
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  const states = (await inspectAll(page)).map(info => info.state);
  await setPhase(page, 'initial');
  await expect.poll(() => formData(page)).toEqual(entries('initial'));
  await page.evaluate(
    ({ ids, states }) => {
      ids.forEach((id, i) => window.formContracts.restore(id, states[i]));
    },
    { ids: cases.map(control => control.id), states }
  );
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  expect((await inspectAll(page)).map(info => info.changes)).toEqual(cases.map(() => 0));
});

test('required messages update immediately and disabled controls clear validation @cross-browser', async ({
  page,
}) => {
  const ids = cases.filter(control => control.tag !== 'slider').map(control => control.id);
  await page.evaluate(ids => {
    for (const id of ids)
      Object.assign(document.getElementById(id)!, {
        required: true,
        requiredMessage: 'Choose a value.',
        checked: false,
        tokens: [],
        value: id === 'multi' ? [] : '',
      });
  }, ids);
  const messages = () =>
    page.evaluate(ids => ids.map(id => window.formContracts.inspect(id).message), ids);
  await expect.poll(messages).toEqual(ids.map(() => 'Choose a value.'));
  await page.evaluate(ids => {
    for (const id of ids)
      Object.assign(document.getElementById(id)!, { requiredMessage: 'A value is needed.' });
  }, ids);
  await expect.poll(messages).toEqual(ids.map(() => 'A value is needed.'));
  await page.locator('#controls').evaluate((fieldset: HTMLFieldSetElement) => {
    fieldset.disabled = true;
  });
  await expect.poll(messages).toEqual(ids.map(() => ''));
  await page.locator('#controls').evaluate((fieldset: HTMLFieldSetElement) => {
    fieldset.disabled = false;
  });
  await expect.poll(messages).toEqual(ids.map(() => 'A value is needed.'));
});

test('radio validity follows active options and keyboard selection supports empty string values @cross-browser', async ({
  page,
}) => {
  const radio = page.locator('#radio');
  await radio.evaluate((el: HTMLDsRadioElement) => {
    el.required = true;
    el.options = [
      { value: 'a', label: 'First', isInactive: true },
      { value: 'b', label: 'Second' },
    ];
  });
  await expect(radio).toHaveAttribute('aria-invalid', 'true');
  expect(await page.evaluate(() => window.formContracts.inspect('radio').valid)).toBe(false);
  await radio.evaluate((el: HTMLDsRadioElement) => {
    el.options = [{ value: 'b', label: 'Second' }];
  });
  await expect(radio).toHaveAttribute('aria-invalid', 'true');
  await radio.evaluate((el: HTMLDsRadioElement) => {
    el.options = [
      { value: '', label: 'Empty value' },
      { value: 'b', label: 'Second' },
    ];
    el.value = 'b';
  });
  await expect(radio.getByRole('radio', { name: 'Empty value' })).toBeVisible();
  const selected = radio.getByRole('radio', { name: 'Second' });
  await expect(selected).toHaveAttribute('tabindex', '0');
  await selected.focus();
  await expect(selected).toBeFocused();
  await page.keyboard.press('Home');
  await expect(radio).toHaveJSProperty('value', '');
  await expect(radio.getByRole('radio', { name: 'Empty value' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  expect(await page.evaluate(() => window.formContracts.inspect('radio').valid)).toBe(true);
  expect(
    await page.evaluate(() =>
      new FormData(document.getElementById('owner') as HTMLFormElement).get('radio')
    )
  ).toBe('');
});

test('checkbox restoration preserves mixed and checked states independently of its submitted value @cross-browser', async ({
  page,
}) => {
  const checkbox = page.locator('#check');
  for (const checked of [false, true])
    for (const indeterminate of [false, true]) {
      await checkbox.evaluate((el: HTMLDsCheckboxElement, state) => Object.assign(el, state), {
        checked,
        indeterminate,
        value: '',
      });
      await expect(checkbox).toHaveAttribute(
        'aria-checked',
        indeterminate ? 'mixed' : String(checked)
      );
      const { state } = await page.evaluate(() => window.formContracts.inspect('check'));
      await checkbox.evaluate((el: HTMLDsCheckboxElement, state) => Object.assign(el, state), {
        checked: !checked,
        indeterminate: !indeterminate,
      });
      await page.evaluate(state => window.formContracts.restore('check', state), state);
      await expect(checkbox).toHaveJSProperty('checked', checked);
      await expect(checkbox).toHaveJSProperty('indeterminate', indeterminate);
      expect(
        await page.evaluate(() =>
          new FormData(document.getElementById('owner') as HTMLFormElement).getAll('check')
        )
      ).toEqual(checked ? [''] : []);
    }
});

test('option-based controls retain restoration state while their choices are unavailable @cross-browser', async ({
  page,
}) => {
  const ids = ['radio', 'tiles', 'select', 'multi'];
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  const states = await page.evaluate(
    ids => ids.map(id => window.formContracts.inspect(id).state),
    ids
  );
  await page.evaluate(ids => {
    for (const id of ids)
      Object.assign(document.getElementById(id)!, { options: [], required: true });
  }, ids);
  await expect
    .poll(() => page.evaluate(ids => ids.map(id => window.formContracts.inspect(id).valid), ids))
    .toEqual(ids.map(() => false));
  expect(
    await page.evaluate(ids => ids.map(id => window.formContracts.inspect(id).state), ids)
  ).toEqual(states);
  await page.evaluate(
    ({ ids, states }) => {
      for (const [index, id] of ids.entries()) {
        Object.assign(document.getElementById(id)!, { value: id === 'multi' ? [] : '' });
        window.formContracts.restore(id, states[index]);
      }
    },
    { ids, states }
  );
  await page.evaluate(
    ({ ids, options }) => {
      for (const id of ids) Object.assign(document.getElementById(id)!, { options });
    },
    { ids, options }
  );
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  expect(
    await page.evaluate(ids => ids.map(id => window.formContracts.inspect(id).valid), ids)
  ).toEqual(ids.map(() => true));
});

test('empty repeated state clears selections and malformed checkbox state is ignored @cross-browser', async ({
  page,
}) => {
  await setPhase(page, 'updated');
  await expect.poll(() => formData(page)).toEqual(entries('updated'));
  await page.evaluate(() => {
    for (const id of ['tokens', 'multi']) window.formContracts.restore(id, '[]');
    for (const state of [null, 'not json', '{}', '[1,0]', '[true]', '[false,false,false]']) {
      window.formContracts.restore('check', state);
    }
  });
  await expect(page.locator('#tokens')).toHaveJSProperty('tokens', []);
  await expect(page.locator('#multi')).toHaveJSProperty('value', []);
  await expect(page.locator('#check')).toHaveJSProperty('checked', true);
  await expect(page.locator('#check')).toHaveJSProperty('indeterminate', false);
  expect((await inspectAll(page)).map(info => info.changes)).toEqual(cases.map(() => 0));
});
