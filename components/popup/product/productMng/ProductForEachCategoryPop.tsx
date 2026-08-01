import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import { ProductMngResponseCategoryProductInfo, ProductMngResponseCategoryWithCount } from '@/generated';
import TunedGrid, { TunedGridRef } from '@/components/grid/TunedGrid';
import CustomGridLoading from '@/components/CustomGridLoading';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import { GridSetting } from '@/libs/ag-grid';
import { ColDef, RowClickedEvent } from 'ag-grid-community';
import { TableHeader } from '@/components';
import { useCommonStore } from '@/stores/useCommonStore';
import ImageZoomPop from '@/components/popup/common/ImageZoomPop';

type CategoryProductWithImg = ProductMngResponseCategoryProductInfo & { imgUrl?: string };

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/productMng/ProductForEachCategoryPop.tsx
 * desc: 카테고리별 상품 팝업 (좌: 카테고리 목록+건수 / 우: 선택 카테고리 상품 목록(이미지 포함))
 * Date: 2026/04/02
 * Author: park junsung
 * */
const ProductForEachCategoryPop = ({ open, onClose }: ProductContentShowPopProps) => {
  const getFileUrls = useCommonStore((s) => s.getFileUrls);
  const deleteCategoryProduct = useProductMngStore((s) => s.deleteCategoryProduct);

  /** 팝업 내부 local state */
  const [categoryList, setCategoryList] = useState<ProductMngResponseCategoryWithCount[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [productRowData, setProductRowData] = useState<CategoryProductWithImg[]>([]);
  const [zoomImg, setZoomImg] = useState<{ url: string; title?: string } | null>(null);

  /** 참조(ref) */
  const RefForCategoryGrid = useRef<TunedGridRef<ProductMngResponseCategoryWithCount>>(null);
  const RefForProductGrid = useRef<TunedGridRef<CategoryProductWithImg>>(null);

  /** 좌측 - 카테고리 목록 컬럼 */
  const categoryColumnDefs = useMemo<ColDef<ProductMngResponseCategoryWithCount>[]>(
    () => [
      {
        colId: 'no',
        headerName: 'No',
        minWidth: 45,
        maxWidth: 45,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'categoryNm',
        headerName: '카테고리',
        flex: 1,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodCnt',
        headerName: '건수',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        cellRenderer: 'NUMBER_COMMA',
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /** 우측 - 선택 카테고리 상품 목록 컬럼 (이미지 포함) */
  const productColumnDefs = useMemo<ColDef<CategoryProductWithImg>[]>(
    () => [
      {
        colId: 'no',
        headerName: 'NO',
        minWidth: 45,
        maxWidth: 45,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'imgUrl',
        headerName: '이미지',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: { padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        suppressHeaderMenuButton: true,
        cellRenderer: (params: { value?: string; data?: CategoryProductWithImg }) =>
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
        flex: 1,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 160,
        maxWidth: 160,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodSizes',
        headerName: '크기',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  /** 좌측 - 카테고리별 상품 건수 목록 조회 */
  const {
    data: categoryData,
    isSuccess: isCategorySuccess,
    isLoading: isCategoryLoading,
    refetch: categoryRefetch,
  } = useQuery({
    queryKey: ['/productMng/categoryListWithCount'],
    queryFn: () => authApi.get('/productMng/categoryListWithCount'),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isCategorySuccess) {
      const { resultCode, body, resultMessage } = categoryData.data;
      if (resultCode === 200) {
        setCategoryList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [categoryData, isCategorySuccess]);

  /** 우측 - 선택 카테고리 상품 목록 조회 */
  const {
    data: productData,
    isSuccess: isProductSuccess,
    isLoading: isProductLoading,
    refetch: productRefetch,
  } = useQuery({
    queryKey: ['/productMng/categoryProductInfoList', selectedCategoryId],
    queryFn: () =>
      authApi.get('/productMng/categoryProductInfoList', {
        params: { categoryId: selectedCategoryId },
      }),
    enabled: open && selectedCategoryId != null,
  });

  useEffect(() => {
    if (isProductSuccess) {
      const { resultCode, body, resultMessage } = productData.data;
      if (resultCode === 200) {
        const rows: CategoryProductWithImg[] = body || [];
        // 대표이미지 presigned URL 은 1회 요청으로 일괄 조회 후 행에 imgUrl 로 주입
        const keys = rows.map((r) => r.repSysFileNm).filter((k): k is string => !!k);
        if (keys.length > 0) {
          getFileUrls(keys)
            .then((urlMap) => {
              setProductRowData(rows.map((row) => (row.repSysFileNm ? { ...row, imgUrl: urlMap[row.repSysFileNm] } : { ...row })));
            })
            .catch(() => setProductRowData(rows));
        } else {
          setProductRowData(rows);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [productData, isProductSuccess]);

  /** 카테고리에서 상품 제외 */
  const { mutate: deleteCategoryProductMutate } = useMutation({
    mutationFn: deleteCategoryProduct,
    onSuccess: (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('카테고리에서 제외되었습니다.');
        productRefetch();
        categoryRefetch();
      } else {
        toastError(`제외 도중 문제 발생 (${e.data.resultMessage})`);
      }
    },
  });

  const onExcludeFromCategory = () => {
    const selected = RefForProductGrid.current?.api.getSelectedRows() ?? [];
    if (selected.length !== 1) {
      toastError('제외할 상품을 한 건 선택해주세요.');
      return;
    }
    deleteCategoryProductMutate({ id: selected[0].categoryProductId });
  };

  const onCategoryRowClicked = (event: RowClickedEvent<ProductMngResponseCategoryWithCount>) => {
    setSelectedCategoryId(event.data?.categoryId ?? undefined);
  };

  const commonOnCloseCallback = () => {
    setSelectedCategoryId(undefined);
    setProductRowData([]);
    if (onClose) onClose();
  };

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={1100}
        open={open}
        isEscClose={true}
        title={'카테고리별 상품'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left"></div>
              <div className="right">
                <button className="btn btn_primary" onClick={onExcludeFromCategory}>
                  카테고리에서 제외
                </button>
                <button className="btn" onClick={commonOnCloseCallback}>
                  닫기
                </button>
              </div>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="mt10">
            <div className="layoutBox">
              <div className={'layout30'}>
                <TableHeader count={categoryList.length} gridRef={RefForCategoryGrid}></TableHeader>
                <TunedGrid<ProductMngResponseCategoryWithCount>
                  columnDefs={categoryColumnDefs}
                  rowData={categoryList}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForCategoryGrid}
                  loading={isCategoryLoading}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                  onRowClicked={onCategoryRowClicked}
                />
              </div>
              <div className={'layout70'}>
                <TableHeader count={productRowData.length} gridRef={RefForProductGrid}></TableHeader>
                <TunedGrid<CategoryProductWithImg>
                  columnDefs={productColumnDefs}
                  rowData={productRowData}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForProductGrid}
                  loading={isProductLoading}
                  rowHeight={50}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                />
              </div>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
      <ImageZoomPop open={zoomImg != null} imgUrl={zoomImg?.url} title={zoomImg?.title} onClose={() => setZoomImg(null)} />
    </div>
  );
};

export default ProductForEachCategoryPop;
