'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Table, Title, toastSuccess } from '@/components';
import {
  ProductMngRequestProductDetInfoFilter,
  ProductMngRequestProductInfoFilter,
  ProductMngResponseProductDetInfo,
  ProductMngResponseProductInfo,
} from '@/generated';
import { CellClickedEvent, CellStyle, ColDef, ICellEditorParams, ICellRendererParams } from 'ag-grid-community';
import { TableHeader, toastError } from '@/components';
import { useCommonStore } from '@/stores';
import { useMutation, useQuery } from '@tanstack/react-query';
import { defaultColDef, GridSetting } from '@/libs/ag-grid';
import { useAgGridApi } from '@/hooks';
import { authApi } from '@/libs';
import TunedGrid, { TunedGridRef } from '@/components/grid/TunedGrid';
import useFilters from '@/hooks/useFilters';
import { useProductMngStore } from '@/stores/product/useProductMngStore';
import { PARTNER_CODE, Placeholder } from '@/libs/const';
import SrcEnumerator, { SrcElement, SrcEnumeratorProps } from '@/components/layout/product/productMng/SrcEnumerator';
import { FileUploadPop } from '@/components/popup/common';
import ProductInfoAddPop from '@/components/popup/product/productMng/ProductInfoAddPop';
import ProductModPop from '@/components/popup/product/productMng/ProductModPop';
import ProductDetInfoPop from '@/components/popup/product/productMng/ProductDetInfoPop';
import { usePartnerCodeStore } from '@/stores/usePartnerCodeStore';
import { usePartnerList } from '@/customHook/usePartnerList';
import { usePartnerCodeList } from '@/customHook/usePartnerCodeList';
import { PartnerCodePop } from '@/components/popup/system/PartnerCodePop';
import { ConfirmModal } from '@/components/ConfirmModal';
import ImageZoomPop from '@/components/popup/common/ImageZoomPop';
import ImgEditPop, { ImgPropsOnEditPop } from '@/components/popup/common/ImgEditPop';
import { useVendorList } from '@/customHook/useVendorList';

type targetedFileTypes = 'rep' | 'detail' | 'size' | 'etc';

/** 목록 행 + 대표이미지 썸네일 URL (repFileId 로부터 비동기 해석) */
type ProductInfoWithImg = ProductMngResponseProductInfo & { imgUrl?: string };

/** 계절 필터 키 (선택 시 'Y' 로 전달, 복수 선택은 OR 조건) */
type ProductInfoFilters = ProductMngRequestProductInfoFilter & { partnerId?: number };

interface targetedFileSetsElementInfo extends SrcElement {
  //fileSeq?: number;
  //fileSrc?: string;
}
interface targetedFileSetInfo extends Omit<SrcEnumeratorProps, 'title' | 'srcInfo'> {
  type?: targetedFileTypes; // 색상 등의 경우 undefined
  rowData: ProductMngResponseProductInfo; // file 호출을 요청하게끔 한 상호작용이 발생한 행의 data
  fileId: number;
  fileInfos: targetedFileSetsElementInfo[];
}

