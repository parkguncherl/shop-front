import React, { useEffect, useMemo, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { toastError } from '../../ToastMessage';
import { ProdSalesRankResponseDetOfProd, ProdSalesRankResponseDetOfSku } from '../../../generated';
import { Utils } from '../../../libs/utils';

interface Props {
  open: boolean;
  onClose?: () => void;
  selectedRowData?: any;
}

const ProdSalesRankDetPop = ({ open = false, onClose, selectedRowData }: Props) => {
  useEffect(() => {
    if (open && selectedRowData == undefined) {
      toastError('선택된 행의 데이터를 찾을 수 없음');
    }
  }, [open]);

  /** 컬럼 정의 */
  const ProdSalesRankDetPopCols = useMemo<ColDef[]>(
    () => [
      {
        field: 'rank',
        headerName: '순위',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        maxWidth: 230,
        minWidth: 230,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'realAmt',
        headerName: '실매출액',
        maxWidth: 120,
        minWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          if (params.value) {
            return Utils.setComma(params.value);
          } else {
            return null;
          }
        },
      },
      {
        field: 'realCnt',
        headerName: '실판매량',
        maxWidth: 80,
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          if (params.value) {
            return Utils.setComma(params.value);
          } else {
            return null;
          }
        },
      },
    ],
    [],
  );

  const [prodSalesRankDetList, setProdSalesRankDetList] = useState<ProdSalesRankResponseDetOfProd[]>([]);
  const [skuSalesRankDetList, setSkuSalesRankDetList] = useState<ProdSalesRankResponseDetOfSku[]>([]);

  const {
    data: prodSalesRankDet,
    isLoading: isProdSalesRankDetLoading,
    isSuccess: isProdSalesRankDetSuccess,
    refetch: fetchProdSalesRankDet,
  } = useQuery(
    ['/prodSalesRank/det/prod', selectedRowData?.prodId],
    () =>
      authApi.get('/prodSalesRank/det/prod', {
        params: {
          prodId: selectedRowData?.prodId,
        },
      }),
    {
      enabled: !!selectedRowData?.prodId,
    },
  );

  useEffect(() => {
    if (isProdSalesRankDetSuccess) {
      const { resultCode, body, resultMessage } = prodSalesRankDet.data;
      if (resultCode == 200) {
        setProdSalesRankDetList(body || []);
      } else {
        toastError('상품별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [prodSalesRankDet, isProdSalesRankDetSuccess]);

  const {
    data: skuSalesRankDet,
    isLoading: isSkuSalesRankDetLoading,
    isSuccess: isSkuSalesRankDetSuccess,
    refetch: fetchSkuSalesRankDet,
  } = useQuery(
    ['/prodSalesRank/det/sku', selectedRowData?.skuId],
    () =>
      authApi.get('/prodSalesRank/det/sku', {
        params: {
          skuId: selectedRowData?.skuId,
        },
      }),
    {
      enabled: !!selectedRowData?.skuId,
    },
  );

  useEffect(() => {
    if (isSkuSalesRankDetSuccess) {
      const { resultCode, body, resultMessage } = skuSalesRankDet.data;
      if (resultCode == 200) {
        setSkuSalesRankDetList(body || []);
      } else {
        toastError('스큐별 실매출 순위 조회 도중 문제가 발생하였습니다.');
        console.error(resultMessage);
      }
    }
  }, [skuSalesRankDet, isSkuSalesRankDetSuccess]);

  return (
    <PopupLayout
      width={630}
      open={open}
      title={selectedRowData ? (selectedRowData.prodNm ? selectedRowData?.prodNm : selectedRowData?.skuNm) + ' 상세보기' : '데이터를 찾을 수 없음'}
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
        <div className="tblBox">
          <table></table>
        </div>
        <div>
          <TunedGrid
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={selectedRowData ? (selectedRowData.prodId ? prodSalesRankDetList : skuSalesRankDetList) : []}
            columnDefs={ProdSalesRankDetPopCols}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
export default ProdSalesRankDetPop;
