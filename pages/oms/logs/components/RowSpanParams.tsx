/**
 * @file RowSpanParams.tsx
 * @description AG-Grid 행 병합 유틸리티 함수
 * @copyright 2024
 */

import { RowSpanParams } from 'ag-grid-community';

interface GridRow {
  no: number;
  displayValue?: string;
  [key: string]: any;
}

/**
 * AG-Grid의 No 컬럼에 대한 행 병합을 계산하는 유틸리티 함수
 * 연속된 동일한 번호를 가진 행들을 병합함
 *
 * @param params - AG-Grid RowSpan 파라미터
 * @returns number - 병합할 행의 수 (0은 병합되어 숨겨질 행)
 *
 * @example
 * // columnDefs에서 사용 예시
 * {
 *   field: 'no',
 *   rowSpan: getNoRowSpan
 * }
 */
export const getNoRowSpan = (params: RowSpanParams<GridRow, any>): number => {
  // 기본 유효성 검사
  const rowIndex = params.node?.rowIndex ?? null;
  if (!params.data || !params.node || rowIndex === null) {
    console.warn('Invalid row span parameters');
    return 1;
  }

  const currentNo = params.data.no;
  if (!currentNo) {
    console.warn('No number value found for row span calculation');
    return 1;
  }

  try {
    // 그룹의 첫 번째 행인지 확인
    if (rowIndex > 0) {
      const prevRow = params.api.getDisplayedRowAtIndex(rowIndex - 1);
      if (prevRow?.data?.no === currentNo) {
        // 병합될 행의 데이터를 빈 값으로 설정
        params.data.displayValue = '';
        return 0; // 이전 행과 같은 번호면 숨김
      }
    }

    // 같은 번호를 가진 연속된 행 수 계산
    let count = 1;
    const totalRows = params.api.getModel().getRowCount();

    for (let i = rowIndex + 1; i < totalRows; i++) {
      const nextRow = params.api.getDisplayedRowAtIndex(i);
      if (!nextRow?.data?.no || nextRow.data.no !== currentNo) {
        break;
      }
      count++;
    }

    return count;
  } catch (error) {
    // 에러 발생 시 안전하게 처리
    console.error('Row span calculation error:', error);
    return 1;
  }
};

/**
 * 특정 필드에 대한 행 병합을 계산하는 일반화된 유틸리티 함수
 *
 * @param params - AG-Grid RowSpan 파라미터
 * @param field - 병합 기준이 되는 필드명
 * @returns number - 병합할 행의 수
 *
 * @example
 * // 다른 필드에 대한 행 병합 시 사용
 * {
 *   field: 'someField',
 *   rowSpan: (params) => getFieldRowSpan(params, 'someField')
 * }
 */
export const getFieldRowSpan = (params: RowSpanParams<GridRow, any>, field: string): number => {
  const rowIndex = params.node?.rowIndex ?? null;
  if (!params.data || !params.node || rowIndex === null) {
    return 1;
  }

  const currentValue = params.data[field];
  if (currentValue === undefined || currentValue === null) {
    return 1;
  }

  try {
    // 이전 행과 같은 값인지 확인
    if (rowIndex > 0) {
      const prevRow = params.api.getDisplayedRowAtIndex(rowIndex - 1);
      if (prevRow?.data?.[field] === currentValue) {
        return 0; // 이전 행과 같은 값이면 숨김
      }
    }

    // 같은 값을 가진 연속된 행 수 계산
    let count = 1;
    const totalRows = params.api.getModel().getRowCount();

    for (let i = rowIndex + 1; i < totalRows; i++) {
      const nextRow = params.api.getDisplayedRowAtIndex(i);
      if (!nextRow?.data?.[field] || nextRow.data[field] !== currentValue) {
        break;
      }
      count++;
    }

    return count;
  } catch (error) {
    console.error(`Row span calculation error for field ${field}:`, error);
    return 1;
  }
};

// 유틸리티 타입들
export type RowSpanFunction = (params: RowSpanParams<GridRow, any>) => number;
export type FieldRowSpanFunction = (params: RowSpanParams<GridRow, any>, field: string) => number;

// React 컴포넌트 default export 추가
const RowSpanParams: React.FC = () => {
  return null;
};

export default RowSpanParams;
