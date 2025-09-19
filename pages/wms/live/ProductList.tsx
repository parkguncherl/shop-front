import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent, RowClassParams } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { authApi } from '../../../libs';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { LbProdResponsePaging } from '../../../generated';
import { LiveExcelUploadPop } from '../../../components/popup/wms/system/storedatamigration/LiveExcelUploadPop';
import { useProductListStore } from '../../../stores/wms/useProductListStore';
import VersionSellerMapPop from '../../../components/wms/live/VersionSellerMapPop';
import { DropDownOption } from '../../../types/DropDownOptions';
import { ConfirmModal } from '../../../components/ConfirmModal';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const ProductList = () => {
  // 메뉴 정보
  const [upMenuNm, menuNm, getFileUrl] = useCommonStore((s) => [s.upMenuNm, s.menuNm, s.getFileUrl]);
  const [showExcelUploadPopup, setShowExcelUploadPopup] = useState(false);
  const [uploadType, setUploadType] = useState<string>('VERSION');
  const [sellerName, setSellerName] = useState<string>('');
  const [selectSeller, setSelectSeller] = useState<DropDownOption[]>([]);
  const [productList, setProductList] = useState<LbProdResponsePaging[]>([]);
  const gridKey = useRef<number>(0);
  const [makeLiveExcel, makeLiveExcelEnglish, updateSellingProd, modalType, openModal, closeModal, initInvenData] = useProductListStore((s) => [
    s.excelDown,
    s.excelDownEnglish,
    s.updateSellingProd,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.initInvenData,
  ]);
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<AgGridReact>(null);

  const fetchSellerData = async () => {
    const { data: dataList } = await authApi.get(`/wms/lbProd/versionSellerMapList/` + filters.lbVersion);
    const { resultCode, body, resultMessage } = dataList;
    if (resultCode === 200) {
      console.log('versionSellerMapList body ====>', body);
      const sellerData: any = body.map((data: any) => ({
        key: filters.lbVersion + data.lbVersionSellerId,
        value: data.lbVersionSellerId,
        label: data.lbSellerNm,
      }));

      setSelectSeller(sellerData);
    } else {
      toastError(resultMessage);
    }
  };

  const { mutate: updateSellingProdMutate } = useMutation(updateSellingProd, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await refetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: initInvenDataMutate } = useMutation(initInvenData, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess(e.data.resultMessage);
          await refetch();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    lbPartnerId: '',
    lbVersionSellerId: 0,
    lbVersion: '',
    prodNm: '',
    status: 'Y',
    lbGubun: '',
  });
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<LbProdResponsePaging[]>([]); // 합계데이터 만들기
  const gridColumns = useMemo<ColDef<LbProdResponsePaging>[]>(
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
        field: 'lbVersion',
        headerName: 'VERSION',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'prodId',
        headerName: '상품ID',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'lbGubun',
        headerName: '구분',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditor: 'agSelectCellEditor', // 커스텀 에디터
        cellEditorParams: {
          values: ['신상', '세일', '팔끝', '휴면', '품절'], // 단순 배열로 변경
        },
        onCellValueChanged: (params) => {
          // 구분 값 변경 시 처리할 로직
          updateSellingProdMutate({ updateType: 'P', lbProdId: params.data.id, lbGubun: params.newValue });
        },
      },
      {
        field: 'lbPartnerNm',
        headerName: '고객사',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '원본sku명',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        minWidth: 150,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'color',
        headerName: '색상',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'engColor',
        headerName: 'COLOR',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        hide: true,
      },
      {
        field: 'size',
        headerName: '사이즈',
        minWidth: 70,
        maxWidth: 70,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'dispSkuNm',
        headerName: '스큐명',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'domaeAmt',
        headerName: '도매가',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
        onCellValueChanged: (params) => {
          // 구분 값 변경 시 처리할 로직
          updateSellingProdMutate({ updateType: 'P', lbProdId: params.data.id, domaeAmt: params.newValue });
        },
        editable: true,
      },
      {
        field: 'sellAmt',
        headerName: '판매가',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
        onCellValueChanged: (params) => {
          // 구분 값 변경 시 처리할 로직
          updateSellingProdMutate({ updateType: 'P', lbProdId: params.data.id, sellAmt: params.newValue });
        },
        editable: true,
      },
      {
        field: 'minSellAmt',
        headerName: '최소판매가',
        minWidth: 120,
        maxWidth: 120,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
        onCellValueChanged: (params) => {
          // 구분 값 변경 시 처리할 로직
          updateSellingProdMutate({ updateType: 'P', lbProdId: params.data.id, minSellAmt: params.newValue });
        },
        editable: true,
      },
      {
        field: 'skuCnt',
        headerName: '현재고',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
        onCellValueChanged: (params) => {
          // 구분 값 변경 시 처리할 로직
          updateSellingProdMutate({ updateType: 'P', lbProdId: params.data.id, skuCnt: params.newValue });
        },
        editable: true,
      },
      {
        field: 'sellCnt',
        headerName: '판매량',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'totSellAmt',
        headerName: '판매금액',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'sellingEtc',
        headerName: '비고',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
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

  useEffect(() => {
    if (filters.lbVersion && Number(filters.lbVersion) > 0) {
      setSelectSeller([]);
      setTimeout(() => {
        fetchSellerData();
      }, 10);
    }
  }, [filters.lbVersion]);

  // 출고정보 목록 조회
  const {
    data: lbProds,
    isFetching,
    isSuccess: isPagingSuccess,
    refetch,
  } = useQuery({
    queryKey: ['/wms/lbProd/paging'], // filters 추가
    queryFn: (): any =>
      authApi.get('/wms/lbProd/paging', {
        params: {
          ...filters,
        },
      }),
  });

  useEffect(() => {
    if (isPagingSuccess && lbProds?.data) {
      const { resultCode, body, resultMessage } = lbProds.data;
      if (resultCode === 200) {
        setProductList(body.rows);
      }
    }
  }, [lbProds, isPagingSuccess]);

  useEffect(() => {
    console.log('pinnedBottomRowData ==>', pinnedBottomRowData);
    if (productList && productList.length > 0) {
      const { sellCnt, totSellAmt } = productList.reduce(
        (
          acc: {
            sellCnt: number;
            totSellAmt: number;
          },
          data: LbProdResponsePaging,
        ) => {
          return {
            sellCnt: acc.sellCnt + (data.sellCnt ? data.sellCnt : 0),
            totSellAmt: acc.totSellAmt + (data.totSellAmt ? data.totSellAmt : 0),
          };
        },
        {
          sellCnt: 0,
          totSellAmt: 0,
        }, // 초기값 설정
      );

      setPinnedBottomRowData([
        {
          no: undefined,
          sellCnt: sellCnt,
          totSellAmt: totSellAmt,
        },
      ]);
    } else {
      setPinnedBottomRowData([
        {
          no: undefined,
          skuCnt: undefined,
          sellCnt: 0,
          totSellAmt: 0,
        },
      ]);
    }

    gridKey.current++;
  }, [productList]);

  const [files, setFiles] = useState<any[]>([]);
  const getFileList = async (fileId: any, type?: string) => {
    if (fileId && Number(fileId) < 1) {
      console.warn('fileId가 없습니다. API 호출하지 않음.');
      return -1; // fileId가 없으면 함수 종료
    }

    try {
      const { data: fileList } = await authApi.get(`/common/file/${fileId}`);
      const { resultCode, body, resultMessage } = fileList;
      if (resultCode === 200) {
        if (type === 'row') {
          return body;
        }
        return body?.length ?? -1;
      }
      return -1;
    } catch (error) {
      console.error('파일 조회 중 오류 발생:', error);
      return -1;
    }
  };

  /** row선택 이벤트 (이미지) */
  const onSelectionChanged = (e: any) => {
    const selectedRows = e.api.getSelectedRows();
    if (selectedRows[0]?.imgFileId) {
      getFileList(selectedRows[0]?.imgFileId, 'row').then(async (fileList) => {
        // 각 파일의 URL
        const updatedFiles = await Promise.all(
          fileList.map(async (file: any) => {
            const fileUrl = await getFileUrl(file.sysFileNm);
            return { ...file, url: fileUrl };
          }),
        );

        setFiles(updatedFiles);
      });
    } else {
      setFiles([]); // 초기화
    }
  };

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

  const exportToExcel = () => {
    gridRef.current?.api.exportDataAsExcel();
  };

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    if (keyBoardEvent.key === 'Enter') {
      updateSellingProdMutate({ updateType: 'E', lbSellingId: event.data.lbSellingId, sellingEtc: event.data.sellingEtc });
    }
  };

  const checkLbname = async () => {
    return authApi.get('/wms/lbProd/getSellerName', { params: { codeUpper: '80001', lbVersionSellerId: filters.lbVersionSellerId } });
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <Search.DropDown
          title={'VERSION'}
          name={'lbVersion'}
          dropDownStyle={{ width: '150px' }}
          codeUpper={'80002'}
          value={filters.lbVersion}
          onChange={onChangeFilters}
          sort={'DESC'}
        />
        <Search.DropDown
          title={'라방셀러'}
          name={'lbVersionSellerId'}
          dropDownStyle={{ width: '250px' }}
          value={filters.lbVersionSellerId || ''}
          onChange={onChangeFilters}
          defaultOptions={selectSeller}
        />
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
          name={'prodNm'}
          placeholder={'상품명 입력'}
          value={filters.prodNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.DropDown title={'판매'} name={'status'} value={filters.status} onChange={onChangeFilters} defaultOptions={[{ value: 'Y', label: '판매' }]} />
        <Search.DropDown
          title={'구분'}
          name={'lbGubun'}
          value={filters.lbGubun}
          onChange={onChangeFilters}
          defaultOptions={[
            { value: '신상', label: '신상' },
            { value: '세일', label: '세일' },
            { value: '팔끝', label: '팔끝' },
            { value: '휴면', label: '휴면' },
            { value: '품절', label: '품절' },
            { value: '휴면/품절제외', label: '휴면/품절제외' },
          ]}
        />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={lbProds?.data?.body?.rows?.length || 0} search={onSearch} gridRef={gridRef}>
          {' '}
          <CustomShortcutButton className={`btn on`} title="엑셀다운로드" onClick={exportToExcel} shortcut={COMMON_SHORTCUTS.alt1}>
            엑셀다운로드
          </CustomShortcutButton>
        </TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={'layout100'}>
                <div className="InfoGrid" ref={topGridDivRef}>
                  <TunedGrid<LbProdResponsePaging>
                    ref={gridRef}
                    rowData={productList}
                    columnDefs={gridColumns}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    onCellKeyDown={onCellKeyDown}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    onSelectionChanged={onSelectionChanged}
                    rowSelection={'multiple'}
                    className={'wmsDashboard check'}
                    getRowClass={getRowClass}
                    pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
                    loading={isFetching}
                    singleClickEdit={true}
                    key={gridKey.current}
                  />
                  <div className="btnArea">
                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion) {
                          openModal('VERSION_SELLER_MAP');
                        } else {
                          toastError('버전을 선택하고 업로드 하세요 ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.NONE}
                      className="btn"
                    >
                      버전별 셀러관리
                    </CustomShortcutButton>

                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion) {
                          setShowExcelUploadPopup(true);
                          setUploadType('VERSION');
                        } else {
                          toastError('버전을 선택하고 업로드 하세요 ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.NONE}
                      className="btn"
                    >
                      판매상품 데이터 업로드
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion) {
                          openModal('INIT_INVEN_DATA');
                        } else {
                          toastError('버전을 선택하고 초기화 해야 합니다. ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.NONE}
                      className="btn"
                    >
                      재고정보 초기화
                    </CustomShortcutButton>

                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion) {
                          setShowExcelUploadPopup(true);
                          setUploadType('INVEN');
                        } else {
                          toastError('버전을 선택하고 업로드 하세요 ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.NONE}
                      className="btn"
                    >
                      재고정보 업데이트
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion && filters.lbVersionSellerId) {
                          checkLbname().then((result) => {
                            if (result.data.resultCode == 200) {
                              if (result.data.body) {
                                setSellerName(result.data.body);
                                setShowExcelUploadPopup(true);
                                setUploadType('SELLER');
                              } else {
                                toastError(result.data.resultMessage);
                              }
                            } else {
                              toastError('라방 셀러면 검색오류');
                            }
                          });
                        } else {
                          toastError('버전 과 판매실적을 업로드할 셀러를 선택 하세요 ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.save}
                      className="btn"
                    >
                      셀러별 판매량 업데이트
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion && filters.lbVersionSellerId) {
                          makeLiveExcel(filters);
                        } else {
                          toastError('버전과 셀러가 선택되어야 파일을 생성할 수 있습니다. ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.save}
                      className="btn"
                    >
                      라방파일(한글)생성하기
                    </CustomShortcutButton>
                    <CustomShortcutButton
                      onClick={() => {
                        if (filters.lbVersion && filters.lbVersionSellerId) {
                          makeLiveExcelEnglish(filters);
                        } else {
                          toastError('버전과 셀러가 선택되어야 파일을 생성할 수 있습니다. ');
                        }
                      }}
                      shortcut={COMMON_SHORTCUTS.save}
                      className="btn"
                    >
                      라방파일(영문)생성하기
                    </CustomShortcutButton>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 미리보기 & 프린트 */}

          <div className="previewBox"></div>
        </div>
      </div>
      {showExcelUploadPopup && (
        <LiveExcelUploadPop
          lbVersion={filters.lbVersion}
          uploadType={uploadType}
          lbVersionSellerId={filters.lbVersionSellerId}
          sellerName={sellerName}
          refetch={refetch}
          onClose={() => setShowExcelUploadPopup(false)}
        />
      )}
      <VersionSellerMapPop versionId={Number(filters.lbVersion)} fetchPopUp={fetchSellerData} />
      <ConfirmModal
        title={'선택된 버전의 재고 수량데이터를 초기화 할까요?'}
        open={modalType.type === 'INIT_INVEN_DATA' && modalType.active}
        onConfirm={() => {
          initInvenDataMutate(filters.lbVersion);
        }}
        onClose={() => {
          closeModal('INIT_INVEN_DATA');
        }}
      />
    </div>
  );
};

export default ProductList;
