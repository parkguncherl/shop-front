/**
 * @file pages/oms/logs/components/treedata.tsx
 * @description 트리데이터 표시를 위한 공통 컴포넌트
 * @copyright 2024
 */

import React, { memo, useCallback, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ICellRendererParams } from 'ag-grid-community';
import UpcLogDetail from './upcLogDetail';

interface TreeDataProps {
  /**
   * ag-grid의 ref
   */
  gridRef: React.RefObject<AgGridReact>;
  /**
   * 확장된 행의 상태값
   */
  expandedRows: Set<any>;
  /**
   * 확장된 행의 상태를 변경하는 함수
   */
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<any>>>;
}

/**
 * 트리 데이터의 행 가시성을 업데이트하는 Hook
 * @param props - TreeDataProps 인터페이스의 속성들
 * @returns void
 */
export const useTreeDataVisibility = ({ gridRef, expandedRows }: TreeDataProps) => {
  // 행 표시/숨김을 위한 함수
  const updateRowVisibility = useCallback(() => {
    if (!gridRef.current?.api) return;

    const api = gridRef.current.api;
    api.forEachNode((node) => {
      if (!node.data?.no) return;

      const rowIndex = node.rowIndex;
      if (rowIndex === null) return;

      const prevRow = api.getDisplayedRowAtIndex(rowIndex - 1);
      const prevNo = prevRow?.data?.no;

      // 이전 행과 번호가 같고 확장되지 않은 경우 높이를 0으로 설정
      if (prevNo === node.data.no && !expandedRows.has(node.data.no.toString())) {
        node.setRowHeight(0);
      } else {
        node.setRowHeight(28); // 기본 행 높이
      }
    });

    api.onRowHeightChanged();
  }, [expandedRows, gridRef]);

  // expandedRows가 변경될 때마다 행 높이 업데이트
  useEffect(() => {
    updateRowVisibility();
  }, [expandedRows, updateRowVisibility]);

  // 초기 데이터 로드 시 행 높이 설정
  const initializeRowHeight = useCallback(
    (rows: any[]) => {
      if (!rows || !gridRef.current?.api) return;

      setTimeout(() => {
        const api = gridRef.current?.api;
        if (!api) return;

        api.forEachNode((node) => {
          if (!node.data?.no) return;

          const rowIndex = node.rowIndex;
          if (rowIndex === null) return;

          const prevRow = api.getDisplayedRowAtIndex(rowIndex - 1);
          const prevNo = prevRow?.data?.no;

          // 이전 행과 번호가 같으면 숨김
          if (prevNo === node.data.no) {
            node.setRowHeight(0);
          } else {
            node.setRowHeight(28);
          }
        });

        api.onRowHeightChanged();
      }, 0);
    },
    [gridRef],
  );

  return { updateRowVisibility, initializeRowHeight };
};

/**
 * 트리 데이터의 확장/축소 토글 핸들러
 * @param no - 토글할 행의 번호
 * @param setExpandedRows - 확장된 행의 상태를 변경하는 함수
 */
export const handleTreeToggle = (no: string, setExpandedRows: React.Dispatch<React.SetStateAction<Set<any>>>) => {
  setExpandedRows((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(no)) {
      newSet.delete(no);
    } else {
      newSet.clear();
      newSet.add(no);
    }
    return newSet;
  });
};

interface ExpandRendererProps extends ICellRendererParams {
  /**
   * 확장된 행들의 집합
   */
  expandedRows: Set<string>;
  /**
   * 행 토글 이벤트 핸들러
   */
  onToggle: (no: string) => void;
}

/**
 * 확장/축소 아이콘을 표시하는 렌더러 컴포넌트
 * @component
 */
export const ExpandRenderer = memo((props: ExpandRendererProps) => {
  const currentNo = props.data.no;
  const rowIndex = props.node.rowIndex;
  if (rowIndex === null) return currentNo;

  const prevRow = props.api.getDisplayedRowAtIndex(rowIndex - 1);
  const prevNo = prevRow?.data?.no;
  const nextRow = props.api.getDisplayedRowAtIndex(rowIndex + 1);
  const hasNext = nextRow?.data?.no === currentNo; // 다음 행이 같은 번호인지 확인

  // 다음 행이 같은 번호일 때만 확장/축소 아이콘 표시
  if (prevNo !== currentNo && hasNext) {
    const isExpanded = props.expandedRows.has(currentNo.toString());
    return (
      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => props.onToggle(currentNo.toString())}>
        <span>{isExpanded ? '▼' : '>'}</span>
      </div>
    );
  }
  return null;
});
ExpandRenderer.displayName = 'ExpandRenderer';
export default UpcLogDetail;
