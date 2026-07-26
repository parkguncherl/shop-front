import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupFooter } from '@/components/popup/PopupFooter';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import {
  PartnerCodeResponseLowerSelect,
  ProductMngRequestCategoryProductInfoFilter,
  ProductMngResponseCategoryProductInfo,
  ProductMngRequestProductInfoWithExclusionFilter,
  ProductMngResponseProductInfoByExclusion,
} from '@/generated';
import TunedGrid, { TunedGridRef } from '@/components/grid/TunedGrid';
import { PopupSearchBox, PopupSearchType } from '@/components/popup/content';
import CustomGridLoading from '@/components/CustomGridLoading';
import CustomNoRowsOverlay from '@/components/CustomNoRowsOverlay';
import { GridSetting } from '@/libs/ag-grid';
import { ColDef, GridReadyEvent, RowDragEndEvent } from 'ag-grid-community';
import useFilters from '@/hooks/useFilters';
import { Search } from '@/components/content';
import { PARTNER_CODE } from '@/libs/const';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import { TableHeader } from '@/components';

// interface ConfirmModalProps {
//   type: 'ADD_TO_CATEGORY' | 'DEL_FROM_CATEGORY';
//   active: boolean;
//   stored_temporary?: unknown;
// }

// interface ConfForAddToCategory extends ConfirmModalProps {
//   type: 'ADD_TO_CATEGORY';
//   stored_temporary?: ProductMngResponseProductInfoByExclusion & { categoryId: number };
// }
//
// interface ConfForDelFromCategory extends ConfirmModalProps {
//   type: 'DEL_FROM_CATEGORY';
//   stored_temporary?: ProductMngResponseCategoryProductInfo;
// }

interface ProductContentShowPopProps {
  open: boolean;
  onClose: () => void;
}

/**
 * components/popup/product/productMng/ProductForEachCategoryPop.tsx
 * desc: 카테고리별 상품 팝업
 * Date: 2026/04/02
 * Author: park junsung
 * */
