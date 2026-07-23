import type { ShellPageCapacity, ShellPageHeaderPresentation } from './shell-page-types';
import type { BarTitleVariant } from '../BarTitle/bar-title-types';

export function resolveShellPageHeaderVariant(
  presentation: ShellPageHeaderPresentation,
  capacity: ShellPageCapacity,
  pageTopVisible: boolean
): BarTitleVariant {
  if (presentation !== 'auto') return presentation;
  if (capacity === 'constrained') return 'constrained';
  if (capacity === 'compact' || !pageTopVisible) return 'compact';
  return 'expanded';
}
