/**
 * @file CompareValueRenderer.tsx
 * @description AG-Grid 셀 값 비교 렌더러 컴포넌트
 */

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Utils } from '../../../../libs/utils';

interface GridData {
  tempId: string | number;
  [key: string]: any;
}

export const CompareValueRenderer: React.FC<ICellRendererParams<GridData>> = (props) => {
  const rowIndex = props.node.rowIndex;

  // 기본 체크
  if (rowIndex === null || rowIndex === undefined || !props.data || !props.column) {
    return <div>{props.value}</div>;
  }

  // 현재 컬럼 ID
  const columnId = props.column.getColId();

  // 다음 행 가져오기
  const nextRow = rowIndex < props.api.getDisplayedRowCount() - 1 ? props.api.getDisplayedRowAtIndex(rowIndex + 1) : null;

  // 같은 TEMP_ID 그룹인지 확인
  const isSameGroup = nextRow && props.data.tempId === nextRow?.data?.tempId;

  // 다음 행의 값 가져오기
  const nextValue = isSameGroup ? nextRow?.data?.[columnId] : null;

  // 다음 값이 없으면 '-' 표시, 아니면 실제 값을 사용
  const displayNextValue = nextValue ? nextValue : '-';

  //const nowValue = props.value ? props.value : '-';
  const nowValue = props.value ? (isNaN(Number(props.value)) ? props.value : Utils.setComma(props.value)) : '-';

  // 다음 값과 비교하여 변경 여부 확인
  const isChanged = isSameGroup && nowValue !== displayNextValue;

  const isNumber = Utils.isNumber(props.value);

  // **현재 행 값 렌더링**
  return (
    <div
      style={{
        display: 'flex',
        color: isChanged ? 'red' : 'inherit',
        justifyContent: isNumber ? 'flex-end' : 'flex-start',
      }}
    >
      {/* 현재 값이 변경되었고, 다음 값이 없으면 '-'를 표시 */}
      {isChanged ? (nowValue == '-' ? '(삭제)' : nowValue) : nowValue}
    </div>
  );
};

export default CompareValueRenderer;
