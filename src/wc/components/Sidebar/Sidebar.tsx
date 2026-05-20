import { Component, Prop, State, Event, EventEmitter, Element, Watch, h, Host } from '@stencil/core';

export type SidebarWidth = 'mini' | 'default' | number;

const MINI_WIDTH = 56;
const DEFAULT_WIDTH = 240;
const MAX_WIDTH = 480;
const MIN_DRAG_WIDTH = 180;
const SNAP_THRESHOLD = 140;
const KEYBOARD_STEP = 16;

const FOCUSABLE_SEL = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Component({
  tag: 'ds-sidebar',
  styleUrl: 'Sidebar.css',
  scoped: true,
})
export class Sidebar {
  @Element() el!: HTMLElement;

  @Prop({ mutable: true }) collapsed: boolean = false;
  @Prop() width: SidebarWidth = 'default';
  @Prop() resizable: boolean = true;
  @Prop() mobile: boolean = false;

  @State() private isResizing: boolean = false;

  @Event() dsToggle!: EventEmitter<void>;
  @Event() dsWidthChange!: EventEmitter<SidebarWidth>;

  private triggerEl: HTMLElement | null = null;
  private escapeHandler: ((e: KeyboardEvent) => void) | null = null;
  private tabHandler: ((e: KeyboardEvent) => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: (() => void) | null = null;

  private get resolvedWidth(): number {
    if (this.width === 'mini') return MINI_WIDTH;
    if (this.width === 'default') return DEFAULT_WIDTH;
    return this.width as number;
  }

  private get isMobileOpen(): boolean {
    return this.mobile && !this.collapsed;
  }

  @Watch('collapsed')
  onCollapsedChange() {
    if (this.isMobileOpen) {
      this.setupMobileFocusTrap();
    } else {
      this.teardownMobileFocusTrap();
    }
  }

  componentDidLoad() {
    if (this.isMobileOpen) {
      this.setupMobileFocusTrap();
    }
    if (this.mobile) {
      this.escapeHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !this.collapsed) {
          this.dsToggle.emit();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }
  }

  disconnectedCallback() {
    this.teardownMobileFocusTrap();
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
      this.escapeHandler = null;
    }
    this.cleanupMouseHandlers();
  }

  private setupMobileFocusTrap() {
    this.triggerEl = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(this.el.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter(
        el => !el.hasAttribute('aria-hidden') && el.offsetParent !== null,
      );

    const initial = focusables();
    (initial[0] ?? this.el).focus();

    this.tabHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) { e.preventDefault(); this.el.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !this.el.contains(active))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (active === last || !this.el.contains(active))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', this.tabHandler);
  }

  private teardownMobileFocusTrap() {
    if (this.tabHandler) {
      document.removeEventListener('keydown', this.tabHandler);
      this.tabHandler = null;
    }
    this.triggerEl?.focus?.();
    this.triggerEl = null;
  }

  private cleanupMouseHandlers() {
    if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
    if (this.mouseUpHandler) document.removeEventListener('mouseup', this.mouseUpHandler);
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private handleResizeMouseDown(e: MouseEvent) {
    if (!this.resizable) return;
    e.preventDefault();
    this.isResizing = true;

    this.mouseMoveHandler = (ev: MouseEvent) => {
      const newW = ev.clientX;
      if (newW < SNAP_THRESHOLD) {
        this.dsWidthChange.emit('mini');
      } else if (newW < MIN_DRAG_WIDTH) {
        this.dsWidthChange.emit('default');
      } else {
        this.dsWidthChange.emit(newW);
      }
    };

    this.mouseUpHandler = () => {
      this.isResizing = false;
      this.cleanupMouseHandlers();
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.mouseMoveHandler);
    document.addEventListener('mouseup', this.mouseUpHandler);
  }

  private handleResizeKeyDown(e: KeyboardEvent) {
    if (!this.resizable) return;
    const w = this.width;
    const resolved = this.resolvedWidth;

    switch (e.key) {
      case 'ArrowLeft': {
        e.preventDefault();
        if (w === 'mini') return;
        const next = resolved - KEYBOARD_STEP;
        this.dsWidthChange.emit(next < MIN_DRAG_WIDTH ? 'mini' : next);
        break;
      }
      case 'ArrowRight': {
        e.preventDefault();
        if (w === 'mini') { this.dsWidthChange.emit('default'); return; }
        this.dsWidthChange.emit(Math.min(resolved + KEYBOARD_STEP, MAX_WIDTH));
        break;
      }
      case 'Home':
        e.preventDefault();
        this.dsWidthChange.emit('mini');
        break;
      case 'End':
        e.preventDefault();
        this.dsWidthChange.emit(MAX_WIDTH);
        break;
    }
  }

  render() {
    if (this.collapsed && !this.mobile) return null;

    const isMini = this.width === 'mini';
    const isMobileOpen = this.isMobileOpen;
    const sidebarWidth = this.collapsed ? 0 : this.resolvedWidth;

    const dialogProps = isMobileOpen
      ? { role: 'dialog', 'aria-modal': 'true', tabIndex: -1 }
      : { role: 'navigation' };

    return (
      <Host>
        {this.mobile && !this.collapsed && (
          <div
            class="backdrop"
            onClick={() => this.dsToggle.emit()}
            aria-hidden="true"
          />
        )}
        <aside
          class={{
            sidebar: true,
            'sidebar--mini': isMini,
            'sidebar--mobile': this.mobile,
            'sidebar--collapsed': this.collapsed,
            'sidebar--resizing': this.isResizing,
          }}
          style={{ width: `${sidebarWidth}px` }}
          aria-label="Sidebar"
          {...dialogProps}
        >
          <div class="sidebar__content">
            <slot />
          </div>
          <div class="sidebar__footer">
            <slot name="footer" />
          </div>
          {this.resizable && !this.mobile && (
            <div
              class="sidebar__resize-handle"
              onMouseDown={(e: MouseEvent) => this.handleResizeMouseDown(e)}
              onKeyDown={(e: KeyboardEvent) => this.handleResizeKeyDown(e)}
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              aria-valuenow={this.resolvedWidth}
              aria-valuemin={MINI_WIDTH}
              aria-valuemax={MAX_WIDTH}
              tabIndex={0}
            />
          )}
        </aside>
      </Host>
    );
  }
}
