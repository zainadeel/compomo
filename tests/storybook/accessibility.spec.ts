import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type Theme = 'light' | 'dark';
type AccessibilityFindingKind = 'manual-review' | 'violation';
type AccessibilityImpact = 'review' | 'serious' | 'critical';

type StoryIndexEntry = {
  id: string;
  importPath: string;
  name: string;
  title: string;
  type: 'docs' | 'story';
};

type StoryIndex = {
  entries: Record<string, StoryIndexEntry>;
};

type AccessibilityBaselineEntry = {
  impact: AccessibilityImpact;
  kind: AccessibilityFindingKind;
  ruleId: string;
  storyId: string;
  target: string;
  theme: Theme;
};

type AccessibilityBaselineGroup = Omit<AccessibilityBaselineEntry, 'target'> & {
  targets: string[];
};

type AccessibilityFinding = AccessibilityBaselineEntry & {
  help: string;
  html: string;
  story: string;
  url: string;
};

type ScanResult = {
  axeRuns: number;
  contrastEvaluations: number;
  findings: AccessibilityFinding[];
  scannedStoryFiles: Set<string>;
  scannedStoryCount: number;
  skippedStories: string[];
};

const themes: Theme[] = ['light', 'dark'];
const blockingImpacts = new Set(['critical', 'serious']);
const contrastRulesRequiringReview = new Set(['color-contrast', 'non-text-contrast']);
const componentStoryPrefix = './src/wc/components/';
const explicitFixtureAttribute = 'data-a11y-fixture';
const componentRootAttribute = 'data-a11y-component-root';
const componentRootSelector = `[${componentRootAttribute}]`;
const updateBaseline = process.env.STORYBOOK_A11Y_UPDATE === '1';
const impactRank: Record<AccessibilityImpact, number> = {
  review: 0,
  serious: 1,
  critical: 2,
};
const baselinePath = fileURLToPath(new URL('./accessibility-baseline.json', import.meta.url));
const storyIndexPath = fileURLToPath(
  new URL('../../storybook-static/index.json', import.meta.url),
);

function normalizeTarget(target: readonly unknown[]): string {
  return target
    .map((part) => (Array.isArray(part) ? part.map(String).join(' >>> ') : String(part)))
    .join(' >>> ');
}

function findingKey(
  finding: Pick<
    AccessibilityBaselineEntry,
    'kind' | 'ruleId' | 'storyId' | 'target' | 'theme'
  >,
): string {
  return JSON.stringify([
    finding.storyId,
    finding.theme,
    finding.kind,
    finding.ruleId,
    finding.target,
  ]);
}

function baselineGroupKey(
  finding: Pick<
    AccessibilityBaselineEntry,
    'impact' | 'kind' | 'ruleId' | 'storyId' | 'theme'
  >,
): string {
  return JSON.stringify([
    finding.storyId,
    finding.theme,
    finding.kind,
    finding.impact,
    finding.ruleId,
  ]);
}

function loadBaseline(): AccessibilityBaselineEntry[] {
  const groups = JSON.parse(
    readFileSync(baselinePath, 'utf8'),
  ) as AccessibilityBaselineGroup[];
  return groups.flatMap(({ targets, ...group }) =>
    targets.map((target) => ({ ...group, target })),
  );
}

function loadComponentStories(): StoryIndexEntry[] {
  if (!existsSync(storyIndexPath)) {
    throw new Error(
      'Storybook index is unavailable. Run npm run storybook:build before the accessibility suite.',
    );
  }
  const index = JSON.parse(readFileSync(storyIndexPath, 'utf8')) as StoryIndex;

  return Object.values(index.entries)
    .filter(
      (entry): entry is StoryIndexEntry =>
        entry.type === 'story' && entry.importPath.startsWith(componentStoryPrefix),
    )
    .sort((left, right) => left.id.localeCompare(right.id));
}

function groupStoriesByFile(stories: StoryIndexEntry[]): Map<string, StoryIndexEntry[]> {
  const grouped = new Map<string, StoryIndexEntry[]>();
  for (const story of stories) {
    const current = grouped.get(story.importPath) ?? [];
    current.push(story);
    grouped.set(story.importPath, current);
  }
  return new Map([...grouped].sort(([left], [right]) => left.localeCompare(right)));
}

function uniqueFindings(findings: AccessibilityFinding[]): AccessibilityFinding[] {
  return [...new Map(findings.map((finding) => [findingKey(finding), finding])).values()];
}

