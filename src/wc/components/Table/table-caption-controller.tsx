import { h } from '@stencil/core';
import { ConnectionTasks } from '../../utils/connection-tasks';
import {
  nextTableColumnCustomizerElementId,
  reorderTableColumnPartition,
  resolveTableFieldsConfiguration,
  tableColumnCustomizerSections,
  toggleTableColumnHidden,
  toggleTableColumnPinned,
} from './table-column-customizer';
import {
  nextTableDataModeSwitcherElementId,
  tableDataModeFromMenuItem,
  tableDataModeMenuItems,
} from './table-data-mode-switcher';
import type { MenuItemData, MenuItemToggleDetail, MenuReorderDetail } from '../Menu/menu-types';
import type {
  DataFieldsConfigChangeDetail,
  TableCaptionVisibility,
  TableColumn,
  TableDataMode,
  TableDataModeChangeDetail,
} from './table-types';

export interface TableCaptionState {
  columnCustomizerOpen: boolean;
  columnCustomizerSurfaceOpen: boolean;
  columnCustomizerInitialFocusVisible: boolean;
  dataModeSwitcherOpen: boolean;
  dataModeSwitcherSurfaceOpen: boolean;
  dataModeSwitcherInitialFocusVisible: boolean;
}

export function createTableCaptionState(): TableCaptionState {
  return {
    columnCustomizerOpen: false,
    columnCustomizerSurfaceOpen: false,
    columnCustomizerInitialFocusVisible: false,
    dataModeSwitcherOpen: false,
    dataModeSwitcherSurfaceOpen: false,
    dataModeSwitcherInitialFocusVisible: false,
  };
}

interface TableCaptionContext {
  caption: string;
  captionVisibility: TableCaptionVisibility;
  headerPresent: boolean;
  headerUsesToolbar: boolean;
  captionTrailingPresent: boolean;
  captionCompact: boolean;
  columnCustomizer: boolean;
  hideColumnCustomizerTrigger: boolean;
  captionControlsBorderless: boolean;
  chromeLoading: boolean;
  columns: TableColumn[];
  hiddenFieldIds: string[];
  fieldOrder: string[];
  pinnedFieldIds: string[];
  customizeOptions: MenuItemData[];
  dataModeSwitcher: boolean;
  dataModeSwitcherLabel: string;
  dataModeMenuLabel: string;
  dataMode: TableDataMode;
  infiniteModeLabel: string;
  paginationModeLabel: string;
  virtualModeLabel: string;
}

interface TableCaptionControllerOptions {
  host: () => HTMLElement;
  state: () => TableCaptionContext;
  menus: () => TableCaptionState;
  change: (patch: Partial<TableCaptionState>) => void;
  headerSlotChange: () => void;
  fieldsChange: (detail: DataFieldsConfigChangeDetail) => void;
  dataModeChange: (detail: TableDataModeChangeDetail) => void;
  customizeOptionChange: (value: string) => void;
}

