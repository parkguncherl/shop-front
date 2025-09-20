/**
 * @file pages/oms/sims/cs.tsx
 * @description OMS > 빈블러 > 고객센터
 * @copyright 2024
 */

import React, { useEffect, useState } from 'react';
import { Search, Table, Title } from '../../../components';
import { Button, Pagination, TableHeader, toastError } from '../../../components';
import { useNoticeStore } from '../../../stores/useNoticeStore';
import { NoticeRequestPagingFilter } from '../../../stores/useNoticeStore';
import { ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { useQuery } from '@tanstack/react-query';
import { useAgGridApi } from '../../../hooks';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import useFilters from '../../../hooks/useFilters';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import Noticepop from '../../../components/popup/wms/system/notice/NoticePop';
import { useCommonStore } from '../../../stores';
import { AgGridReact } from 'ag-grid-react';
import { useTranslation } from 'react-i18next';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import NoticePop from '../../../components/popup/wms/system/notice/NoticePop';
import NoticeModPop from '../../../components/popup/wms/system/notice/NoticeModPop';
import NoticeAddPop from '../../../components/popup/wms/system/notice/NoticeAddPop';
import { useSession } from 'next-auth/react';
import { authApi } from '../../../libs';
import { DropDownOption } from '../../../types/DropDownOptions';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

// 공지사항 상세 정보 인터페이스 정의
interface NoticeDetail {
  id: number;
  noticeCd: string;
  title: string;
  noticeCntn: string;
  moveUri: string;
  authCds: string;
  creUser: string;
  creTm: string;
  updUser: string;
  updTm: string;
  deleteYn: string;
  readCnt: number;
  [key: string]: any; // 추가 속성을 위한 인덱스 시그니처
}

// 공지사항 컴포넌트
const CS: React.FC = () => {
  const session = useSession();
  const userAuthCode: any = session.data?.user.authCd;

  // AG Grid API 훅
  const { gridApi, onGridReady } = useAgGridApi();

  // 공통 스토어에서 필요한 상태 가져오기
  const { upMenuNm, menuNm, menuUpdYn } = useCommonStore();

  // 공지사항 스토어에서 필요한 상태와 메서드 가져오기
  const { paging, setPaging, selectedNotice, setSelectedNotice, modalType, openModal, closeModal, fetchNotices, getNoticeDetail, loading, error } =
    useNoticeStore();

  // 로컬 상태로 그리드 데이터 관리
  const [localRowData, setLocalRowData] = useState<NoticeDetail[]>([]);

  // 필터 상태 정의
  const [filters, onChangeFilters, onFiltersReset] = useFilters<NoticeRequestPagingFilter>({
    startDate: '',
    endDate: '',
    noticeCd: '',
    authCds: [], // 빈 배열로 초기화
  });

  // 공지사항 컬럼 정의
  const noticeColumns: ColDef<NoticeDetail>[] = [
    { field: 'no', headerName: 'No', minWidth: 40, maxWidth: 40, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'noticeCd',
      headerName: '구분',
      minWidth: 100,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        switch (params.value) {
          case '20110':
            return '공지사항';
          case '20120':
            return '메뉴얼';
          default:
            return '기타';
        }
      },
    },
    { field: 'title', headerName: '제목', minWidth: 350, suppressHeaderMenuButton: true },
    // { field: 'noticeCntn', headerName: '내용', minWidth: 200, maxWidth: 300, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    { field: 'creUser', headerName: '작성자', minWidth: 100, cellStyle: GridSetting.CellStyle.CENTER, suppressHeaderMenuButton: true },
    {
      field: 'readCnt',
      headerName: '조회수',
      minWidth: 40,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => params.value?.toString() || '0', // undefined 값 처리
    },
    {
      field: 'creTm',
      headerName: '작성일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ''),
    },
    {
      field: 'updTm',
      headerName: '수정일',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? new Date(params.value).toLocaleDateString() : ''),
    },
  ];

  // 검색 함수
  const onSearch = async () => {
    setPaging({ ...paging, curPage: 1 });
    await refetch();
  };

  // 초기화 함수
  const reset = async () => {
    await onFiltersReset();
    await onSearch();
  };

  // 공지사항 코드
  const [dropDownData, setDropDownData] = useState<DropDownOption[]>([]);
  useEffect(() => {
    const hardCodedData = [
      { key: '', value: '', label: '전체보기' },
      { key: '20110', value: '20110', label: '공지사항' },
      { key: '20120', value: '20120', label: '메뉴얼' },
    ];
    setDropDownData(hardCodedData);
  }, []);

  // 공지사항 데이터 조회
  const {
    data: notices,
    isLoading,
    isSuccess: isListSuccess,
    refetch: refetch,
  } = useQuery(['/notice/paging', paging.curPage], () =>
    authApi.get('/notice/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isListSuccess) {
      const { resultCode, body, resultMessage } = notices.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setLocalRowData(body.rows);
      } else {
        toastError(resultMessage);
      }
    }
  }, [notices, isListSuccess, setPaging]);

  // 검색 버튼 클릭 핸들러
  const search = async () => {
    const title = filters.title || '';
    if (title.length >= 2 || (filters.startDate && filters.endDate)) {
      // 검색 키워드 길이가 2자 이상이거나 날짜 필터가 설정된 경우
      await onSearch();
    } else {
      toastError('검색 키워드 길이는 2자 이상으로 입력하거나 날짜를 설정해주세요.');
    }
  };

  // 행 클릭 핸들러 (조회수 증가 포함)
  const handleRowClick = async (e: any) => {
    try {
      const noticeId = e.data.id;

      // 서버에서 최신 공지사항 상세 정보를 다시 가져오기
      const response = await getNoticeDetail(noticeId);

      if (response.data.body) {
        const noticeDetail = response.data.body as NoticeDetail;

        // 선택된 공지사항을 상태로 설정
        setSelectedNotice(noticeDetail);

        // 모달 열기
        openModal('DETAIL');
      }
      // 리페치 데이터로 카운트 증가 ㅠㅠ 가져옵니다
      // await refetch();
    } catch (error) {
      console.error('공지사항 상세 조회 오류:', error);
      toastError('공지사항 상세 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div>
      {/* 타이틀 컴포넌트 */}
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} search={onSearch} />

      {/* 검색 컴포넌트 */}
      <Search className="type_2">
        <Search.DropDown
          title={'게시판선택'}
          name={'noticeCd'}
          placeholder={Placeholder.Default}
          defaultOptions={dropDownData}
          value={filters.noticeCd}
          onChange={(name, value) => {
            onChangeFilters(name, value);
          }}
        />
        <Search.Input
          title={'제목검색'}
          name={'title'}
          placeholder={Placeholder.Default}
          value={filters.title || ''}
          onChange={onChangeFilters}
          onEnter={search}
          filters={filters}
        />
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={onChangeFilters}
          onEnter={onSearch}
          value={[filters.startDate, filters.endDate]}
        />
      </Search>

      {/* 테이블 컴포넌트 */}
      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch}></TableHeader>
        <div className="ag-theme-alpine pagingDefault">
          <AgGridReact
            headerHeight={35}
            onGridReady={onGridReady}
            rowData={localRowData}
            gridOptions={
              {
                rowHeight: 24,
                getRowId: (params) => params.data.id.toString(),
              } as GridOptions<NoticeDetail>
            }
            columnDefs={noticeColumns}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            rowSelection={'single'}
            onRowClicked={handleRowClick}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
      {modalType.type === 'DETAIL' && modalType.active && selectedNotice && (
        <NoticePop notice={selectedNotice} onClose={() => closeModal('DETAIL')} onSuccess={refetch} />
      )}
    </div>
  );
};

export default CS;
