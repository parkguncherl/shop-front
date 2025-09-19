import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { AsnMngResponsePaging, AsnMngRequestDelete, AsnMngResponseInventoryLedgerPaging, ReceivingHistoryRequestFactorySpc } from '../../../generated';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef, RowClassParams } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import TunedGrid from '../../../components/grid/TunedGrid';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import { useSession } from 'next-auth/react';
import { AgGridReact } from 'ag-grid-react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import dayjs from 'dayjs';
import { Utils } from '../../../libs/utils';
import { DropDownOption } from '../../../types/DropDownOptions';
import { AsnStatCd } from '../../../libs/const';
import CustomTooltip from '../../../components/CustomTooltip';
import DataMigrationPop from '../../../components/popup/wms/system/DataMigrationPop';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';

/** 재고장 페이지 */
const InventoryLedger = () => {
  const session = useSession();
  const nowPage = 'oms_inventoryLedger'; // filter 저장 예솔수정실패함
  /** Grid Api */
  const InventoryLedgerGridRef = useRef<AgGridReact>(null);
  /** 공통 스토어 - State */
  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, // filter 저장 예솔수정실패함
    s.setFilterDataList, // filter 저장 예솔수정실패함
    s.getFilterData, // filter 저장 예솔수정실패함
  ]);

  /** 예솔수정 하단합계 */
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<AsnMngResponseInventoryLedgerPaging[]>([]);

  /** asnMng 스토어 */
  const [paging, setPaging, modalType, openModal, closeModal, updateAsns, deleteAsns] = useAsnMngStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.updateAsns,
    s.deleteAsns,
  ]);

  /** 생산처품목 단가DC 저장 */
  const [upsertFactorySpc] = useReceivingHistoryStore((s) => [s.upsertFactorySpc]);

  const [inventoryLedgerList, setInventoryLedgerList] = useState<AsnMngResponseInventoryLedgerPaging[]>([]);
  const [delEventType, setDelEventType] = useState('발주삭제');
  const [errorPop, setErrorPop] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const [prevFilters] = useState(() => getFilterData(filterDataList, nowPage));

  console.log('0filters ===============================>', prevFilters);
  /** 필터저장 예솔수정실패함 */
  const [filters, onChangeFilters] = useFilters(
    prevFilters || {
      searchType: '작업',
      asnRepareType: 'N', //수선분 유무
      searchDesignNm: '',
      searchProdNm: '',
      startDate: Utils.getStartDayBeforeMonth(12), // 디폴트는 12개월 부터 조회
      endDate: today, // 오늘날짜
    },
  );

  const onSearch = async () => {
    setTimeout(() => {
      inventoryLedgerRefetch();
    }, 200);
  };

  useEffect(() => {
    onSearch();
  }, []);

  // 디자이너 조회
  const [designerOptions, setDesignerOptions] = useState<[string?]>([]);
  const { data: loadDesigner, isSuccess: isDesignerSucess } = useQuery({
    queryKey: ['fetchDesigner-inventoryLedger'],
    queryFn: (): any => authApi.get('/partner/detail'),
  });
  useEffect(() => {
    if (isDesignerSucess) {
      if (loadDesigner?.data?.body?.designCntn) {
        const designArr = loadDesigner?.data?.body?.designCntn.split(/\r?\n/);
        if (designArr.length > 0) {
          setDesignerOptions(designArr);
        } else {
          toastError('등록된 디자이너가 없습니다.');
        }
      }
    }
  }, [isDesignerSucess]);

  // 공장조회
  const [factoryOptions, setFactoryOptions] = useState<DropDownOption[]>([]);
  const { data: loadFactory, isSuccess: isFactorySuccess } = useQuery({
    queryKey: ['/factory/omsPartnerId'],
    queryFn: (): any => authApi.get('/factory/omsPartnerId'),
  });
  useEffect(() => {
    if (isFactorySuccess) {
      const options = loadFactory?.data?.body?.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: item.compNm,
      }));
      console.log('loadFactoryData>>', options);
      if (options.size == 0) {
        toastError('등록된 공장정보가 없습니다.');
      }
      setFactoryOptions(options);
    }
  }, [isFactorySuccess]);

  /** 페이징 목록 조회 */
  const {
    data: inventoryLedger,
    isLoading: isInventoryLedgerLoading,
    isSuccess: isInventoryLedgerSuccess,
    refetch: inventoryLedgerRefetch,
  } = useQuery({
    queryKey: ['/asnMng/inventoryLedger/paging'],
    queryFn: (): any =>
      authApi
        .get('/asnMng/inventoryLedger/paging', {
          params: {
            curPage: paging.curPage,
            pageRowCount: paging.pageRowCount,
            ...filters,
          },
        })
        .then((res) => res.data), // ✅ 여기서 data만 추출
    enabled: false,
  });
  useEffect(() => {
    if (isInventoryLedgerSuccess) {
      const { resultCode, body, resultMessage } = inventoryLedger;
      if (resultCode === 200) {
        console.log('loadData', body);
        setPaging(body?.paging);
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 예솔수정실패함
        console.log('3filters ===============================>', filters);
        setInventoryLedgerList(body.rows || []);
        /** 예솔수정
         * 하단합계 추가 */
        if (body.rows && body.rows.length > 0) {
          const { genCount, asnCount, befInstockCount, realCount, remainCount } = body.rows.reduce(
            (
              acc: {
                genCount: number;
                asnCount: number;
                befInstockCount: number;
                realCount: number;
                remainCount: number;
              },
              data: AsnMngResponseInventoryLedgerPaging,
            ) => {
              return {
                genCount: acc.genCount + (data.genCnt ? data.genCnt : 0),
                asnCount: acc.asnCount + (data.asnCnt ? data.asnCnt : 0),
                befInstockCount: acc.befInstockCount + (data.befInstockCnt ? data.befInstockCnt : 0),
                realCount: acc.realCount + (data.realCnt ? data.realCnt : 0),
                remainCount: acc.remainCount + (data.remainCnt ? data.remainCnt : 0),
              };
            },
            {
              genCount: 0,
              asnCount: 0,
              befInstockCount: 0,
              realCount: 0,
              remainCount: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              genCnt: genCount,
              asnCnt: asnCount,
              befInstockCnt: befInstockCount,
              realCnt: realCount,
              remainCnt: remainCount,
            },
          ]);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isInventoryLedgerSuccess, inventoryLedger, setPaging]);

  /** 생산처 품목 단가DC 업데이트  */
  const { mutate: upsertFactorySpcMutate } = useMutation(upsertFactorySpc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        closeModal('MOD_FACTORY_SPC');
        // inventoryLedgerRefetch();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 단가DC 일괄적용 저장 */
  const handleDanDcUpdateConfirm = async () => {
    const gridApi = InventoryLedgerGridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const rowNode = gridApi?.getDisplayedRowAtIndex(focusedCell?.rowIndex as number);

    if (rowNode) {
      const rowData = rowNode.data;
      console.log('rowData >>', rowData);

      // 단가DC가 변경된 것만 저장한다.
      if (!rowData.factoryId || !rowData.prodId || isNaN(rowData.asnDcAmt)) {
        toastError('저장할 내용이 없어 다시 확인후 이용해주세요');
      }

      const params: ReceivingHistoryRequestFactorySpc = {
        factoryId: rowData.factoryId,
        prodId: rowData.prodId,
        updDcAmt: rowData.asnDcAmt, // 단가DC
      };
      console.log('단가DC저장 params >>', params);
      upsertFactorySpcMutate(params);
    } else {
      toastError('선택된 항목이 없어 단가DC 저장을 못했어요.');
    }
  };

  // Todo. 임시  (삭제할것)
  const runAsnBatch = async () => {
    await authApi.get('/asnMng/asn-batch');
    inventoryLedgerRefetch();
  };

  // 컬럼정의
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  useEffect(() => {
    //if (factoryOptions?.length > 0 && designerOptions?.length > 0) {
    if (filters.searchType === '작업') {
      // 작업보기 그리드 컬럼 정의
      setColumnDefs([
        {
          filter: false,
          sortable: false,
          maxWidth: 30,
          minWidth: 30,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'no',
          headerName: 'No.',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'asnId',
          headerName: '발주ID',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'parentId',
          headerName: '원발주ID',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'asnYmd',
          headerName: '발주일자',
          minWidth: 90,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'consumedDays',
          headerName: '소요일',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          valueGetter: (params) => {
            if (params.node?.rowPinned !== 'bottom') {
              if (params.data?.consumedDays == 0) {
                return '당일';
              } else {
                return params.data?.consumedDays + '일';
              }
            }
          },
        },
        {
          field: 'makerNm',
          headerName: '생산처',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: 'editCell',
          filter: 'agSetColumnFilter',
          cellEditor: 'agRichSelectCellEditor',
          editable: (params) => !params.data?.asnCnt, // asnCnt가 없을 때만 편집 가능
          cellEditorParams: (params: any) => {
            // asnCnt가 있으면 편집 비활성화
            if (params.data?.asnCnt) {
              return null;
            }
            return {
              values: factoryOptions.map((item) => item.label),
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
            };
          },
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            return '입고가 진행된 상품의 생산처/디자이너를 변경할 수 없어요.';
          },
          onCellClicked: (params) => {
            if (params.data?.asnCnt) {
              toastError('예정수량 입력 후 생산처/디자이너를 변경할 수 없어요.');
            }
          },
          onCellValueChanged: (params) => {
            if (params.data?.asnCnt) {
              toastError('예정수량 입력 후 생산처/디자이너를 변경할 수 없어요.');
              setInventoryLedgerList((prevList) =>
                prevList.map((item) =>
                  item.asnId === params.data.asnId
                    ? {
                        ...item,
                        makerNm: params.oldValue,
                      }
                    : item,
                ),
              );
              return;
            }
            const selectedFactory = factoryOptions?.find((item: DropDownOption) => item.label === params.newValue);
            if (selectedFactory && selectedFactory.value) {
              updateAsns([{ id: params.data.asnId, factoryId: Number(selectedFactory.value) }]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              makerNm: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            makerNm: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            }
          },
        },
        {
          field: 'asnDcAmt' /* 공임비 툴팁정보 제공을 위한 히든컬럼 */,
          hide: true,
        },
        {
          field: 'gagongAmt',
          headerName: '공임비',
          minWidth: 60,
          suppressHeaderMenuButton: true,
          cellClass: 'editCell',
          editable: true,
          cellStyle: ({ data }) => {
            if (data.gagongAmt > data.skuMainGagongAmt) {
              return { ...GridSetting.CellStyle.CENTER, color: '#344cfd', fontWeight: 500 };
            } else if (data.gagongAmt < data.skuMainGagongAmt) {
              return { ...GridSetting.CellStyle.CENTER, color: '#d50202', fontWeight: 500 };
            }
            return GridSetting.CellStyle.CENTER;
          },
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            const skuMainGagongAmt = params.data.skuMainGagongAmt ? Utils.setComma(params.data.skuMainGagongAmt) : 0;
            const asnDcAmt = params.data.asnDcAmt ? Utils.setComma(params.data.asnDcAmt) : 0;
            return `공임비 ${skuMainGagongAmt}원에서 단가DC ${asnDcAmt}원 적용되었어요`;
          },
          onCellValueChanged: (params) => {
            if (!isNaN(params.newValue)) {
              if (params.newValue !== params.oldValue) {
                params.node?.setDataValue('asnDcAmt', params.data.skuMainGagongAmt - params.newValue);
                openModal('MOD_FACTORY_SPC');
              }

              const requestParams = {
                id: params.data.asnId,
                updGagongAmt: params.newValue, //수정한 공임비
              };

              updateAsns([requestParams]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              skuMainGagongAmt: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            asnCnt: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            } else {
              toastError('숫자만 입력이 가능합니다');
            }
          },
          cellRenderer: 'NUMBER_COMMA',
        },
        {
          field: 'designerNm',
          headerName: '디자이너',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          cellClass: 'editCell',
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
          cellEditor: 'agRichSelectCellEditor',
          editable: (params) => !params.data?.asnCnt, // asnCnt가 없을 때만 편집 가능
          cellEditorParams: (params: any) => {
            // asnCnt가 있으면 편집 비활성화
            if (params.data?.asnCnt) {
              return null;
            }
            return {
              values: designerOptions.map((item) => item),
              allowTyping: true,
              filterList: true,
              highlightMatch: true,
            };
          },
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            return '입고가 진행된 상품의 생산처/디자이너를 변경할 수 없어요.';
          },
          onCellClicked: (params) => {
            if (params.data?.asnCnt) {
              toastError('예정수량 입력 후 생산처/디자이너를 변경할 수 없어요.');
            }
          },
          onCellValueChanged: (params) => {
            if (params.data?.asnCnt) {
              toastError('예정수량 입력 후 생산처/디자이너를 변경할 수 없어요.');
              setInventoryLedgerList((prevList) =>
                prevList.map((item) =>
                  item.asnId === params.data.asnId
                    ? {
                        ...item,
                        designerNm: params.oldValue,
                      }
                    : item,
                ),
              );
              return;
            }
            const selectDesigner = designerOptions.find((item) => item === params.newValue);
            if (selectDesigner) {
              updateAsns([{ id: params.data.asnId, designNm: selectDesigner }]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              designerNm: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            designerNm: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            }
          },
        },
        {
          field: 'fabricComp',
          headerName: '원단처',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.LEFT,
          cellClass: 'editCell',
          suppressHeaderMenuButton: true,
          editable: (params) => !params.data?.asnCnt,
          tooltipComponentParams: { color: '#fff' },
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            if (params.data?.asnCnt) return '예정수량 입력 후 원단처/재단장수를 변경할 수 없어요.';
          },
          onCellValueChanged: (params) => {
            if (params.data?.asnCnt) {
              toastError('예정수량 입력 후 원단처/재단장수를 변경할 수 없어요.');
              setInventoryLedgerList((prevList) =>
                prevList.map((item) =>
                  item.asnId === params.data.asnId
                    ? {
                        ...item,
                        fabricComp: params.oldValue,
                      }
                    : item,
                ),
              );
              return;
            }
            const newValue = params.newValue.trim();
            if (newValue && newValue.length < 500) {
              updateAsns([{ id: params.data.asnId, fabricComp: newValue }]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnI
                          ? {
                              ...item,
                              fabricComp: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            fabricComp: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            } else {
              toastError('500자 이내로 입력바랍니다.');
            }
          },
        },
        {
          field: 'prodNm',
          headerName: '상품명',
          minWidth: 120,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'skuColor',
          headerName: '컬러',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'skuSize',
          headerName: '사이즈',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'genCnt',
          headerName: '발주수량',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.RIGHT,
          suppressHeaderMenuButton: true,
          valueFormatter: (params) => {
            return Utils.setComma(params.value);
          },
        },
        {
          field: 'cutCntn',
          headerName: '재단장수',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: 'editCell',
          editable: (params) => !params.data?.asnCnt,
          tooltipComponentParams: { color: '#fff' },
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            if (params.data?.asnCnt) return '예정수량 입력 후 원단처/재단장수를 변경할 수 없어요.';
          },
          onCellValueChanged: (params) => {
            if (params.data.asnCnt) {
              toastError('예정수량 입력 후 원단처/재단장수를 변경할 수 없어요.');
              setInventoryLedgerList((prevList) =>
                prevList.map((item) =>
                  item.asnId === params.data.asnId
                    ? {
                        ...item,
                        cutCntn: params.oldValue,
                      }
                    : item,
                ),
              );
              return;
            }
            const newValue = params.newValue.trim();
            if (newValue && newValue.length < 500) {
              updateAsns([{ id: params.data.asnId, cutCntn: newValue }]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              cutCntn: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            cutCntn: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            } else {
              toastError('500자 이내로 입력바랍니다.');
            }
          },
        },
        {
          field: 'asnCnt',
          headerName: '입하예정',
          filter: true,
          minWidth: 80,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: 'editCell',
          editable: true,
          tooltipComponent: CustomTooltip,
          tooltipValueGetter: (params) => {
            if (params.data?.asnCnt) return '빈블러가 물류 입고 처리 후에는 입하예정 수량을 삭제/변경할 수 없어요.';
          },
          onCellValueChanged: (params) => {
            if (!isNaN(params.newValue)) {
              const requestParams = {
                id: params.data.asnId,
                asnCnt: params.newValue ? params.newValue : 0,
                asnStatCd: params.newValue ? '3' : '2', //입하예정 값을 지우면 입하예정단계에서 발주확정단계로 변경한다.
              };
              updateAsns([requestParams]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              asnCnt: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            asnCnt: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            } else {
              toastError('숫자만 입력이 가능합니다');
            }
          },
        },
        {
          field: 'befInstockCnt',
          headerName: '기입고',
          filter: true,
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'writer',
          headerName: '사용자',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
        },
        {
          field: 'updYmd',
          headerName: '최근작업일',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'asnEtc',
          headerName: '비고',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: 'editCell',
          editable: true,
          onCellValueChanged: (params) => {
            const newValue = params.newValue?.trim();
            if (newValue && newValue.length < 4000) {
              updateAsns([{ id: params.data.asnId, asnEtc: newValue }]).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  if (resultMessage) {
                    setErrorMessage(resultMessage);
                    setErrorPop(true);
                    setInventoryLedgerList((prevList) =>
                      prevList.map((item) =>
                        item.asnId === params.data.asnId
                          ? {
                              ...item,
                              asnEtc: params.oldValue,
                            }
                          : item,
                      ),
                    );
                  } else {
                    toastSuccess('수정되었습니다.');
                  }
                  inventoryLedgerRefetch();
                } else {
                  toastError(resultMessage);
                  setInventoryLedgerList((prevList) =>
                    prevList.map((item) =>
                      item.asnId === params.data.asnId
                        ? {
                            ...item,
                            asnEtc: params.oldValue,
                          }
                        : item,
                    ),
                  );
                }
              });
            } else {
              toastError('4000자 아내로 입력바랍니다.');
            }
          },
        },
      ]);
    } else {
      // 개발테스트를 위해 범위 변경함
      setColumnDefs([
        {
          filter: false,
          sortable: false,
          maxWidth: 30,
          minWidth: 30,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'no',
          headerName: 'No.',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'asnId',
          headerName: '발주ID',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'parentId',
          headerName: '원발주ID',
          minWidth: 70,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          hide: true,
        },
        {
          field: 'asnYmd',
          headerName: '발주일자',
          minWidth: 90,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'stockYmd',
          headerName: '입고일자',
          minWidth: 90,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'makerNm',
          headerName: '생산처',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
        },
        {
          field: 'designerNm',
          headerName: '디자이너',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
        },
        {
          field: 'fabricComp',
          headerName: '원단처',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'prodNm',
          headerName: '상품명',
          minWidth: 120,
          cellStyle: GridSetting.CellStyle.LEFT,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'skuColor',
          headerName: '컬러',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'skuSize',
          headerName: '사이즈',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'genCnt',
          headerName: '발주수량',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'cutCntn',
          headerName: '재단장수',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'asnCnt',
          headerName: 'ASN',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'realCnt',
          headerName: '입하완료',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
        {
          field: 'remainCnt',
          headerName: '잔량',
          minWidth: 60,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          cellClass: 'txtColor red',
          cellRenderer: 'NUMBER_COMMA',
        },
        {
          field: 'status',
          headerName: '작업상태',
          minWidth: 120,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
        },
        {
          field: '',
          headerName: '완료',
          minWidth: 50,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
          valueGetter: (params) => {
            if (params.data?.status === '완료') {
              return '■';
            } else if (params.data?.status === '부분입하') {
              return '▲';
            } else if (params.data?.status === '미완료') {
              return '□';
            } else {
              return '□';
            }
          },
        },
        {
          field: 'writer',
          headerName: '사용자',
          minWidth: 100,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
          filter: 'agSetColumnFilter',
          valueGetter: (params) => (params.data?.writer === '-' ? '빈블러' : params.data?.writer),
        },
        {
          field: 'asnEtc',
          headerName: '비고',
          minWidth: 150,
          cellStyle: GridSetting.CellStyle.CENTER,
          suppressHeaderMenuButton: true,
        },
      ]);
    }
  }, [factoryOptions, designerOptions, filters.searchType]);

  useEffect(() => {
    console.log('columnDefs ==>', columnDefs);
  }, [columnDefs]);

  // 초기화버튼 이벤트
  const onReset = async () => {
    if (filters.searchType === '작업') {
      onChangeFilters('startDate', Utils.getStartDayBeforeMonth(3)); // 디폴트 3개월 이전
      onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    } else {
      onChangeFilters('startDate', yesterday); // 디폴트 하루전
      onChangeFilters('endDate', today); //당일
    }
    onChangeFilters('asnRepareType', 'N');
    onChangeFilters('searchDesignNm', '');
    onChangeFilters('searchProdNm', '');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';

    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    } else if (params.data.delYn === 'Y') {
      rtnValue = rtnValue ? rtnValue + ' ag-row-canceled-row' : 'ag-row-canceled-row';
    }

    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} reset={onReset} filters={filters} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          title={'기간'}
          type={'range'}
          defaultType={'type'}
          startName={'startDate'}
          endName={'endDate'}
          onChange={(name, value) => {
            onChangeFilters(name, value);
            onSearch();
          }}
          value={[filters.startDate ? filters.startDate : '', filters.endDate ? filters.endDate : '']}
        />
        <Search.Input
          title={'디자이너'}
          name={'searchDesignNm'}
          placeholder={'디자이너명 입력'}
          value={filters.searchDesignNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Input
          title={'상품명'}
          name={'searchProdNm'}
          placeholder={'상품명 입력'}
          value={filters.searchProdNm}
          onEnter={onSearch}
          onChange={onChangeFilters}
          filters={filters}
        />
        <Search.Switch
          title={'일반/수선분'}
          name={'asnRepareType'}
          checkedLabel={'수선분'}
          uncheckedLabel={'일반'}
          onChange={(e, value) => {
            onChangeFilters('asnRepareType', value ? 'M' : 'N');
            onSearch();
          }}
          filters={filters}
          value={filters.asnRepareType === 'M'}
          //ref={asnRepareTypeRef}
        />
        <Search.Switch
          title={'검색조건'}
          name={'searchType'}
          checkedLabel={'이력'}
          uncheckedLabel={'작업'}
          onChange={(e, value) => {
            if (value) {
              onChangeFilters('startDate', Utils.getStartDayBeforeMonth(3)); // 3개월 하루전
              onChangeFilters('endDate', today); //당일로
              onChangeFilters('searchType', '이력');
            } else {
              onChangeFilters('startDate', yesterday); // 디폴트 하루전
              onChangeFilters('endDate', today); //당일로
              onChangeFilters('searchType', '작업');
            }
            onSearch();
          }}
          filters={filters}
          value={filters.searchType === '이력'}
        />
      </Search>

      <Table>
        <TableHeader
          count={paging.totalRowCount || 0}
          paging={paging}
          setPaging={setPaging}
          search={onSearch}
          gridRef={InventoryLedgerGridRef}
          isPaging={false}
        ></TableHeader>
        {columnDefs && columnDefs.length > 0 && (
          <TunedGrid<AsnMngResponseInventoryLedgerPaging>
            ref={InventoryLedgerGridRef}
            loading={isInventoryLedgerLoading}
            rowData={inventoryLedgerList || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            suppressRowClickSelection={true}
            enableRangeSelection={true}
            rowSelection={'multiple'}
            //suppressMultiRangeSelection={false}
            className={'default'}
            getRowClass={getRowClass}
            pinnedBottomRowData={pinnedBottomRowData} // 예솔수정 하단합계 추가
          />
        )}
        <div className="btnArea">
          {filters.searchType === '작업' && (
            <>
              <CustomShortcutButton
                className="btn"
                title="삭제하기"
                shortcut={COMMON_SHORTCUTS.ctrlZ}
                onClick={() => {
                  if (session.data) {
                    // if (session.data.user.authCd == '350') {
                    //   toastError('디자이너는 본 동작을 실행할 수 없습니다.');
                    // } else {
                    if (InventoryLedgerGridRef.current?.api.getSelectedNodes() && InventoryLedgerGridRef.current?.api.getSelectedNodes().length > 0) {
                      const selectedNodes = InventoryLedgerGridRef.current.api.getSelectedNodes();

                      for (let i = 0; i < selectedNodes.length; i++) {
                        if ((selectedNodes[i].data as AsnMngResponsePaging).asnStatCd == AsnStatCd.입하예정) {
                          toastError('입하예정 중인 발주건은 삭제할 수 없습니다.');
                          return;
                        }

                        if (selectedNodes[i].data.befInstockCnt) {
                          setDelEventType('잔량삭제');
                        }
                      }
                      openModal('DEL_CONFIRMED');
                    } else {
                      toastError('삭제할 발주 데이터를 하나 이상 선택하십시요.');
                    }
                    // }
                  } else {
                    toastError('본 동작을 실행할 수 있는 사용자인지 확인할 수 없습니다.');
                  }
                }}
              >
                삭제하기
              </CustomShortcutButton>
              <button className="btn" title="주문보다 입고가 적어 재고장 생성할경우 아침 8시 배치실행" onClick={() => runAsnBatch()}>
                배치생성(주문보다 입고가 적어 재고장 생성할경우)
              </button>
            </>
          )}
        </div>
      </Table>

      <ConfirmModal
        title={delEventType === '잔량삭제' ? '해당 발주는 아직 잔량이 있습니다. 잔량을 삭제 할래요?' : '해당 발주를 삭제 할래요?'}
        open={modalType.type === 'DEL_CONFIRMED' && modalType.active}
        onConfirm={() => {
          const selectedNodes = InventoryLedgerGridRef.current?.api.getSelectedNodes();
          const targetData: AsnMngRequestDelete[] = [];
          if (selectedNodes) {
            for (let i = 0; i < selectedNodes.length; i++) {
              targetData[i] = {
                id: selectedNodes[i].data.asnId,
              };
            }
          }
          deleteAsns(targetData).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              if (resultMessage) {
                // 입하확정시 삭제 불가 메세지
                setErrorMessage(resultMessage);
                setErrorPop(true);
              } else {
                toastSuccess('삭제되었습니다.');
                inventoryLedgerRefetch();
              }
            } else {
              toastError(resultMessage);
            }
          });
        }}
        onClose={() => {
          closeModal('DEL_CONFIRMED');
        }}
      />

      <ConfirmModal
        title={`해당 제품에 대한 일괄 할인을 적용하시겠습니까?`}
        open={modalType.type === 'MOD_FACTORY_SPC' && modalType.active}
        onConfirm={handleDanDcUpdateConfirm}
        onClose={() => {
          closeModal('MOD_FACTORY_SPC');
        }}
      />

      {errorPop ? <DataMigrationPop message={errorMessage} state={errorPop} setState={setErrorPop} /> : ''}
    </div>
  );
};

export default InventoryLedger;
