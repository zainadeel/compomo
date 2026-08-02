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
}

export interface TestInventory {
  schemaVersion: number;
  summary: {
    byLayer: Record<string, number>;
    byDecision: Record<string, number>;
    renderedBrowserExecutions: number;
    baselineRenderedBrowserExecutions: number;
  };
  tests: TestInventoryCase[];
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
