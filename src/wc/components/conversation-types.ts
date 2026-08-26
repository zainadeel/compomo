export type ConversationItemState = 'default' | 'busy' | 'error';

export type MessageDirection = 'incoming' | 'outgoing' | 'system';

export type MessageGroupPosition = 'single' | 'first' | 'middle' | 'last';

export type MessageDeliveryState = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type MessageMetadataVisibility = 'always' | 'hover';

export type MessageFeedback = 'positive' | 'negative';

export interface MessageCopyResultEventDetail {
  status: 'success' | 'error';
}

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

export type AgentQuestionType = 'single' | 'multiple' | 'text';

export interface AgentQuestionChoice {
  value: string;
  label: string;
  description?: string;
}

export interface AgentQuestion {
  id: string;
  type: AgentQuestionType;
  question: string;
  description?: string;
  choices?: AgentQuestionChoice[];
  required?: boolean;
  skippable?: boolean;
  allowOther?: boolean;
  placeholder?: string;
}

export interface AgentQuestionAnswer {
  questionId: string;
  value: string | string[] | null;
}

export type AgentQuestionnaireStatus = 'preparing' | 'ready' | 'submitting' | 'error' | 'answered';

export interface AgentQuestionnaireLabels {
  progress: string;
  previous: string;
  next: string;
  answer: string;
  skip: string;
  cancel: string;
  other: string;
  otherPlaceholder: string;
  preparing: string;
}

export interface AgentQuestionnaireAnswerEventDetail {
  requestId: string;
  answers: AgentQuestionAnswer[];
}

export interface AgentQuestionnaireCancelEventDetail {
  requestId: string;
}

export type AgentToolState =
  | 'preparing'
  | 'queued'
  | 'running'
  | 'waiting-for-user'
  | 'success'
  | 'error'
  | 'denied'
  | 'canceled';

export type AgentResponseRenderMode = 'parts' | 'composed';

export interface AgentQuestionnaireResponsePart {
  id: string;
  type: 'questionnaire';
  requestId: string;
  questions: AgentQuestion[];
  answers: AgentQuestionAnswer[];
  status: 'answered';
}

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
    }
  | AgentQuestionnaireResponsePart;
