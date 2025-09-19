/**
 * @No.3
 * @file pages/oms/factory/inventoryLedgerM.tsx
 * @description  OMS > 재고장 모바일
 * @Feature 이동
 * @copyright 2024
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { AsnMngResponsePaging, AsnMngRequestDelete, AsnMngResponseInventoryLedgerPaging, AsnMngRequestInventoryLedgerFilter } from '../../../generated';
import { Pagination, Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
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
import Loading from '../../../components/Loading';

/** 재고장 페이지 */
const InventoryLedger = () => {
  const session = useSession();
  /** Grid Api */
  const { gridApi, gridColumnApi, onGridReady } = useAgGridApi();
  const InventoryLedgerGridRef = useRef<AgGridReact>(null);

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);

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

  const [inventoryLedgerList, setInventoryLedgerList] = useState<AsnMngResponseInventoryLedgerPaging[]>([]);
  const [delEventType, setDelEventType] = useState('발주삭제');
  const [errorPop, setErrorPop] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  /** 필터 */
  const [filters, onChangeFilters] = useFilters<AsnMngRequestInventoryLedgerFilter>({
    searchType: '작업',
    asnRepareType: 'N', //수선분 유무
    searchDesignNm: '',
    searchProdNm: '',
    startDate: Utils.getStartDayBeforeMonth(3), // 디폴트는 3개월 부터 조회
    endDate: dayjs().format('YYYY-MM-DD'), // 오늘날짜
  });

  // 디자이너 조회
  const [designerOptions, setDesignerOptions] = useState<[string?]>([]);
  const { data: loadDesigner, isSuccess: isDesignerSucess } = useQuery(['fetchDesigner-inventoryLedger'], () => authApi.get('/partner/detail'));
  useEffect(() => {
    if (isDesignerSucess) {
      if (loadDesigner?.data?.body?.designCntn) {
        const designArr = loadDesigner?.data?.body?.designCntn.split(/\r?\n/);
        if (designArr.length > 0) {
          setDesignerOptions(designArr);
        }
      }
    }
  }, [isDesignerSucess]);

  // 공장조회
  const [factoryOptions, setFactoryOptions] = useState<DropDownOption[]>([]);
  const { data: loadFactory, isSuccess: isFactorySuccess } = useQuery(['fetchFactory-inventoryLedger'], () => authApi.get('/factory/omsPartnerId'));
  useEffect(() => {
    if (isFactorySuccess) {
      const options = loadFactory?.data?.body?.map((item: any) => ({
        key: item.id,
        value: item.id,
        label: item.compNm,
      }));
      // console.log('loadFactoryData>>', options);
      setFactoryOptions(options);
    }
  }, [isFactorySuccess]);

  /** 페이징 목록 조회 */
  const {
    data: inventoryLedger,
    isLoading: isInventoryLedgerLoading,
    isSuccess: isInventoryLedgerSuccess,
    refetch: inventoryLedgerRefetch,
  } = useQuery(['/asnMng/inventoryLedger/paging', paging.curPage], () =>
    authApi.get('/asnMng/inventoryLedger/paging', {
      params: {
        curPage: paging.curPage,
        pageRowCount: paging.pageRowCount,
        ...filters,
      },
    }),
  );
  useEffect(() => {
    if (isInventoryLedgerSuccess) {
      const { resultCode, body, resultMessage } = inventoryLedger.data;
      if (resultCode === 200) {
        // console.log('loadData', body);
        setPaging(body?.paging);
        setIsFetchLoading(false);
        setInventoryLedgerList(body.rows || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isInventoryLedgerSuccess, inventoryLedger, setPaging]);

  // Todo. 임시  (삭제할것)
  const runAsnBatch = async () => {
    await authApi.get('/asnMng/asn-batch');
    inventoryLedgerRefetch();
  };

  // 컬럼정의
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  useEffect(() => {
    if (factoryOptions?.length > 0 && designerOptions?.length > 0) {
      if (filters.searchType === '작업') {
        // 작업보기 그리드 컬럼 정의
        onChangeFilters('startDate', Utils.getStartDayBeforeMonth(3)); // 디폴트 3개월 이전
        onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
        setColumnDefs([
          {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            filter: false,
            sortable: false,
            maxWidth: 30,
            minWidth: 30,
            suppressHeaderMenuButton: true,
          },
          {
            field: 'no',
            headerName: 'no',
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
          },
          {
            field: 'parentId',
            headerName: '원발주ID',
            minWidth: 50,
            cellStyle: GridSetting.CellStyle.CENTER,
            suppressHeaderMenuButton: true,
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
              if (params.data?.consumedDays == 0) {
                return '당일';
              } else {
                return params.data?.consumedDays + '일';
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
            headerName: '칼라',
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
            minWidth: 60,
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
        // 이력보기 그리드 컬럼 정의
        onChangeFilters('startDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD')); // 디폴트 하루전
        onChangeFilters('endDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD')); //하루전
        // 개발테스트를 위해 범위 변경함
        // onChangeFilters('startDate', dayjs().subtract(2, 'day').format('YYYY-MM-DD')); // 개발테스트 - 당일
        // onChangeFilters('endDate', dayjs().subtract(0, 'day').format('YYYY-MM-DD')); // 개발테스트 - 당일
        setColumnDefs([
          {
            headerCheckboxSelection: true,
            checkboxSelection: true,
            filter: false,
            sortable: false,
            maxWidth: 30,
            minWidth: 30,
            suppressHeaderMenuButton: true,
            hide: true,
          },
          {
            field: 'no',
            headerName: 'no',
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
          },
          {
            field: 'parentId',
            headerName: '원발주ID',
            minWidth: 70,
            cellStyle: GridSetting.CellStyle.CENTER,
            suppressHeaderMenuButton: true,
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
            headerName: '칼라',
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
            headerName: '입하예정',
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
            valueGetter: (params) => {
              if (params.data?.status === '미완료') {
                return params.data.remainCnt;
              }
            },
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
    }
  }, [factoryOptions, designerOptions, filters.searchType]);

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await inventoryLedgerRefetch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    if (filters.searchType === '작업') {
      onChangeFilters('startDate', Utils.getStartDayBeforeMonth(3)); // 디폴트 3개월 이전
      onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    } else {
      onChangeFilters('startDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD')); // 디폴트 하루전
      onChangeFilters('endDate', dayjs().subtract(1, 'day').format('YYYY-MM-DD')); //하루전
    }
    onChangeFilters('asnRepareType', 'N');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} reset={onReset} filters={filters} search={onSearch} />
      <Search className="type_2">
        {/*<Search.Radio*/}
        {/*  title={'검색조건'}*/}
        {/*  name={'searchType'}*/}
        {/*  options={[*/}
        {/*    { label: '작업하기', value: '작업' },*/}
        {/*    { label: '이력정보', value: '이력' },*/}
        {/*  ]}*/}
        {/*  value={filters.searchType}*/}
        {/*  onChange={(name, value: any) => {*/}
        {/*    onChangeFilters('searchType', value);*/}
        {/*    inventoryLedgerRefetch();*/}
        {/*  }}*/}
        {/*/>*/}
        <Search.Switch
          title={'검색조건'}
          name={'searchType'}
          checkedLabel={'이력'}
          uncheckedLabel={'작업'}
          onChange={(e, value) => {
            onChangeFilters('searchType', value ? '이력' : '작업');
            setIsFetchLoading(true);
            setTimeout(() => {
              inventoryLedgerRefetch();
            }, 500);
          }}
          filters={filters}
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
            setIsFetchLoading(true);
            setTimeout(() => {
              inventoryLedgerRefetch();
            }, 500);
          }}
          filters={filters}
        />
        {filters.searchType === '작업' && (
          // <Search.DatePicker title={'작업일자'} name={'asnYmd'} onEnter={search} value={filters.updTime} filters={filters} onChange={onChangeFilters} />
          <Search.TwoDatePicker
            title={'작업기간'}
            startName={'startDate'}
            endName={'endDate'}
            value={[filters.startDate ? filters.startDate : '', filters.endDate ? filters.endDate : '']}
            onEnter={onSearch}
            filters={filters}
            onChange={onChangeFilters}
          />
        )}
        {filters.searchType === '이력' && (
          <Search.TwoDatePicker
            title={'입고기간'}
            startName={'startDate'}
            endName={'endDate'}
            value={[filters.startDate ? filters.startDate : '', filters.endDate ? filters.endDate : '']}
            onEnter={onSearch}
            filters={filters}
            onChange={onChangeFilters}
          />
        )}
      </Search>

      <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} gridRef={InventoryLedgerGridRef}>
        {filters.searchType === '작업' && (
          <>
            <button
              className="btn"
              title="삭제"
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
              삭제
            </button>
            <button className="btn" title="배치생성" onClick={() => runAsnBatch()}>
              배치생성(개발용)
            </button>
          </>
        )}
      </TableHeader>
      {columnDefs && columnDefs.length > 0 && (
        <div className="gridBox">
          <div className={'ag-theme-alpine'}>
            <TunedGrid<AsnMngResponseInventoryLedgerPaging>
              ref={InventoryLedgerGridRef}
              headerHeight={35}
              onGridReady={onGridReady}
              loading={isInventoryLedgerLoading}
              rowData={inventoryLedgerList}
              gridOptions={{ rowHeight: 24 }}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              suppressRowClickSelection={false}
              preventPersonalizedColumnSetting={true}
            />
          </div>
          <Pagination pageObject={paging} setPaging={setPaging} />
        </div>
      )}

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
                setIsFetchLoading(true);
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

      {errorPop ? <DataMigrationPop message={errorMessage} state={errorPop} setState={setErrorPop} /> : ''}
      {(isFetchLoading || isInventoryLedgerLoading) && <Loading />}
    </div>
  );
};

export default InventoryLedger;
