import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

type StoryIndexEntry = {
  id: string;
  name: string;
  title: string;
  type: 'docs' | 'story';
};

type StoryIndex = {
  entries: Record<string, StoryIndexEntry>;
};

type AccessibilityBaselineEntry = {
  allowedNodes: number;
  impact: 'critical' | 'serious';
  ruleId: string;
  storyId: string;
};

type AccessibilityFinding = AccessibilityBaselineEntry & {
  help: string;
  nodes: string[];
  story: string;
  url: string;
};

const blockingImpacts = new Set(['critical', 'serious']);
const impactRank: Record<AccessibilityBaselineEntry['impact'], number> = {
  serious: 1,
  critical: 2,
};
const baselinePath = fileURLToPath(new URL('./accessibility-baseline.json', import.meta.url));

function findingKey(finding: Pick<AccessibilityBaselineEntry, 'ruleId' | 'storyId'>): string {
  return `${finding.storyId}:${finding.ruleId}`;
}

function loadBaseline(): AccessibilityBaselineEntry[] {
  return JSON.parse(readFileSync(baselinePath, 'utf8')) as AccessibilityBaselineEntry[];
}

function writeBaseline(findings: AccessibilityFinding[]): void {
  const baseline = findings
    .map(({ allowedNodes, impact, ruleId, storyId }) => ({
      allowedNodes,
      impact,
      ruleId,
      storyId,
    }))
    .sort((left, right) => findingKey(left).localeCompare(findingKey(right)));

  writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
}

async function waitForStory(page: Page): Promise<void> {
  await page.locator('#storybook-root').waitFor({ state: 'attached' });
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

test('all stories avoid serious and critical accessibility violations', async ({
  page,
  request,
}) => {
  const indexResponse = await request.get('/index.json');
  expect(indexResponse.ok(), 'Storybook index should load').toBe(true);

  const index = (await indexResponse.json()) as StoryIndex;
  const stories = Object.values(index.entries)
    .filter((entry): entry is StoryIndexEntry => entry.type === 'story')
    .sort((left, right) => left.id.localeCompare(right.id));

  expect(stories.length, 'Storybook should expose at least one story').toBeGreaterThan(0);

  const findings: AccessibilityFinding[] = [];

  for (const story of stories) {
    await test.step(`${story.title} / ${story.name}`, async () => {
      const storyUrl = `/iframe.html?id=${encodeURIComponent(story.id)}&viewMode=story`;
      const response = await page.goto(storyUrl, { waitUntil: 'networkidle' });

      expect(response?.ok(), `${story.id} should render`).toBe(true);
      await waitForStory(page);

      const results = await new AxeBuilder({ page })
        // Isolated component stories are not full pages and do not need landmarks.
        .disableRules(['region'])
        .analyze();

      for (const violation of results.violations) {
        if (!violation.impact || !blockingImpacts.has(violation.impact)) continue;

        const impact = violation.impact as AccessibilityBaselineEntry['impact'];
        findings.push({
          allowedNodes: violation.nodes.length,
          help: violation.help,
          impact,
          nodes: violation.nodes.map((node) => node.target.join(' ')),
          ruleId: violation.id,
          story: `${story.title} / ${story.name}`,
          storyId: story.id,
          url: storyUrl,
        });
      }
    });
  }

  if (process.env.STORYBOOK_A11Y_UPDATE === '1') {
    writeBaseline(findings);
    return;
  }

  const baseline = new Map(loadBaseline().map((entry) => [findingKey(entry), entry]));
  const findingsByKey = new Map(findings.map((finding) => [findingKey(finding), finding]));
  const regressions = findings.filter((finding) => {
    const allowed = baseline.get(findingKey(finding));
    return (
      !allowed ||
      finding.allowedNodes > allowed.allowedNodes ||
      impactRank[finding.impact] > impactRank[allowed.impact]
    );
  });

  const improvements = [...baseline.values()].filter((allowed) => {
    const finding = findingsByKey.get(findingKey(allowed));
    return (
      !finding ||
      finding.allowedNodes < allowed.allowedNodes ||
      impactRank[finding.impact] < impactRank[allowed.impact]
    );
  });

  if (regressions.length > 0) {
    const details = regressions.slice(0, 20).map((finding) => {
      const allowed = baseline.get(findingKey(finding));
      const allowance = allowed ? `baseline allows ${allowed.allowedNodes}` : 'not in baseline';
      const targets = finding.nodes.slice(0, 5).join(', ');
      return `${finding.story} [${finding.impact}/${finding.ruleId}; ${allowance}] ${finding.help}: ${targets} (${finding.url})`;
    });
    const omitted = regressions.length > details.length
      ? `\n...and ${regressions.length - details.length} more.`
      : '';

    throw new Error(
      `Found ${regressions.length} new or expanded serious/critical accessibility finding(s).\n${details.join('\n')}${omitted}`,
    );
  }

  if (improvements.length > 0) {
    const details = improvements.slice(0, 20).map((allowed) => {
      const finding = findingsByKey.get(findingKey(allowed));
      const current = finding
        ? `${finding.allowedNodes} ${finding.impact} node(s)`
        : 'resolved';
      return `${allowed.storyId} / ${allowed.ruleId}: ${allowed.allowedNodes} ${allowed.impact} node(s) → ${current}`;
    });
    const omitted = improvements.length > details.length
      ? `\n...and ${improvements.length - details.length} more.`
      : '';

    throw new Error(
      `The accessibility baseline improved. Run npm run storybook:test:a11y:update to lock in the improvement.\n${details.join('\n')}${omitted}`,
    );
  }

  process.stdout.write(
    `Checked ${stories.length} stories; no regressions beyond ${baseline.size} baselined serious/critical findings.\n`,
  );
});
