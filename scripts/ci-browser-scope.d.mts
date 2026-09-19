export function isBrowserNeutralPath(filePath: string): boolean;
export function isVersionOnlyPackageChange(
  filePath: string,
  before: string,
  after: string
): boolean;
export function requiresBrowserValidation(
  filePaths: string[],
  versionOnlyPaths?: ReadonlySet<string>
): boolean;
export function requiresStorybookValidation(
  filePaths: string[],
  versionOnlyPaths?: ReadonlySet<string>
): boolean;
