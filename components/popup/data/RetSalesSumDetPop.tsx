import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { toastError } from '../../ToastMessage';
import { RetailSalesSummaryResponse } from '../../../generated';
import { Utils } from '../../../libs/utils';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { useRetSalesSumStore } from '../../../stores/useRetSalesSumStore';

interface Props {
  onClose?: () => void;
  sellerId: number;
  sellerNm: string;
  searchType: string;
  startDate: string;
  endDate: string;
  prodAttrCd: string;
}

const RetSalesSumDetPop = ({ onClose, sellerId, startDate, endDate, prodAttrCd, searchType, sellerNm }: Props) => {
  console.log('sellerId ==>', sellerId);

  const [reqSellerId, setReqSellerId] = useState(sellerId);
  const [modalType, openModal] = useRetSalesSumStore((s) => [s.modalType, s.openModal]);
  const [retailSalesSummaryDetList, setRetailSalesSummaryDetList] = useState<RetailSalesSummaryResponse[]>([]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any>([]); // 합계데이터 만들기
  /** 컬럼 정의 */
  const columnDefs = useMemo<ColDef<RetailSalesSummaryResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No',
        maxWidth: 40,
        minWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'workYmd',
        headerName: '영업일',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '사업자명',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubun1',
        headerName: '구분1',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubun2',
        headerName: '구분2',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: `returnAmt`,
        headerName: '미수금',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `chitCnt`,
        headerName: '전표건수',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totSkuCnt`,
        headerName: '판매량',
        minWidth: 55,
        maxWidth: 55,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totBackCnt`,
        headerName: '반품량',
        minWidth: 45,
        maxWidth: 45,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `backRate`,
        headerName: '반품율',
        minWidth: 45,
        maxWidth: 45,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: `totOrderAmt`,
        headerName: '판매금액',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totBackAmt`,
        headerName: '반품금액',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totDcAmt`,
        headerName: '단가DC',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totDiscountAmt`,
        headerName: '할인금액',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totIncomAmt`,
        headerName: '실매출금액',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totCashAmt`,
        headerName: '현금입금',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totAccountAmt`,
        headerName: '통장입금',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `nowAmt`,
        headerName: '당기잔액',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totVatAmt`,
        headerName: '부가세',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `logisAmt`,
        headerName: '물류비',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  const { data: detList, isSuccess: isDetSuccess } = useQuery(
    ['/omsData/retailSummaryDetList' + reqSellerId],
    () =>
      authApi.get('/omsData/retailSummaryDetList', {
        params: {
          searchType: searchType,
          sellerId: reqSellerId,
          prodAttrCd: prodAttrCd,
          startDate: startDate,
          endDate: endDate,
        },
      }),
    {
      enabled: !!reqSellerId,
    },
  );

  useEffect(() => {
    if (isDetSuccess) {
      const { resultCode, body, resultMessage } = detList.data;
      if (resultCode == 200) {
        setRetailSalesSummaryDetList(body || []);
        const summary = body.reduce(
          (
            acc: {
              returnAmt: number;
              chitCnt: number;
              totSkuCnt: number;
              totOrderAmt: number;
              totBackAmt: number;
              totBackCnt: number;
              totDcAmt: number;
              totIncomAmt: number;
              totCashAmt: number;
              totAccountAmt: number;
              nowAmt: number;
              totVatAmt: number;
              logisAmt: number;
            },
            data: RetailSalesSummaryResponse,
          ) => {
            //console.log('data==>', data);
            return {
              // 청구합계
              returnAmt: acc.returnAmt + (data.returnAmt ?? 0),
              chitCnt: acc.chitCnt + (data.chitCnt ?? 0),
              totSkuCnt: acc.totSkuCnt + (data.totSkuCnt ?? 0),
              totOrderAmt: acc.totOrderAmt + (data.totOrderAmt ?? 0),
              totBackAmt: acc.totBackAmt + (data.totBackAmt ?? 0),
              totBackCnt: acc.totBackCnt + (data.totBackCnt ?? 0),
              totDcAmt: acc.totDcAmt + (data.totDcAmt ?? 0),
              totIncomAmt: acc.totIncomAmt + (data.totIncomAmt ?? 0),
              totCashAmt: acc.totCashAmt + (data.totCashAmt ?? 0),
              totAccountAmt: acc.totAccountAmt + (data.totAccountAmt ?? 0),
              nowAmt: acc.nowAmt + (data.nowAmt ?? 0),
              totVatAmt: acc.totVatAmt + (data.totVatAmt ?? 0),
              logisAmt: acc.logisAmt + (data.logisAmt ?? 0),
            };
          },
          {
            returnAmt: 0,
            chitCnt: 0,
            totSkuCnt: 0,
            totOrderAmt: 0,
            totBackAmt: 0,
            totBackCnt: 0,
            totDcAmt: 0,
            totIncomAmt: 0,
            totCashAmt: 0,
            totAccountAmt: 0,
            nowAmt: 0,
            totVatAmt: 0,
            logisAmt: 0,
          }, // 초기값 설정
        );
        setPinnedBottomRowData([summary]); // 👈 합산 결과 객체 바로 전달
      } else {
        toastError('상품별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [isDetSuccess]);

  useEffect(() => {
    setReqSellerId(sellerId);
  }, [sellerId]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <PopupLayout
      isEscClose={false}
      width={1500}
      open={modalType.type === 'DETAIL'}
      title={sellerNm + ' 상세보기'}
      onClose={() => {
        if (onClose) {
          onClose();
        }
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                if (onClose) {
                  onClose();
                }
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div>
          <TunedGrid<RetailSalesSummaryResponse>
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={retailSalesSummaryDetList || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pinnedBottomRowData={pinnedBottomRowData}
            getRowClass={getRowClass}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
export default RetSalesSumDetPop;