function writeBaseline(findings: AccessibilityFinding[]): void {
  const groups = new Map<string, AccessibilityBaselineGroup>();
  for (const { impact, kind, ruleId, storyId, target, theme } of uniqueFindings(findings)) {
    const group = { impact, kind, ruleId, storyId, theme };
    const key = baselineGroupKey(group);
    const current = groups.get(key) ?? { ...group, targets: [] };
    current.targets.push(target);
    groups.set(key, current);
  }

  const baseline = [...groups.values()]
    .map((group) => ({
      ...group,
      targets: group.targets.sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => baselineGroupKey(left).localeCompare(baselineGroupKey(right)));

  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
}

async function waitForStory(page: Page): Promise<void> {
  await page.locator('#storybook-root').waitFor({ state: 'attached' });
  await page.locator('#storybook-root > *').first().waitFor({ state: 'attached' });
  await page.addStyleTag({
    // Theme changes can animate foreground/background colors. Freeze motion so Axe
    // always measures the settled token pair instead of a transition midpoint.
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  });
  await page.evaluate(async () => {
    await document.fonts.ready;

    const customElementsInStory = Array.from(
      document.querySelectorAll<HTMLElement>('#storybook-root *'),
    ).filter((element) => element.localName.includes('-'));

    await Promise.all(
      customElementsInStory.map((element) => customElements.whenDefined(element.localName)),
    );

    await Promise.all(
      customElementsInStory.map((element) => {
        const stencilElement = element as HTMLElement & {
          componentOnReady?: () => Promise<unknown>;
        };
        return stencilElement.componentOnReady?.() ?? Promise.resolve();
      }),
    );
  });
}

async function markComponentRoots(page: Page): Promise<number> {
  return page.evaluate(({ explicitAttribute, rootAttribute }) => {
    const storyRoot = document.querySelector<HTMLElement>('#storybook-root');
    if (!storyRoot) return 0;

    const explicitFixtures = Array.from(
      storyRoot.querySelectorAll<HTMLElement>(`[${explicitAttribute}]`),
    ).filter((element) => element.localName.startsWith('ds-'));

    const componentElements = Array.from(
      storyRoot.querySelectorAll<HTMLElement>('*'),
    ).filter((element) => element.localName.startsWith('ds-'));
    const inferredRoots = componentElements.filter((element) => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== storyRoot) {
        if (ancestor.localName.startsWith('ds-')) return false;
        ancestor = ancestor.parentElement;
      }
      return true;
    });
    const componentRoots = explicitFixtures.length > 0 ? explicitFixtures : inferredRoots;

    componentRoots.forEach((element, index) => {
      element.setAttribute(rootAttribute, String(index));
    });

    return componentRoots.length;
  }, {
    explicitAttribute: explicitFixtureAttribute,
    rootAttribute: componentRootAttribute,
  });
}

async function applyTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((nextTheme) => {
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
  }, theme);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}

