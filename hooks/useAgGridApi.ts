import { AgColumn, GridApi, GridReadyEvent } from 'ag-grid-community';
import { useState } from 'react';

interface Props {
  autoSizeAllColumns?: boolean;
}

interface TUseAgGridApi {
  gridApi?: GridApi;
  gridColumnApi?: AgColumn;
  onGridReady: (params: GridReadyEvent) => void;
}

export const useAgGridApi = (props: Props | undefined = { autoSizeAllColumns: true }): TUseAgGridApi => {
  const [gridApi] = useState<GridApi>();
  const [gridColumnApi] = useState<AgColumn>();

  const onGridReady = (eventProps: GridReadyEvent) => {
    if (props?.autoSizeAllColumns) {
      eventProps.api.sizeColumnsToFit(); // 또는 다른 열 크기 조정 메서드 사용
      console.log(eventProps);
    }
  };

  return {
    gridApi,
    gridColumnApi,
    onGridReady,
  };
};
