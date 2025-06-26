import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
  CellClickedEvent,
} from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Static column definitions
const TOOL_GRID_COLUMNS: ColDef[] = [
  {
    headerName: 'Tool Name',
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
      const handlePackageClick = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        const packageName = params.value;
        const version = params.data.activeVersion;
        const npmUrl = `https://www.npmjs.com/package/${packageName}/v/${version}`;
        window.open(npmUrl, '_blank');
      };

      return (
        <div className="flex items-center h-full" onClick={handlePackageClick}>
          <span
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-mono cursor-pointer"
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
          <div className="text-sm text-gray-600" title={params.value}>
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

interface ToolSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToolAdd: (tool: any) => Promise<void>;
  existingTools: string[];
  availableTools: any[];
}

export function ToolSelectorModal({
  isOpen,
  onClose,
  onToolAdd,
  existingTools,
  availableTools,
}: ToolSelectorModalProps) {
  // Filter out already added tools
  const filteredTools = availableTools.filter((tool) => !existingTools.includes(tool.packageName));

  const handleCellClick = async (event: CellClickedEvent) => {
    const tool = event.data;
    if (!tool) {
      return;
    }

    // Don't add tool if user clicked on the package name column
    if (event.column?.getColId() === 'packageName') {
      return;
    }

    try {
      await onToolAdd(tool);
    } catch (error) {
      console.error('Failed to add tool:', error);
    }
  };

  const getRowClass = () => {
    return 'cursor-pointer hover:bg-gray-50';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Tools to App Version</DialogTitle>
          <DialogDescription>
            Click any tool to add it immediately to your app version.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <div className="ag-theme-alpine h-full w-full">
            <AgGridReact
              rowData={filteredTools}
              columnDefs={TOOL_GRID_COLUMNS}
              defaultColDef={DEFAULT_COL_DEF}
              onCellClicked={handleCellClick}
              getRowClass={getRowClass}
              suppressRowClickSelection={true}
              rowHeight={50}
              suppressHorizontalScroll={false}
              alwaysShowHorizontalScroll={true}
              suppressScrollOnNewData={true}
              domLayout="normal"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