/** 시스템 - 상품관리 페이지 */
const SellProductMng = () => {
  /** Grid Api */
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<TunedGridRef<ProductInfoWithImg>>(null);
  /** 공통 스토어 - State */
  const upMenuNm = useCommonStore((s) => s.upMenuNm);
  const menuNm = useCommonStore((s) => s.menuNm);
  const getFileUrl = useCommonStore((s) => s.getFileUrl);
  const getFileUrls = useCommonStore((s) => s.getFileUrls);
  /** 이미지 확대보기 팝업 */
  const [zoomImg, setZoomImg] = useState<{ url: string; title?: string } | null>(null);
  const selectFileList = useCommonStore((s) => s.selectFileList);
  const updateImageFile = useCommonStore((s) => s.updateImageFile);
  const uploadImageFiles = useCommonStore((s) => s.uploadImageFiles);
  const deleteFile = useCommonStore((s) => s.deleteFile);
  const vendorList = useVendorList();
  /** 품목관리 스토어 - State */
  const modals = useProductMngStore((s) => s.modals);
  const openModal = useProductMngStore((s) => s.openModal);
  const closeModal = useProductMngStore((s) => s.closeModal);
  const deleteProduct = useProductMngStore((s) => s.deleteProduct);
  const partnerCodeModals = usePartnerCodeStore((s) => s.modals);
  const partnerCodeOpenModal = usePartnerCodeStore((s) => s.openModal);
  const partnerCodeCloseModal = usePartnerCodeStore((s) => s.closeModal);

  /** 검색 필터 */
  const [filters, onChangeFilters] = useFilters<ProductInfoFilters>({
    prodNm: undefined,
    partnerId: undefined,
    vendorId: undefined,
    categoryId: undefined,
    showYn: 'Y', // 기본값: 전시
  });

  /** 카테고리(P0001) 검색용 드롭다운 옵션 (+ 코드에 없는 '미등록' 항목을 화면에서 추가) */
  const { data: categoryCodeOptions = [] } = usePartnerCodeList({ codeUpper: PARTNER_CODE.categories.code });
  // categoryId = -1 은 '어떤 카테고리에도 등록되지 않은 상품' 을 의미하는 sentinel 값
  const categoryOptions = useMemo(() => [...categoryCodeOptions, { key: '-1', value: -1, label: '미등록' }], [categoryCodeOptions]);

  /** 계절 버튼 — 버튼마다 독립 boolean state (체크박스처럼 다중 선택) */
  const [isSpring, setIsSpring] = useState(false);
  const [isSummer, setIsSummer] = useState(false);
  const [isAutumn, setIsAutumn] = useState(false);
  const [isWinter, setIsWinter] = useState(false);

  const seasonButtons = [
    { label: '봄', active: isSpring, toggle: () => setIsSpring((v) => !v) },
    { label: '여름', active: isSummer, toggle: () => setIsSummer((v) => !v) },
    { label: '가을', active: isAutumn, toggle: () => setIsAutumn((v) => !v) },
    { label: '겨울', active: isWinter, toggle: () => setIsWinter((v) => !v) },
  ];

  const { data: partnerOptions = [] } = usePartnerList({ enabled: true });
  const [detFilters, onChangeDetFilters, onDetFiltersReset] = useFilters<ProductMngRequestProductDetInfoFilter>({
    prodId: undefined,
    prodDetColor: undefined,
  });

  /** local states */
  const [productInfoList, setProductInfoList] = useState<ProductInfoWithImg[]>([]);
  const [productDetInfo, setProductDetInfo] = useState<ProductMngResponseProductDetInfo | undefined>(undefined); // prodId + prodDetColor 조합으로 조회된 결과는 고유하리라 기대되니 배열이 아닌 단일 객체로 관리
  const [targetedFileSetInfo, setTargetedFileSetInfo] = useState<targetedFileSetInfo | undefined>(undefined);
  const [selectedRowsData, setSelectedRowsData] = useState<ProductMngResponseProductInfo | undefined>(undefined);

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          closeModal('PROD_DEL');
          await productInfosRefetch();
        } else {
          toastError(`컨텐츠 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: updateImageFileMutate } = useMutation({
    mutationFn: updateImageFile,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('컨텐츠가 정상 수정되었습니다.');
          closeModal('IMG_EDIT'); // 팝업 닫음
          if (targetedFileSetInfo?.fileId) {
            setTargetedFileSetInfo({
              ...targetedFileSetInfo,
              fileInfos: await selectFileList(targetedFileSetInfo?.fileId).then(async (fileDetList) => {
                const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                for (let index = 0; index < fileDetList.length; index++) {
                  fileSetsElementInfos.push({
                    fileNm: fileDetList[index].fileNm,
                    fileSeq: fileDetList[index].fileSeq,
                    fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                  });
                }
                return fileSetsElementInfos;
              }),
            });
          }
        } else {
          toastError(`컨텐츠 수정 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: uploadImageFilesMutate } = useMutation({
    mutationFn: uploadImageFiles,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('이미지가 정상적으로 업로드되었습니다.');
          closeModal('INIT_BOARD'); // 팝업 닫음
          if (targetedFileSetInfo?.fileId) {
            setTargetedFileSetInfo({
              ...targetedFileSetInfo,
              fileInfos: await selectFileList(targetedFileSetInfo?.fileId).then(async (fileDetList) => {
                const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                for (let index = 0; index < fileDetList.length; index++) {
                  fileSetsElementInfos.push({
                    fileNm: fileDetList[index].fileNm,
                    fileSeq: fileDetList[index].fileSeq,
                    fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                  });
                }
                return fileSetsElementInfos;
              }),
            });
          }
        } else {
          toastError(`이미지 업로드 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: deleteImgFileMutate } = useMutation({
    mutationFn: deleteFile,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('이미지가 정상적으로 삭제되었습니다.');
          closeModal('IMG_DEL_CONF'); // 팝업 닫음

          // targetedFileSetInfo 리프레쉬
          if (targetedFileSetInfo?.fileId) {
            setTargetedFileSetInfo({
              ...targetedFileSetInfo,
              fileInfos: await selectFileList(targetedFileSetInfo?.fileId).then(async (fileDetList) => {
                const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                for (let index = 0; index < fileDetList.length; index++) {
                  fileSetsElementInfos.push({
                    fileNm: fileDetList[index].fileNm,
                    fileSeq: fileDetList[index].fileSeq,
                    fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                  });
                }
                return fileSetsElementInfos;
              }),
            });
          }
          productInfosRefetch();
        } else {
          console.log('e.data.resultMessage: ', e.data.resultMessage);
          toastError(`이미지 삭제 도중 문제 발생 (${e.data.resultMessage})`);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 품목정보 목록 조회 */
  const {
    data: productInfos,
    isSuccess: isProductInfosSuccess,
    isLoading: isProductInfosLoading,
    refetch: productInfosRefetch,
  } = useQuery({
    queryKey: [
      '/productMng/productInfoList',
      {
        partnerId: filters.partnerId,
        vendorId: filters.vendorId,
        categoryId: filters.categoryId,
        showYn: filters.showYn,
        prodNm: filters.prodNm,
        // 계절 선택은 즉시 재조회되도록 키에 포함
        isSpring,
        isSummer,
        isAutumn,
        isWinter,
      },
    ],
    queryFn: () =>
      authApi.get('/productMng/productInfoList', {
        params: {
          ...filters,
          // 선택된 계절만 'Y' 로 전달 (미선택은 undefined → 파라미터 제외)
          isSpring: isSpring ? 'Y' : undefined,
          isSummer: isSummer ? 'Y' : undefined,
          isAutumn: isAutumn ? 'Y' : undefined,
          isWinter: isWinter ? 'Y' : undefined,
        },
      }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isProductInfosSuccess) {
      const { resultCode, body, resultMessage } = productInfos.data;
      if (resultCode === 200) {
        const rows: ProductInfoWithImg[] = body || [];
        // 대표이미지 썸네일 URL 해석
        // 목록 응답에 repSysFileNm 이 포함되므로, 행별 파일조회 없이 presigned url 만 1회로 일괄 조회한다.
        const keys = rows.map((r) => (r as any).repSysFileNm as string | undefined).filter((k): k is string => !!k);
        if (keys.length === 0) {
          setProductInfoList(rows);
        } else {
          getFileUrls(keys)
            .then((urlMap) =>
              setProductInfoList(
                rows.map((row) => {
                  const key = (row as any).repSysFileNm as string | undefined;
                  return key ? { ...row, imgUrl: urlMap[key] } : { ...row };
                }),
              ),
            )
            .catch(() => setProductInfoList(rows));
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [productInfos, isProductInfosSuccess]);

  /** 품목상세정보 목록 조회 */
  const { data: productDetInfos, isSuccess: isProductDetInfosSuccess } = useQuery({
    queryKey: ['/productMng/productDetInfoList', detFilters.prodDetColor],
    queryFn: () =>
      authApi.get('/productMng/productDetInfoList', {
        params: {
          ...detFilters,
        },
      }),
    refetchOnMount: 'always',
    enabled: detFilters.prodId != undefined,
  });

  useEffect(() => {
    if (isProductDetInfosSuccess) {
      const { resultCode, body, resultMessage } = productDetInfos.data;
      if (resultCode === 200) {
        if (body.length > 1) {
          console.error('단일 반환을 기대하였으나 다수의 데이터 반환됨, 데이터 오염 여부 점검!');
          return;
        }
        setProductDetInfo(body[0]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [productDetInfos, isProductDetInfosSuccess]);

  useEffect(() => {
    const targetedFileSetInfoRefreshFn = async (productDetInfo: ProductMngResponseProductDetInfo | undefined): Promise<targetedFileSetInfo | undefined> => {
      if (productDetInfo == undefined || !productDetInfo.fileId) {
        setTargetedFileSetInfo(undefined); // state 초기화
        return;
      }
      return {
        type: undefined, // 색상이므로
        rowData: productInfoList.filter((productInfo) => productInfo.id == productDetInfo.productId)[0],
        fileId: productDetInfo.fileId as number,
        fileInfos: await selectFileList(productDetInfo.fileId as number).then(async (fileDetList) => {
          console.log('fileDetList: ', fileDetList);
          const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
          for (let index = 0; index < fileDetList.length; index++) {
            fileSetsElementInfos.push({
              fileSeq: fileDetList[index].fileSeq,
              fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
            });
          }
          return fileSetsElementInfos;
        }),
      };
    };
    targetedFileSetInfoRefreshFn(productDetInfo).then((updatedFileSetInfo) => {
      setTargetedFileSetInfo(updatedFileSetInfo);
    });
  }, [productDetInfo]);

  /** 컬럼 설정 */
  // rowHeight 를 키우면 textAlign 만으로는 글자가 위로 붙으므로, 셀마다 세로 중앙 정렬을 함께 준다
  // (ProdGroupMng 와 동일한 방식)
  const rcCenter: CellStyle = { ...GridSetting.CellStyle.CENTER, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const rcLeft: CellStyle = { ...GridSetting.CellStyle.LEFT, display: 'flex', alignItems: 'center' };
  const rcRight: CellStyle = { ...GridSetting.CellStyle.RIGHT, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' };

  const columnDefs = useMemo<ColDef<ProductInfoWithImg>[]>(
    () => [
      {
        field: 'no',
        headerName: 'NO',
        minWidth: 35,
        maxWidth: 35,
        valueGetter: (params) => (params.node ? (params.node.rowIndex ?? 0) + 1 : ''),
        cellStyle: rcCenter,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'imgUrl',
        headerName: '이미지',
        suppressHeaderMenuButton: true,
        minWidth: 56,
        maxWidth: 56,
        cellStyle: { padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        cellRenderer: (params: { value?: string; data?: ProductInfoWithImg }) =>
          params.value ? (
            <img
              src={params.value}
              title="클릭하면 크게 보기"
              style={{ height: '46px', width: '46px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
              onClick={() => setZoomImg({ url: params.value as string, title: params.data?.prodNm })}
            />
          ) : null,
      },
      { field: 'vendorNm', headerName: '협력업체', minWidth: 80, maxWidth: 80, suppressHeaderMenuButton: true },
      { field: 'prodNm', headerName: '품목명', minWidth: 200, maxWidth: 200, suppressHeaderMenuButton: true },
      { field: 'season', headerName: '계절', minWidth: 37, maxWidth: 37, suppressHeaderMenuButton: true, cellStyle: rcCenter },
      { field: 'prodSizes', headerName: '크기', minWidth: 90, maxWidth: 90, suppressHeaderMenuButton: true, cellStyle: rcCenter },
      {
        field: 'prodColors',
        headerName: '색상',
        minWidth: 145,
        maxWidth: 145,
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (params: ICellEditorParams) => {
          const splittedColors: string[] = params.value.split(',');
          return {
            values: splittedColors,
          };
        },
        // valueFormatter: (params) => {
        //   if (params.data?.representedProdColor) {
        //     return params.data?.representedProdColor; // representedProdColor 우선 출력
        //   }
        //   return params.value; // comma 단위로 쪼개어 나열된 기본 prodColors 반환
        // },
        valueSetter: (params) => {
          onChangeDetFilters('prodId', params.data.id);
          onChangeDetFilters('prodDetColor', params.newValue);

          setProductInfoList((prevState) =>
            prevState.map((prev) => {
              if (prev.id == params.data.id) {
                return {
                  ...prev,
                  representedProdColor: params.newValue,
                };
              }
              return prev;
            }),
          );

          // false를 반환하여 그리드 데이터 업데이트를 원천 차단
          return false;
        },
        suppressHeaderMenuButton: true,
      },
      { field: 'makeYmd', headerName: '등록', minWidth: 40, maxWidth: 40, suppressHeaderMenuButton: true, cellRenderer: 'MONTH_DAY', cellStyle: rcCenter },
      {
        field: 'relCount',
        headerName: '연계',
        minWidth: 33,
        maxWidth: 33,
        suppressHeaderMenuButton: true,
        cellStyle: (params) => ({
          ...rcCenter,
          ...(params.value != null && params.value < 1 ? { color: '#ff6b6b', fontWeight: 700, background: 'rgba(255, 80, 80, 0.12)' } : {}),
        }),
      },
      {
        field: 'orgAmt',
        headerName: '원가',
        minWidth: 56,
        maxWidth: 56,
        suppressHeaderMenuButton: true,
        cellStyle: rcRight,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'sellAmt',
        headerName: '판매가',
        minWidth: 56,
        maxWidth: 56,
        suppressHeaderMenuButton: true,
        cellStyle: rcRight,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'stock',
        headerName: '재고',
        minWidth: 40,
        maxWidth: 40,
        suppressHeaderMenuButton: true,
        cellStyle: rcRight,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'repFileIdCnt',
        headerName: '대표 IMG',
        minWidth: 58,
        maxWidth: 58,
        suppressHeaderMenuButton: true,
        // tblBtn 은 height 20px 고정 + margin 0 !important 이므로, 셀에서 수직 중앙 정렬해야 한다
        cellStyle: GridSetting.CellStyle.FLEX_CENTER,
        // 카운트를 버튼 형태로 노출 (실제 동작은 onCellClicked 에서 처리되므로 클릭 전파를 막지 않는다)
        // .tblBtn 기본 높이(20px)는 rowHeight 50 에서 얇아 보이므로 이 컬럼에서만 인라인으로 키운다
        // (전역 .tblBtn 은 코드관리 등 다른 화면과 공유하므로 건드리지 않는다)
        // 선택 상태는 조상 셀렉터(.ag-row-selected) 대신 버튼에 직접 .on 을 붙여 표현한다
        cellRenderer: (p: ICellRendererParams<ProductMngResponseProductInfo>) => (
          <button type={'button'} className={`tblBtn${p.node?.isSelected() ? ' on' : ''}`} style={{ width: '100%', height: '32px' }}>
            {p.value ?? 0} 건
          </button>
        ),
      },
      {
        field: 'detailFileIdCnt',
        headerName: '상세 IMG',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: rcCenter,
        hide: true,
      },
      {
        field: 'sizeFileIdCnt',
        headerName: 'SIZE',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: rcCenter,
        hide: true,
      },
      /*
      { field: 'etcFileIdCnt', headerName: '기타이미지', minWidth: 80, maxWidth: 80, suppressHeaderMenuButton: true, cellStyle: rcCenter },
*/
    ],
    [onChangeDetFilters],
  );

  /** 검색 버튼 클릭 시 */
  const search = async () => {
    await onSearch();
  };

  const onSearch = async () => {
    await productInfosRefetch();
  };

  const onCellClickedCallBack = async (event: CellClickedEvent<ProductInfoWithImg>) => {
    const cellsColField = event.column.getColDef().field;

    // 대표이미지 이하 4개의 컬럼 중 하나를 클릭하는 경우 동작
    if (cellsColField && ['repFileIdCnt', 'detailFileIdCnt', 'sizeFileIdCnt', 'etcFileIdCnt'].includes(cellsColField)) {
      // query cached 된 값으로 초기화(색상 목록과의 상호작용으로 어떠한 색상이 선택되어 있는 경우에 대한 초기화 동작)
      // 단, 비동기로 해석해둔 대표이미지 URL(imgUrl)은 유지한다.
      setProductInfoList((prevState) =>
        ((productInfos?.data.body || []) as ProductInfoWithImg[]).map((row) => ({
          ...row,
          imgUrl: prevState.find((prev) => prev.id === row.id)?.imgUrl,
        })),
      );
      onDetFiltersReset(); // 상세정보 필터 또한 초기화

      // if (event.data && (event.data[cellsColField as keyof ProductMngResponseProductInfo] as number) == 0) {
      //   // 카운트된 이미지 개수가 0인경우 초기화 동작 이하가 무의미하므로 return
      //   setTargetedFileSetInfo(undefined);
      //   return;
      // }

      if (cellsColField == 'repFileIdCnt') {
        if (targetedFileSetInfo?.fileId == event.data?.repFileId) {
          // 불필요한 수정(이미 동일한 fileId 이므로)
          return;
        }

        if (!event.data?.repFileId) {
          // 유효한 fileId를 찾을 수 없는 경우 초기화 동작 이하가 무의미하므로 return
          setTargetedFileSetInfo(undefined);
          return;
        }
        setTargetedFileSetInfo({
          type: 'rep',
          rowData: event.data,
          fileId: event.data.repFileId,
          fileInfos: await selectFileList(event.data.repFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileNm: fileDetList[index].fileNm,
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'detailFileIdCnt') {
        if (targetedFileSetInfo?.fileId == event.data?.detailFileId) {
          // 불필요한 수정(이미 동일한 fileId 이므로)
          return;
        }

        if (!event.data?.detailFileId) {
          // 유효한 fileId를 찾을 수 없는 경우 초기화 동작 이하가 무의미하므로 return
          setTargetedFileSetInfo(undefined);
          return;
        }
        setTargetedFileSetInfo({
          type: 'detail',
          rowData: event.data,
          fileId: event.data?.detailFileId,
          fileInfos: await selectFileList(event.data.detailFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'sizeFileIdCnt') {
        if (targetedFileSetInfo?.fileId == event.data?.sizeFileId) {
          // 불필요한 수정(이미 동일한 fileId 이므로)
          return;
        }

        if (!event.data?.sizeFileId) {
          // 유효한 fileId를 찾을 수 없는 경우 초기화 동작 이하가 무의미하므로 return
          setTargetedFileSetInfo(undefined);
          return;
        }
        setTargetedFileSetInfo({
          type: 'size',
          rowData: event.data,
          fileId: event.data?.sizeFileId,
          fileInfos: await selectFileList(event.data.sizeFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      } else if (cellsColField == 'etcFileIdCnt') {
        if (targetedFileSetInfo?.fileId == event.data?.etcFileId) {
          // 불필요한 수정(이미 동일한 fileId 이므로)
          return;
        }

        if (!event.data?.etcFileId) {
          // 유효한 fileId를 찾을 수 없는 경우 초기화 동작 이하가 무의미하므로 return
          setTargetedFileSetInfo(undefined);
          return;
        }
        setTargetedFileSetInfo({
          type: 'etc',
          rowData: event.data,
          fileId: event.data?.etcFileId,
          fileInfos: await selectFileList(event.data.etcFileId).then(async (fileDetList) => {
            const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
            for (let index = 0; index < fileDetList.length; index++) {
              fileSetsElementInfos.push({
                fileSeq: fileDetList[index].fileSeq,
                fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
              });
            }
            return fileSetsElementInfos;
          }),
        });
      }
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} />
      <Search className="type_2">
        <Search.DropDown
          title={'카테고리'}
          name={'categoryId'}
          value={filters.categoryId}
          onChange={(_name, value) => onChangeFilters('categoryId', value ? Number(value) : undefined)}
          defaultOptions={categoryOptions}
          showAll={true}
          dropDownStyle={{ width: '120px' }}
        />
        <Search.DropDown
          title={'협력업체'}
          name={'vendorId'}
          value={filters.vendorId}
          onChange={(_name, value) => onChangeFilters('vendorId', value ? Number(value) : undefined)}
          defaultOptions={vendorList.data}
          showAll={true}
          dropDownStyle={{ width: '120px' }}
        />
        <Search.Input title={'품목명'} name={'prodNm'} placeholder={Placeholder.Input} value={filters.prodNm} onChange={onChangeFilters} onEnter={onSearch} />
        <Search.DropDown
          title={'전시여부'}
          name={'showYn'}
          value={filters.showYn}
          onChange={onChangeFilters}
          defaultOptions={[
            { key: 'Y', value: 'Y', label: '전시' },
            { key: 'N', value: 'N', label: '미전시' },
          ]}
          showAll={true}
          dropDownStyle={{ width: '100px' }}
        />
        {/* 계절 — 버튼별 boolean state 로 체크박스처럼 다중 선택. 선택된 계절 중 하나라도 포함된 상품 조회 (미선택 = 전체) */}
        <dl>
          <dd>
            <div className="formBox" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {seasonButtons.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  /* 다크모드는 `.formBox button { ...!important }` 로 배경을 강제하는데,
                     그 예외가 segBtn--active 뿐이라 활성 시 이 클래스를 부여해야 색 반전이 유지된다 */
                  className={s.active ? 'segBtn segBtn--active' : 'segBtn'}
                  onClick={s.toggle}
                  style={{
                    height: 30,
                    padding: '0 8px',
                    minWidth: 34,
                    fontSize: 13,
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: `1px solid ${s.active ? '#5b21b6' : '#d9d9d9'}`,
                    background: s.active ? '#5b21b6' : '#f3f4f6',
                    color: s.active ? '#fff' : '#6b7280',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </dd>
        </dl>
      </Search>
      <Table>
        <div className="tblPreview">
          <div className="layoutBox">
            <div className={'layout75'}>
              <TableHeader count={productInfoList.length} search={search}></TableHeader>
              <TunedGrid<ProductInfoWithImg>
                headerHeight={35}
                // 46px 썸네일이 들어가도록 (ProdGroupMng 우측 그리드와 동일)
                rowHeight={50}
                ref={gridRef}
                onGridReady={onGridReady}
                loading={isProductInfosLoading}
                rowData={productInfoList}
                // 행 데이터가 통째로 교체돼도(onCellClicked 의 목록 초기화 등) 행 노드 동일성이 유지되어
                // 선택 상태가 풀리지 않도록 한다 (ProdGroupMng 와 동일)
                getRowId={(params) => String(params.data.id)}
                // getRowId 로 행 노드를 재사용하면 데이터가 안 바뀐 셀은 다시 그리지 않는다.
                // NO 컬럼은 데이터가 아니라 rowIndex 기반이라 필터 후 이전 순번이 남으므로,
                // 모델(데이터/필터/정렬)이 갱신될 때 해당 컬럼만 강제로 다시 그린다.
                onModelUpdated={(e) => e.api.refreshCells({ columns: ['no'], force: true })}
                columnDefs={columnDefs}
                // cellStyle 을 따로 지정하지 않은 컬럼도 세로 중앙 정렬되도록 기본값을 준다
                // (공용 defaultColDef 는 제네릭 없는 ColDef 라 field 타입 충돌 방지를 위해 캐스팅)
                defaultColDef={{ ...(defaultColDef as ColDef<ProductInfoWithImg>), cellStyle: rcLeft }}
                rowClassRules={{ 'row-muted': (p) => (p.data as any)?.showYn === 'N' }}
                rowSelection={{
                  mode: 'singleRow',
                  enableClickSelection: true,
                }}
                onSelectionChanged={(event) => {
                  const selectedRows = event.api.getSelectedRows();
                  setSelectedRowsData(selectedRows.length > 0 ? selectedRows[0] : undefined);
                  // 선택 여부에 따라 버튼 상태가 바뀌므로 해당 컬럼 셀만 강제로 다시 그린다
                  event.api.refreshCells({ columns: ['repFileIdCnt'], force: true });
                }}
                popupParent={typeof document !== 'undefined' ? document.body : undefined} // ag grid 내장 드롭다운 사용 시 그리드가 사라지는 현상을 방지하기 위하여 document.body 영역을 popup의 부모 요소로 명시 박근철 수정
                onCellClicked={onCellClickedCallBack}
                onRowDoubleClicked={() => openModal('PROD_MOD')}
                className={'default check'}
              />
              <div className="btnArea between">
                <div className="left">
                  <button
                    className={'btn btn_primary'}
                    onClick={() => {
                      partnerCodeOpenModal('PARTNER_CODE_P0001_OPEN');
                    }}
                  >
                    카테고리
                  </button>
                </div>
                <div className="right">
                  <button
                    className={'btn btn_primary'}
                    onClick={() => {
                      openModal('PROD_INFO_ADD');
                    }}
                  >
                    등록
                  </button>
                  <button
                    className={'btn btn_primary'}
                    onClick={() => {
                      // 행 더블클릭과 동일하게 수정 팝업 오픈 (선택된 행 필요)
                      if (selectedRowsData == undefined) {
                        toastError('수정하실 품목 ROW 를 선택하세요');
                      } else {
                        openModal('PROD_MOD');
                      }
                    }}
                  >
                    수정
                  </button>
                  <button
                    className={`btn btn_primary`}
                    onClick={() => {
                      if (selectedRowsData == undefined) {
                        toastError('품목 상세를 보시고자 하는 ROW 를 선택하세요');
                      } else {
                        openModal('PROD_DET_INFO');
                      }
                    }}
                  >
                    {`색상/사이즈`}
                  </button>
                </div>
              </div>
            </div>
            <div className={'layout25'}>
              <SrcEnumerator
                title={{
                  left: !targetedFileSetInfo
                    ? ''
                    : `${targetedFileSetInfo?.rowData.prodNm ? '[' + targetedFileSetInfo?.rowData.prodNm + ']' : ''} ${
                        targetedFileSetInfo?.type == 'rep'
                          ? '대표이미지'
                          : targetedFileSetInfo?.type == 'detail'
                            ? '상세이미지'
                            : targetedFileSetInfo?.type == 'size'
                              ? '사이즈이미지'
                              : targetedFileSetInfo?.type == 'etc'
                                ? '기타이미지'
                                : detFilters.prodDetColor != undefined
                                  ? detFilters.prodDetColor
                                  : '알수 없음'
                      }`,
                }}
                srcInfo={
                  targetedFileSetInfo?.fileId != undefined
                    ? {
                        fileId: targetedFileSetInfo?.fileId,
                        srcElements: [...(targetedFileSetInfo?.fileInfos || [])],
                      }
                    : undefined
                }
                callBack={{
                  onToUpperReqSuccess: async () => {
                    const targetedFileSetInfoRefreshFn = async (prevState: targetedFileSetInfo | undefined) => {
                      return {
                        ...prevState,
                        fileInfos: !prevState?.fileId
                          ? undefined
                          : await selectFileList(prevState.fileId).then(async (fileDetList) => {
                              const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                              for (let index = 0; index < fileDetList.length; index++) {
                                fileSetsElementInfos.push({
                                  fileSeq: fileDetList[index].fileSeq,
                                  fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                                });
                              }
                              return fileSetsElementInfos;
                            }),
                      } as targetedFileSetInfo;
                    };

                    const refreshedTargetedFileSetInfo = await targetedFileSetInfoRefreshFn(targetedFileSetInfo);
                    setTargetedFileSetInfo(refreshedTargetedFileSetInfo);
                  },
                  onImgDoubleClick: (event) => {
                    openModal('IMG_EDIT', {
                      imgFileId: targetedFileSetInfo?.fileId,
                      imgFileName: event.srcElement.fileNm,
                      seq: event.srcElement.fileSeq,
                      imgSrc: event.srcElement.fileSrc,
                    });
                    // setTargetedImgInfoForEdit({
                    //   imgFileId: targetedFileSetInfo?.fileId,
                    //   imgFileName: event.srcElement.fileNm,
                    //   seq: event.srcElement.fileSeq,
                    //   imgSrc: event.srcElement.fileSrc,
                    // });
                  },
                  delReqHandler: (event) => {
                    openModal('IMG_DEL_CONF', { imgFileId: targetedFileSetInfo?.fileId, fileSeq: event.srcElement.fileSeq });
                  },
                }}
              >
                <div className="btnArea between">
                  {targetedFileSetInfo?.fileId && (
                    <>
                      <div className="left"></div>
                      <div className="right">
                        <button
                          className={'btn btn_primary'}
                          onClick={() => {
                            openModal('INIT_BOARD');
                          }}
                        >
                          {'빈 캔버스'}
                        </button>
                        <button
                          className={'btn btn_primary'}
                          onClick={() => {
                            openModal('IMG_UPLOAD');
                          }}
                        >
                          {'업로드'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </SrcEnumerator>
            </div>
          </div>
        </div>
      </Table>
      <FileUploadPop
        open={modals.type == 'IMG_UPLOAD' && modals.active}
        onClose={() => closeModal('IMG_UPLOAD')}
        onlyImg={true}
        fileId={targetedFileSetInfo?.fileId}
        onSuccess={async () => {
          const targetedFileSetInfoRefreshFn = async (prevState: targetedFileSetInfo | undefined) => {
            return {
              ...prevState,
              fileInfos: !prevState?.fileId
                ? undefined
                : await selectFileList(prevState.fileId).then(async (fileDetList) => {
                    const fileSetsElementInfos: targetedFileSetsElementInfo[] = [];
                    for (let index = 0; index < fileDetList.length; index++) {
                      fileSetsElementInfos.push({
                        fileSeq: fileDetList[index].fileSeq,
                        fileSrc: fileDetList[index].sysFileNm ? await getFileUrl(fileDetList[index].sysFileNm as string) : undefined,
                      });
                    }
                    return fileSetsElementInfos;
                  }),
            } as targetedFileSetInfo;
          };

          const refreshedTargetedFileSetInfo = await targetedFileSetInfoRefreshFn(targetedFileSetInfo);
          setTargetedFileSetInfo(refreshedTargetedFileSetInfo);
          productInfosRefetch();
        }}
      />
      <ProductInfoAddPop
        //open={modals.active && (modals.type == 'PROD_INFO_ADD' || modals.type == 'PROD_DET_INFO_ADD')}
        open={modals.active && modals.type == 'PROD_INFO_ADD'}
        sizeInfo={(productInfoList[0] as unknown as { sizeInfo?: string } | undefined)?.sizeInfo}
        onClose={() => {
          closeModal(modals.type);
        }}
        onSuccess={() => {
          closeModal(modals.type);

          productInfosRefetch();
          onDetFiltersReset();
        }}
        //productInfo={modals.type == 'PROD_DET_INFO_ADD' ? selectedRowsData : undefined} todo
      />
      <ProductModPop
        open={modals.active && modals.type == 'PROD_MOD'}
        onClose={() => {
          closeModal(modals.type);
        }}
        onSuccess={() => {
          closeModal(modals.type);
          productInfosRefetch();
          onDetFiltersReset();
          gridRef.current?.api.deselectAll();
        }}
        productInfo={selectedRowsData}
      />
      <ProductDetInfoPop
        open={modals.active && modals.type == 'PROD_DET_INFO'}
        onClose={(modHasBeenDone) => {
          closeModal(modals.type);
          if (modHasBeenDone) {
            productInfosRefetch();
          }
        }}
        productInfo={selectedRowsData}
      />
      <PartnerCodePop
        partnerCodeUpper={PARTNER_CODE.categories.code}
        title={'품목카테고리관리'}
        activated={partnerCodeModals?.type === 'PARTNER_CODE_P0001_OPEN' && partnerCodeModals.active}
        codeName={PARTNER_CODE.categories.name}
        onCloseRequestEmerged={() => partnerCodeCloseModal('PARTNER_CODE_P0001_OPEN')}
      />
      <ConfirmModal
        open={modals.active && modals.type == 'PROD_DEL'}
        title={`${(modals.stored_temporary as ProductMngResponseProductInfo | undefined)?.prodNm} 을(를) 삭제 하시겠습니까?`}
        confirmText={'저장'}
        onConfirm={() => {
          if (modals.stored_temporary) {
            deleteProductMutate({
              id: (modals.stored_temporary as ProductMngResponseProductInfo).id,
            });
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => {
          closeModal('PROD_DEL');
        }}
      />
      <ImgEditPop
        open={modals.type == 'IMG_EDIT' && modals.active}
        onClose={() => closeModal('IMG_EDIT')}
        imgProps={modals.stored_temporary as ImgPropsOnEditPop | undefined}
        onFileIsExportedByConf={(file) => {
          // 기존 이미지 기반 교체(fileId, seq 기반 신규 버킷 오브젝트를 가리키도록 조정)
          const targetedImgInfoForEdit = modals.stored_temporary as ImgPropsOnEditPop | undefined;
          if (targetedImgInfoForEdit == undefined || targetedImgInfoForEdit.imgSrc == undefined) {
            console.error('배경 이미지 혹은 출처(src)를 찾을 수 없음');
            return;
          }
          if (!targetedImgInfoForEdit?.imgFileId) {
            console.error('이미지 파일 식별자(fileId)를 찾을 수 없음');
            return;
          }
          if (!targetedImgInfoForEdit.seq) {
            console.error('이미지의 순서(seq) 정보를 찾을 수 없음');
            return;
          }
          updateImageFileMutate({ fileId: targetedImgInfoForEdit.imgFileId, fileSeq: targetedImgInfoForEdit.seq, uploadFile: file });
        }}
      />
      <ImgEditPop
        open={modals.type == 'INIT_BOARD' && modals.active}
        onClose={() => closeModal('INIT_BOARD')}
        imgProps={undefined}
        onFileIsExportedByConf={(file) => {
          if (!targetedFileSetInfo?.fileId) {
            console.error('현재의 대상 이미지 목록 식별자(fileId)를 찾을 수 없음');
            return;
          }
          uploadImageFilesMutate({ fileId: targetedFileSetInfo?.fileId, uploadFiles: [file] }); // 화이트보드 캔버스의 작성물 업로드
        }}
      />
      <ConfirmModal
        open={modals.active && modals.type == 'IMG_DEL_CONF'}
        title={'선택하신 이미지를 삭제 하시겠습니까?'}
        confirmText={'삭제'}
        onConfirm={() => {
          if (modals.stored_temporary) {
            deleteImgFileMutate({
              fileId: (modals.stored_temporary as any).imgFileId,
              fileSeq: (modals.stored_temporary as any).fileSeq,
            });
          } else {
            toastError('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
            console.error('저장하고자 하는 입력 결과를 찾을 수 없습니다.');
          }
        }}
        onClose={() => closeModal('IMG_DEL_CONF')}
      />

      <ImageZoomPop open={zoomImg != null} imgUrl={zoomImg?.url} title={zoomImg?.title} onClose={() => setZoomImg(null)} />
    </div>
  );
};

export default SellProductMng;