/** Owns caption composition and menu interaction, using controlled field and mode inputs. */
// Keep JSX in functions so Stencil includes these component dependencies in its metadata.
export function createTableCaptionController(options: TableCaptionControllerOptions) {
  const columnCustomizerElementId = nextTableColumnCustomizerElementId();
  const dataModeSwitcherElementId = nextTableDataModeSwitcherElementId();
  const tasks = new ConnectionTasks(() => options.host().isConnected);

  function state() {
    return options.state();
  }

  function menus() {
    return options.menus();
  }

  function disconnect(): void {
    tasks.cancel();
    options.change(createTableCaptionState());
  }

  function reconcile(): void {
    if (!showsColumnCustomizer() || state().chromeLoading) {
      options.change({ columnCustomizerOpen: false, columnCustomizerSurfaceOpen: false });
    }
    if (!showsDataModeSwitcher() || state().chromeLoading) {
      options.change({ dataModeSwitcherOpen: false, dataModeSwitcherSurfaceOpen: false });
    }
  }

  function renderMenus() {
    return [renderDataModeSwitcherMenu(), renderColumnCustomizerMenu()];
  }

  function showsColumnCustomizer(): boolean {
    return state().columnCustomizer && state().captionVisibility === 'visible';
  }

  function showsDataModeSwitcher(): boolean {
    return state().dataModeSwitcher && state().captionVisibility === 'visible';
  }

  function showsCaptionTrailing(): boolean {
    return (
      showsDataModeSwitcher() ||
      (showsColumnCustomizer() && !state().hideColumnCustomizerTrigger) ||
      state().captionTrailingPresent
    );
  }

  function renderBar() {
    if (state().captionVisibility !== 'visible') return null;
    return (
      <div class="ds-table__caption-bar ds-table__bar ds-control--md">
        <div
          class={{
            'ds-table__caption-content': true,
            'ds-table__caption-content--trailing': showsCaptionTrailing(),
          }}
        >
          <div
            class={{
              'ds-table__caption-leading': true,
              'ds-table__caption-leading--toolbar': state().headerUsesToolbar,
            }}
          >
            <slot name="header" onSlotchange={options.headerSlotChange} />
            {!state().headerPresent ? (
              <ds-text
                class="ds-table__caption-title ds-table__bar-text"
                as="div"
                variant="text-title-small"
                emphasis={true}
                color="primary"
                aria-hidden="true"
              >
                {state().caption}
              </ds-text>
            ) : null}
          </div>
          {renderCaptionTrailing()}
        </div>
        <slot name="header-after" />
      </div>
    );
  }

  function renderCaptionTrailing() {
    if (!showsCaptionTrailing()) return null;
    return (
      <div class="ds-table__caption-trailing">
        {renderColumnCustomizerTrigger()}
        {showsColumnCustomizer() &&
        !state().hideColumnCustomizerTrigger &&
        showsDataModeSwitcher() ? (
          <ds-divider orientation="vertical" length="var(--dimension-size-400)" />
        ) : null}
        {renderDataModeSwitcherTrigger()}
        <slot name="caption-trailing" />
      </div>
    );
  }

  function renderDataModeSwitcherTrigger() {
    if (!showsDataModeSwitcher()) return null;
    if (state().chromeLoading) {
      return (
        <ds-skeleton
          variant="control"
          controlAppearance={state().captionControlsBorderless ? 'borderless' : 'outlined'}
          controlContent="icon"
          controlSize="md"
          width="var(--dimension-size-400)"
        />
      );
    }
    return (
      <span class="ds-table__caption-mode-switcher">
        <ds-tooltip label={state().dataModeSwitcherLabel} side="top" size="sm">
          <ds-button-unfilled
            hasBorder={!state().captionControlsBorderless}
            id={`${dataModeSwitcherElementId}-trigger`}
            variant="icon"
            size="md"
            icon="Ellipses"
            aria-label={state().dataModeSwitcherLabel}
            hasMenu={true}
            expanded={menus().dataModeSwitcherOpen}
            surfaceOpen={menus().dataModeSwitcherSurfaceOpen}
            controls={dataModeSwitcherElementId}
            activeFill={false}
            pressScale={false}
            onDsClick={(event: CustomEvent<MouseEvent>) => {
              toggleDataModeSwitcher(event.detail.detail === 0);
            }}
          />
        </ds-tooltip>
      </span>
    );
  }

  function renderDataModeSwitcherMenu() {
    if (!showsDataModeSwitcher() || state().chromeLoading) return null;
    return (
      <ds-menu
        id={dataModeSwitcherElementId}
        open={menus().dataModeSwitcherOpen}
        anchorId={`${dataModeSwitcherElementId}-trigger`}
        align="end"
        side="bottom"
        menuLabel={state().dataModeMenuLabel}
        initialFocusVisible={menus().dataModeSwitcherInitialFocusVisible}
        items={tableDataModeMenuItems(state().dataMode, {
          infinite: state().infiniteModeLabel,
          pagination: state().paginationModeLabel,
          virtual: state().virtualModeLabel,
        })}
        onDsClose={() => closeDataModeSwitcher()}
        onDsAfterClose={() => {
          if (!menus().dataModeSwitcherOpen) options.change({ dataModeSwitcherSurfaceOpen: false });
        }}
        onDsSelect={event => handleDataModeSwitcherSelect(event.detail)}
      />
    );
  }

  function toggleDataModeSwitcher(fromKeyboard = false): void {
    if (menus().dataModeSwitcherOpen) closeDataModeSwitcher();
    else openDataModeSwitcher(fromKeyboard);
  }

  function openDataModeSwitcher(fromKeyboard = false): void {
    if (!showsDataModeSwitcher() || state().chromeLoading || menus().dataModeSwitcherOpen) return;
    options.change({
      columnCustomizerOpen: false,
      dataModeSwitcherInitialFocusVisible: fromKeyboard,
      dataModeSwitcherOpen: true,
      dataModeSwitcherSurfaceOpen: true,
    });
  }

  function closeDataModeSwitcher(): void {
    options.change({ dataModeSwitcherOpen: false });
  }

  function handleDataModeSwitcherSelect(item: MenuItemData): void {
    const dataMode = tableDataModeFromMenuItem(item);
    if (!dataMode) return;
    closeDataModeSwitcher();
    if (dataMode !== state().dataMode) options.dataModeChange({ dataMode });
    tasks.frame(() => {
      options
        .host()
        .querySelector<HTMLElement & { setFocus?: () => void }>(
          `#${CSS.escape(`${dataModeSwitcherElementId}-trigger`)}`
        )
        ?.setFocus?.();
    });
  }

  function renderColumnCustomizerTrigger() {
    if (state().hideColumnCustomizerTrigger) return null;
    if (!showsColumnCustomizer()) return null;
    return (
      <div
        class={{
          'ds-table__caption-customizer': true,
          'ds-table__caption-customizer--loading': state().chromeLoading,
        }}
        aria-hidden={state().chromeLoading ? 'true' : undefined}
      >
        <ds-tooltip label={state().captionCompact ? 'Customize' : ''} side="top" size="sm">
          <ds-button-unfilled
            hasBorder={!state().captionControlsBorderless}
            id={`${columnCustomizerElementId}-trigger`}
            variant={state().captionCompact ? 'icon' : 'icon-label'}
            size="md"
            icon="Preferences"
            label="Customize"
            labelEmphasis={false}
            pressScale={false}
            aria-label="Customize table"
            haspopup="menu"
            expanded={menus().columnCustomizerOpen}
            surfaceOpen={menus().columnCustomizerSurfaceOpen}
            controls={columnCustomizerElementId}
            onDsClick={(event: CustomEvent<MouseEvent>) => {
              if (state().chromeLoading) return;
              toggleColumnCustomizer(event.detail.detail === 0);
            }}
          />
        </ds-tooltip>
        {state().chromeLoading ? (
          <ds-skeleton
            variant="control"
            controlAppearance={state().captionControlsBorderless ? 'borderless' : 'outlined'}
            controlContent={state().captionCompact ? 'icon' : 'icon-label'}
            controlSize="md"
            width="100%"
          />
        ) : null}
      </div>
    );
  }

  function renderColumnCustomizerMenu() {
    if (!showsColumnCustomizer() || state().chromeLoading) return null;
    return (
      <ds-menu
        id={columnCustomizerElementId}
        open={menus().columnCustomizerOpen}
        anchorId={`${columnCustomizerElementId}-trigger`}
        align="end"
        side="bottom"
        menuLabel="Customize table"
        initialFocusVisible={menus().columnCustomizerInitialFocusVisible}
        sections={[
          ...tableColumnCustomizerSections(
            state().columns,
            state().hiddenFieldIds,
            state().fieldOrder,
            state().pinnedFieldIds
          ),
          ...(state().customizeOptions.length
            ? [{ header: 'Options', items: state().customizeOptions }]
            : []),
        ]}
        onDsClose={() => closeColumnCustomizer()}
        onDsAfterClose={() => {
          if (!menus().columnCustomizerOpen) options.change({ columnCustomizerSurfaceOpen: false });
        }}
        onDsSelect={event => {
          if (state().customizeOptions.some(option => option.value === event.detail.value)) {
            options.customizeOptionChange(event.detail.value!);
          } else handleColumnCustomizerSelect(event.detail);
        }}
        onDsItemToggle={(event: CustomEvent<MenuItemToggleDetail>) =>
          handleColumnCustomizerAction(event.detail)
        }
        onDsReorder={event => handleColumnCustomizerReorder(event.detail)}
      />
    );
  }

  function toggleColumnCustomizer(fromKeyboard = false): void {
    if (menus().columnCustomizerOpen) closeColumnCustomizer();
    else openColumnCustomizer(fromKeyboard);
  }

  function openColumnCustomizer(fromKeyboard = false): void {
    if (!showsColumnCustomizer() || state().chromeLoading || menus().columnCustomizerOpen) return;
    options.change({
      dataModeSwitcherOpen: false,
      columnCustomizerInitialFocusVisible: fromKeyboard,
      columnCustomizerOpen: true,
      columnCustomizerSurfaceOpen: true,
    });
  }

  function closeColumnCustomizer(): void {
    options.change({ columnCustomizerOpen: false });
  }

  function emitColumnsConfigChange(
    hiddenFieldIds: string[],
    fieldOrder: string[],
    pinnedFieldIds: string[] = state().pinnedFieldIds
  ): void {
    options.fieldsChange(
      resolveTableFieldsConfiguration(state().columns, hiddenFieldIds, fieldOrder, pinnedFieldIds)
    );
  }

  function handleColumnCustomizerReorder(detail: MenuReorderDetail): void {
    const order = detail.items
      .filter(item => item.reorderable)
      .map(item => item.value)
      .filter((id): id is string => !!id);
    options.fieldsChange(
      reorderTableColumnPartition(
        state().columns,
        state().hiddenFieldIds,
        state().fieldOrder,
        state().pinnedFieldIds,
        order
      )
    );
  }

  function handleColumnCustomizerAction(detail: MenuItemToggleDetail): void {
    if (detail.action?.id === 'visibility') {
      handleColumnCustomizerSelect(detail.item);
      return;
    }
    if (detail.action?.id !== 'pin') return;
    const fieldId = detail.item.value;
    if (!fieldId) return;
    options.fieldsChange(
      toggleTableColumnPinned(
        state().columns,
        state().hiddenFieldIds,
        state().fieldOrder,
        state().pinnedFieldIds,
        fieldId
      )
    );
  }

  function handleColumnCustomizerSelect(item: MenuItemData): void {
    const fieldId = item.value;
    if (!fieldId || item.isInactive) return;
    emitColumnsConfigChange(
      toggleTableColumnHidden(state().columns, state().hiddenFieldIds, fieldId),
      state().fieldOrder
    );
  }
  return { disconnect, reconcile, renderMenus, renderBar };
}
