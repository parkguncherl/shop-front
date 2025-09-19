/**
 * @file /oms/pastHistory/components/NumberofOthers.tsx
 * @description 기타 숫자표시 cellRenderer 컴퍼넌트
 * @copyright 2024
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ICellRendererParams } from 'ag-grid-community';

export interface ModalData {
  changedFields: string[];
  currentData: any;
  prevData: any;
}

interface NumberofOthersProps extends ICellRendererParams {
  setModalData: (data: ModalData) => void;
  setModalOpen: (open: boolean) => void;
}

/**
 * 기타 변경사항 수를 표시하는 셀 렌더러 컴포넌트
 */
const NumberofOthers = React.memo(({ data, node, api, setModalData, setModalOpen }: NumberofOthersProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const changeFieldMappings = {
    releaseYmd: '출시일자',
    seasonCd: '계절',
    compCntn: '혼용율',
    minAsnCnt: 'MOQ',
    prodAttrCd: '제작여부',
    funcCd: '복종1',
    funcDetCd: '복종2',
    skuCntn: '비고',
    extBarCode: '외부바코드',
    designNm: '디자이너명',
    yochug: '요척',
    sellerFaxNo: '팩스번호',
    sellerAddr: '주소',
    sellerAddrEtc: '주소기타',
    personTelNo: '담당자연락처',
    compNm: '사업자명',
    compNo: '사업자번호',
    etcScrCntn: '비고(화면)',
    etcChitCntn: '비고(전표)',
    etcAccCntn: '계좌(전표)',
    compEmail: '이메일',
    compPrnCd: '혼용률인쇄YN',
    remainYn: '잔액인쇄YN',
    etcCntn: '기타',
    compTelNo: '회사연락처',
    compAddr: '주소',
    personNm: '담당자',
    detailInfo: '상세정보',
  } as const;

  // 모든 데이터 계산 로직을 useMemo에서 처리
  const memoizedData = useMemo(() => {
    if (!data || node.rowIndex === null) {
      return {
        nextRow: null,
        changedFields: [],
        changeCount: 0,
        shouldRender: false,
      };
    }

    // 다음 행 가져오기
    const nextRow = api.getDisplayedRowAtIndex(node.rowIndex + 1);

    // 다음 행이 존재하고 같은 tempId를 가진 경우에만 비교
    const changedFields = Object.entries(changeFieldMappings)
      .filter(([field]) => nextRow?.data && data.tempId === nextRow.data.tempId && data[field] !== nextRow.data[field])
      .map(([field]) => field);

    return {
      nextRow: nextRow?.data || null,
      changedFields,
      changeCount: changedFields.length,
      shouldRender: true,
    };
  }, [api, data, node.rowIndex]);

  // memoizedData에서 필요한 값들을 구조분해할당
  const { nextRow, changedFields, changeCount, shouldRender } = memoizedData;

  const handleClick = useCallback(() => {
    if (changeCount > 0) {
      setModalData({
        changedFields,
        currentData: nextRow,
        prevData: data,
      });
      setModalOpen(true);
    }
  }, [changeCount, changedFields, data, nextRow, setModalData, setModalOpen]);

  if (!shouldRender) return null;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: changeCount > 0 ? 'pointer' : 'default',
        color: changeCount > 0 ? (isHovered ? 'red' : 'red') : 'inherit',
        fontWeight: isHovered ? 'bold' : 'normal',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s ease',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {changeCount > 0 ? `${changeCount}건` : ''}
    </div>
  );
});

// 컴포넌트 displayName 설정
NumberofOthers.displayName = 'NumberofOthers';

export default NumberofOthers;
