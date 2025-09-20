/**
 재고이동
 /wms/ipgo/inventorymove
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { CodeResponseLowerSelect, InventoryMoveResponsePaging, LocsetResponseOptionList, PartnerResponseSelect } from '../../../generated';
import { Button, Pagination, Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { CellValueChangedEvent, ColDef } from 'ag-grid-community';

import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useStoreReqStore } from '../../../stores/useStoreReqStore';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { createInvenMove, fetchLocOptions, fetchLowerCodes, fetchPartners } from '../../../api/wms-api';

const Inventorymove = () => {
  const session = useSession();
  // const startDt = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'); // 1개월전 1일자로 조회한다.
  // const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const gridRef = useRef<AgGridReact>(null);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  const { onGridReady } = useAgGridApi();
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [paging, setPaging] = useStoreReqStore((s) => [s.paging, s.setPaging]);

  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: session.data?.user.workLogisId,
    skuNm: '',
    partnerId: 0,
    // startDate: startDt,
    // endDate: today,
  });

  // 최초 데이타 렌더링 및 재렌더링시
  const onRowDataUpdated = (params: any) => {
    // params.api.forEachNode((node: any) => {
    // 적치수량 필드에 기본값 설정
    // node.setDataValue('invenCnt', node.data.stockCnt);
    //
    // if (node.data.stockCnt > 0) {
    //   node.setSelected(true); // 모든 행을 선택 상태로 설정
    // }
    // });
    // updateTotals(); // 데이터 업데이트 시 합계도 계산
  };

  const onCellValueChanged = (event: CellValueChangedEvent<InventoryMoveResponsePaging>): void => {
    const { colDef, node, newValue, oldValue, data } = event;

    // 값이 실제로 변경되지 않은 경우는 제외
    if (oldValue === newValue) {
      return;
    }

    // 초기 값(originalValue)과 비교하여 상태 설정
    const initialOriginalValue = 0;

    // console.log('onCellValueChanged', {
    //   event: event,
    //   newValue: newValue,
    //   initialOriginalValue: initialOriginalValue,
    // });

    // 입력값변경에 따른 체크박스 자동 체크
    if (initialOriginalValue !== newValue) {
      node.setSelected(true);
    } else {
      node.setSelected(false);
    }

    // 셀 변경이 있을 때마다 합계 업데이트
    // updateTotals();
  };

  // 합계 업데이트 함수
  const updateTotals = () => {
    let stockTotal = 0;
    let invenTotal = 0;

    gridRef.current?.api.forEachNode((node) => {
      stockTotal += Number(node.data.stockCnt || 0);
      invenTotal += Number(node.data.invenCnt || 0);
    });

    // 합계 데이터를 상태로 설정하여 pinned bottom row에 전달
    // setPinnedBottomRowData([{ skuSize: 'Total', stockCnt: stockTotal, invenCnt: invenTotal }]);
  };

  /**
   *  API
   */

  // 화주옵션 조회
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([]);
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

  // 이동위치옵션 조회
  const [locOption, setLocOption] = useState<LocsetResponseOptionList[]>([]);
  const { data: locs, isSuccess: isFetchLocSuccess } = useQuery(['fetchLocOptions', workLogisId], () => fetchLocOptions(workLogisId), {
    enabled: !!session.data?.user.workLogisId, // logisId가 유효할 때에만 실행
  });
  useEffect(() => {
    if (isFetchLocSuccess && locs) {
      const { resultCode, body, resultMessage } = locs.data;
      if (resultCode === 200) {
        setLocOption(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchLocSuccess, locs]);

  // 이동사유옵션 조회
  const [lowerCodeOption, setLowerCodeOption] = useState<CodeResponseLowerSelect[]>([]);
  const { data: lowerCodes, isSuccess: isFetchCodesSuccess } = useQuery(['fetchLowerCodes'], () => fetchLowerCodes('10260'));
  useEffect(() => {
    if (isFetchCodesSuccess && lowerCodes) {
      const { resultCode, body, resultMessage } = lowerCodes.data;
      if (resultCode === 200) {
        console.log('lowerCodes data:', lowerCodes.data.body);
        setLowerCodeOption(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchCodesSuccess, lowerCodes]);

  //재고이동 목록 조회
  const {
    data: invens,
    isSuccess: isInvenSuccess,
    refetch: refetchStock,
  } = useQuery(
    ['/inventorymove/paging', paging.curPage],
    () =>
      authApi.get('/inventorymove/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
    {
      refetchOnMount: 'always',
    },
  );
  useEffect(() => {
    if (isInvenSuccess && invens?.data) {
      const { resultCode, body, resultMessage } = invens.data;
      if (resultCode === 200) {
        // console.log('invens data>', invens.data);
        setPaging(body?.paging);
      } else {
        toastError(resultMessage);
      }
    }
  }, [invens, isInvenSuccess, setPaging]);

  // 적치 등록 API
  const queryClient = useQueryClient();
  const { mutate: createInvenMoveMutate } = useMutation(createInvenMove, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/inventorymove/paging']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 검색 */
  const onSearch = async () => {
    setPaging({
      curPage: 1,
    });
    await refetchStock();
  };

  // 검색 버튼 클릭
  const search = async () => {
    await onSearch();
  };

  // 초기화버튼 이벤트
  const onReset = async () => {
    await onFiltersReset();
    await onChangeFilters('logisId', Number(session.data?.user.workLogisId));
    await onChangeFilters('partnerId', 0);
    // await onChangeFilters('startDate', startDt);
    // await onChangeFilters('endDate', today);

    setSelectedPartner(defaultOption);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  // 필터 옵션 선택
  const [selectedPartner, setSelectedPartner] = useState();

  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value);
  };

  // 적치시작
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;
    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('적치할 상품의 입력수량을 입력해주세요.', { autoClose: 1000 });
      return;
    } else {
      console.log('selectedRows:', selectedRows);
      const invalidRow = selectedRows.some((row: any) => row.aftCnt <= 0 || !row.aftLoc || !row.invenChgCd);

      if (invalidRow) {
        toastError('이동할 상품의 필수 항목(수량,위치,사유)을 입력해주세요.', { autoClose: 1000 });
      }

      createInvenMoveMutate(selectedRows);
    }
  };

  // const [pinnedBottomRowData, setPinnedBottomRowData] = useState<any[]>([]); // 합계데이터 만들기
  const columnDefs = useMemo<ColDef[]>(
    () => [
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
        field: 'no',
        headerName: 'No',
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '화주',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'prodNm',
        headerName: '상품명',
        maxWidth: 180,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuColor',
        headerName: '칼라',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuSize',
        headerName: '사이즈',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'invenCnt',
        headerName: '재고수량',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locNm',
        headerName: '적치위치',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          const locStr = `${params.data.zoneCdNm} - ${params.data.locNm}`;
          return locStr ? locStr : params.value;
        },
      },
      {
        field: 'aftCnt',
        headerName: '이동수량(입력)',
        editable: true,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        valueParser: (params) => {
          const newValue = Number(params.newValue);
          if (isNaN(newValue) || newValue <= 0) {
            toastError('숫자(양수)만 입력가능합니다.', { autoClose: 1000 });
            return params.oldValue;
          }
          if (params.data.invenCnt < newValue) {
            toastError('이동수량은 재고수량 보다 클수 없습니다.', { autoClose: 1000 });
            return params.oldValue;
          }
          return isNaN(newValue) ? 0 : newValue;
        },
      },
      {
        field: 'aftLoc',
        headerName: '이동위치(검색)',
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        cellEditor: 'agRichSelectCellEditor',
        editable: true,
        cellEditorParams: {
          values: locOption?.map((item) => item.id),
          formatValue: (value: any) => {
            const match = locOption?.find((item: any) => item.id === value);
            return match ? `${match.zoneCdNm} - ${match.location}` : value;
          },
          allowTyping: true,
          filterList: true,
          highlightMatch: true,
        },
        valueFormatter: (params: any) => {
          const match = locOption?.find((item: any) => item.id === params.value);
          return match ? `${match.zoneCdNm} - ${match.location}` : params.value;
        },
      },
      {
        field: 'invenChgCd',
        headerName: '이동사유(입력)',
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        cellEditor: 'agRichSelectCellEditor',
        editable: true,
        cellEditorParams: {
          values: lowerCodeOption?.map((item: any) => item.codeCd), // 실제 저장할 값은 codeCd
          formatValue: (value: any) => {
            // codeCd를 UI에 표시할 codeNm으로 변환
            const match = lowerCodeOption?.find((item: any) => item.codeCd === value);
            return match ? `${match.codeNm} - ${match.codeCd}` : value;
          },
          allowTyping: true,
          filterList: true,
          highlightMatch: true,
        },
        valueFormatter: (params) => {
          // codeCd를 codeNm으로 변환하여 UI에 표시
          const match = lowerCodeOption?.find((item: any) => item.codeCd === params.value);
          return match ? match.codeNm : params.value;
        },
      },
      {
        field: 'chgEtc',
        headerName: '변경 비고(입력)',
        editable: true,
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
      },
    ],
    [locOption],
  );

  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={search} />
      <Search className="type_2 full">
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 입력"
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'스큐명 입력'}
          value={filters.skuNm}
          onEnter={search}
          onChange={onChangeFilters}
          filters={filters}
        />
      </Search>

      <Table>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={search}>
          <button className="btn btnBlue" onClick={handleSave}>
            이동시작
          </button>
        </TableHeader>
        <div className={'ag-theme-alpine wmsDefault'}>
          <AgGridReact
            ref={gridRef}
            rowData={invens?.data?.body?.rows || []}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            gridOptions={{ rowHeight: 24, headerHeight: 35 }}
            rowSelection={'multiple'}
            suppressRowClickSelection={true}
            paginationPageSize={paging.pageRowCount}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            enableRangeSelection={true}
            //suppressMultiRangeSelection={false}
            onCellValueChanged={onCellValueChanged}
            getRowClass={(params) => {
              if (params.node.rowPinned === 'bottom') {
                return 'ag-grid-pinned-row';
              }
            }}
            /* pinnedBottomRowData={pinnedBottomRowData} // 하단에 고정된 합계 행
            onFirstDataRendered={onRowDataUpdated}*/
            onRowDataUpdated={onRowDataUpdated}
          />
        </div>
        <Pagination pageObject={paging} setPaging={setPaging} />
      </Table>
    </div>
  );
};

export default Inventorymove;
