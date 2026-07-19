export type ConversationItemState = 'default' | 'busy' | 'error';

export type MessageDirection = 'incoming' | 'outgoing' | 'system';

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageScrollerPosition = 'start' | 'end' | 'last-anchor';

export type MessageComposerStatus = 'ready' | 'submitted' | 'streaming' | 'error';

export interface ConversationAttachment {
  id: string;
  name: string;
  mediaType?: string;
  size?: string;
  url?: string;
}

export type AgentActivityState = 'pending' | 'active' | 'complete' | 'error';

export interface AgentActivityItem {
  id: string;
  label: string;
  detail?: string;
  state: AgentActivityState;
}

export interface AgentSource {
  id: string;
  title: string;
  url: string;
  description?: string;
}

export type AgentToolState = 'queued' | 'running' | 'success' | 'error' | 'denied';

export type AgentResponsePart =
  | {
      id: string;
      type: 'markdown';
      content: string;
      state: 'streaming' | 'complete';
    }
  | {
      id: string;
      type: 'activity';
      items: AgentActivityItem[];
    }
  | {
      id: string;
      type: 'tool';
      name: string;
      label: string;
      state: AgentToolState;
      input?: unknown;
      output?: unknown;
      error?: string;
    }
  | {
      id: string;
      type: 'attachments';
      items: ConversationAttachment[];
    }
  | {
      id: string;
      type: 'sources';
      items: AgentSource[];
    };