const ProductForEachCategoryPop = ({ open, onClose }: ProductContentShowPopProps) => {
  /** 공통 스토어 - State */
  const insertCategoryProduct = useProductMngStore((s) => s.insertCategoryProduct);
  const updateCategoryProductSeq = useProductMngStore((s) => s.updateCategoryProductSeq);
  const deleteCategoryProduct = useProductMngStore((s) => s.deleteCategoryProduct);
  const selectLowerPartnerCodeByCodeUpper = usePartnerCodeStore((s) => s.selectLowerPartnerCodeByCodeUpper);

  /** 팝업 내부 local state */
  const [productInfoListByCategory, setProductInfoListByCategory] = useState<ProductMngResponseCategoryProductInfo[]>([]);
  const [productInfoListWithExclusion, setProductInfoListWithExclusion] = useState<ProductMngResponseProductInfoByExclusion[]>([]);
  // const [modalsStatus, setModalsStatus] = useState<ConfForAddToCategory | ConfForDelFromCategory>({
  //   type: 'ADD_TO_CATEGORY',
  //   active: false,
  //   stored_temporary: undefined,
  // });

  // 각각 좌, 우측 선택된 행의 상태
  // const [selectedProductInfoByCategory, setSelectedProductInfoByCategory] = useState<ProductMngResponseCategoryProductInfo | undefined>(undefined);
  // const [selectedProductInfo, setSelectedProductInfo] = useState<ProductMngResponseProductInfoByExclusion | undefined>(undefined);

  const [lowerPartnerCodeList, setLowerPartnerCodeList] = useState<PartnerCodeResponseLowerSelect[]>([]);

  /** 참조(ref) */
  const RefForLeftGrid = useRef<TunedGridRef<ProductMngResponseCategoryProductInfo>>(null);
  const RefForRightGrid = useRef<TunedGridRef<ProductMngResponseProductInfoByExclusion>>(null);

  const refAsFlag = useRef<ProductMngRequestCategoryProductInfoFilter & ProductMngRequestProductInfoWithExclusionFilter>({ categoryId: undefined });

  /** 검색 필터 */
  const [filtersForProdInfoByCategory, onChangeFiltersForProdInfoByCategory, filtersForProdInfoByCategoryReset] =
    useFilters<ProductMngRequestCategoryProductInfoFilter>({
      categoryId: undefined,
    });
  const [filtersForProdInfoListWithExclusion, onChangeFiltersForProdInfoListWithExclusion, filtersForProdInfoListWithExclusionReset] =
    useFilters<ProductMngRequestProductInfoWithExclusionFilter>({
      prodNm: undefined,
    });

  /** 검색 필터 동기화 시점 추가적 동작을 정의할수 있는 common callback */
  const onChangeFiltersForProdInfoByCategoryCommonCallback = (name: string, value: string | number) => {
    onChangeFiltersForProdInfoByCategory(name, value);
    refAsFlag.current = { ...refAsFlag.current, [name]: value };
  };
  const onChangeFiltersForProdInfoListWithExclusionCommonCallback = (name: string, value: string | number) => {
    onChangeFiltersForProdInfoListWithExclusion(name, value);
    refAsFlag.current = { ...refAsFlag.current, [name]: value };
  };

  /** 컬럼 설정 */
  const columnDefsOnLeft = useMemo<ColDef<ProductMngResponseCategoryProductInfo>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 37,
        maxWidth: 37,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        rowDrag: true,
      },
      {
        field: 'categoryNm',
        headerName: '카테고리',
        minWidth: 100,
        maxWidth: 100,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 200,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 160,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodSizes',
        headerName: '크기',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
    ],
    [],
  );

  const columnDefsOnRight = useMemo<ColDef<ProductMngResponseProductInfoByExclusion>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 37,
        maxWidth: 37,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        rowDrag: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 200,
        maxWidth: 200,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 160,
        maxWidth: 160,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.LEFT,
      },
      {
        field: 'prodSizes',
        headerName: '크기',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  const { mutate: insertCategoryProductMutate } = useMutation({
    mutationFn: insertCategoryProduct,
    onSuccess: (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('추가되었습니다.');
          // setModalsStatus((prevState) => {
          //   return {
          //     ...prevState,
          //     active: false,
          //     stored_temporary: undefined,
          //   };
          // });
          productInfosByCategoryRefetch();
          productInfosWithExclusionRefetch();
        } else {
          toastError(`컨텐츠 추가 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteCategoryProductMutate } = useMutation({
    mutationFn: deleteCategoryProduct,
    onSuccess: (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          // setModalsStatus((prevState) => {
          //   return {
          //     ...prevState,
          //     active: false,
          //     stored_temporary: undefined,
          //   };
          // });
          productInfosByCategoryRefetch();
          productInfosWithExclusionRefetch();
        } else {
          toastError(`컨텐츠 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 하위코드 목록 조회 */
  const { data: categories, isSuccess: isCategoriesSuccess } = useQuery({
    queryKey: [],
    queryFn: () => selectLowerPartnerCodeByCodeUpper(PARTNER_CODE.categories.code, ''),
    enabled: open,
  });

  useEffect(() => {
    if (isCategoriesSuccess) {
      const { resultCode, body, resultMessage } = categories.data;
      if (resultCode == 200) {
        setLowerPartnerCodeList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [categories, isCategoriesSuccess]);

  useEffect(() => {
    console.log('lowerPartnerCodeList ==>', lowerPartnerCodeList);
  }, [lowerPartnerCodeList]);

  /** 카테고리 연결상품정보 목록 조회 */
  const {
    data: productInfosByCategory,
    isSuccess: isProductInfosByCategorySuccess,
    isLoading: isProductInfosByCategoryLoading,
    refetch: productInfosByCategoryRefetch,
  } = useQuery({
    queryKey: ['/productMng/categoryProductInfoList', filtersForProdInfoByCategory.categoryId],
    queryFn: () =>
      authApi.get('/productMng/categoryProductInfoList', {
        params: {
          ...filtersForProdInfoByCategory,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductInfosByCategorySuccess) {
      const { resultCode, body, resultMessage } = productInfosByCategory.data;
      if (resultCode === 200) {
        setProductInfoListByCategory(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfosByCategory, isProductInfosByCategorySuccess]);

  /** 전체상품정보 */
  const {
    data: productInfosWithExclusion,
    isSuccess: isProductInfosWithExclusionSuccess,
    isLoading: isProductInfosWithExclusionLoading,
    refetch: productInfosWithExclusionRefetch,
  } = useQuery({
    queryKey: ['/productMng/prodInfoListWithExclusion', filtersForProdInfoByCategory.categoryId],
    queryFn: () =>
      authApi.get('/productMng/prodInfoListWithExclusion', {
        params: {
          ...filtersForProdInfoListWithExclusion,
          categoryId: filtersForProdInfoByCategory.categoryId,
        },
      }),
    refetchOnMount: 'always',
    enabled: open,
  });

  useEffect(() => {
    if (isProductInfosWithExclusionSuccess) {
      const { resultCode, body, resultMessage } = productInfosWithExclusion.data;
      if (resultCode === 200) {
        setProductInfoListWithExclusion(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfosWithExclusion, isProductInfosWithExclusionSuccess]);

  const commonOnCloseCallback = () => {
    if (onClose) onClose();

    filtersForProdInfoByCategoryReset();
    filtersForProdInfoListWithExclusionReset();
  };

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = () => {
    productInfosByCategoryRefetch();
    productInfosWithExclusionRefetch();
  };

  /** 죄측 그리드 하 row 드래그 이벤트 */
  const onRowDragEndHandlerOfLeftSided = async (event: RowDragEndEvent) => {
    const movingNode = event.node;
    const overNode = event.overNode;

    if (movingNode.id && overNode?.id && movingNode.id != overNode?.id) {
      // 유의미한 드래깅이 발생한 경우
      const movingData = movingNode.data;
      const overData = overNode?.data;

      if (movingData && overData) {
        const fromIndex = productInfoListByCategory.indexOf(movingData);
        const toIndex = productInfoListByCategory.indexOf(overData);

        const fromSeq = productInfoListByCategory[fromIndex].seq;
        const toSeq = productInfoListByCategory[toIndex].seq;

        if (fromIndex == toIndex) {
          toastError('동일한 영역에 드래깅 할 수 없습니다.');
          return; // 이 경우 이후 동작이 무의미하므로
        }
        if (!filtersForProdInfoByCategory.categoryId) {
          toastError('카테고리 선택 후 다시 시도하십시요.');
          return;
        }
        const seqUpdReqsResult = await updateCategoryProductSeq({
          categoryId: filtersForProdInfoByCategory.categoryId,
          fromSeq: fromSeq,
          toSeq: toSeq,
        });

        const { resultCode, resultMessage } = seqUpdReqsResult.data;

        if (resultCode == 200) {
          productInfosByCategoryRefetch(); // refetch
        } else {
          console.error(resultMessage);
          toastError('재정렬 과정에서 문제가 발생하였습니다.');
        }
      }
    }
  };

  /** 죄측 그리드 초기화 동작(우측 그리드로의 드롭을 가능토록 하는 초기화 구성 또한 정의) */
  const onLeftGridReady = (params: GridReadyEvent<ProductMngResponseCategoryProductInfo>) => {
    if (RefForRightGrid.current) {
      // 우측 그리드가 준비된 후 drop zone 연결
      const dropZoneParams = RefForRightGrid.current.api.getRowDropZoneParams({
        /** 우측 그리드로의 드랍 시점 이벤트*/
        onDragStop: (dragParams: RowDragEndEvent<ProductMngResponseCategoryProductInfo>) => {
          /** prodInfo 삭제 동작 */
          const droppedNodesData = dragParams.node.data;
          //console.log('droppedNodesData to Right: ', droppedNodesData?.categoryId);
          if (droppedNodesData) {
            deleteCategoryProductMutate({
              id: droppedNodesData.categoryProductId, // 이때의 id는 카테고리 연결상품정보 아이디(PK)
            });
          }
        },
      });

      if (dropZoneParams) {
        params.api.addRowDropZone(dropZoneParams); // 드롭존 추가
      }
    }
  };

  /** 우측 그리드 초기화 동작(우측 그리드로의 드롭을 가능토록 하는 초기화 구성 또한 정의) */
  const onRightGridReady = (params: GridReadyEvent<ProductMngResponseProductInfoByExclusion>) => {
    if (RefForLeftGrid.current) {
      // 좌측 그리드가 준비된 후 drop zone 연결
      const dropZoneParams = RefForLeftGrid.current.api.getRowDropZoneParams({
        /** 좌측 그리드로의 드랍 시점 이벤트*/
        onDragStop: (dragParams: RowDragEndEvent<ProductMngResponseProductInfoByExclusion>) => {
          /** prodInfo 추가 동작 */
          const droppedNodesData = dragParams.node.data;
          // console.log('droppedNodesData to Left: ', droppedNodesData);
          // console.log('refAsFlag.current: ', refAsFlag.current);
          if (droppedNodesData) {
            if (refAsFlag.current.categoryId) {
              insertCategoryProductMutate({
                categoryId: refAsFlag.current.categoryId,
                productId: droppedNodesData.id,
              });
            }
          }
        },
      });

      if (dropZoneParams) {
        params.api.addRowDropZone(dropZoneParams); // 드롭존 추가
      }
    }
  };

  const categoryOptions = useMemo(() => {
    return lowerPartnerCodeList.map((lowerPartnerCode) => ({
      key: String(lowerPartnerCode.id),
      label: lowerPartnerCode.codeNm,
      value: lowerPartnerCode.id,
    }));
  }, [lowerPartnerCodeList]);

  return (
    <div className="imgPopBox">
      <PopupLayout
        width={1250}
        open={open}
        //isEscClose={!modalsStatus.active}
        isEscClose={true}
        title={'카테고리별 상품'}
        onClose={commonOnCloseCallback}
        footer={
          <PopupFooter>
            <div className="btnArea between">
              <div className="left">
                <button
                  className={`btn btn_primary`}
                  onClick={() => {
                    const api = RefForRightGrid.current?.api;
                    if (api?.getSelectedRows().length === 1) {
                      const id = api.getSelectedRows()[0].id;
                      if (refAsFlag.current.categoryId) {
                        insertCategoryProductMutate({
                          categoryId: refAsFlag.current.categoryId,
                          productId: id,
                        });
                      }
                    } else {
                      toastError('추가할 데이터가 한건 반드시 선택되어야 합니다.');
                    }
                  }}
                >
                  추가
                </button>
              </div>
              <div className="right">
                <button
                  className={`btn btn_primary`}
                  onClick={() => {
                    const api = RefForLeftGrid.current?.api;
                    if (api?.getSelectedRows().length === 1) {
                      const categoryProductId = api.getSelectedRows()[0].categoryProductId;

                      deleteCategoryProductMutate({
                        id: categoryProductId,
                      });
                    } else {
                      toastError('삭제할데이터가 한건 반드시 선택되어야 합니다.');
                    }
                  }}
                >
                  제외
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
          {/* 검색영역은 오른쪽 그리드(카테고리별 상품) 위로 우측 정렬 */}
          <div className="mt10">
            <div className="layoutBox">
              <div className={'layout45'}>
                <PopupSearchBox style={{ height: 74, display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <PopupSearchType className={'type_1'} style={{ fontWeight: 600, fontSize: 'var(--m-size)', textAlign: 'left', width: '100%' }}>
                    선택가능 상품 목록
                  </PopupSearchType>
                </PopupSearchBox>
                <TableHeader count={productInfoListWithExclusion.length} gridRef={RefForRightGrid}></TableHeader>
                <TunedGrid<ProductMngResponseProductInfoByExclusion>
                  columnDefs={columnDefsOnRight}
                  rowData={productInfoListWithExclusion}
                  onGridReady={onRightGridReady}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForRightGrid}
                  loading={isProductInfosWithExclusionLoading}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                  // onSelectionChanged={(event) => {
                  //   const selectedRows = event.api.getSelectedRows();
                  //   setSelectedProductInfo(selectedRows.length > 0 ? selectedRows[0] : undefined);
                  // }}
                />
              </div>
              <div className={'layout55'}>
                <PopupSearchBox style={{ height: 74 }}>
                  <PopupSearchType className={'type_1'}>
                    <Search.DropDown
                      title={'카테고리'}
                      name={'categoryId'}
                      defaultOptions={categoryOptions}
                      value={filtersForProdInfoByCategory.categoryId}
                      onChange={onChangeFiltersForProdInfoByCategoryCommonCallback}
                      wrapperClassNames={'fullWidthSel'}
                      dropDownStyle={{ width: '100%' }}
                    />
                  </PopupSearchType>
                  <PopupSearchType className={'type_1'}>
                    <Search.Input
                      title={'상품명'}
                      name={'prodNm'}
                      placeholder={'키워드 입력 후 엔터키 클릭'}
                      value={filtersForProdInfoListWithExclusion.prodNm}
                      onEnter={search}
                      onChange={onChangeFiltersForProdInfoListWithExclusionCommonCallback}
                      filters={filtersForProdInfoListWithExclusion}
                    />
                  </PopupSearchType>
                </PopupSearchBox>
                <TableHeader count={productInfoListByCategory.length} gridRef={RefForLeftGrid}></TableHeader>
                <TunedGrid<ProductMngResponseCategoryProductInfo>
                  columnDefs={columnDefsOnLeft}
                  rowData={productInfoListByCategory}
                  onGridReady={onLeftGridReady}
                  loadingOverlayComponent={CustomGridLoading}
                  noRowsOverlayComponent={CustomNoRowsOverlay}
                  ref={RefForLeftGrid}
                  loading={isProductInfosByCategoryLoading}
                  rowSelection={{
                    mode: 'singleRow',
                    enableClickSelection: true,
                  }}
                  // onSelectionChanged={(event) => {
                  //   const selectedRows = event.api.getSelectedRows();
                  //   setSelectedProductInfoByCategory(selectedRows.length > 0 ? selectedRows[0] : undefined);
                  // }}
                  onRowDragEnd={onRowDragEndHandlerOfLeftSided}
                />
              </div>
            </div>
          </div>
        </PopupContent>
      </PopupLayout>
      {/*<ConfirmModal*/}
      {/*  open={modalsStatus.active && (modalsStatus.type == 'ADD_TO_CATEGORY' || modalsStatus.type == 'DEL_FROM_CATEGORY')}*/}
      {/*  title={*/}
      {/*    modalsStatus.type == 'DEL_FROM_CATEGORY'*/}
      {/*      ? modalsStatus.stored_temporary?.prodNm + ' 을 해당 카테고리의 상품 목록에서 삭제하시겠습니까?'*/}
      {/*      : modalsStatus.stored_temporary?.prodNm + ' 을 해당 카테고리의 상품 목록으로 추가하시겠습니까?'*/}
      {/*  }*/}
      {/*  confirmText={'확인'}*/}
      {/*  onConfirm={() => {*/}
      {/*    // todo 추후 제거*/}
      {/*    if (modalsStatus.type == 'DEL_FROM_CATEGORY') {*/}
      {/*      // 카테고리로부터 제거*/}
      {/*      deleteCategoryProductMutate({*/}
      {/*        id: modalsStatus.stored_temporary?.categoryProductId, // 이때의 id는 카테고리 연결상품정보 아이디(PK)*/}
      {/*      });*/}
      {/*    } else {*/}
      {/*      // 카테고리로 추가*/}
      {/*      insertCategoryProductMutate({*/}
      {/*        categoryId: modalsStatus.stored_temporary?.categoryId,*/}
      {/*        productId: modalsStatus.stored_temporary?.id,*/}
      {/*      });*/}
      {/*    }*/}
      {/*  }}*/}
      {/*  onClose={() => {*/}
      {/*    setModalsStatus((prevState) => {*/}
      {/*      return {*/}
      {/*        ...prevState,*/}
      {/*        active: false,*/}
      {/*        stored_temporary: undefined,*/}
      {/*      };*/}
      {/*    });*/}
      {/*  }}*/}
      {/*/>*/}
    </div>
  );
};

export default ProductForEachCategoryPop;
