import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useProdSalesSumStore } from '../../../stores/useProdSalesSumStore';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Table } from '../../content';
import { ProductResponseSalesSumDetList, ProductResponseSalesSumList } from '../../../generated';
import { Utils } from '../../../libs/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  titleNm: string;
  detData?: ProductResponseSalesSumList;
}
const ProdSalesSumDet = ({ ...props }: Props) => {
  /** 출고 관련 전역 상태 */
  const [modalType, closeModal] = useProdSalesSumStore((s) => [s.modalType, s.closeModal, s.openModal]);
  const [titleCntn, setTitleCntn] = useState<string | null | undefined>(null);

  /** 컬럼 정의 */
  const DetPopCols = useMemo<ColDef<ProductResponseSalesSumDetList>[]>(
    () => [
      {
        field: 'no',
        headerName: '#',
        minWidth: 40,
        maxWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'workYmd',
        headerName: '일자',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품명',
        maxWidth: 180,
        minWidth: 150,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        maxWidth: 100,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubunCntn',
        headerName: '구분',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'baseAmt',
        headerName: '거래단가',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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
        field: 'dcAmt',
        headerName: '할인금액',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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
        field: 'sellCnt',
        headerName: '판매량',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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
        field: 'rtnCnt',
        headerName: '반품량',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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
        field: 'sellAmt',
        headerName: '판매금액',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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
        field: 'rtnAmt',
        headerName: '반품금액',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
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

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const { data: salesSumList } = useQuery(['/product/productSailSumDet/list'], (): any =>
    authApi.get('/product/productSailSumDet/list', {
      params: {
        startDate: props.startDate,
        endDate: props.endDate,
        prodId: props.detData?.prodId,
        skuColor: props.detData?.skuColor,
        skuSize: props.detData?.skuSize,
      },
    }),
  );

  useEffect(() => {
    setTitleCntn(
      props.detData?.prodNm || 'None' + props.detData?.skuColor ? props.detData?.skuColor : '' + props.detData?.skuSize ? props.detData?.skuSize : '',
    );
  }, []);

  return (
    <PopupLayout
      width={1000}
      open={modalType.type === 'DET' && modalType.active}
      title={props.titleNm}
      onClose={() => {
        closeModal('DET');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('DET')}>
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
        <Table>
          <TunedGrid<ProductResponseSalesSumDetList>
            rowData={salesSumList?.data.body || []}
            columnDefs={DetPopCols}
            defaultColDef={defaultColDef}
            ref={RefForGrid}
            className={'pop'}
          />
        </Table>
      </PopupContent>
    </PopupLayout>
  );
};
export default ProdSalesSumDet;
