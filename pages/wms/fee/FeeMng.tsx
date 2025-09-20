import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { useSession } from 'next-auth/react';
import { PartnerFeeResponse } from '../../../generated';
import useFilters from '../../../hooks/useFilters';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { CellDoubleClickedEvent, ColDef } from 'ag-grid-community';
import { authApi } from '../../../libs';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { ReactSelectorInterface, TunedReactSelector } from '../../../components/TunedReactSelector';
import CustomGridLoading from '../../../components/CustomGridLoading';
import { useFeeStore } from '../../../stores/wms/useFeeStore';
import { FeeAddPop } from '../../../components/popup/wms/fee/FeeAddPop';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const FeeMng: React.FC = () => {
  // 세션 정보
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  // 메뉴 정보
  const { upMenuNm, menuNm, partnerOptions, fetchPartnerOptions } = useCommonStore();
  const [openModal, modalType] = useFeeStore((s) => [s.openModal, s.modalType]);
  const [feeData, setFeeData] = useState<PartnerFeeResponse[]>([]);
  const gridRef = useRef<AgGridReact>(null);
  const reactSelectRef = useRef<ReactSelectorInterface>(null);
  const [selectedFeeData, setSelectedFeeData] = useState<PartnerFeeResponse>();
  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    partnerId: undefined,
    histYn: 'N',
  });

  useEffect(() => {
    fetchPartnerOptions(workLogisId, '전체');
  }, []);

  const gridColumns = useMemo<ColDef<PartnerFeeResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'feeTypeNm',
        headerName: '유형',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockFee',
        headerName: '입고비',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'jobFee',
        headerName: '출고비',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'maintFee',
        headerName: '보관비',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'hangerFee',
        headerName: '행거보관비',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'serviceFee',
        headerName: '서비스요율',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        cellRenderer: 'PERCENTAGE',
      },
      {
        field: 'orderFee',
        headerName: '제작요율',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        cellRenderer: 'PERCENTAGE',
      },
      {
        field: 'startDayFormated',
        headerName: '시작일자',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'createDayFormated',
        headerName: '등록일자',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  // 검색 기능
  const search = async () => {
    // 검색 시 페이지 1로 초기화
    refetch().then(() => console.log('search refetchInvenSku ==='));
  };

  // 초기화 기능
  const reset = async () => {
    onFiltersReset();
    // 파트너 선택 상태도 초기화
  };

  // 출고정보 목록 조회
  const {
    data: feeList,
    isSuccess,
    refetch,
    isLoading: isPageLoading,
  } = useQuery({
    queryKey: ['/wms/fee/partnerFeeList', filters],
    queryFn: () => authApi.get('/wms/fee/partnerFeeList', { params: filters }),
    enabled: true,
  });

  // 결과 처리
  useEffect(() => {
    if (!isSuccess || !feeList?.data) return;

    const { resultCode, body, resultMessage } = feeList.data;
    if (resultCode === 200) {
      setFeeData(body || []);
    } else {
      setFeeData([]);
      toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
    }
  }, [isSuccess, feeList]);

  const onCellClicked = async (cellClickedEvent: CellDoubleClickedEvent) => {
    console.log('cellClickedEvent ==>', cellClickedEvent);
    setSelectedFeeData(cellClickedEvent.data);
    openModal('MOD_FEE');
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />

      <Search className="type_2">
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={(option) => {
            if (option.value) {
              onChangeFilters('partnerId', option.value.toString());
            } else {
              onChangeFilters('partnerId', 0);
            }
          }}
          options={partnerOptions}
          placeholder="고객사 선택"
          ref={reactSelectRef}
        />
        <Search.Switch
          title={'검색조건'}
          name={'histYn'}
          checkedLabel={'이력'}
          uncheckedLabel={'작업'}
          onChange={(e, value) => {
            onChangeFilters('histYn', value ? 'Y' : 'N');
            setTimeout(() => {
              search();
            }, 500);
          }}
          filters={filters}
        />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={feeData.length || 0} search={search}></TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<PartnerFeeResponse>
              ref={gridRef}
              rowData={feeData}
              columnDefs={gridColumns}
              defaultColDef={defaultColDef}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              loadingOverlayComponent={CustomGridLoading}
              rowSelection={'single'}
              className={'wmsDashboard check'}
              suppressRowClickSelection={false}
              loading={isPageLoading}
              onCellDoubleClicked={onCellClicked}
            />
            <div className="btnArea">
              {' '}
              <CustomShortcutButton
                onClick={() => {
                  const selectedNodes: PartnerFeeResponse[] | undefined = gridRef.current?.api
                    .getSelectedNodes()
                    ?.map((node, index) => ({ ...node.data, no: ++index }));
                  if (selectedNodes && selectedNodes.length > 0) {
                    openModal('ADD_FEE');
                  } else if (selectedNodes && selectedNodes.length < 1) {
                    openModal('ADD_FEE');
                  }
                }}
                shortcut={COMMON_SHORTCUTS.save}
                className="btn"
              >
                수수료 등록
              </CustomShortcutButton>
            </div>
          </div>
        </div>
      </div>
      {modalType.type === 'ADD_FEE' && modalType.active && <FeeAddPop />}
      {modalType.type === 'MOD_FEE' && modalType.active && <FeeAddPop {...selectedFeeData} />}
    </div>
  );
};

export default React.memo(FeeMng);
