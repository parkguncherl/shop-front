/**
 * @No.2
 * @file pages/oms/data/ProdMenufactRank.tsx
 * @description  OMS > 데이터 > 생산처 입고집계
 * @status 기초생성
 * @copyright 2024
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import { useCommonStore } from '../../../stores';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, Table, TableHeader, Title, toastError } from '../../../components';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { ColDef } from 'ag-grid-community';
import TunedGrid from '../../../components/grid/TunedGrid';
import { RetailResponsePaging, RetailSalesSummaryResponse } from '../../../generated';
import dayjs from 'dayjs';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import { Utils } from '../../../libs/utils';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { VatAddPop } from '../../../components/popup/orderMng/vat/VatAddPop';
import { useVatStore } from '../../../stores/useVatStore';
import { useRetailStore } from '../../../stores/useRetailStore';
import { useRetSalesSumStore } from '../../../stores/useRetSalesSumStore';
import RetSalesSumDetPop from '../../../components/popup/data/RetSalesSumDetPop';

const ProdMenufactRank = () => {
  const nowPage = 'oms_RetSalesSum'; // filter 저장 2025-01-21
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);
  const [menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [s.menuNm, s.filterDataList, s.setFilterDataList, s.getFilterData]);
  const [modalTypeVat, openModalVat, selectedRetail, setSelectedRetail] = useVatStore((s) => [s.modalType, s.openModal, s.retail, s.setRetail]);
  const [modalType, openModal, closeModal] = useRetSalesSumStore((s) => [s.modalType, s.openModal, s.closeModal]);
  const [getRetailDetail] = useRetailStore((s) => [s.getRetailDetail]);
  const [selectedSellerId, setSelectedSellerId] = useState<number>(0);
  const [selectedSellerNm, setSelectedSellerNm] = useState<string>('');
  const today = dayjs().format('YYYY-MM-DD');
  const previousMonthFirstDay = dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD');

  // 필터 상태 관리
  const [filters, onChangeFilters] = useFilters(
    getFilterData(filterDataList, nowPage) || {
      // filter 저장 2025-01-21
      searchType: 'A',
      sellerNm: '',
      prodAttrCd: '',
      startDate: previousMonthFirstDay,
      endDate: today,
    },
  );

  // AG-Grid 컬럼 정의
  const columnDefs = useMemo<ColDef<RetailSalesSummaryResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No',
        maxWidth: 40,
        minWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '사업자명',
        minWidth: 80,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'sellerNm',
        headerName: '소매처',
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubun1',
        headerName: '구분1',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'gubun2',
        headerName: '구분2',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: `returnAmt`,
        headerName: '미수금',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `chitCnt`,
        headerName: '전표건수',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totSkuCnt`,
        headerName: '판매량',
        minWidth: 55,
        maxWidth: 55,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totBackCnt`,
        headerName: '반품량',
        minWidth: 45,
        maxWidth: 45,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `backRate`,
        headerName: '반품율',
        minWidth: 45,
        maxWidth: 45,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
      },
      {
        field: `totOrderAmt`,
        headerName: '판매금액',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totBackAmt`,
        headerName: '반품금액',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totDcAmt`,
        headerName: '단가DC',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totDiscountAmt`,
        headerName: '할인금액',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totIncomAmt`,
        headerName: '실매출금액',
        minWidth: 68,
        maxWidth: 68,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totCashAmt`,
        headerName: '현금입금',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totAccountAmt`,
        headerName: '통장입금',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `nowAmt`,
        headerName: '당기잔액',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `totVatAmt`,
        headerName: '부가세',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: `logisAmt`,
        headerName: '물류비',
        minWidth: 56,
        maxWidth: 56,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [filters.searchType],
  );
  // 데이터 조회 API 호출
  const {
    data: loadData,
    isLoading,
    isSuccess,
    refetch,
  } = useQuery(['/omsData/retailSummary'], (): any =>
    authApi.get('/omsData/retailSummary', {
      params: {
        ...filters,
      },
    }),
  );

  // API 응답 처리
  useEffect(() => {
    if (isSuccess && loadData?.data) {
      const { resultCode, body, resultMessage } = loadData.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 저장 2025-01-21
      } else {
        toastError(resultMessage);
      }
    }
  }, [loadData, isSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    await refetch();
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onChangeFilters('sellerId', 0);
    onChangeFilters('searchType', '');
    onChangeFilters('startDate', previousMonthFirstDay);
    onChangeFilters('endDate', today);
  };

  useEffect(() => {
    refetch();
  }, [filters]);

  useEffect(() => {
    console.log('selectedRetail ==>', selectedRetail);
  }, [selectedRetail]);

  /**
   * 배경행 no숫자별 색상 정렬 홀수일때만 ag-grid-changeOrder적용
   */
  return (
    <div>
      <Title title={menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
        />
        <Search.Switch
          title={''}
          name={'searchType'}
          checkedLabel={'미수금'}
          uncheckedLabel={'전체'}
          onChange={(e, value) => {
            console.log('value ==>', value);
            onChangeFilters('searchType', value ? 'M' : 'A');
          }}
          filters={filters}
        />
        <Search.RetailBar
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처 검색'}
          allowNewRetail={false}
          onRetailDeleted={() => {
            onChangeFilters('sellerId', 0);
          }}
          onRetailSelected={(retailInfo) => {
            /** 본 영역에서만 소매처 상태 및 sellerId 필터 값이 변경됨 */
            if (retailInfo?.id) {
              onChangeFilters('sellerId', retailInfo.id);
            }
          }}
        />
        <Search.Radio
          title={''}
          name={'prodAttrCd'}
          options={[
            { label: '일반상품', value: 'N' },
            { label: '제작상품', value: 'Y' },
            { label: '전체', value: '' },
          ]}
          value={filters.prodAttrCd}
          onChange={(e, value) => {
            onChangeFilters('searchType', value);
          }}
        />
      </Search>
      <Table>
        <TableHeader count={loadData?.data?.body?.length || 0} isPaging={false} search={onSearch} />
        <TunedGrid<RetailSalesSummaryResponse>
          ref={gridRef}
          rowData={loadData?.data?.body || []}
          loading={isLoading}
          columnDefs={columnDefs}
          onGridReady={onGridReady}
          rowSelection={'single'}
          defaultColDef={defaultColDef}
          className={'default'}
        />
        <div className="btnArea">
          <CustomShortcutButton
            className="btn"
            title="상세보기"
            shortcut={COMMON_SHORTCUTS.NONE}
            onClick={() => {
              const nodes = gridRef.current?.api.getSelectedNodes();
              if (nodes?.length && nodes?.length > 0) {
                const rowNode = nodes[0];
                console.log('rowNode 22 ==>', rowNode);
                setSelectedSellerId(rowNode.data.id);
                setSelectedSellerNm(rowNode.data.sellerNm || '');
                setTimeout(() => {
                  openModal('DETAIL');
                }, 1000);
              }
            }}
          >
            상세보기
          </CustomShortcutButton>
          <CustomShortcutButton
            className="btn"
            title="부가세생성"
            shortcut={COMMON_SHORTCUTS.NONE}
            onClick={() => {
              const nodes = gridRef.current?.api.getSelectedNodes();
              if (nodes?.length && nodes?.length > 0) {
                const rowNode = nodes[0];
                console.log('rowNode ==>', rowNode);
                if (rowNode) {
                  getRetailDetail(rowNode.data.id).then((response) => {
                    if (response.data.resultCode === 200 && response.data.body) {
                      setSelectedRetail({ ...response.data.body, sellerId: rowNode.data.id } as Partial<RetailResponsePaging>);
                      setTimeout(() => {
                        openModalVat('ADD');
                      }, 10);
                    } else {
                      toastError(response.data.resultMessage || '상세 정보를 불러오는 데 실패했습니다.');
                    }
                  });
                }
              }
            }}
          >
            부가세생성
          </CustomShortcutButton>
        </div>
      </Table>
      {modalTypeVat.type === 'ADD' && modalTypeVat.active && <VatAddPop />}
      {modalType.type === 'DETAIL' && modalType.active && (
        <RetSalesSumDetPop
          onClose={() => {
            closeModal('DETAIL');
          }}
          sellerId={selectedSellerId}
          sellerNm={selectedSellerNm}
          searchType={filters.searchType}
          startDate={filters.startDate}
          endDate={filters.endDate}
          prodAttrCd={filters.prodAttrCd}
        />
      )}
    </div>
  );
};

export default ProdMenufactRank;
