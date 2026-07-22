import type { ShellPageCapacity, ShellPageHeaderPresentation } from './shell-page-types';
import type { BarTitleVariant } from '../BarTitle/bar-title-types';

export interface ShellPageCapacityOptions {
  inlineSize: number;
  compactAt: number;
  constrainedAt: number;
  hysteresis: number;
  previous: ShellPageCapacity | null;
}

export function resolveShellPageCapacity({
  inlineSize,
  compactAt,
  constrainedAt,
  hysteresis,
  previous,
}: ShellPageCapacityOptions): ShellPageCapacity {
  if (previous === null) {
    if (inlineSize <= constrainedAt) return 'constrained';
    if (inlineSize <= compactAt) return 'compact';
    return 'roomy';
  }

  if (previous === 'constrained') {
    if (inlineSize <= constrainedAt + hysteresis) return 'constrained';
    return inlineSize <= compactAt ? 'compact' : 'roomy';
  }

  if (inlineSize <= constrainedAt) return 'constrained';

  if (previous === 'compact') {
    return inlineSize <= compactAt + hysteresis ? 'compact' : 'roomy';
  }

  return inlineSize <= compactAt ? 'compact' : 'roomy';
}

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
