import { PopupLayout } from '../../PopupLayout';
import { PopupFooter } from '../../PopupFooter';
import { PopupContent } from '../../PopupContent';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, GridSetting } from '../../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../../CustomGridLoading';
import CustomNoRowsOverlay from '../../../CustomNoRowsOverlay';
import React, { useEffect, useRef, useState } from 'react';
import { useSampleStore } from '../../../../stores/useSampleStore';
import { useAgGridApi } from '../../../../hooks';
import { MisongJobInfoResponse, SampleRequestElementInfoFilter, SampleResponseElementInfo } from '../../../../generated';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../../libs';
import useFilters from '../../../../hooks/useFilters';
import { useSession } from 'next-auth/react';
import TunedGrid from '../../../grid/TunedGrid';

export const SampleElementDetPop = () => {
  const session = useSession();
  const today = session.data?.user.workYmd;
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();

  /** 컬럼 정의 */
  const OrderCols: ColDef<SampleResponseElementInfo>[] = [
    {
      field: 'workYmd',
      headerName: '샘플일자',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'returnYmd',
      headerName: '반납일자',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'period',
      headerName: '경과일',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'invenStatCd',
      headerName: '샘플상태',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ];
  /** 컬럼 설정  */
  const [columnDefs, setColumnDefs] = useState<ColDef[]>(OrderCols);
  const [sampleElements, setSampleElements] = useState<SampleResponseElementInfo[]>([]);

  const [modalType, closeModal, selectedSample] = useSampleStore((s) => [s.modalType, s.closeModal, s.selectedSample]);

  const DetailGridRef = useRef<AgGridReact>(null);

  const [filters, onChangeFilters] = useFilters<SampleRequestElementInfoFilter>({
    today: today,
    orderDetId: selectedSample?.orderDetId,
  });

  const { data: sampleElementInfo, isSuccess: isLoadingSuccess } = useQuery(
    ['/orderTran/sample/elementInfo'],
    () =>
      authApi.get('/orderTran/sample/elementInfo', {
        params: {
          ...filters,
        },
      }),
    {
      //enabled: false,
    },
  );

  useEffect(() => {
    if (sampleElementInfo) {
      const { resultCode, body, resultMessage } = sampleElementInfo.data;
      setSampleElements(body);
    }
  }, [sampleElementInfo]);
  return (
    <PopupLayout
      width={630}
      isEscClose={true}
      open={modalType.type === 'DETAIL'}
      title={'샘플 관련 상세정보'}
      onClose={() => {
        closeModal('DETAIL');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={() => closeModal('DETAIL')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        {isLoadingSuccess && (
          <div className="gridBox">
            <TunedGrid<SampleResponseElementInfo>
              className={'pop'}
              headerHeight={35}
              onGridReady={(e) => {
                e.api.sizeColumnsToFit();
              }}
              rowData={sampleElements.length ? JSON.parse(JSON.stringify(sampleElements)) : [{}]}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={{
                rowHeight: 24,
              }}
            />
          </div>
        )}
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};
