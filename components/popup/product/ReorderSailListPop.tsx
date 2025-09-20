import React, { useCallback, useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { MisongResponseGroupBySku, ProductResponseSailInfoList } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError } from '../../ToastMessage';
import { Utils } from '../../../libs/utils';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { useProductTranDataStore } from '../../../stores/useProductTranDataStore';

interface ReorderSailListPopProps {
  startDate: string;
  endDate: string;
  skuId: number;
  skuNm: string;
}

const ReorderSailListPop: React.FC<ReorderSailListPopProps> = ({ skuId, skuNm, startDate, endDate }) => {
  const [modalType, openModal, closeModal] = useProductTranDataStore((s) => [s.modalType, s.openModal, s.closeModal]);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  /** 컬럼 정의 */
  const SkuListColsForPop: ColDef<ProductResponseSailInfoList>[] = [
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      maxWidth: 50,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      width: 200,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.LEFT,
    },
    {
      field: 'dcYn',
      headerName: '단가DC',
      minWidth: 60,
      maxWidth: 60,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'reorderCnt',
      headerName: '리오더',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: {
        textAlign: 'right',
        paddingRight: '8px', // 원하는 만큼 조절
      },
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'skuCnt',
      headerName: '판매량',
      minWidth: 80,
      maxWidth: 80,
      suppressHeaderMenuButton: true,
      cellStyle: {
        textAlign: 'right',
        paddingRight: '8px', // 원하는 만큼 조절
      },
      valueFormatter: (params) => {
        return Utils.setComma(params.value);
      },
    },
  ];

  /** 조건에 해당하는 상품 데이터(row) 조회 */
  const {
    data: skuDataList,
    isSuccess,
    refetch: fetchSkuList,
  } = useQuery(['/product/productTranData/skuReorder'], (): any =>
    authApi.get('/product/productTranData/skuReorder', {
      params: {
        startDate: startDate,
        endDate: endDate,
        skuId: skuId,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess) {
      console.log('skuDataList ===>', skuDataList);
      const { resultCode, body, resultMessage } = skuDataList.data;
      if (resultCode === 200) {
        console.log('resultCode ===>', resultCode);

        // 합계 데이터 시작
        if (body && body.length > 0) {
          const { totalCnt } = body.reduce(
            (
              acc: {
                totalCnt: number;
              },
              data: ProductResponseSailInfoList,
            ) => {
              return {
                totalCnt: acc.totalCnt + (data.skuCnt ? data.skuCnt : 0),
              };
            },
            {
              totalCnt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              skuCnt: totalCnt,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, skuDataList]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <PopupLayout
      width={600}
      height={600}
      open={modalType.type === 'REORDER' && modalType.active}
      title={skuNm}
      onClose={() => {
        closeModal('REORDER');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('REORDER')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <TunedGrid<MisongResponseGroupBySku>
          colIndexForSuppressKeyEvent={2}
          headerHeight={35}
          rowData={(skuDataList?.data.body as ProductResponseSailInfoList[]) || []}
          columnDefs={SkuListColsForPop}
          defaultColDef={defaultColDef}
          gridOptions={{
            rowHeight: 24,
          }}
          className={'pop'}
          getRowClass={getRowClass}
          pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
        />
      </PopupContent>
    </PopupLayout>
  );
};

export default ReorderSailListPop;
