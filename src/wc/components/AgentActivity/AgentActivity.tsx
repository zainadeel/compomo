import { Component, Prop, State, Watch, h, Host } from '@stencil/core';
import type { AgentActivityItem } from '../conversation-types';

@Component({
  tag: 'ds-agent-activity',
  styleUrl: 'AgentActivity.css',
  scoped: true,
})
export class AgentActivity {
  @Prop() items: AgentActivityItem[] = [];
  @Prop() heading: string = 'Activity';
  @Prop() open: boolean = false;

  @State() private expanded: boolean = false;

  componentWillLoad() {
    this.expanded = this.open;
  }

  @Watch('open')
  handleOpenChange(open: boolean) {
    this.expanded = open;
  }

  private get currentItem(): AgentActivityItem | undefined {
    return (
      this.items.find(item => item.state === 'active') ??
      this.items.find(item => item.state === 'error') ??
      [...this.items].reverse().find(item => item.state === 'complete') ??
      this.items.find(item => item.state === 'pending')
    );
  }

  private handleToggle = (event: Event) => {
    this.expanded = (event.currentTarget as HTMLDetailsElement).open;
  };

  private stateLabel(item: AgentActivityItem): string {
    if (item.state === 'active') return 'In progress';
    if (item.state === 'complete') return 'Complete';
    if (item.state === 'error') return 'Error';
    return 'Pending';
  }

  render() {
    return (
      <Host>
        <details class="agent-activity" open={this.open} onToggle={this.handleToggle}>
          <summary>
            <ds-icon name="ChevronRight" size="xs" color="inherit" />
            <ds-text
              class="agent-activity__summary-label"
              variant="text-body-small"
              shimmer={!this.expanded && this.currentItem?.state === 'active'}
            >
              {this.expanded ? this.heading : this.currentItem?.label ?? this.heading}
            </ds-text>
          </summary>
          <ol>
            {this.items.map(item => (
              <li class={`agent-activity__item agent-activity__item--${item.state}`}>
                <span class="agent-activity__marker" aria-hidden="true">
                  {item.state === 'active' ? (
                    <ds-loader size="xs" color="inherit" />
                  ) : item.state === 'pending' ? (
                    <span class="agent-activity__pending-dot" />
                  ) : (
                    <ds-icon
                      name={item.state === 'error' ? 'ErrorTriangle' : 'Check'}
                      size="xs"
                      color="inherit"
                    />
                  )}
                </span>
                <span>
                  <ds-text variant="text-body-small" shimmer={item.state === 'active'}>
                    {item.label}
                  </ds-text>
                  {item.detail ? (
                    <ds-text variant="text-caption" color="secondary">
                      {item.detail}
                    </ds-text>
                  ) : null}
                  <span class="agent-activity__state ds-visually-hidden">{this.stateLabel(item)}</span>
                </span>
              </li>
            ))}
          </ol>
        </details>
      </Host>
    );
  }
}
