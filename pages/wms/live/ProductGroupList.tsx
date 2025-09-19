import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { useCodeStore, useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { authApi } from '../../../libs';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { CodeDropDown, LbProductGroupResponseList } from '../../../generated';
import { CODE } from '../../../libs/const';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const ProductGroupList = () => {
  // 메뉴 정보
  const [upMenuNm, menuNm, getFileUrl] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.getFileUrl]);
  const [seasonCd, setSeasonCd] = useState<Array<CodeDropDown>>([]); // 드롭다운 정보 세팅
  const [style1, setStyle1] = useState<Array<CodeDropDown>>([]); // 드롭다운 정보 세팅
  const [style2, setStyle2] = useState<Array<CodeDropDown>>([]); // 드롭다운 정보 세팅
  const { selectCodeList } = useCodeStore(); // 드롭다운 데이터를 가져오는 함수
  const [productList, setProductList] = useState<LbProductGroupResponseList[]>([]);
  const gridKey = useRef<number>(0);
  const gridRef = useRef<AgGridReact>(null);

  //selectCodeList('90050').then((r) => setSeasonCd(r || []));
  //selectCodeList('80005').then((r) => setStyle1(r || []));
  //selectCodeList('80006').then((r) => setStyle2(r || []));

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    lbPartnerId: '',
    lbProdGroupNm: '',
    status: 'Y',
  });
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<LbProductGroupResponseList[]>([]); // 합계데이터 만들기
  const gridColumns = useMemo<ColDef<LbProductGroupResponseList>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 36,
        maxWidth: 36,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'lbPartnerId',
        headerName: '파트너ID',
        minWidth: 120,
        maxWidth: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'lbPartnerNm',
        headerName: '파트너',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'lbProdGroupCd',
        headerName: '상품그룹코드',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'lbProdGroupNm',
        headerName: '상품그룹명',
        minWidth: 300,
        maxWidth: 300,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'seasonNm',
        headerName: '시즌',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'style1',
        headerName: '스타일1',
        minWidth: 150,
        maxWidth: 150,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'style2',
        headerName: '스타일2',
        minWidth: 150,
        maxWidth: 150,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
    ],
    [],
  );
  // 검색 기능
  const search = async () => {
    // 검색 시 페이지 1로 초기화
    refetch();
  };

  const onSearch = async () => {
    refetch();
  };

  // 초기화 기능
  const reset = async () => {
    onFiltersReset();
    // 파트너 선택 상태도 초기화
    refetch();
  };

  const {
    data: lbProds,
    isFetching,
    isSuccess: isPagingSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/wms/lbProd/productGroupList'], // filters 추가
    queryFn: (): any =>
      authApi.get('/wms/lbProd/productGroupList', {
        params: {
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isPagingSuccess && lbProds?.data) {
      const { resultCode, body, resultMessage } = lbProds.data;
      if (resultCode === 200) {
        setProductList(body);
      }
    }
  }, [lbProds, isPagingSuccess]);

  useEffect(() => {
    search();
  }, [filters]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue + 'ag-grid-pinned-row';
    }
    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.DropDown
          title={'라방화주'}
          name={'lbPartnerId'}
          codeUpper={'80000'}
          dropDownStyle={{ width: '150px' }}
          value={filters.lbPartnerId || ''}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'상품명'}
          name={'lbProdGroupNm'}
          placeholder={'상품명 입력'}
          value={filters.lbProdGroupNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={lbProds?.data?.body?.rows?.length || 0} search={onSearch} gridRef={gridRef}></TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={'layout100'}>
                <TunedGrid<LbProductGroupResponseList>
                  ref={gridRef}
                  rowData={productList}
                  columnDefs={gridColumns}
                  defaultColDef={defaultColDef}
                  suppressRowClickSelection={false}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  rowSelection={'single'}
                  className={'wmsDashboard check'}
                  getRowClass={getRowClass}
                  pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                  loading={isFetching}
                  singleClickEdit={true}
                  key={gridKey.current}
                />
                <div className="btnArea"></div>
              </div>
            </div>
          </div>
          {/* 미리보기 & 프린트 */}
          <div className="previewBox"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductGroupList;
