import axe, { type Result } from 'axe-core';
import { afterEach, expect } from 'vitest';

const componentRootAttribute = 'data-a11y-component-root';
const explicitFixtureAttribute = 'data-a11y-fixture';
const blockingImpacts = new Set(['critical', 'serious']);

async function waitForStencil(): Promise<HTMLElement[]> {
  await document.fonts.ready;

  const components = Array.from(document.querySelectorAll<HTMLElement>('*')).filter(
    (element) => element.localName.startsWith('ds-'),
  );

  await Promise.all(components.map((element) => customElements.whenDefined(element.localName)));
  await Promise.all(
    components.map((element) => {
      const stencilElement = element as HTMLElement & {
        componentOnReady?: () => Promise<unknown>;
      };
      return stencilElement.componentOnReady?.() ?? Promise.resolve();
    }),
  );

  return components;
}

function markComponentRoots(components: HTMLElement[]): HTMLElement[] {
  const explicitFixtures = components.filter((element) =>
    element.hasAttribute(explicitFixtureAttribute),
  );
  const inferredRoots = components.filter((element) => {
    let ancestor = element.parentElement;
    while (ancestor) {
      if (ancestor.localName.startsWith('ds-')) return false;
      ancestor = ancestor.parentElement;
    }
    return true;
  });
  const roots = explicitFixtures.length > 0 ? explicitFixtures : inferredRoots;

  roots.forEach((element, index) => element.setAttribute(componentRootAttribute, String(index)));
  return roots;
}

function describeFindings(findings: Result[]): string {
  return findings
    .flatMap((finding) =>
      finding.nodes.map(
        (node) => {
          const target = node.target.length > 0 ? node.target.join(' >>> ') : node.html;
          return `${finding.impact ?? 'unknown'}/${finding.id}: ${finding.help} — ${target}`;
        },
      ),
    )
    .join('\n');
}

afterEach(async ({ task }) => {
  if (!task.file.filepath.includes('/src/wc/components/')) return;

  const components = await waitForStencil();
  const roots = markComponentRoots(components);
  if (roots.length === 0) return;

  const results = await axe.run(
    {
      include: [[`[${componentRootAttribute}]`]],
    },
    {
      resultTypes: ['violations'],
      selectors: false,
      rules: {
        region: { enabled: false },
      },
    },
  );
  const blockingFindings = results.violations.filter(
    (finding) => finding.impact && blockingImpacts.has(finding.impact),
  );

  roots.forEach((element) => element.removeAttribute(componentRootAttribute));

  expect(
    blockingFindings,
    `No serious or critical component accessibility violations are allowed.\n${describeFindings(blockingFindings)}`,
  ).toEqual([]);
});
