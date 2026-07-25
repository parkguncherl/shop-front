'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CellEditRequestEvent, CellStyle, ColDef } from 'ag-grid-community';
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
import ImageZoomPop from '@/components/popup/common/ImageZoomPop';
import { VendorProductResponse } from '@/generated';
import { VendorMngResponseVendorPagingInfo } from '@/generated';

// 그리드에서 바로 수정 가능한 컬럼 (명칭 ~ 기타정보, 등록자 이전까지)
const INLINE_EDITABLE = new Set(['vendorNm', 'location', 'phoneNo', 'phoneNo2', 'kakaoId', 'etcInfo']);

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
  const updateVendor = useVendorStore((s) => s.updateVendor);
  const deleteVendor = useVendorStore((s) => s.deleteVendor);

  const [rowData, setRowData] = useState<VendorMngResponseVendorPagingInfo[]>([]);
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

  // 그리드 셀 인라인 수정 - id 와 변경된 필드만 전송
  const { mutate: updateVendorMutate } = useMutation({
    mutationFn: updateVendor,
    onSuccess: (e, variables) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
        refetch();
      } else {
        toastError(e.data.resultMessage ?? '수정 중 오류가 발생했습니다.');
      }
    },
    onError: () => {
      toastError('수정 중 오류가 발생했습니다.');
    },
  });

  // readOnlyEdit 모드: ag-grid가 행 객체(frozen)에 직접 대입하지 않고 요청만 발생 -> 우리가 직접 갱신
  const onCellEditRequest = useCallback(
    (event: CellEditRequestEvent<VendorMngResponseVendorPagingInfo>) => {
      const field = event.column.getColId();
      if (!INLINE_EDITABLE.has(field)) return;

      const id = event.data?.id;
      if (!id) return;

      const newValue = typeof event.newValue === 'string' ? event.newValue.trim() : event.newValue;

      // 명칭은 필수값 - 비우면 무시
      if (field === 'vendorNm' && (newValue == null || newValue === '')) {
        toastError('명칭은 필수 항목입니다.');
        return;
      }

      // 로컬 rowData 즉시 반영 (새 객체로 교체)
      setRowData((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: newValue } : row)));
      // id 와 변경된 필드만 전송
      updateVendorMutate({ id, [field]: newValue ?? '' });
    },
    [updateVendorMutate],
  );

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
      headerName: '명칭✎',
      minWidth: 90,
      maxWidth: 90,
      editable: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'location',
      headerName: '위치✎',
      minWidth: 140,
      maxWidth: 140,
      editable: true,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'prodCnt',
      headerName: '등록',
      minWidth: 40,
      maxWidth: 40,
      editable: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'oneMonthsellCnt',
      headerName: '1/M',
      minWidth: 40,
      maxWidth: 40,
      editable: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'threeMonthsellCnt',
      headerName: '3/M',
      minWidth: 40,
      maxWidth: 40,
      editable: true,
      suppressHeaderMenuButton: true,
      cellRenderer: 'NUMBER_COMMA',
      cellStyle: GridSetting.CellStyle.RIGHT,
    },
    {
      field: 'phoneNo',
      headerName: '연락처✎',
      minWidth: 100,
      maxWidth: 100,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'phoneNo2',
      headerName: '연락처2✎',
      minWidth: 100,
      maxWidth: 100,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      hide: true,
    },
    {
      field: 'kakaoId',
      headerName: '카톡ID✎',
      minWidth: 100,
      maxWidth: 100,
      editable: true,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcInfo',
      headerName: '기타정보✎',
      minWidth: 100,
      maxWidth: 100,
      editable: true,
      suppressHeaderMenuButton: true,
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
          <div className="layout55">
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
                readOnlyEdit
                stopEditingWhenCellsLoseFocus
                onCellEditRequest={onCellEditRequest}
                onRowClicked={(e) => {
                  if (e.node.isRowPinned()) return;
                  setSelectedVendor(e.data ?? null);
                }}
              />
            </Table>
          </div>

          {/* 우: 선택한 협력업체의 상품목록 */}
          <div className="layout45">
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
