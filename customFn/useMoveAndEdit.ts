import { RefObject } from 'react';
import { AgGridReact } from 'ag-grid-react';

export function useMoveAndEdit(gridRef: RefObject<AgGridReact<any>>) {
  /**
   * 지정된 셀로 포커스 이동 후, 편집 모드 진입 (IME 한글 입력 안정화 지원)
   * @param rowIndex 이동할 행 인덱스
   * @param colKey 이동할 컬럼 필드명
   * @param delayMillis 포커스 이동 지연 시간 (기본값: 0)
   * @param isDisplay 행추가시 보이지 않는경우 대비
   * @param isNotEditing 바로 에디팅 모드로 갈건지
   */
  const moveAndEdit = (rowIndex: number, colKey: string, delayMillis = 0, isDisplay: boolean, isNotEditing: boolean) => {
    const api = gridRef.current?.api;
    if (api && colKey && rowIndex != null && rowIndex > -1) {
      setTimeout(() => {
        if (isDisplay) {
          api.ensureIndexVisible(rowIndex);
        }
        api.setFocusedCell(rowIndex, colKey);
        if (!isNotEditing) {
          const enableRowCount = api.getDisplayedRowCount();
          if (rowIndex >= 0 && rowIndex < enableRowCount) {
            const rowNode = api.getDisplayedRowAtIndex(rowIndex);
            if (rowNode) {
              api.clearCellSelection();
              setTimeout(() => {
                api.startEditingCell({ rowIndex, colKey });
              }, delayMillis + 10);
            }
          }
        }
      }, delayMillis);
    }
  };

  return { moveAndEdit };
}
