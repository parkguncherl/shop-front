'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { CellStyle, ColDef } from 'ag-grid-community';
import { Search, Table, TableHeader, Title } from '@/components';
import { toastError, toastSuccess } from '@/components';
import { useCommonStore, useVendorStore } from '@/stores';
import type { VendorFilter } from '@/stores';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import CustomGridLoading from '@/components/CustomGridLoading';
import TunedGrid from '@/components/grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmModal } from '@/components/ConfirmModal';
import VendorMngAddPop from '@/components/popup/market/vendor/VendorMngAddPop';
import VendorMngModPop from '@/components/popup/market/vendor/VendorMngModPop';
import ImageZoomPop from '@/components/popup/common/ImageZoomPop';
import { VendorProductResponse } from '@/generated';
import { VendorMngResponseVendorPagingInfo } from '@/generated';

type VendorProductResponseWithImg = VendorProductResponse & { imgUrl?: string };

const VendorMng = () => {
  const { onGridReady } = useAgGridApi();
  const menuNm = useCommonStore((s) => s.menuNm);
  const getFileUrls = useCommonStore((s) => s.getFileUrls);

  // 스토어 값은 각각 개별 셀렉터로 분리하여 사용 (zustand v5)
  const filters = useVendorStore((s) => s.filters);
  const setFilters = useVendorStore((s) => s.setFilters);
  const resetFilters = useVendorStore((s) => s.resetFilters);
  const selectedVendor = useVendorStore((s) => s.selectedVendor);
  const setSelectedVendor = useVendorStore((s) => s.setSelectedVendor);
  const addOpen = useVendorStore((s) => s.addOpen);
  const delOpen = useVendorStore((s) => s.delOpen);
  const setAddOpen = useVendorStore((s) => s.setAddOpen);
  const setDelOpen = useVendorStore((s) => s.setDelOpen);
  const fetchVendors = useVendorStore((s) => s.fetchVendors);
  const fetchVendorProducts = useVendorStore((s) => s.fetchVendorProducts);
  const deleteVendor = useVendorStore((s) => s.deleteVendor);

  const [rowData, setRowData] = useState<VendorMngResponseVendorPagingInfo[]>([]);
  const [modOpen, setModOpen] = useState(false); // 수정 팝업
  const queryClient = useQueryClient();

  const {
    isLoading,
    isSuccess,
    data: listData,
    refetch,
  } = useQuery({
    queryKey: ['/partnerVendorMng/list', filters.vendorNm, filters.phoneNo],
    queryFn: () => fetchVendors(filters),
  });

  useEffect(() => {
    if (!isSuccess) return;
    const { resultCode, body, resultMessage } = listData.data;
    if (resultCode === 200) {
      // 조회 결과 행이 읽기전용(frozen)일 수 있어 그리드 인라인 편집을 위해 mutable 복사본으로 저장
      setRowData((body?.rows ?? []).map((r: VendorMngResponseVendorPagingInfo) => ({ ...r })));
    } else {
      toastError(resultMessage ?? '조회 중 오류가 발생했습니다.');
    }
  }, [listData, isSuccess]);

  /** 하단 고정 합계행 - 등록(prodCnt) 합계 */
  const pinnedBottomRowData = useMemo<VendorMngResponseVendorPagingInfo[] | undefined>(() => {
    if (rowData.length === 0) return undefined;
    return [
      {
        vendorNm: `합계 (${rowData.length}건)`,
        prodCnt: rowData.reduce((acc, r) => acc + (r.prodCnt ?? 0), 0),
        oneMonthsellCnt: rowData.reduce((acc, r) => acc + (r.oneMonthsellCnt ?? 0), 0),
        threeMonthsellCnt: rowData.reduce((acc, r) => acc + (r.threeMonthsellCnt ?? 0), 0),
      } as VendorMngResponseVendorPagingInfo,
    ];
  }, [rowData]);

  /** 선택한 협력업체의 상품목록 */
  const [productRowData, setProductRowData] = useState<VendorProductResponseWithImg[]>([]);
  /** 이미지 확대보기 팝업 */
  const [zoomImg, setZoomImg] = useState<{ url: string; title?: string } | null>(null);

  const {
    isLoading: isProductLoading,
    isSuccess: isProductSuccess,
    data: productListData,
  } = useQuery({
    queryKey: ['/vendorProductMng/list', selectedVendor?.id],
    queryFn: () => fetchVendorProducts(selectedVendor!.id as number),
    enabled: selectedVendor?.id != null,
  });

  useEffect(() => {
    if (selectedVendor?.id == null) {
      setProductRowData([]);
      return;
    }
    if (!isProductSuccess) return;
    const { resultCode, body, resultMessage } = productListData.data;
    if (resultCode === 200) {
      const rows: VendorProductResponseWithImg[] = body ?? [];
      setProductRowData(rows);
      // 대표이미지 presigned URL 은 1회 요청으로 일괄 조회 후 행에 imgUrl 로 주입
      const keys = rows.map((r) => r.repSysFileNm).filter((k): k is string => !!k);
      if (keys.length > 0) {
        getFileUrls(keys)
          .then((urlMap) => {
            setProductRowData(rows.map((row) => (row.repSysFileNm ? { ...row, imgUrl: urlMap[row.repSysFileNm] } : { ...row })));
          })
          .catch(() => {
            /* 이미지 해석 실패 시 썸네일만 비워둔다 */
          });
      }
    } else {
      toastError(resultMessage ?? '상품 조회 중 오류가 발생했습니다.');
    }
  }, [productListData, isProductSuccess, selectedVendor?.id]);

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        setDelOpen(false);
        setSelectedVendor(null);
        await queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
      } else {
        toastError(e.data.resultMessage ?? '삭제 중 오류가 발생했습니다.');
      }
    },
  });

  const columnDefs: ColDef<VendorMngResponseVendorPagingInfo>[] = [
    {
      headerName: 'No',
      minWidth: 37,
      maxWidth: 37,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 하단 합계행에는 번호를 표시하지 않는다
      valueGetter: (p) => (p.node?.isRowPinned() ? '' : p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    {
      field: 'vendorNm',
      headerName: '명칭',
      minWidth: 90,
      maxWidth: 90,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'location',
      headerName: '위치',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodCnt',
      headerName: '등록',
      minWidth: 36,
      maxWidth: 36,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'oneMonthsellCnt',
      headerName: '1/M',
      minWidth: 37,
      maxWidth: 37,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'threeMonthsellCnt',
      headerName: '3/M',
      minWidth: 38,
      maxWidth: 38,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'phoneNo',
      headerName: '연락처',
      minWidth: 95,
      maxWidth: 95,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo2',
      headerName: '연락처2',
      minWidth: 80,
      maxWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'kakaoId',
      headerName: '카톡ID',
      minWidth: 100,
      maxWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcInfo',
      headerName: '기타정보',
      minWidth: 100,
      maxWidth: 100,
      suppressHeaderMenuButton: true,
    },
    {
      headerName: 'STORY',
      colId: 'story',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 카카오스토리 아이콘 버튼 - 항상 표시하되, kakao_story_id 없으면 disable
      cellRenderer: (p: { data?: VendorMngResponseVendorPagingInfo; node?: { isRowPinned: () => boolean } }) => {
        if (p.node?.isRowPinned()) return null;
        const storyId = (p.data as any)?.kakaoStoryId as string | undefined;
        return (
          <button
            type="button"
            disabled={!storyId}
            title={storyId ? '카카오스토리 열기' : '카카오스토리 ID 없음'}
            onClick={() => storyId && window.open(`https://story.kakao.com/${storyId}`, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: storyId ? 'pointer' : 'not-allowed',
              opacity: storyId ? 1 : 0.35,
            }}
          >
            {/* 카카오스토리 아이콘 (옐로우 라운드 + 화이트 하트) */}
            <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-label="카카오스토리">
              <rect x="1" y="1" width="20" height="20" rx="6" fill="#FEE500" />
              <path
                d="M11 16.2C7.4 13.5 5.2 11.1 5.2 8.7 5.2 7 6.5 5.8 8.1 5.8c1 0 1.9 0.5 2.9 1.7 1-1.2 1.9-1.7 2.9-1.7 1.6 0 2.9 1.2 2.9 2.9 0 2.4-2.2 4.8-5.8 7.5z"
                fill="#3A1D1D"
              />
            </svg>
          </button>
        );
      },
    },
    {
      headerName: 'INSTA',
      colId: 'insta',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      // 인스타그램 아이콘 버튼 - 항상 표시하되, insta_id 없으면 disable
      cellRenderer: (p: { data?: VendorMngResponseVendorPagingInfo; node?: { isRowPinned: () => boolean } }) => {
        if (p.node?.isRowPinned()) return null;
        const instaId = (p.data as any)?.instaId as string | undefined;
        return (
          <button
            type="button"
            disabled={!instaId}
            title={instaId ? '인스타그램 열기' : '인스타그램 ID 없음'}
            onClick={() => instaId && window.open(`https://www.instagram.com/${instaId}`, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: instaId ? 'pointer' : 'not-allowed',
              opacity: instaId ? 1 : 0.35,
            }}
          >
            {/* 인스타그램 아이콘 (그라디언트 라운드 + 카메라) */}
            <svg width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-label="인스타그램">
              <defs>
                <linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#FEDA75" />
                  <stop offset="0.35" stopColor="#FA7E1E" />
                  <stop offset="0.6" stopColor="#D62976" />
                  <stop offset="0.8" stopColor="#962FBF" />
                  <stop offset="1" stopColor="#4F5BD5" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="20" height="20" rx="6" fill="url(#igGrad)" />
              <rect x="6" y="6" width="10" height="10" rx="3.2" fill="none" stroke="#fff" strokeWidth="1.6" />
              <circle cx="11" cy="11" r="2.6" fill="none" stroke="#fff" strokeWidth="1.6" />
              <circle cx="15" cy="7" r="1" fill="#fff" />
            </svg>
          </button>
        );
      },
    },
  ];

  // rowHeight 를 키우면 textAlign 만으로는 글자가 위로 붙으므로, 셀마다 세로 중앙 정렬을 함께 준다
  // (ProductMng / ProdGroupMng 와 동일한 방식)
  const rcCenter: CellStyle = { ...GridSetting.CellStyle.CENTER, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const rcLeft: CellStyle = { ...GridSetting.CellStyle.LEFT, display: 'flex', alignItems: 'center' };

  /** 선택한 협력업체의 상품목록 컬럼 */
  const productColumnDefs: ColDef<VendorProductResponseWithImg>[] = [
    {
      headerName: 'No',
      minWidth: 37,
      maxWidth: 37,
      cellStyle: rcCenter,
      suppressHeaderMenuButton: true,
      valueGetter: (p) => (p.node?.rowIndex != null ? p.node.rowIndex + 1 : ''),
    },
    {
      field: 'imgUrl',
      headerName: '이미지',
      minWidth: 56,
      maxWidth: 56,
      cellStyle: { padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
      suppressHeaderMenuButton: true,
      cellRenderer: (params: { value?: string; data?: VendorProductResponseWithImg }) =>
        params.value ? (
          <img
            src={params.value}
            title="클릭하면 크게 보기"
            style={{ height: '46px', width: '46px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
            onClick={() => setZoomImg({ url: params.value as string, title: params.data?.prodNm })}
          />
        ) : null,
    },
    {
      field: 'prodNm',
      headerName: '상품명',
      minWidth: 160,
      maxWidth: 160,
      cellStyle: rcLeft,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'season',
      headerName: '시즌',
      minWidth: 45,
      maxWidth: 45,
      cellStyle: rcCenter,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodColors',
      headerName: '컬러',
      minWidth: 140,
      maxWidth: 140,
      cellStyle: rcLeft,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodSizes',
      headerName: '사이즈',
      minWidth: 110,
      maxWidth: 110,
      cellStyle: rcLeft,
      suppressHeaderMenuButton: true,
    },
  ];

  const reset = () => {
    resetFilters();
    setSelectedVendor(null);
    queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
  };

  return (
    <div>
      <Title title={menuNm ?? '협력업체 관리'} reset={reset} search={refetch} />
      <Search className="type_2">
        <Search.Input
          title="명칭"
          name="vendorNm"
          placeholder="명칭을 입력하세요"
          value={filters.vendorNm}
          onChange={(name, value) => setFilters(name as keyof VendorFilter, value as string)}
          onEnter={() => refetch()}
        />
        <Search.Input
          title="연락처"
          name="phoneNo"
          placeholder="연락처를 입력하세요"
          value={filters.phoneNo}
          onChange={(name, value) => setFilters(name as keyof VendorFilter, value as string)}
          onEnter={() => refetch()}
        />
      </Search>
      <div className="tblPreview">
        <div className="layoutBox">
          {/* 좌: 협력업체 목록 */}
          <div className="layout60">
            <Table>
              <TableHeader count={rowData.length} search={refetch}></TableHeader>
              <TunedGrid<VendorMngResponseVendorPagingInfo>
                headerHeight={35}
                onGridReady={onGridReady}
                loading={isLoading}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pinnedBottomRowData={pinnedBottomRowData}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                className="default check"
                rowSelection={{ mode: 'singleRow', enableClickSelection: true }}
                onRowClicked={(e) => {
                  if (e.node.isRowPinned()) return;
                  setSelectedVendor(e.data ?? null);
                }}
              />
            </Table>
          </div>

          {/* 우: 선택한 협력업체의 상품목록 */}
          <div className="layout40">
            <Table>
              <TableHeader
                count={productRowData.length}
                title={selectedVendor?.vendorNm ? `${selectedVendor.vendorNm} 상품` : '상품목록'}
                isCount={true}
              ></TableHeader>
              <TunedGrid<VendorProductResponseWithImg>
                headerHeight={35}
                loading={isProductLoading && selectedVendor?.id != null}
                rowData={productRowData}
                columnDefs={productColumnDefs}
                defaultColDef={defaultColDef}
                rowHeight={50}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                className={'default check'}
              />
            </Table>
          </div>
        </div>
        <div className="btnArea between">
          <div className="right">
            <button className="btn btn_primary" onClick={() => setAddOpen(true)}>
              등록
            </button>
            <button className="btn btn_default" onClick={() => setModOpen(true)} disabled={!selectedVendor}>
              수정
            </button>
            <button className="btn btn_danger" onClick={() => setDelOpen(true)} disabled={!selectedVendor}>
              삭제
            </button>
          </div>
        </div>
      </div>

      <VendorMngAddPop
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
        }}
      />

      {selectedVendor && (
        <VendorMngModPop
          open={modOpen}
          item={selectedVendor}
          onClose={() => setModOpen(false)}
          onSuccess={() => {
            setModOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/partnerVendorMng/list'] });
          }}
        />
      )}

      <ConfirmModal
        open={delOpen}
        title="해당 협력업체를 삭제하시겠습니까?"
        warningMessage="삭제 후 복구할 수 없습니다."
        onConfirm={() => {
          if (selectedVendor && selectedVendor.id) deleteMutate(selectedVendor.id);
          else toastError('선택된 벤더가 없습니다.');
        }}
        onClose={(_r) => setDelOpen(false)}
      />

      <ImageZoomPop open={zoomImg != null} imgUrl={zoomImg?.url} title={zoomImg?.title} onClose={() => setZoomImg(null)} />
    </div>
  );
};

export default VendorMng;
