import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '../../../components';
import { Pagination, TableHeader, toastError } from '../../../components';
import { BodyScrollEvent, ColDef, GridApi } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { ProductMngPagingFilter, useProductMngStore } from '../../../stores/useProductMngStore';
import { useCommonStore } from '../../../stores';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { authApi } from '../../../libs';
import { useQuery } from '@tanstack/react-query';
import { ProductResponsePaging } from '../../../generated';
import ProductAddPop from '../../../components/popup/prodMng/ProductAddPop';
import { Utils } from '../../../libs/utils';
import ProductModPop from '../../../components/popup/prodMng/ProductModPop';
import { useSession } from 'next-auth/react';
import { DropDownOption } from '../../../types/DropDownOptions';
import CustomStatsToolPanel from './customStatsToolPanel';

const ProductMng = () => {
  const { onGridReady } = useAgGridApi();
  const session = useSession();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const gridRef = useRef<AgGridReact>(null);
  const [paging, setPaging, selectedProduct, setSelectedProduct, modals, openModal] = useProductMngStore((s) => [
    s.paging,
    s.setPaging,
    s.selectedProduct,
    s.setSelectedProduct,
    s.modals,
    s.openModal,
  ]);
  const [selectProductId, setSelectProductId] = useState();
  const [selectedSeasonValue, setSelectedSeasonValue] = useState<(string | number)[]>([]); // 라디오박스 시즌 체크
  const [selectedSleepValue, setSelectedSleepValue] = useState<string | number>(''); // 라디오박스 휴면 체크
  const [selectedAttrValue, setSelectedAttrValue] = useState<string | number>(''); // 라디오박스 속성(제작) 체크

  const [selectedSizeValues, setSelectedSizeValues] = useState<DropDownOption[]>([]);
  const [designerOptions, setDesignerOptions] = useState<DropDownOption[]>([]);
  const [factoryOptions, setFactoryOptions] = useState<DropDownOption[]>([]);

  const [filters, onChangeFilters, onFiltersReset, setFilters] = useFilters<ProductMngPagingFilter>({
    searchKeyword: '',
    partnerId: session.data?.user.partnerId,
    sleepYn: '',
    prodAttrCd: '',
    seasonCd: [],
    skuSize: [],
  });

  /** 검색 데이터 불러오기 */
  const defaultOption: DropDownOption = {
    key: '',
    value: '',
    label: '선택',
  };
  // 사이즈
  const fetchSizeData = async () => {
    const partnerId = session.data?.user.partnerId;
    const { data: dataList } = await authApi.get(`/partner`);
    const { resultCode, body, resultMessage } = dataList;
    if (resultCode === 200) {
      const sizeArray = body.sizeInfo.split(',');
      const sizeData = sizeArray.map((item: any, index: number) => ({
        key: index,
        value: item,
        label: item,
      }));
      setSelectedSizeValues(sizeData);
    } else {
      toastError(resultMessage);
    }
  };
  // 메인공장
  const fetchFactoryData = async () => {
    const { data: factoryDataList } = await authApi.get('/factory/omsPartnerId');
    const { resultCode, body, resultMessage } = factoryDataList;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: item.compNm,
      }));
      setFactoryOptions([defaultOption, ...options]);
    } else {
      toastError(resultMessage);
    }
  };
  // 디자이너
  const fetchDesignData = async () => {
    const { data: designDataList } = await authApi.get('/user/designer');
    const { resultCode, body, resultMessage } = designDataList;
    if (resultCode === 200) {
      const options: DropDownOption[] = body.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: '[디자이너] ' + item.userNm,
      }));
      setDesignerOptions([defaultOption, ...options]);
    } else {
      toastError(resultMessage);
    }
  };
  // 판매처
  useEffect(() => {
    fetchFactoryData();
    fetchDesignData();
    fetchSizeData();
  }, []);

  /** 그리드 */
  // 컬럼
  const [columnDefs] = useState<ColDef[]>([
    //{ field: 'id', headerName: 'ID', minWidth: 40 },
    {
      field: 'check',
      headerName: '',
      minWidth: 30,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      enableRowGroup: true,
    },
    {
      field: 'no',
      headerName: 'No',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      enableRowGroup: true,
    },
    // { field: 'prodCd', headerName: '상품코드', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 160,
      suppressHeaderMenuButton: true,
      enableRowGroup: true,
      filter: true,
    },
    {
      field: 'prodAttrCd',
      headerName: '제작여부',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      enableRowGroup: true,
      valueFormatter: (params: any) => {
        return params.value === 'Y' ? 'Y' : 'N';
      },
    },
    {
      field: 'seasonCd',
      headerName: '시즌',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      enableRowGroup: true,
      valueFormatter: (params) => {
        const seasonCd = params.value;
        // 시즌 코드 매핑
        const seasonMapping = [
          { regex: /^S___$/, name: '봄' },
          { regex: /^_S__$/, name: '여름' },
          { regex: /^__F_$/, name: '가을' },
          { regex: /^___W$/, name: '겨울' },
          { regex: /^SS__$/, name: '봄 여름' },
          { regex: /^S_F_$/, name: '봄 가을' },
          { regex: /^S__W$/, name: '봄 겨울' },
          { regex: /^_SF_$/, name: '여름 가을' },
          { regex: /^_S_W$/, name: '여름 겨울' },
          { regex: /^__FW$/, name: '가을 겨울' },
          { regex: /^S_FW$/, name: '봄 가을 겨울' },
          { regex: /^SS_W$/, name: '봄 여름 겨울' },
          { regex: /^SSFW$/, name: '사계절' },
        ];
        // 시즌 코드 매핑에 맞는 시즌명 반환
        for (let i = 0; i < seasonMapping.length; i++) {
          if (seasonMapping[i].regex.test(seasonCd)) {
            return seasonMapping[i].name;
          }
        }
        // 매핑되지 않는 경우 기본값 반환
        return '시즌미정';
      },
    },
    { field: 'skuColor', headerName: '칼라', minWidth: 60, cellStyle: GridSetting.CellStyle.CENTER, enableRowGroup: true, suppressHeaderMenuButton: true },
    { field: 'skuSize', headerName: '사이즈', minWidth: 70, cellStyle: GridSetting.CellStyle.CENTER, enableRowGroup: true, suppressHeaderMenuButton: true },
    {
      field: 'inventoryAmt',
      headerName: '빈블러',
      aggFunc: 'sum',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      enableRowGroup: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerInventoryAmt',
      headerName: '매장',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      enableRowGroup: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sleepYn',
      headerName: '휴면',
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      enableRowGroup: true,
      suppressHeaderMenuButton: true,
    },
    { field: 'factoryNm', headerName: '메인공장', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, enableRowGroup: true, suppressHeaderMenuButton: true },
    { field: 'designNm', headerName: '디자이너', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, enableRowGroup: true, suppressHeaderMenuButton: true },
    { field: 'sellerNm', headerName: '거래처', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, enableRowGroup: true, suppressHeaderMenuButton: true },
    {
      field: 'orgAmt',
      headerName: '제품원가',
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      enableRowGroup: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    {
      field: 'sellAmt',
      headerName: '판매가',
      minWidth: 70,
      cellStyle: GridSetting.CellStyle.RIGHT,
      suppressHeaderMenuButton: true,
      valueFormatter: (params: any) => {
        return Utils.setComma(params.value);
      },
    },
    // { field: 'dcAmt', headerName: '단가DC', minWidth: 70, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'compCntn', headerName: '혼용율', minWidth: 120, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'releaseYmd',
      headerName: '출시일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      enableRowGroup: true,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (!params.value) return ''; // 값이 없을 경우 빈 문자열 반환
        const date = new Date(params.value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      },
    },
    //{ field: 'fabric', headerName: '원단', minWidth: 80, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
  ]);
  // 그리드 로우클릭시
  const handleGridRowClick = (event: any) => {
    if (event.data) {
      setSelectProductId(event.data.id);
      productSelectRefetch();
      openModal('MOD');
    }
  };

  /** 상품관리 페이징 목록 조회 */
  const {
    data: products,
    isSuccess,
    isLoading,
    refetch: productRefetch,
  } = useQuery(['/product/paging', paging.curPage], () =>
    authApi.get('/product/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        enableRowGroup: true,
        ...filters,
      },
    }),
  );

  useEffect(() => {
    if (isSuccess && products?.data) {
      const { resultCode, body, resultMessage } = products.data;
      if (resultCode === 200 && body) {
        setPaging(body.paging);
      } else {
        toastError(resultMessage || '데이터 조회 중 오류가 발생했습니다.');
      }
    }
  }, [products, isSuccess, setPaging]);

  /** 상품 조회 */
  const {
    data: product,
    isSuccess: isProductSuccess,
    refetch: productSelectRefetch,
  } = useQuery(
    [`/product/${selectProductId}`, selectProductId],
    () =>
      authApi.get(`/product/${selectProductId}`, {
        params: {
          id: selectProductId,
        },
      }),
    {
      enabled: !!selectProductId, // selectProductId가 있을 때만 쿼리 실행
      onSuccess: (data) => {
        const { resultCode, body, resultMessage } = data.data;
        if (resultCode === 200) {
          setSelectedProduct(body);
        } else {
          toastError(resultMessage);
        }
      },
      onError: (error) => {
        console.log(error);
      },
    },
  );
  useEffect(() => {
    if (selectProductId) {
      productSelectRefetch();
    }
  }, [selectProductId]);

  /** 휴면처리 */
  const sleepYnData = async (list: any) => {
    const { data: sleepYnData } = await authApi.post(`/sku/sleepYn`, list);
    const { resultCode, body, resultMessage } = sleepYnData;
    if (resultCode === 200) {
      toastSuccess('휴면상태가 변경되었습니다.');
      productRefetch();
    } else {
      toastError(resultMessage);
    }
  };
  const handleSleepYn = (): void => {
    if (gridRef.current) {
      // gridRef 또는 선택된 행이 없을 경우 return
      if (gridRef.current.api.getSelectedRows().length === 0) {
        toastError('상태를 변경할 행을 선택해주세요.');
        return;
      }

      const selectedRows = gridRef.current.api.getSelectedRows();
      const list: { id: string; sleepYn: string }[] = []; // 리스트를 배열로 초기화

      selectedRows.map((item) => {
        list.push({ id: item.skuId, sleepYn: item.sleepYn === 'Y' ? 'N' : 'Y' }); // 항목을 배열에 추가
      });

      sleepYnData(list);
    }
    filters.partnerId = session.data?.user.partnerId;
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };
  // 검색
  const onSearch = async () => {
    filters.partnerId = session.data?.user.partnerId;
    setPaging({
      curPage: 1,
    });
    await productRefetch();
  };

  /** 초기화 버튼 클릭 시 */
  const reset = async () => {
    // 필터 초기화
    onFiltersReset(); // 필터 초기화
    setSelectedSleepValue(''); // 상태 업데이트
    setSelectedSeasonValue([]); // 상태 업데이트
    setSelectedAttrValue(''); // 상태 업데이트

    // 여기서 필터 상태를 업데이트하는 로직을 추가하세요
    filters.partnerId = session.data?.user.partnerId;
    filters.sleepYn = '';
    filters.seasonCd = '';
    filters.skuSize = [];
    filters.prodAttrCd = '';
    filters.factoryId = '';
    filters.designId = '';
    filters.compCntn = '';

    await onSearch(); // 상태가 업데이트된 후에 검색 실행
  };

  // 휠 방향 감지
  const onWheel = (event: any) => {
    const gridInfo = gridRef.current?.api.getVerticalPixelRange();
    const rowCount = gridRef.current?.api.getDisplayedRowCount() ? gridRef.current?.api.getDisplayedRowCount() : 0;
    const lastRowNode = gridRef.current?.api.getDisplayedRowAtIndex(rowCount - 1);
    console.log('스크롤 ==> ', event.deltaY);
    if (event.deltaY > 99) {
      // 마지막 행이 보이는 경우 추가 데이터 로드
      if (lastRowNode) {
        const lastRowBottom = (lastRowNode.rowTop || 0) + (lastRowNode.rowHeight || 0);
        // 마지막 행이 완전히 보이는 경우 추가 데이터 로드
        if ((gridInfo?.bottom || 0) >= lastRowBottom) {
          if (paging.curPage && !isLoading) {
            setPaging({ ...paging, curPage: paging?.curPage + 1 });
          }
        }
      }
    } else if (event?.deltaY < -99) {
      if (gridInfo?.top === 0) {
        setTimeout(() => {
          if (paging.curPage && paging.curPage > 1 && !isLoading) {
            setPaging({ ...paging, curPage: paging?.curPage - 1 });
          }
        }, 200);
      }
    }
  };
  // possible options: 'never', 'always', 'onlyWhenGrouping'
  const rowGroupPanelShow = 'always';

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.Input
          title={'검색'}
          name={'searchKeyword'}
          placeholder={'상품코드/상품명 검색'}
          value={filters.searchKeyword}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Input
          title={'칼라'}
          name={'skuColor'}
          placeholder={'칼라 검색'}
          value={filters.skuColor}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
        <Search.Radio
          title={'휴면여부'}
          name={'sleepYn'}
          options={[
            { label: '정상', value: 'N' },
            { label: '휴면', value: 'Y' },
            { label: '전체', value: '' },
          ]}
          value={selectedSleepValue}
          onChange={(name, value) => {
            setSelectedSleepValue(value);
            onChangeFilters(name, value);
          }}
          filters={filters}
        />
        <Search.DropDown
          title={'사이즈'}
          type={'multiple'}
          name={'skuSize'}
          defaultOptions={selectedSizeValues}
          values={filters.skuSize || []}
          onChange={(name, value) => {
            let updatedValues = filters.skuSize || []; // 현재 선택된 값들

            if (Array.isArray(value)) {
              updatedValues = value; // 새 값이 배열일 경우 업데이트
            } else {
              if (updatedValues.includes(value)) {
                // 이미 선택된 값이면 제거
                updatedValues = updatedValues.filter((v: any) => v !== value);
              } else {
                // 선택되지 않았으면 추가
                updatedValues = [...updatedValues, value];
              }
            }

            onChangeFilters(name, updatedValues); // 배열로 전달
          }}
        />
        <Search.Check
          title={'시즌'}
          name="seasonCd"
          value={selectedSeasonValue}
          options={[
            { label: '봄', value: 'S___' },
            { label: '여름', value: '_S__' },
            { label: '가을', value: '__F_' },
            { label: '겨울', value: '___W' },
          ]} // 옵션 배열
          filters={filters}
          onChange={(name, value) => {
            const updatedValues = Array.isArray(value) ? value : [value];
            setSelectedSeasonValue(updatedValues);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            onChangeFilters(name, updatedValues); // 배열을 전달
          }}
        />
        <Search.Radio
          title={'속성'}
          name={'prodAttrCd'}
          options={[
            { label: '전체', value: '' },
            { label: '제작', value: 'Y' },
            { label: '비제작', value: 'N' },
          ]}
          value={selectedAttrValue}
          onChange={(name, value) => {
            setSelectedAttrValue(value);
            onChangeFilters(name, value);
          }}
          filters={filters}
        />
        <Search.DropDown title={'메인공장'} name={'factoryId'} defaultOptions={factoryOptions} value={filters.factoryId || ''} onChange={onChangeFilters} />
        <Search.DropDown title={'디자이너'} name={'designId'} defaultOptions={designerOptions} value={filters.designId || ''} onChange={onChangeFilters} />
        <Search.Input
          title={'혼용율'}
          name={'compCntn'}
          placeholder={'혼용율 검색'}
          value={filters.compCntn}
          onChange={onChangeFilters}
          onEnter={onSearch}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={productRefetch} choiceCount={50}></TableHeader>
        <div className={'ag-theme-alpine'} onWheel={onWheel}>
          <AgGridReact
            statusBar={{
              statusPanels: [
                {
                  statusPanel: 'agSelectedRowCountComponent', // 선택된 행 개수 표시
                  align: 'left',
                },
                {
                  statusPanel: 'agAggregationComponent', // 집계 정보 표시 (예: 평균, 합계 등)
                  align: 'right',
                },
              ],
            }}
            localeText={{
              selectAll: '모두 선택',
              noRowsToShow: '표시할 행이 없습니다',
              selectedRows: '선택된 행 수',
            }}
            defaultColDef={{
              filter: true, // 필터 적용
              sortable: true, // 정렬 가능
            }}
            sideBar={{
              toolPanels: [
                {
                  id: 'columns',
                  labelDefault: 'BINBLUR', // 패널 이름
                  labelKey: 'columns',
                  iconKey: 'columns', // 아이콘
                  toolPanel: 'agColumnsToolPanel', // 열 관리 패널
                  toolPanelParams: {
                    suppressRowGroups: false, // 행 그룹 사용 여부
                    suppressValues: false, // 값 사용 여부
                    suppressPivots: true, // 피벗 사용 여부
                    suppressPivotMode: true, // 피벗 모드 사용 여부
                  },
                },
                {
                  id: 'filters',
                  labelDefault: '필터',
                  labelKey: 'filters',
                  iconKey: 'filter',
                  toolPanel: 'agFiltersToolPanel', // 필터 패널
                },
                {
                  id: 'customStats',
                  labelDefault: '통계자료',
                  labelKey: 'customStats',
                  iconKey: 'custom-stats',
                  toolPanel: CustomStatsToolPanel,
                  toolPanelParams: {
                    title: 'Custom Stats',
                  },
                },
              ],
              defaultToolPanel: 'null', // 그리드를 처음 열 때 기본으로 열리는 패널
            }}
            ref={gridRef}
            rowGroupPanelShow={rowGroupPanelShow}
            headerHeight={35}
            onGridReady={onGridReady}
            rowData={products?.data?.body?.rows as ProductResponsePaging[]}
            gridOptions={{
              rowHeight: 24,
            }}
            columnDefs={columnDefs}
            autoGroupColumnDef={{
              // 자동 생성되는 그룹 컬럼에 대한 설정
              minWidth: 250,
              width: 300,
            }}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'multiple'}
            onRowDoubleClicked={handleGridRowClick}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default ProductMng;
