#!/usr/bin/env node
/** Add authored public type exports that Stencil cannot infer from component props. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = join(root, 'dist/components/index.d.ts');
const packageTypesPath = join(root, 'dist/types/components.d.ts');
const questionnaireEntryPath = join(
  root,
  'dist/components/ds-agent-questionnaire.d.ts',
);

const marker = '// --- nav type re-exports (patch-index-types.mjs) ---';
const patch = `
${marker}
export type {
  NavChromeStyle,
  PanelNavRouterMode,
  PanelNavItem,
  PanelNavGroup,
} from '../types/components/PanelNav/panel-nav-types';
export type {
  BarNavTab,
  BarNavActionItem,
} from '../types/components/BarNav/bar-nav-types';
export type {
  ConversationItemState,
  MessageDirection,
  MessageGroupPosition,
  MessageDeliveryState,
  MessageMetadataVisibility,
  MessageFeedback,
  MessageCopyResultEventDetail,
  MessageScrollerPosition,
  MessageComposerStatus,
  ConversationAttachment,
  AgentActivityState,
  AgentActivityItem,
  AgentSource,
  AgentQuestionType,
  AgentQuestionChoice,
  AgentQuestion,
  AgentQuestionAnswer,
  AgentQuestionnaireStatus,
  AgentQuestionnaireLabels,
  AgentQuestionnaireAnswerEventDetail,
  AgentQuestionnaireCancelEventDetail,
  AgentToolState,
  AgentResponseRenderMode,
  AgentQuestionnaireResponsePart,
  AgentResponsePart,
} from '../types/components/conversation-types';
export type {
  TableCaptionVisibility,
  TableCellAlign,
  TableCellAction,
  TableCellActionDetail,
  TableCellBlank,
  TableCellEmpty,
  TableCellIcon,
  TableCellImage,
  TableCellPrimaryText,
  TableCellText,
  TableCellTag,
  TableCellTagVariant,
  TableCellValue,
  TableColumn,
  TableColumnWidth,
  TableGroup,
  TableHeaderSegment,
  TableGroupingChangeDetail,
  TableGroupingState,
  TableLoadMoreDetail,
  TableLoadMoreMode,
  TableLoadMoreReason,
  TableRow,
  TableSelectionChangeDetail,
  TableSelectionMode,
  TableSortChangeDetail,
  TableSortDirection,
  TableSortState,
} from '../types/components/Table/table-types';
`;

const questionnaireTypesMarker =
  '// --- questionnaire type re-exports (patch-index-types.mjs) ---';
const packageTypesPatch = `
${questionnaireTypesMarker}
export type {
  AgentQuestionType,
  AgentQuestionChoice,
  AgentQuestionnaireResponsePart,
} from './components/conversation-types';
`;
const questionnaireEntryPatch = `
${questionnaireTypesMarker}
export type {
  AgentQuestionType,
  AgentQuestionChoice,
  AgentQuestion,
  AgentQuestionAnswer,
  AgentQuestionnaireStatus,
  AgentQuestionnaireLabels,
  AgentQuestionnaireAnswerEventDetail,
  AgentQuestionnaireCancelEventDetail,
  AgentQuestionnaireResponsePart,
} from '../types/components/conversation-types';
`;

function appendPatch(path, patchMarker, content) {
  const existing = readFileSync(path, 'utf8');
  if (existing.includes(patchMarker)) return;
  writeFileSync(path, existing.trimEnd() + content + '\n');
}

function patchQuestionnaireEntry() {
  let existing = readFileSync(questionnaireEntryPath, 'utf8');
  existing = existing.replace(
    'interface DsAgentQuestionnaire extends Components.DsAgentQuestionnaire, HTMLElement {}',
    'export interface DsAgentQuestionnaire extends Components.DsAgentQuestionnaire, HTMLElement {}',
  );
  if (!existing.includes(questionnaireTypesMarker)) {
    existing = existing.trimEnd() + questionnaireEntryPatch + '\n';
  }
  writeFileSync(questionnaireEntryPath, existing);
}

appendPatch(indexPath, marker, patch);
appendPatch(packageTypesPath, questionnaireTypesMarker, packageTypesPatch);
patchQuestionnaireEntry();
