export interface TestInventoryCase {
  id: string;
  file: string;
  line: number;
  title: string;
  layer: 'unit' | 'rendered' | 'storybook';
  owner: string;
  risk: string;
  decision: string;
  browsers: string[];
  reason: string;
  audited: boolean;
  accessibilityAudit?: boolean;
}

export interface TestInventory {
  schemaVersion: number;
  summary: {
    byLayer: Record<string, number>;
    byDecision: Record<string, number>;
    renderedBrowserExecutions: number;
    retiredRenderedCases: number;
    activeRenderedAxeCases: number;
    baselineRenderedBrowserExecutions: number;
  };
  tests: TestInventoryCase[];
  retiredRenderedCases: Array<{
    file: string;
    title: string;
    owner: string;
    decision: string;
    replacementFile: string;
    reason: string;
  }>;
}

export function buildTestInventory(repositoryRoot?: string): Promise<TestInventory>;
export function extractRenderedInventory(
  repositoryRoot: string,
  policy: Record<string, unknown>
): Promise<TestInventoryCase[]>;
export function summarizeTestInventory(
  cases: TestInventoryCase[],
  policy: Record<string, unknown>
): TestInventory['summary'];
export function validateTestInventory(
  inventory: TestInventory,
  policy: Record<string, unknown>
): string[];
