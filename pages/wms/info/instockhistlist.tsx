/**
 입고 이력 리스트
 /wms/info/instockhistlist
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { FactoryResponseSelectList, LocsetResponseOptionList, PartnerResponseSelect } from '../../../generated';
import { Pagination, Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { fetchFactories, fetchLocOptions, fetchPartners } from '../../../api/wms-api';
import { Utils } from '../../../libs/utils';
import TunedGrid from '../../../components/grid/TunedGrid';

const Instockhistlist = () => {
  const session = useSession();
  const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); // 1개월전 1일자로 조회한다.
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const gridRef = useRef<AgGridReact>(null);

  const { onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [paging, setPaging] = useStoreReqStore((s) => [s.paging, s.setPaging]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: session.data?.user.workLogisId,
    startDate: startDt,
    endDate: today,
    skuNm: '',
    partnerId: 0,
    factoryId: 0,
    ipgologtatCd: '9',
  });

  const [locOption, setLocOption] = useState<LocsetResponseOptionList[]>([]);

  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        filter: false,
        sortable: false,
        maxWidth: 30,
        minWidth: 30,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'no',
        headerName: 'No',
        maxWidth: 40,
        minWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'tempNo',
        headerName: 'tempNo',
        maxWidth: 80,
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'asnId',
        headerName: 'ASN번호',
        maxWidth: 60,
        minWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockYmd',
        headerName: '입하일자',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '화주',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'compNm',
        headerName: '생산처(공장)',
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockCdNm',
        headerName: '입하구분',
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'skuColor',
        headerName: '컬러',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'stockCnt',
        headerName: '입하수량',
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'invenCnt',
        headerName: '적치수량',
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'zonecdNm',
        headerName: '적치Zone',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locationNm',
        headerName: '적치Loc',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creUser',
        headerName: '입고자',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creTm',
        headerName: '입고시간',
        minWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'updUser',
        headerName: '적치자',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'updTm',
        headerName: '적치시간',
        minWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [locOption],
  );

  /**
   *  API
   */

  // 화주옵션 조회
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([]);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerOption([defaultOption, ...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  // 공장옵션 조회
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess } = useQuery(['fetchFactories'], fetchFactories);
  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          value: item.id,
          label: item.compNm,
        }));
        setFactoryOption([defaultOption, ...factoryCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  // 로케이션 옵션 조회
  const { data: locs, isSuccess: isFetchLocSuccess } = useQuery(['fetchLocOptions', workLogisId], () => fetchLocOptions(workLogisId), {
    enabled: !!session.data?.user.workLogisId, // logisId가 유효할 때에만 실행
  });
  useEffect(() => {
    if (isFetchLocSuccess && locs) {
      const { resultCode, body, resultMessage } = locs.data;
      if (resultCode === 200) {
        console.log('locs data>>', locs.data.body);
        const locNms = body?.map((item: LocsetResponseOptionList) => ({
          // locationId: item.id,
          locationNm: item.location,
          // zoneCd: item.zoneCd,
          zoneCdNm: item.zoneCdNm,
        }));
        // setLocOption(locNms);
        setLocOption(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchLocSuccess, locs]);

  //적치 목록 조회
  const {
    data: ipgolog,
    isSuccess: isipgologuccess,
    refetch: refetchStock,
  } = useQuery(['/ipgolog/paging', paging.curPage], (): any =>
    authApi.get('/ipgolog/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isipgologuccess && ipgolog?.data) {
      const { resultCode, body, resultMessage } = ipgolog.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [ipgolog, isipgologuccess, setPaging]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await refetchStock();
  };

  // 검색 버튼 클릭
  const search = async () => {
    await onSearch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    await onFiltersReset();
    await onChangeFilters('startDate', startDt);
    await onChangeFilters('endDate', today);
    await onChangeFilters('factoryId', 0);
    await onChangeFilters('partnerId', 0);
    await onChangeFilters('ipgologtatCd', '1');

    setSelectedPartner(defaultOption);
    setSelectedFactory(defaultOption);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  // 필터 옵션 선택
  const [selectedPartner, setSelectedPartner] = useState();
  const [selectedFactory, setSelectedFactory] = useState();

  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value);
  };

  const handleChangeFactory = (option: any) => {
    setSelectedFactory(option);
    onChangeFilters('factoryId', option.value);
  };

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  const addClass = (currentClass: string, newClass: string) => (currentClass ? `${currentClass} ${newClass}` : newClass);
  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    // params와 params.data가 존재하는지 체크
    if (params?.data?.tempNo) {
      const rowNumber = parseInt(params.data.tempNo);
      if (!isNaN(rowNumber) && rowNumber % 2 === 1) {
        rtnValue = addClass(rtnValue, 'ag-grid-changeOrder');
      }
    }
    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={search} />
      <Search className="type_2 full">
        {/*<Search.DropDown
          title={'적치상태'}
          name={'ipgologtatCd'}
          value={filters.ipgologtatCd}
          defaultOptions={ipgologtatOptions}
          placeholder={'적치상태 구분'}
          onChange={onChangeFilters}
        />*/}
        <Search.TwoDatePicker
          title={'입하일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={search}
          filters={filters}
          onChange={onChangeFilters}
        />
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 입력"
        />
        <DataListDropDown
          title={'공장명'}
          name={'factoryId'}
          value={selectedFactory}
          onChange={handleChangeFactory}
          options={factoryOption}
          placeholder="공장명 입력"
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'스큐명 입력'}
          value={filters.skuNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}></TableHeader>
        <TunedGrid
          ref={gridRef}
          rowData={ipgolog?.data?.body?.rows || []}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          gridOptions={{ rowHeight: 28, headerHeight: 35 }}
          rowSelection={'multiple'}
          suppressRowClickSelection={true}
          paginationPageSize={paging.pageRowCount}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          enableRangeSelection={true}
          //suppressMultiRangeSelection={false}
          getRowClass={getRowClass}
          pinnedBottomRowData={pinnedBottomRowData}
          className={'wmsDefault'}
        />
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default Instockhistlist;
