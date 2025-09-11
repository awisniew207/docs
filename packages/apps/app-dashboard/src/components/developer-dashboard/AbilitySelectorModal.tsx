import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/shared/ui/dialog';
import { Button } from '@/components/shared/ui/button';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  RowClickedEvent,
} from 'ag-grid-community';
import { Ability } from '@/types/developer-dashboard/appTypes';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Static column definitions
const TOOL_GRID_COLUMNS: ColDef[] = [
  {
    headerName: 'Ability Name',
    field: 'title',
    flex: 2,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center justify-between h-full">
          <div>
            <div className="font-medium">{params.value || params.data.packageName}</div>
          </div>
        </div>
      );
    },
  },
  {
    headerName: 'Package Name',
    field: 'packageName',
    flex: 2,
    minWidth: 180,
    suppressNavigable: true,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <span
            ref={(ref) => {
              if (!ref) return;

              ref.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const packageName = params.value;
                const version = params.data.activeVersion;
                const npmUrl = `https://www.npmjs.com/package/${packageName}/v/${version}`;
                window.open(npmUrl, '_blank');
              };
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline text-sm font-mono cursor-pointer"
            title={`View ${params.value} on npm`}
          >
            {params.value}
          </span>
        </div>
      );
    },
  },
  {
    headerName: 'Version',
    field: 'activeVersion',
    flex: 1,
    minWidth: 100,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <span>{params.value}</span>
        </div>
      );
    },
  },
  {
    headerName: 'Description',
    field: 'description',
    width: 600,
    minWidth: 400,
    maxWidth: 1000,
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <div className="flex items-center h-full">
          <div className="text-sm text-gray-600 dark:text-gray-300" title={params.value}>
            {params.value || 'No description available'}
          </div>
        </div>
      );
    },
  },
];

const DEFAULT_COL_DEF = {
  sortable: true,
  filter: true,
  resizable: true,
  suppressSizeToFit: false,
};

interface AbilitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAbilityAdd: (ability: Ability) => Promise<void>;
  existingAbilities: string[];
  availableAbilities: Ability[];
}

export function AbilitySelectorModal({
  isOpen,
  onClose,
  onAbilityAdd,
  existingAbilities,
  availableAbilities,
}: AbilitySelectorModalProps) {
  // Filter out already added abilities
  const filteredAbilities = availableAbilities.filter(
    (ability) => !existingAbilities.includes(ability.packageName),
  );

  const handleRowClick = async (event: RowClickedEvent) => {
    const ability = event.data;
    if (!ability) {
      return;
    }

    await onAbilityAdd(ability);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const getRowClass = () => {
    return 'cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[85vw] max-w-6xl h-[70vh] flex flex-col !max-w-none bg-white dark:bg-neutral-800"
        style={{ width: '85vw', maxWidth: '72rem' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-neutral-800 dark:text-white">
            Add Abilities to App Version
          </DialogTitle>
          <DialogDescription>
            Click any ability to add it immediately to your app version.
            {existingAbilities.length > 0 &&
              ` (${existingAbilities.length} abilities already added)`}
            {filteredAbilities.length < availableAbilities.length &&
              ` • Showing ${filteredAbilities.length} of ${availableAbilities.length} available abilities`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="ag-theme-alpine h-full w-full bg-white dark:bg-neutral-800 dark:[&_.ag-root-wrapper]:!bg-transparent dark:[&_.ag-header]:!bg-neutral-700 dark:[&_.ag-header-cell]:!bg-neutral-700 dark:[&_.ag-header-cell]:!text-white dark:[&_.ag-row]:!bg-neutral-800 dark:[&_.ag-cell]:!text-white dark:[&_.ag-row-hover]:!bg-neutral-700">
            <AgGridReact
              rowData={filteredAbilities}
              columnDefs={TOOL_GRID_COLUMNS}
              defaultColDef={DEFAULT_COL_DEF}
              onRowClicked={handleRowClick}
              getRowClass={getRowClass}
              rowHeight={50}
              suppressHorizontalScroll={false}
              alwaysShowHorizontalScroll={true}
              suppressScrollOnNewData={true}
              domLayout="normal"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-600 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
