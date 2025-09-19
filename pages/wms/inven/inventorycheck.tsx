import React, { useEffect, useRef, useState } from 'react';
import { Search, Table, Title, toastError, toastSuccess } from '../../../components';
import { Pagination, TableHeader } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { GridSetting } from '../../../libs/ag-grid';
import { useAgGridApi } from '../../../hooks';
import { useInventoryInfoStore, InventoryInfoDetail } from '../../../stores/wms/useInventoryInfoStore';
import { useCommonStore, usePartnerCodeStore } from '../../../stores';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import useFilters from '../../../hooks/useFilters';
import { useSession } from 'next-auth/react';
import { Utils } from '../../../libs/utils';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { PartnerResponseSelect } from '../../../generated';
import { fetchPartners } from '../../../api/wms-api';
import dayjs from 'dayjs';
import TunedGrid from '../../../components/grid/TunedGrid';

/**
 * 재고정보 페이지 컴포넌트
 * wms/chulgo/inventoryinfo
 */
const Inventorycheck: React.FC = () => {
  // ag-Grid API 및 레퍼런스 훅
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);

  // 세션 정보 가져오기
  const session = useSession();

  // 상위 메뉴명과 현재 메뉴명 상태
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

  // 파트너 코드 상태 관리 훅
  const [selectPartnerCodeDropdown] = usePartnerCodeStore((s) => [s.selectPartnerCodeDropdown]);

  // 재고 정보 스토어에서 필요한 상태와 함수 가져오기
  const { paging, setPaging, getInventoryInfoDetail } = useInventoryInfoStore();

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    sellerId: 0,
    startDate: Utils.getStartDayDefault(),
    endDate: dayjs().format('YYYY-MM-DD'), // 오늘날짜
    searchKeyword: '',
    searchType: 'A',
    partnerId: session.data?.user.partnerId,
    compCntn: '',
    partnerNm: '',
    seasonCd: [],
    skuSize: [],
    skuColor: '',
    prodAttrCd: '',
    sleepYn: '',
    designId: null,
    factoryId: null,
  });

  const [selectedPartner, setSelectedPartner] = useState();
  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value);
  };

  // 그리드 데이터 및 상태 관리
  const [topGridData, setTopGridData] = useState<any[]>([]);
  const [bottomGridData, setBottomGridData] = useState<InventoryInfoDetail[]>([]);
  const [selectedTopRow, setSelectedTopRow] = useState<InventoryInfoDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // 하단 그리드 표시 여부 상태
  const [isShowSubGrid, setIsShowSubGrid] = useState<boolean>(false);

  // 각 ref 사용
  const topGridRef = useRef<AgGridReact>(null);
  const bottomGridRef = useRef<AgGridReact>(null);

  /**
   * API 호출 - 재고정보 목록 조회
   */
  const {
    data: inventoryInfos,
    isLoading: isInventoryInfosLoading,
    isSuccess: isPagingSuccess,
    refetch: inventoryInfoRefetch,
  } = useQuery(
    ['/wms/inven/paging', paging.curPage],
    /* () =>
      authApi.get('/wms/inven/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),*/
    async () => {
      return {
        data: {
          resultCode: 200,
          resultMessage: 'success',
          body: {
            rows: [
              {
                creTm: '2024-03-18 20:22',
                updTm: '',
                partnerId: '몬드',
                statCd: '대기',
                id: '001',
                checkdocTitle: '4월 정기실사',
                creNm: '백병근',
                userNm: '',
                checkstatCd: 'A - 정기실사',
                checkstatReason: '4월 정기실사요청',
              },
              {
                creTm: '2024-03-17 21:19',
                updTm: '2024-03-18 01:30',
                partnerId: '안느',
                statCd: '완료',
                id: '002',
                checkdocTitle: '특별실사',
                creNm: '백병근',
                userNm: '김진호',
                checkstatCd: 'B - 특별실사',
                checkstatReason: '매장 (화주)요청했음',
              },
              {
                creTm: '2024-03-16 21:19',
                updTm: '',
                partnerId: '삐삐앤코',
                statCd: '대기',
                id: '003',
                checkdocTitle: '물류실사부탁해요',
                creNm: '김예솔',
                userNm: '',
                checkstatCd: 'C - 물류실사',
                checkstatReason: '예솔과장 물류실사 요청',
              },
            ],
            paging: {
              curPage: paging.curPage || 1,
              pageRowCount: paging.pageRowCount || 50,
              totalRowCount: 3,
              totalPageCount: 1,
              pageGroupCount: 10,
              firstPage: 1,
              lastPage: 1,
              startPage: 1,
              endPage: 1,
            },
          },
        },
      };
    },
    {
      enabled: true,
    },
  );

  /**
   * 상단 그리드 데이터 설정
   */
  useEffect(() => {
    if (isPagingSuccess && inventoryInfos?.data) {
      const { resultCode, body, resultMessage } = inventoryInfos.data;
      if (resultCode === 200 && body) {
        setPaging(body.paging);
        setTopGridData(body.rows || []);
      } else {
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [inventoryInfos, isPagingSuccess, setPaging]);

  /**
   * 상단 그리드 셀 클릭 핸들러
   */
  const handleTopGridCellClick = async (event: any) => {
    console.log('클릭된 행 데이터:', event.data);
    if (!event.data) return;

    setSelectedTopRow(event.data);
    setIsDetailLoading(true);
    setIsShowSubGrid(true); // 하단 그리드 표시

    try {
      const tempBottomData: any[] = [
        {
          no: 1,
          prdNm: '예솔반팔',
          skuColor: '블랙',
          skuSize: 'M',
          zoneCd: 'A-1',
          invenCnt: 50,
          skucheckstatCd: 'A - 정상',
          skucheckstatReason: '정상이였음',
        },
        {
          no: 2,
          prdNm: '예솔반팔',
          skuColor: '화이트',
          skuSize: 'L',
          zoneCd: 'A-2',
          invenCnt: 30,
          skucheckstatCd: 'A - 정상',
          skucheckstatReason: '',
        },
        {
          no: 3,
          prdNm: '예솔반팔',
          skuColor: '네이비',
          skuSize: 'S',
          zoneCd: 'B-1',
          invenCnt: 25,
          skucheckstatCd: 'B - 불량',
          skucheckstatReason: '재고3개불량',
        },
        {
          no: 3,
          prdNm: '예솔반팔',
          skuColor: '네이비',
          skuSize: 'S',
          zoneCd: 'B-3',
          invenCnt: 6,
          skucheckstatCd: 'C - 전산재고불일치',
          skucheckstatReason: '카운팅 숫자 2개 더많았음(현배이사님의논처리)',
        },
      ];

      setBottomGridData(tempBottomData);

      /* const response = await getInventoryInfoDetail(event.data.id);
      if (response.data.resultCode === 200 && response.data.body) {
        setBottomGridData(Array.isArray(response.data.body) ? response.data.body : [response.data.body]);
      } else {
        toastError(response.data.resultMessage || '상세 정보를 불러오는데 실패했습니다.');
        setBottomGridData([]);
      }*/
    } catch (error) {
      console.error('상세 정보 조회 오류:', error);
      toastError('상세 정보를 불러오는데 실패했습니다.');
      setBottomGridData([]);
    } finally {
      setIsDetailLoading(false);
    }
  };

  /**
   * 영역 외 클릭시 하단 그리드 닫힘 처리
   */
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const bottomGridDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const topGridElement = topGridDivRef.current;
      const bottomGridElement = bottomGridDivRef.current;

      // 클릭이 그리드 영역 외부에서 발생한 경우
      if (topGridElement && bottomGridElement && !topGridElement.contains(event.target as Node) && !bottomGridElement.contains(event.target as Node)) {
        setIsShowSubGrid(false);
      }
    };

    // 이벤트 리스너 등록/해제
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * 검색 및 초기화 함수
   */
  const search = async () => {
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };

  const onSearch = async () => {
    filters.partnerId = session.data?.user.partnerId;
    setPaging({
      curPage: 1,
    });
    await inventoryInfoRefetch();
  };

  const reset = async () => {
    onFiltersReset();
    filters.partnerId = session.data?.user.partnerId;
    await onSearch();
  };

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

  // 상단 위치에 추가
  const [topColumnDefs, setTopColumnDefs] = useState<ColDef[]>([]);
  const [bottomColumnDefs, setBottomColumnDefs] = useState<ColDef[]>([]);

  // HTML을 안전하게 렌더링하는 컴포넌트를 정의
  const SafeHtml: React.FC<{ html: string }> = ({ html }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

  // 컬럼 정의 설정 (useEffect 사용)
  useEffect(() => {
    // 상단 그리드 컬럼 정의 (SKU 정보 및 총 재고수)
    setTopColumnDefs([
      {
        headerCheckboxSelection: true,
        checkboxSelection: true,
        filter: false,
        sortable: false,
        maxWidth: 30,
        minWidth: 30,
        suppressHeaderMenuButton: true,
        //hide: true,
      },
      {
        field: 'creTm',
        headerName: '요청일자',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'updTm',
        headerName: '완료일자',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'partnerId',
        headerName: '화주',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'statCd',
        headerName: '상태',
        maxWidth: 80,
        minWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        cellRenderer: (params: any) => {
          let color = '';
          if (params.value === '대기') {
            color = '#1890ff'; // 파란색
          } else if (params.value === '완료') {
            color = '#ff4d4f'; // 빨간색
          }
          return <SafeHtml html={`<span style="color: ${color};">${params.value}</span>`} />;
        },
      },
      {
        field: 'id',
        headerName: '실사문서번호',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'checkdocTitle',
        headerName: '실사문서이름',
        minWidth: 140,
        maxWidth: 140,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'creNm',
        headerName: '생성자',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'userNm',
        headerName: '작업자',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'checkstatCd',
        headerName: '실사문서코드',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        editable: true,
        cellEditor: 'agRichSelectCellEditor',
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
      },
      {
        field: 'checkstatReason',
        headerName: '비고',
        minWidth: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        editable: true,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
      },
    ]);

    // 하단 그리드 컬럼 정의 (상세 재고 정보 및 위치)
    setBottomColumnDefs([
      {
        field: 'no',
        headerName: '번호',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'prdNm',
        headerName: '상품명',
        width: 90,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'skuColor',
        headerName: '색상',
        width: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        width: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'zoneCd',
        headerName: '구역 코드',
        width: 100,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'invenCnt',
        headerName: '수량',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'invenCnt', //입력할 수량
        headerName: '조정수량',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        editable: true,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
      },
      {
        field: 'skucheckstatCd',
        headerName: '실사재고코드',
        minWidth: 120,
        maxWidth: 120,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        editable: true,
        cellEditor: 'agRichSelectCellEditor',
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
      },
      {
        field: 'skucheckstatReason',
        headerName: '상세비고',
        minWidth: 300,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
        editable: true,
        headerClass: 'custom-header-class',
        cellClass: 'custom-cell-color',
      },
    ]);
  }, []); // 빈 배열을 dependencies로 전달하여 컴포넌트 마운트 시에만 실행

  return (
    <div>
      {/* 타이틀 컴포넌트 */}
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />

      {/* 검색 컴포넌트 */}
      <Search className="type_2 pull">
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 입력"
        />
        <Search.Radio
          title={'실사상태'}
          name={'searchType'}
          options={[
            { label: '대기', value: 'A' },
            { label: '완료', value: 'B' },
          ]}
          value={filters.searchType}
          onChange={async (name, value) => {
            onChangeFilters('searchType', value); // 선택된 값을 상태로 업데이트
            onSearch();
          }}
        />
        <Search.TwoDatePicker
          title={'실사일자'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onEnter={inventoryInfoRefetch}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Search.Input
          title={'상품'}
          name={'searchKeyword'}
          placeholder={'상품'}
          value={filters.searchKeyword}
          onChange={onChangeFilters}
          onEnter={() => {
            inventoryInfoRefetch;
          }}
          filters={filters}
        />
      </Search>

      {/* 테이블 헤더 컴포넌트 */}
      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={inventoryInfoRefetch} choiceCount={50}>
        <button className="btn btnBlue" title="저장">
          실사완료
        </button>
      </TableHeader>

      <div className="gridBox">
        <div className={`tblPreview columnGridArea ${isShowSubGrid ? 'show' : ''}`}>
          {/* 상단 그리드 */}
          <div className="InfoGrid" ref={topGridDivRef}>
            <div className="ag-theme-alpine">
              {'실사문서리스트'}
              <TunedGrid
                ref={topGridRef}
                onGridReady={onGridReady}
                gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                rowData={topGridData}
                columnDefs={topColumnDefs}
                paginationPageSize={paging.pageRowCount}
                onCellClicked={handleTopGridCellClick}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                rowSelection="multiple"
                suppressRowClickSelection={true}
              />
            </div>
          </div>

          {/* 하단 그리드 */}
          <div className="DetailGrid" ref={bottomGridDivRef}>
            <div className="ag-theme-alpine">
              {'실사상세'}
              {/* height 추가 */}
              <TunedGrid
                ref={bottomGridRef}
                gridOptions={{ rowHeight: 24, headerHeight: 35 }}
                onGridReady={onGridReady}
                rowData={bottomGridData}
                columnDefs={bottomColumnDefs}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                domLayout="normal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 페이지네이션 컴포넌트 */}
      <Pagination pageObject={paging} setPaging={(newPaging) => setPaging({ ...paging, ...newPaging })} />
    </div>
  );
};

export default React.memo(Inventorycheck);
