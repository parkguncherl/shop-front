/**
 * @file CompareIsSame.tsx
 * @description AG-Grid 셀 값 비교 렌더러 컴포넌트
 */

import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';
import { Utils } from '../../../../libs/utils';

interface GridData {
  tempId: string | number;
  [key: string]: any;
}

export const CompareIsSame: React.FC<ICellRendererParams<GridData>> = (props) => {
  const rowIndex = props.node.rowIndex;

  // 기본 체크
  if (rowIndex === null || rowIndex === undefined || !props.data || !props.column) {
    return <div>{props.value}</div>;
  }

  // 현재 컬럼 ID
  const columnId = props.column.getColId();

  // 다음 행 가져오기
  const prevRow = rowIndex > 0 ? props.api.getDisplayedRowAtIndex(rowIndex - 1) : null;
  // 같은 TEMP_ID 그룹인지 확인
  const isSameGroup = prevRow && props.data.tempId === prevRow?.data?.tempId;
  const prevValue = isSameGroup ? prevRow?.data?.[columnId] : null;
  const nowValue = props.value ? (isNaN(Number(props.value)) ? props.value : Utils.setComma(props.value)) : '-';
  const isNotChange = isSameGroup && prevValue == props.value;

  // **현재 행 값 렌더링**
  return <div>{isNotChange ? '' : nowValue}</div>;
};

export default CompareIsSame;
