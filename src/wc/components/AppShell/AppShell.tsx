import { Component, Prop, Element, Watch, h, Host } from '@stencil/core';
import type { NavChromeStyle } from '../../nav/nav-chrome';
import {
  SHELL_GRADIENT_IMAGE_VAR,
  SHELL_GRADIENT_OPACITY,
  SHELL_GRADIENT_OPACITY_VAR,
  SHELL_GRADIENT_POSITION_BAR_VAR,
  SHELL_GRADIENT_POSITION_PANEL_VAR,
  SHELL_GRADIENT_SIZE_VAR,
  buildShellRadialGradient,
  shellGradientPositionBar,
  shellGradientPositionPanel,
  shellGradientSize,
} from '../../nav/shell-gradient';

@Component({
  tag: 'ds-app-shell',
  styleUrl: 'AppShell.css',
  scoped: true,
})
export class AppShell {
  /** Chrome style propagated to slotted `ds-panel-nav` and `ds-bar-nav`. */
  @Prop({ attribute: 'nav-style', reflect: true }) navStyle: NavChromeStyle = 'dashboard';

  /** When `true`, paints the shared chrome surface (bg + wash + grid) behind panel, bar, and tools. */
  @Prop({ reflect: true }) gradient: boolean = false;

  /**
   * Optional custom gradient for `background-image` (e.g. SVG URL).
   * When set, overrides the built-in radial wash.
   */
  @Prop() gradientSrc: string = '';

  @Element() el!: HTMLElement;

  private resizeObserver: ResizeObserver | null = null;

  componentDidLoad() {
    this.syncSlottedNavStyle();
    this.connectMetricsObserver();
    this.scheduleChromeSync();
  }

  private scheduleChromeSync() {
    this.syncChrome();
    requestAnimationFrame(() => this.syncChrome());
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  @Watch('navStyle')
  @Watch('gradient')
  @Watch('gradientSrc')
  onShellPropsChange() {
    this.syncSlottedNavStyle();
    this.scheduleChromeSync();
  }

  private syncSlottedNavStyle() {
    const panel = this.el.querySelector('ds-panel-nav') as (HTMLElement & { navStyle: NavChromeStyle }) | null;
    const bar = this.el.querySelector('ds-bar-nav') as (HTMLElement & { navStyle: NavChromeStyle }) | null;
    if (panel) {
      panel.setAttribute('nav-style', this.navStyle);
      panel.navStyle = this.navStyle;
    }
    if (bar) {
      bar.setAttribute('nav-style', this.navStyle);
      bar.navStyle = this.navStyle;
    }
  }

  private connectMetricsObserver() {
    this.resizeObserver = new ResizeObserver(() => this.scheduleChromeSync());
    this.resizeObserver.observe(this.el);
    const panelWrap = this.el.querySelector('.app-shell__panel');
    if (panelWrap) this.resizeObserver.observe(panelWrap);
    this.scheduleChromeSync();
  }

  private applyGradientVars(target: HTMLElement, vars: Record<string, string | null>) {
    const style = target.style;
    for (const [name, value] of Object.entries(vars)) {
      if (value === null) style.removeProperty(name);
      else style.setProperty(name, value);
    }
  }

  private clearGradientPaintVars(targets: HTMLElement[]) {
    const keys = [
      SHELL_GRADIENT_IMAGE_VAR,
      SHELL_GRADIENT_SIZE_VAR,
      SHELL_GRADIENT_OPACITY_VAR,
    ];
    for (const target of targets) {
      for (const key of keys) target.style.removeProperty(key);
    }
  }

  /** Panel/bar wash offsets for scroll fades and badge rings. */
  private syncChromeLayoutVars(
    panel: HTMLElement | null,
    bar: HTMLElement | null,
    panelPosition: string,
    barPosition: string,
  ) {
    if (panel) {
      panel.style.setProperty(SHELL_GRADIENT_POSITION_PANEL_VAR, panelPosition);
    }
    if (bar) {
      bar.style.setProperty(SHELL_GRADIENT_POSITION_BAR_VAR, barPosition);
    }
  }

  private syncChrome() {
    const panel = this.el.querySelector('ds-panel-nav') as HTMLElement | null;
    const bar = this.el.querySelector('ds-bar-nav') as HTMLElement | null;
    const targets = [this.el, panel, bar].filter((el): el is HTMLElement => el !== null);

    const shellRect = this.el.getBoundingClientRect();
    const panelWrap = this.el.querySelector('.app-shell__panel') as HTMLElement | null;
    const panelWidth = panelWrap?.getBoundingClientRect().width ?? 0;

    const panelPosition = shellGradientPositionPanel();
    const barPosition = shellGradientPositionBar(panelWidth);

    this.syncChromeLayoutVars(panel, bar, panelPosition, barPosition);

    if (!this.gradient) {
      this.clearGradientPaintVars(targets);
      return;
    }

    const image = this.gradientSrc.trim()
      ? `url(${this.gradientSrc.trim()})`
      : buildShellRadialGradient();

    const size = shellGradientSize({
      width: shellRect.width,
      height: shellRect.height,
      panelWidth,
    });
    const opacity = SHELL_GRADIENT_OPACITY;

    for (const target of targets) {
      if (target === this.el) {
        this.applyGradientVars(target, {
          [SHELL_GRADIENT_IMAGE_VAR]: image,
          [SHELL_GRADIENT_SIZE_VAR]: size,
          [SHELL_GRADIENT_POSITION_PANEL_VAR]: panelPosition,
          [SHELL_GRADIENT_POSITION_BAR_VAR]: barPosition,
          [SHELL_GRADIENT_OPACITY_VAR]: opacity,
        });
        continue;
      }

      const isBar = target.tagName.toLowerCase() === 'ds-bar-nav';
      this.applyGradientVars(target, {
        [SHELL_GRADIENT_IMAGE_VAR]: image,
        [SHELL_GRADIENT_SIZE_VAR]: size,
        [SHELL_GRADIENT_OPACITY_VAR]: opacity,
        [SHELL_GRADIENT_POSITION_PANEL_VAR]: isBar ? null : panelPosition,
        [SHELL_GRADIENT_POSITION_BAR_VAR]: isBar ? barPosition : null,
      });
    }
  }

  render() {
    const shellCls: Record<string, boolean> = {
      'app-shell': true,
      'app-shell--gradient': this.gradient,
      [`app-shell--${this.navStyle}`]: true,
    };

    return (
      <Host class={shellCls}>
        <div class="app-shell__row">
          {this.gradient ? <div class="app-shell__chrome" aria-hidden="true" /> : null}
          <div class="app-shell__panel">
            <slot name="panel" />
          </div>
          <div class="app-shell__main">
            <div class="app-shell__stack">
              <div class="app-shell__bar">
                <slot name="bar" />
              </div>
              <div class="app-shell__content">
                <slot />
              </div>
            </div>
            <div class="app-shell__tools">
              <slot name="tools" />
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
