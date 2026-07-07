import type { ShellGradientPreset } from '../../nav/shell-gradient-presets';
import {
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
} from '../../nav/shell-gradient-presets';

export type { ShellGradientPreset };

export {
  DEFAULT_SHELL_GRADIENT_PRESET,
  SHELL_GRADIENT_PRESETS,
  SHELL_GRADIENT_PRESET_LABELS,
  buildShellRadialGradientForPreset,
  isShellGradientPreset,
  shellGradientPresetStopToken,
} from '../../nav/shell-gradient-presets';
