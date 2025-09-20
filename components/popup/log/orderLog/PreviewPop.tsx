import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { PopupLayout, PopupFooter, PopupContent } from '../../../../components/popup';
import TunedGrid from '../../../../components/grid/TunedGrid';
import CustomGridLoading from '../../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../../components/CustomNoRowsOverlay';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../../libs/ag-grid';
import { OrderDet, OrderDetCreate, PastLogResponseSaleLogResponse, RetailAmtResponse } from '../../../../generated';
import useFilters from '../../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import { toastError } from '../../../ToastMessage';
import { useRetailStore } from '../../../../stores/useRetailStore';
import { Utils } from '../../../../libs/utils';
import { useCommonStore } from '../../../../stores';

interface PreviewPopProps {
  open: boolean;
  onClose: () => void;
  selectedRowData?: PastLogResponseSaleLogResponse | null;
  rowData?: PastLogResponseSaleLogResponse[];
}

/** 판매 로그의 미리보기 팝업 */
export const PreviewPop = ({ open = false, onClose, selectedRowData, rowData = [] }: PreviewPopProps) => {
  /** 소매처 전역 상태 */
  const [selectSomeRetailAmt] = useRetailStore((s) => [s.selectSomeRetailAmt]);

  /** 공통 스토어 - State */
  const [removeEmptyRows] = useCommonStore((s) => [s.removeEmptyRows]);

  const [befRowRetailAmt, setBefRetailAmt] = useState<RetailAmtResponse | undefined>(undefined);
  const [targetRowRetailAmt, setTargetRowRetailAmt] = useState<RetailAmtResponse | undefined>(undefined);

  // 그리드 참조 설정
  const leftGridRef = useRef(null);
  const rightGridRef = useRef(null);

  // 주문 로그 관련 상태들
  const [befOrderDetList, setBefOrderDetList] = useState<OrderDet[]>([]);
  const [targetOrderDetList, setTargetOrderDetList] = useState<OrderDet[]>([]);
  const [pinnedBottomLeftRowData, setPinnedBottomLeftRowData] = useState<OrderDet[]>([]); // 합계데이터 만들기
  const [pinnedBottomRightRowData, setPinnedBottomRightRowData] = useState<OrderDet[]>([]); // 합계데이터 만들기

  const [befRowData, setBefRowData] = useState<PastLogResponseSaleLogResponse | undefined>(undefined);
  const [boundedSaleLogList, setBoundedSaleLogList] = useState<PastLogResponseSaleLogResponse[]>([]);

  useEffect(() => {
    setBefRowData(
      rowData?.filter((data) => {
        // 같은 부모를 공유하는 자식 행(부모 행을 클릭하더라도 이전 행은 무조건 자식 행)들 중 클릭된 행의 rank + 1 의 rank 값에 대응하는 요소의 orderId 할당
        return (
          data.path?.length == 2 &&
          selectedRowData &&
          selectedRowData.path &&
          selectedRowData.path[0] == data.path[0] &&
          selectedRowData.rank &&
          selectedRowData.rank + 1 == data.rank
        );
      })[0],
    );
    setBoundedSaleLogList(
      rowData?.filter((data) => {
        // 같은 부모를 공유하는 자식 행들 및 그 부모 행을 state 로 설정함
        return selectedRowData && selectedRowData.path && data.path && selectedRowData.path[0] == data.path[0];
      }),
    );
  }, [rowData, selectedRowData]);

  // 샘플 데이터 - 왼쪽 그리드
  /*const leftGridData = [
    { skuNm: '상품A.멜란.FREE', baseAmt: 10000, jobCnt: 5, totAmt: 50000 },
    { skuNm: '상품B.멜란.FREE', baseAmt: 15000, jobCnt: 3, totAmt: 45000 },
    { skuNm: '상품C.멜란.FREE', baseAmt: 20000, jobCnt: 2, totAmt: 40000 },
  ];

  // 샘플 데이터 - 오른쪽 그리드
  const rightGridData = [
    { skuNm: '상품A.멜란.FREE', baseAmt: 10000, jobCnt: 5, totAmt: 50000 },
    { skuNm: '상품D.멜란.FREE', baseAmt: 25000, jobCnt: 1, totAmt: 25000 },
  ];*/

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    befRowOrderId: rowData?.filter((data) => {
      // 같은 부모를 공유하는 자식 행(부모 행을 클릭하더라도 이전 행은 무조건 자식 행)들 중 클릭된 행의 rank + 1 의 rank 값에 대응하는 요소의 orderId 할당
      return (
        data.path?.length == 2 &&
        selectedRowData &&
        selectedRowData.path &&
        selectedRowData.path[0] == data.path[0] &&
        selectedRowData.rank &&
        selectedRowData.rank + 1 == data.rank
      );
    })[0].orderId, // 클릭된 행의 이전 행의 orderId
    targetRowOrderId: selectedRowData?.orderId, // 클릭된 행의 orderId
  });

  // 그리드 컬럼 정의(좌)
  const leftColumnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'skuNm',
        headerName: '품명',
        minWidth: 130,
        maxWidth: 130,
        //cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => {
          const mockCellStyle = GridSetting.CellStyle.CENTER;
          // 스큐 삭제 여부 확인
          if (params.data.skuNm && targetOrderDetList.length > 0) {
            // 스큐명이 부재한 경우(하단 고정 행) 혹은 우측 행 목록의 길이가 0인 경우 스타일 적용 대상이 되지 않는다
            for (let i = 0; i < targetOrderDetList.length; i++) {
              // 우측 컬럼 목록을 사용하여 비교
              if (targetOrderDetList[i].skuNm == params.data.skuNm) {
                // 동일한 스큐 존재 -> 기존 스큐가 삭제되지 않음
                return mockCellStyle;
              }
            }
            return { ...mockCellStyle, backgroundColor: 'gray' }; // 동일한 스큐를 찾지 못할 경우 삭제된 것으로 간주
          }
        },
      },
      {
        field: 'baseAmt',
        headerName: '단가',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          // 금액 포맷팅 (천단위 구분자)
          return params.value?.toLocaleString() || '';
        },
      },
      {
        field: 'skuCnt',
        headerName: '수량',
        minWidth: 40,
        maxWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'totAmt',
        headerName: '금액',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          // 금액 포맷팅 (천단위 구분자)
          return params.value?.toLocaleString() || '';
        },
      },
    ],
    [targetOrderDetList],
  );

  // 그리드 컬럼 정의(우)
  const rightColumnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: 'skuNm',
        headerName: '품명',
        minWidth: 130,
        maxWidth: 130,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => {
          const mockCellStyle = GridSetting.CellStyle.CENTER;
          // 스큐 추가 여부 확인
          if (params.data.skuNm && befOrderDetList.length > 0) {
            // 스큐명이 부재한 경우(하단 고정 행) 혹은 좌측 행 목록의 길이가 0인 경우 스타일 적용 대상이 되지 않는다
            for (let i = 0; i < befOrderDetList.length; i++) {
              // 좌측 행 목록을 사용하여 비교
              if (befOrderDetList[i].skuNm == params.data.skuNm) {
                // 동일한 스큐 존재 -> 해당 스큐는 추가된 스큐가 아니다.
                return mockCellStyle;
              }
            }
            return { ...mockCellStyle, backgroundColor: 'orange' }; // 동일한 스큐를 찾지 못할 경우 추가된 것으로 간주
          }
        },
      },
      {
        field: 'baseAmt',
        headerName: '단가',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          // 금액 포맷팅 (천단위 구분자)
          return params.value?.toLocaleString() || '';
        },
        cellStyle: (params) => {
          const mockCellStyle = GridSetting.CellStyle.CENTER;
          // 단가 변동 여부 확인
          if (params.data.skuNm && befOrderDetList.length > 0) {
            // 스큐명이 부재한 경우(하단 고정 행) 혹은 좌측 행 목록의 길이가 0인 경우 스타일 적용 대상이 되지 않는다
            for (let i = 0; i < befOrderDetList.length; i++) {
              // 좌측 행 목록을 사용하여 비교
              if (befOrderDetList[i].skuNm == params.data.skuNm && befOrderDetList[i].baseAmt != params.data.baseAmt) {
                // 동일한 스큐가 존재하며 단가가 동일하지 않은 경우
                return { ...mockCellStyle, backgroundColor: 'blue' };
              }
            }
            return mockCellStyle; // 동일한 스큐를 찾지 못하였거나 단가가 동일한 경우 기본 스타일 반환
          }
        },
      },
      {
        field: 'skuCnt',
        headerName: '수량',
        minWidth: 40,
        maxWidth: 40,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => {
          const mockCellStyle = GridSetting.CellStyle.CENTER;
          // 단가 변동 여부 확인
          if (params.data.skuNm && befOrderDetList.length > 0) {
            // 스큐명이 부재한 경우(하단 고정 행) 혹은 좌측 행 목록의 길이가 0인 경우 스타일 적용 대상이 되지 않는다
            for (let i = 0; i < befOrderDetList.length; i++) {
              // 좌측 행 목록을 사용하여 비교
              if (befOrderDetList[i].skuNm == params.data.skuNm && befOrderDetList[i].skuCnt != params.data.skuCnt) {
                // 동일한 스큐가 존재하며 단가가 동일하지 않은 경우
                return { ...mockCellStyle, backgroundColor: 'pink' };
              }
            }
            return mockCellStyle; // 동일한 스큐를 찾지 못하였거나 단가가 동일한 경우 기본 스타일 반환
          }
        },
      },
      {
        field: 'totAmt',
        headerName: '금액',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          // 금액 포맷팅 (천단위 구분자)
          return params.value?.toLocaleString() || '';
        },
      },
    ],
    [befOrderDetList],
  );

  // 기본 컬럼 속성
  const defaultColDef = {
    sortable: true, // 정렬 가능
    resizable: true, // 크기 조절 가능
  };

  const totalThisOrderDetAmtCounter = useCallback(
    (orderDetList: OrderDetCreate[]) => {
      let totalThisOrderDetAmt = 0;
      for (let i = 0; i < removeEmptyRows(orderDetList).length; i++) {
        if (orderDetList[i].orderDetCd == '90' || orderDetList[i].orderDetCd == '99') {
          // 판매, 미송
          // 당잔에 카운트
          totalThisOrderDetAmt += Number(orderDetList[i].totAmt || 0);
        } else if (orderDetList[i].orderDetCd == '40') {
          // 반품
          // 당잔에 디스카운트
          totalThisOrderDetAmt -= Number(orderDetList[i].totAmt || 0);
        }
      }
      return totalThisOrderDetAmt;
    },
    [removeEmptyRows],
  );

  /**
   * 데이터 조회 API 호출
   * React Query를 사용하여 변경로그 데이터를 서버로부터 조회
   */
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/past/saleLog/preview', filters.befRowOrderId, filters.targetRowOrderId], () =>
    authApi.get('/past/saleLog/preview', {
      params: {
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        console.log(body);
        if (body.befSaleLogList.length > 0) {
          setBefOrderDetList(body.befSaleLogList);
          const { skuCntTotal, totAmtTotal } = body.befSaleLogList.reduce(
            (
              acc: {
                skuCntTotal: number;
                totAmtTotal: number;
              },
              data: OrderDet,
            ) => {
              return {
                skuCntTotal: acc.skuCntTotal + (data.skuCnt ? data.skuCnt : 0),
                totAmtTotal: acc.totAmtTotal + (data.totAmt ? data.totAmt : 0),
              };
            },
            {
              skuCntTotal: 0,
              totAmtTotal: 0,
            }, // 초기값 설정
          );
          setPinnedBottomLeftRowData([{ skuCnt: skuCntTotal, totAmt: totAmtTotal }]);
        }

        if (body.targetSaleLogList.length > 0) {
          setTargetOrderDetList(body.targetSaleLogList);
          const { skuCntTotal, totAmtTotal } = body.targetSaleLogList.reduce(
            (
              acc: {
                skuCntTotal: number;
                totAmtTotal: number;
              },
              data: OrderDet,
            ) => {
              return {
                skuCntTotal: acc.skuCntTotal + (data.skuCnt ? data.skuCnt : 0),
                totAmtTotal: acc.totAmtTotal + (data.totAmt ? data.totAmt : 0),
              };
            },
            {
              skuCntTotal: 0,
              totAmtTotal: 0,
            }, // 초기값 설정
          );
          setPinnedBottomRightRowData([{ skuCnt: skuCntTotal, totAmt: totAmtTotal }]);
        }
      } else {
        toastError('조회 도중 에러가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  useEffect(() => {
    if (befRowData) {
      // 선행하는 행의 소매처의 금전정보 조회
      selectSomeRetailAmt({ sellerId: befRowData.sellerId }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          console.log('befRows', body);
          setBefRetailAmt(body);
        } else {
          toastError('소매처별 금전정보 조회 도중 문제가 발생하였습니다.');
          console.error(resultMessage);
        }
      });
    }
  }, [selectSomeRetailAmt, befRowData]);

  useEffect(() => {
    if (selectedRowData) {
      // 클릭된 행의 소매처의 금전정보 조회
      selectSomeRetailAmt({ sellerId: selectedRowData.sellerId }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          console.log('lastRows', body);
          setTargetRowRetailAmt(body);
        } else {
          toastError('소매처별 금전정보 조회 도중 문제가 발생하였습니다.');
          console.error(resultMessage);
        }
      });
    }
  }, [selectSomeRetailAmt, selectedRowData]);

  return (
    <PopupLayout
      width={800}
      open={open}
      title="미리보기"
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="닫기"
              onClick={onClose} // setIsOpen(false) 대신 props의 onClose 사용
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="layoutBox">
          {/* 왼쪽 */}
          <div className="layout50">
            <div className="gridBox" style={{ height: '500px' }}>
              <div style={{ textAlign: 'left', marginTop: '10px' }}>
                {boundedSaleLogList.length - (befRowData?.rank || 0) == 0 ? '생성' : boundedSaleLogList.length - (befRowData?.rank || 0) + '번째 수정'}
              </div>
              <h3 style={{ textAlign: 'center' }}>{befRowData?.sellerNm || ''}</h3>
              <div style={{ textAlign: 'right' }}>
                {befRowData?.updYmd?.substring(0, 10)} {befRowData?.updHms?.substring(0, 8)}
              </div>
              <table>
                <colgroup>
                  <col width="60%" />
                  <col width="40%" />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ fontWeight: '500', textAlign: 'left' }}>{befRowData?.workYmd}</th>
                    <th style={{ textAlign: 'center', fontWeight: '500' }}>{befRowData?.orderCdNm}</th>
                  </tr>
                </thead>
              </table>
              <TunedGrid
                headerHeight={35}
                onGridReady={(e) => {
                  e.api.sizeColumnsToFit();
                }}
                rowData={befOrderDetList}
                columnDefs={leftColumnDefs}
                defaultColDef={defaultColDef}
                gridOptions={{ rowHeight: 24 }}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                ref={leftGridRef}
                pinnedBottomRowData={pinnedBottomLeftRowData}
              />
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: '500',
                  height: 70,
                }}
              >
                전 잔 : {Utils.setComma(befRowData?.befAmt || 0)}{' '}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: '500',
                  height: 70,
                }}
              >
                당일합계 : {Utils.setComma(befRowData?.payAmount || 0)}
              </div>
              {befRowData?.discountAmount && befRowData?.discountAmount != 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    height: 70,
                    backgroundColor: selectedRowData?.discountAmount == 0 ? 'gray' : '',
                  }}
                >
                  (할인금액) : {Utils.setComma(befRowData?.discountAmount || 0)}
                </div>
              ) : (
                <div style={{ height: 70 }}></div>
              )}
              {(befRowData?.cashDeposit || 0) + (befRowData?.accountDeposit || 0) != 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    height: 70,
                    backgroundColor: (selectedRowData?.cashDeposit || 0) + (selectedRowData?.accountDeposit || 0) == 0 ? 'gray' : '',
                  }}
                >
                  (입금금액) : {Utils.setComma((befRowData?.cashDeposit || 0) + (befRowData?.accountDeposit || 0))}
                </div>
              )}
              <div style={{ textAlign: 'center', fontWeight: '500', height: 70 }}>당 잔 : {Utils.setComma(totalThisOrderDetAmtCounter(befOrderDetList))}</div>
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="layout50">
            <div className="gridBox" style={{ height: '500px' }}>
              <div style={{ textAlign: 'left', marginTop: '10px' }}>
                {selectedRowData?.rank == 1 ? '최종' : boundedSaleLogList.length - (selectedRowData?.rank || 0) + '번째 수정'}
              </div>
              <h3 style={{ textAlign: 'center' }}>{selectedRowData?.sellerNm || ''}</h3>
              <div style={{ textAlign: 'right' }}>
                {selectedRowData?.updYmd?.substring(0, 10)} {selectedRowData?.updHms?.substring(0, 8)}
              </div>
              <table>
                <colgroup>
                  <col width="60%" />
                  <col width="40%" />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ fontWeight: '500', textAlign: 'left' }}>{selectedRowData?.workYmd}</th>
                    <th style={{ textAlign: 'center', fontWeight: '500' }}>{selectedRowData?.orderCdNm}</th>
                  </tr>
                </thead>
              </table>
              <TunedGrid
                headerHeight={35}
                onGridReady={(e) => {
                  e.api.sizeColumnsToFit();
                }}
                rowData={targetOrderDetList}
                columnDefs={rightColumnDefs}
                defaultColDef={defaultColDef}
                gridOptions={{ rowHeight: 24 }}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                getRowStyle={(params) => {
                  const leftData = targetOrderDetList.find((item) => item.skuNm === params.data.skuNm);
                  if (!leftData) {
                    return { backgroundColor: '#F5BCA9' }; // 신규 데이터 행
                  }
                  if (JSON.stringify(leftData) !== JSON.stringify(params.data)) {
                    return { backgroundColor: '#F2F5A9' }; // 수정된 데이터 행
                  }
                  return undefined; // null 대신 undefined 반환
                }}
                ref={rightGridRef}
                pinnedBottomRowData={pinnedBottomRightRowData}
              />
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: '500',
                  height: 70,
                }}
              >
                전 잔 : {Utils.setComma(selectedRowData?.befAmt || 0)}{' '}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontWeight: '500',
                  height: 70,
                }}
              >
                당일합계 : {Utils.setComma(selectedRowData?.payAmount || 0)}
              </div>
              {selectedRowData?.discountAmount && selectedRowData?.discountAmount != 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    height: 70,
                    backgroundColor: befRowData?.discountAmount != selectedRowData?.discountAmount ? 'blue' : '',
                  }}
                >
                  (할인금액) : {Utils.setComma(selectedRowData?.discountAmount || 0)}
                </div>
              ) : (
                <div style={{ height: 70 }}></div>
              )}
              {(selectedRowData?.cashDeposit || 0) + (selectedRowData?.accountDeposit || 0) != 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    fontWeight: '500',
                    height: 70,
                    backgroundColor:
                      (befRowData?.cashDeposit || 0) + (befRowData?.accountDeposit || 0) !=
                      (selectedRowData?.cashDeposit || 0) + (selectedRowData?.accountDeposit || 0)
                        ? 'aqua'
                        : '',
                  }}
                >
                  (입금금액) : {Utils.setComma((selectedRowData?.cashDeposit || 0) + (selectedRowData?.accountDeposit || 0))}
                </div>
              ) : (
                <div style={{ height: 70 }}></div>
              )}
              <div style={{ textAlign: 'center', fontWeight: '500', height: 70 }}>
                당 잔 : {Utils.setComma(totalThisOrderDetAmtCounter(targetOrderDetList))}
              </div>
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default PreviewPop;
