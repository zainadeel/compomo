import { Component, Prop, h, Host } from '@stencil/core';
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

  render() {
    return (
      <Host>
        <details class="agent-activity" open={this.open}>
          <summary>
            <ds-icon name="ChevronRight" size="xs" color="inherit" />
            <ds-text variant="text-body-small" emphasis>{this.heading}</ds-text>
          </summary>
          <ol>
            {this.items.map(item => (
              <li class={`agent-activity__item agent-activity__item--${item.state}`}>
                <span class="agent-activity__marker" aria-hidden="true">
                  {item.state === 'active'
                    ? <ds-loader size="xs" color="inherit" />
                    : <ds-icon name={item.state === 'error' ? 'ErrorTriangle' : 'Check'} size="xs" color="inherit" />}
                </span>
                <span>
                  <ds-text variant="text-body-small" emphasis={item.state === 'active'}>{item.label}</ds-text>
                  {item.detail ? <ds-text variant="text-caption" color="secondary">{item.detail}</ds-text> : null}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </Host>
    );
  }
}
