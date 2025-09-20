/**
 수동피킹
 /wms/info/mnpicking
 */
import { useSession } from 'next-auth/react';
import { useCommonStore } from '../../../stores';
import React, { useEffect, useRef, useState } from 'react';
import { MnPickingRequestFilter, MnPickingResponseResponse, PartnerResponseSelect } from '../../../generated';
import { AgGridReact } from 'ag-grid-react';
import useFilters from '../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { fetchPartners } from '../../../api/wms-api';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import TunedGrid from '../../../components/grid/TunedGrid';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { TunedReactSelector } from '../../../components/TunedReactSelector';
import { PartnerDropDownOption } from '../../../types/PartnerDropDownOption';

const Mnpicking = () => {
  const session = useSession();

  // 그리드 준비 완료 시 실행되는 함수
  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  // 전역 상태
  const { upMenuNm, menuNm } = useCommonStore();

  // 참조
  const gridRef = useRef<AgGridReact>(null);

  const [mnPickingInfoList, setMnPickingInfoList] = useState<MnPickingResponseResponse[]>([]);

  /**
   *  Grid 컬럼
   */
  const [columnDefs] = useState<ColDef<MnPickingResponseResponse>[]>([
    {
      field: 'no',
      headerName: '#',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pickingBeginTm',
      headerName: '출고시작 일시',
      minWidth: 100,
      maxWidth: 160,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerNm',
      headerName: '고객사',
      minWidth: 120,
      maxWidth: 160,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pickingChitNo',
      headerName: '출고전표',
      minWidth: 70,
      maxWidth: 70,
      suppressHeaderMenuButton: true,
      cellStyle: GridSetting.CellStyle.CENTER,
    },
    {
      field: 'skuNm',
      headerName: '상품',
      minWidth: 150,
      maxWidth: 150,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'pickingCnt',
      headerName: '피킹',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'completedCnt',
      headerName: '완료',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'zoneDesc',
      headerName: 'ZONE',
      minWidth: 60,
      maxWidth: 60,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'locAlias',
      headerName: 'LOCATION',
      minWidth: 150,
      maxWidth: 150,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'waitYn',
      headerName: '출고보류',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cntInComputer',
      headerName: '전산재고',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'cntInReal',
      headerName: '실물재고',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
    },
  ]);

  // 필터 상태
  const [filters, onChangeFilters, onFiltersReset] = useFilters<MnPickingRequestFilter>({
    logisId: session.data?.user.workLogisId, // 물류 계정 창고검색필터
    partnerId: undefined, // 화주id
    zoneDesc: '',
    skuNm: '', // 스큐명
  });

  /**
   *  API
   */

  // 출고정보 목록 조회
  const {
    data: mnPickingInfos,
    isLoading: isMnPickingInfosLoading,
    isSuccess: isMnPickingInfosSuccess,
    refetch: fetchMnPickingInfos,
  } = useQuery(['/wms/mnPicking/list', filters.logisId, filters.partnerId, filters.zoneDesc], (): any =>
    authApi.get('/wms/mnPicking/list', {
      params: {
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isMnPickingInfosSuccess) {
      const { resultCode, body, resultMessage } = mnPickingInfos.data;
      if (resultCode === 200) {
        setMnPickingInfoList(body || []);
      } else {
        toastError(resultMessage || '출고 목록 조회 정보가 없습니다.');
      }
    }
  }, [mnPickingInfos, isMnPickingInfosSuccess]);

  /** 화주 목록 */
  const [partnerList, setPartnerList] = useState<PartnerDropDownOption[]>([]);

  useEffect(() => {
    fetchPartners().then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerList([...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    });
  }, []);

  const onSearch = () => {
    // 검색 동작
    fetchMnPickingInfos();
  };

  const reset = () => {
    // 초기화
    onFiltersReset();
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />
      <Search className="type_2">
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={(option) => {
            onChangeFilters('partnerId', option.value as number);
          }}
          options={partnerList}
          placeholder="고객사 선택"
        />
        <Search.Input
          title={'상품'}
          name={'skuNm'}
          placeholder={'상품명 입력'}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.DropDown
          title={'ZONE'}
          name={'zoneDesc'}
          defaultOptions={[
            { label: '랙', value: '랙' },
            { label: '임시', value: '임시' },
            { label: '행거', value: '행거' },
            { label: '벌크', value: '벌크' },
          ]}
          value={filters.zoneDesc}
          onChange={onChangeFilters}
        />
      </Search>
      <TableHeader count={mnPickingInfoList.length} search={onSearch} />
      <TunedGrid
        ref={gridRef}
        rowData={mnPickingInfoList}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={onGridReady}
        suppressRowClickSelection={false}
        loadingOverlayComponent={CustomGridLoading}
        noRowsOverlayComponent={CustomNoRowsOverlay}
      />
    </div>
  );
};

export default Mnpicking;
