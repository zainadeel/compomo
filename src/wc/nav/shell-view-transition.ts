import { parseCssTimeMs } from '../utils/resolve-css-time-ms';

/** `view-transition-name` on `ds-bar-nav` — pairs with root reveal in shell apps. */
export const SHELL_BAR_NAV_VT_NAME = 'ds-shell-bar-nav';

export { parseCssTimeMs };

const VT_STYLE_ID = 'ds-shell-nav-vt-style';

/** Suppress default cross-fade and pin new snapshots to a 0px circle for WAAPI reveal. */
export function ensureShellNavVtStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(VT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = VT_STYLE_ID;
  style.textContent = [
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}',
    `::view-transition-old(${SHELL_BAR_NAV_VT_NAME}),::view-transition-new(${SHELL_BAR_NAV_VT_NAME}){animation:none;mix-blend-mode:normal}`,
    '::view-transition-new(root){clip-path:circle(0px at var(--vt-x,50%) var(--vt-y,50%))}',
    `::view-transition-new(${SHELL_BAR_NAV_VT_NAME}){clip-path:circle(0px at var(--vt-x,50%) var(--vt-y,50%))}`,
  ].join('\n');
  document.head.appendChild(style);
}

export interface ShellNavRevealOrigin {
  x: number;
  y: number;
  maxRadius: number;
}

/** Origin for the radial reveal — defaults to panel-nav footer gear, then viewport center. */
export function resolveShellNavRevealOrigin(originEl?: HTMLElement | null): ShellNavRevealOrigin {
  const btn =
    originEl ??
    document.querySelector<HTMLElement>('.panel-nav__footer-btn');
  const rect = btn?.getBoundingClientRect();
  const x = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2);
  const y = rect ? Math.round(rect.top + rect.height / 2) : Math.round(window.innerHeight / 2);
  const maxRadius = Math.ceil(
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)),
  );
  return { x, y, maxRadius };
}

export function setShellNavRevealOriginVars(origin: ShellNavRevealOrigin): void {
  document.documentElement.style.setProperty('--vt-x', `${origin.x}px`);
  document.documentElement.style.setProperty('--vt-y', `${origin.y}px`);
}

/** Animate root + bar-nav snapshots with the same radial clip-path reveal. */
export function animateShellNavRadialReveal(
  origin: ShellNavRevealOrigin,
  durationMs?: number,
): void {
  const durToken = getComputedStyle(document.documentElement)
    .getPropertyValue('--effect-animation-duration-long-1')
    .trim();
  const duration = durationMs ?? parseCssTimeMs(durToken, 750);
  const keyframes = {
    clipPath: [
      `circle(0px at ${origin.x}px ${origin.y}px)`,
      `circle(${origin.maxRadius}px at ${origin.x}px ${origin.y}px)`,
    ],
  };
  const options = {
    duration,
    easing: 'ease-in-out',
    fill: 'forwards' as const,
  };

  document.documentElement.animate(keyframes, {
    ...options,
    pseudoElement: '::view-transition-new(root)',
  });
  document.documentElement.animate(keyframes, {
    ...options,
    pseudoElement: `::view-transition-new(${SHELL_BAR_NAV_VT_NAME})`,
  });
}

/** Run radial reveal when a view transition's `ready` promise settles (app/router driver). */
export function runShellNavStyleRevealOnReady(
  transition: { ready: Promise<void> },
  originEl?: HTMLElement | null,
): void {
  ensureShellNavVtStyle();
  const origin = resolveShellNavRevealOrigin(originEl);
  setShellNavRevealOriginVars(origin);

  transition.ready
    .then(() => animateShellNavRadialReveal(origin))
    .catch(() => {
      /* transition skipped or superseded */
    });
}