async function scanStories(page: Page, stories: StoryIndexEntry[]): Promise<ScanResult> {
  const findings: AccessibilityFinding[] = [];
  const scannedStoryFiles = new Set<string>();
  const skippedStories: string[] = [];
  let axeRuns = 0;
  let contrastEvaluations = 0;
  let scannedStoryCount = 0;

  for (const story of stories) {
    await test.step(`${story.title} / ${story.name}`, async () => {
      const storyUrl = `/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
      const response = await page.goto(storyUrl, { waitUntil: 'load' });

      expect(response?.ok(), `${story.id} should render`).toBe(true);
      await waitForStory(page);

      const componentRootCount = await markComponentRoots(page);
      if (componentRootCount === 0) {
        skippedStories.push(story.id);
        return;
      }

      scannedStoryCount += 1;
      scannedStoryFiles.add(story.importPath);

      for (const theme of themes) {
        await test.step(theme, async () => {
          await applyTheme(page, theme);

          const results = await new AxeBuilder({ page })
            // Storybook fixtures are same-origin. A single awaited axe.run() avoids
            // axe-core's partial-run state occasionally leaking into the next story.
            .setLegacyMode()
            // Scan rendered component fixtures only. Storybook captions and showcase annotations
            // remain useful documentation, but they are not part of the component contract.
            .include(componentRootSelector)
            // Isolated component stories are not full pages and do not need landmarks.
            .disableRules(['region'])
            .analyze();
          axeRuns += 1;

          contrastEvaluations += [
            ...results.passes,
            ...results.violations,
            ...results.incomplete,
          ]
            .filter((result) => contrastRulesRequiringReview.has(result.id))
            .reduce((count, result) => count + result.nodes.length, 0);

          for (const violation of results.violations) {
            if (!violation.impact || !blockingImpacts.has(violation.impact)) continue;

            const impact = violation.impact as Extract<AccessibilityImpact, 'critical' | 'serious'>;
            for (const node of violation.nodes) {
              findings.push({
                help: violation.help,
                html: node.html,
                impact,
                kind: 'violation',
                ruleId: violation.id,
                story: `${story.title} / ${story.name}`,
                storyId: story.id,
                target: normalizeTarget(node.target),
                theme,
                url: `${storyUrl}&globals=theme:${theme}`,
              });
            }
          }

          for (const incomplete of results.incomplete) {
            if (!contrastRulesRequiringReview.has(incomplete.id)) continue;

            for (const node of incomplete.nodes) {
              findings.push({
                help: incomplete.help,
                html: node.html,
                impact: 'review',
                kind: 'manual-review',
                ruleId: incomplete.id,
                story: `${story.title} / ${story.name}`,
                storyId: story.id,
                target: normalizeTarget(node.target),
                theme,
                url: `${storyUrl}&globals=theme:${theme}`,
              });
            }
          }
        });
      }
    });
  }

  return {
    axeRuns,
    contrastEvaluations,
    findings: uniqueFindings(findings),
    scannedStoryFiles,
    scannedStoryCount,
    skippedStories,
  };
}

function expectFindingsToMatchBaseline(
  currentFindings: AccessibilityFinding[],
  baselineEntries: AccessibilityBaselineEntry[],
): void {
  const baseline = new Map(baselineEntries.map((entry) => [findingKey(entry), entry]));
  const findingsByKey = new Map(
    currentFindings.map((finding) => [findingKey(finding), finding]),
  );
  const regressions = currentFindings.filter((finding) => {
    const allowed = baseline.get(findingKey(finding));
    return !allowed || impactRank[finding.impact] > impactRank[allowed.impact];
  });
  const improvements = [...baseline.values()].filter((allowed) => {
    const finding = findingsByKey.get(findingKey(allowed));
    return !finding || impactRank[finding.impact] < impactRank[allowed.impact];
  });

  if (regressions.length > 0) {
    const details = regressions.slice(0, 20).map((finding) => {
      const allowed = baseline.get(findingKey(finding));
      const allowance = allowed ? `baseline allows ${allowed.impact}` : 'not in baseline';
      return `${finding.story} / ${finding.theme} [${finding.kind}/${finding.impact}/${finding.ruleId}; ${allowance}] ${finding.help}: ${finding.target} — ${finding.html} (${finding.url})`;
    });
    const omitted = regressions.length > details.length
      ? `\n...and ${regressions.length - details.length} more.`
      : '';

    throw new Error(
      `Found ${regressions.length} new or worsened exact component accessibility finding(s).\n${details.join('\n')}${omitted}`,
    );
  }

  if (improvements.length > 0) {
    const details = improvements.slice(0, 20).map((allowed) => {
      const finding = findingsByKey.get(findingKey(allowed));
      const current = finding ? finding.impact : 'resolved';
      return `${allowed.storyId} / ${allowed.theme} / ${allowed.ruleId} / ${allowed.target}: ${allowed.impact} → ${current}`;
    });
    const omitted = improvements.length > details.length
      ? `\n...and ${improvements.length - details.length} more.`
      : '';

    throw new Error(
      `The component accessibility baseline improved. Run npm run storybook:test:a11y:update to lock in the improvement.\n${details.join('\n')}${omitted}`,
    );
  }
}

const componentStories = loadComponentStories();
const storiesByFile = groupStoriesByFile(componentStories);
const baseline = loadBaseline();

if (updateBaseline) {
  test('update the complete component accessibility baseline', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    expect(componentStories.length, 'Storybook should expose component stories').toBeGreaterThan(0);
    const result = await scanStories(page, componentStories);

    expect(result.contrastEvaluations).toBeGreaterThan(0);
    expect(
      [...storiesByFile.keys()].filter((importPath) => !result.scannedStoryFiles.has(importPath)),
      'Every component story file should contribute at least one rendered ds-* fixture',
    ).toEqual([]);

    writeBaseline(result.findings);
    process.stdout.write(
      `Updated ${result.findings.length} exact findings after checking ${result.scannedStoryCount} component stories in ${themes.length} themes (${result.skippedStories.length} documentation-only exports skipped).\n`,
    );
  });
} else {
  test('baseline only references current component stories', () => {
    expect(componentStories.length, 'Storybook should expose component stories').toBeGreaterThan(0);
    const storyIds = new Set(componentStories.map((story) => story.id));
    const staleStoryIds = [
      ...new Set(baseline.map((entry) => entry.storyId).filter((storyId) => !storyIds.has(storyId))),
    ].sort();

    expect(
      staleStoryIds,
      'Remove or refresh findings for component stories that no longer exist',
    ).toEqual([]);
  });

  for (const [importPath, stories] of storiesByFile) {
    const storyIds = new Set(stories.map((story) => story.id));
    const fileBaseline = baseline.filter((entry) => storyIds.has(entry.storyId));
    const testName = importPath.slice(componentStoryPrefix.length);

    test(testName, async ({ page }) => {
      const result = await scanStories(page, stories);

      expect(result.axeRuns, 'Every rendered fixture should be checked in both themes').toBe(
        result.scannedStoryCount * themes.length,
      );
      expect(
        result.scannedStoryFiles.has(importPath),
        'The component story file should contribute at least one rendered ds-* fixture',
      ).toBe(true);
      expectFindingsToMatchBaseline(result.findings, fileBaseline);
    });
  }
}
