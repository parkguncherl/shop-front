import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError } from '../../../components';
import { useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { useSession } from 'next-auth/react';
import { InoutListResponse, PartnerResponseSelect } from '../../../generated';
import { fetchPartners } from '../../../api/wms-api';
import useFilters from '../../../hooks/useFilters';
import TunedGrid from '../../../components/grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowClassParams } from 'ag-grid-community';
import { Utils } from '../../../libs/utils';
import { authApi } from '../../../libs';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import dayjs from 'dayjs';
import CustomNewDatePicker, { CustomNewDatePickerRefInterface } from '../../../components/CustomNewDatePicker';
import { ReactSelectorInterface, TunedReactSelector } from '../../../components/TunedReactSelector';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const FeeSettle = () => {
  // 세션 정보
  const session = useSession();

  // 메뉴 정보
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [queryKey, setQueryKey] = useState<boolean>(false);
  const [pinnedBottomRowData, setPinnedBottomRowData] = useState<InoutListResponse[]>([]); // 합계데이터 만들기
  const gridRef = useRef<AgGridReact>(null);
  const datePickerRef = useRef<CustomNewDatePickerRefInterface | null>(null);
  const [gridData, setGridData] = useState<InoutListResponse[]>([]);
  const reactSelectRef = useRef<ReactSelectorInterface>(null);
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    partnerId: 0,
    searchType: 'D',
    prodAttrCd: '',
    skuNm: '',
    logisId: workLogisId,
  });

  const gridColumns = useMemo<ColDef<InoutListResponse>[]>(
    () => [
      {
        field: 'no',
        headerName: 'No.',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'workYmd',
        headerName: '일자',
        minWidth: 80,
        maxWidth: 80,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'startInvenCnt',
        headerName: '기초재고',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'stockCnt',
        headerName: '입고합',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'stockFeeAmt',
        headerName: '입고비',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'jobCnt',
        headerName: '출고합',
        minWidth: 70,
        maxWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'jobFeeAmt',
        headerName: '출고비',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'jobTotAmt',
        headerName: '기준금액',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'invenIncCnt',
        headerName: '증감',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: (params) => {
          return {
            ...GridSetting.CellStyle.RIGHT,
            color: params.value < 0 ? 'red' : '', // Set color based on value
          };
        },

        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'endInvenCnt',
        headerName: '기말재고',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'maintFeeAmt',
        headerName: '보관비',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'hangerCnt',
        headerName: '행거재고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'hangerFeeAmt',
        headerName: '보관비',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'serviceFeeAmt',
        headerName: '일반수수료',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'orderFeeAmt',
        headerName: '제작수수료',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'totalFeeAmt',
        headerName: '총수수료',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        cellRenderer: 'NUMBER_COMMA',
      },
      {
        field: 'asnStockCnt',
        headerName: '발주입고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'repairStockCnt',
        headerName: '수선입고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'giftStockCnt',
        headerName: '매장입고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'sailCnt',
        headerName: '판매출고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'misongCnt',
        headerName: '미송출고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'sampleCnt',
        headerName: '샘플출고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'maejangCnt',
        headerName: '매장출고',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  // 화주 변경 핸들러
  const handleChangePartner = (option: any) => {
    onChangeFilters('partnerId', option.value.toString());
    setTimeout(() => {
      setQueryKey(!queryKey);
    }, 10);
  };

  // 초기화 기능
  const reset = async () => {
    //onFiltersReset();
    // 파트너 선택 상태도 초기화
    onChangeFilters('startDate', dayjs().subtract(1, 'month').format('YYYY-MM-DD'));
    onChangeFilters('endDate', dayjs().format('YYYY-MM-DD'));
    onChangeFilters('partnerId', 0);
    onChangeFilters('searchType', 'D');
    onChangeFilters('prodAttrCd', '');
    onChangeFilters('skuNm', '');
    onChangeFilters('feeType', 'A');
    reactSelectRef.current?.reactSelectorReset();
    setTimeout(() => setQueryKey(!queryKey), 10);
  };

  // 화주옵션 조회
  const defaultOption = { value: '0', label: '전체' };
  const [partnerOption, setPartnerOption] = useState<any>([defaultOption]);
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

  const onSearch = async () => {
    setQueryKey(!queryKey);
  };

  // 출고정보 목록 조회
  const {
    data: inoutList,
    isSuccess: isListSuccess,
    isFetched,
  } = useQuery(
    ['/wms/inout/list', queryKey, filters.startDate, filters.endDate], // filters 추가
    () =>
      authApi.get('/wms/inout/list', {
        params: filters,
      }),
  );

  useEffect(() => {
    if (isListSuccess && isFetched && inoutList?.data) {
      console.log('inoutList ==>', inoutList);
      const { resultCode, body, resultMessage } = inoutList.data;
      if (resultCode === 200 && body) {
        setGridData(body);
        if (body && body.length > 0) {
          const {
            startInvenCnt,
            stockCnt,
            stockFeeAmt,
            jobCnt,
            jobFeeAmt,
            serviceFeeAmt,
            orderFeeAmt,
            jobTotAmt,
            invenIncCnt,
            endInvenCnt,
            maintFeeAmt,
            hangerCnt,
            hangerFeeAmt,
            asnStockCnt,
            repairStockCnt,
            giftStockCnt,
            sailCnt,
            misongCnt,
            sampleCnt,
            maejangCnt,
          } = body.reduce(
            (
              acc: {
                startInvenCnt: number;
                stockCnt: number;
                stockFeeAmt: number;
                jobCnt: number;
                jobFeeAmt: number;
                serviceFeeAmt: number;
                orderFeeAmt: number;
                jobTotAmt: number;
                invenIncCnt: number;
                endInvenCnt: number;
                maintFeeAmt: number;
                hangerCnt: number;
                hangerFeeAmt: number;
                asnStockCnt: number;
                repairStockCnt: number;
                giftStockCnt: number;
                sailCnt: number;
                misongCnt: number;
                sampleCnt: number;
                maejangCnt: number;
              },
              data: InoutListResponse,
            ) => {
              return {
                startInvenCnt: acc.startInvenCnt + (data.startInvenCnt ? data.startInvenCnt : 0),
                stockCnt: acc.stockCnt + (data.stockCnt ? data.stockCnt : 0),
                stockFeeAmt: acc.stockFeeAmt + (data.stockFeeAmt ? data.stockFeeAmt : 0),
                jobCnt: acc.jobCnt + (data.jobCnt ? data.jobCnt : 0),
                jobFeeAmt: acc.jobFeeAmt + (data.jobFeeAmt ? data.jobFeeAmt : 0),
                jobTotAmt: acc.jobTotAmt + (data.jobTotAmt ? data.jobTotAmt : 0),
                serviceFeeAmt: acc.serviceFeeAmt + (data.serviceFeeAmt ? data.serviceFeeAmt : 0),
                orderFeeAmt: acc.orderFeeAmt + (data.orderFeeAmt ? data.orderFeeAmt : 0),
                invenIncCnt: acc.invenIncCnt + (data.invenIncCnt ? data.invenIncCnt : 0),
                endInvenCnt: acc.endInvenCnt + (data.endInvenCnt ? data.endInvenCnt : 0),
                maintFeeAmt: acc.maintFeeAmt + (data.maintFeeAmt ? data.maintFeeAmt : 0),
                hangerCnt: acc.hangerCnt + (data.hangerCnt ? data.hangerCnt : 0),
                hangerFeeAmt: acc.hangerFeeAmt + (data.hangerFeeAmt ? data.hangerFeeAmt : 0),
                asnStockCnt: acc.asnStockCnt + (data.asnStockCnt ? data.asnStockCnt : 0),
                repairStockCnt: acc.repairStockCnt + (data.repairStockCnt ? data.repairStockCnt : 0),
                giftStockCnt: acc.giftStockCnt + (data.giftStockCnt ? data.giftStockCnt : 0),
                sailCnt: acc.sailCnt + (data.sailCnt ? data.sailCnt : 0),
                misongCnt: acc.misongCnt + (data.misongCnt ? data.misongCnt : 0),
                sampleCnt: acc.sampleCnt + (data.sampleCnt ? data.sampleCnt : 0),
                maejangCnt: acc.maejangCnt + (data.maejangCnt ? data.maejangCnt : 0),
              };
            },
            {
              startInvenCnt: 0,
              stockCnt: 0,
              stockFeeAmt: 0,
              jobCnt: 0,
              jobFeeAmt: 0,
              jobTotAmt: 0,
              serviceFeeAmt: 0,
              orderFeeAmt: 0,
              invenIncCnt: 0,
              endInvenCnt: 0,
              maintFeeAmt: 0,
              hangerCnt: 0,
              hangerFeeAmt: 0,
              asnStockCnt: 0,
              repairStockCnt: 0,
              giftStockCnt: 0,
              sailCnt: 0,
              misongCnt: 0,
              sampleCnt: 0,
              maejangCnt: 0,
            }, // 초기값 설정
          );

          setPinnedBottomRowData([
            {
              startInvenCnt: startInvenCnt,
              stockCnt: stockCnt,
              stockFeeAmt: stockFeeAmt,
              jobCnt: jobCnt,
              jobFeeAmt: jobFeeAmt,
              jobTotAmt: jobTotAmt,
              serviceFeeAmt: serviceFeeAmt,
              orderFeeAmt: orderFeeAmt,
              invenIncCnt: invenIncCnt,
              endInvenCnt: endInvenCnt,
              maintFeeAmt: maintFeeAmt,
              hangerCnt: hangerCnt,
              hangerFeeAmt: hangerFeeAmt,
              asnStockCnt: asnStockCnt,
              repairStockCnt: repairStockCnt,
              giftStockCnt: giftStockCnt,
              sailCnt: sailCnt,
              misongCnt: misongCnt,
              sampleCnt: sampleCnt,
              maejangCnt: maejangCnt,
            },
          ]);
        }
      } else {
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [isListSuccess, inoutList, isFetched]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.node.rowPinned === 'bottom') {
      // 합계 행 스타일링
      rtnValue = rtnValue ? rtnValue + ' ag-grid-pinned-row' : 'ag-grid-pinned-row';
    }

    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={onSearch} filters={filters} reset={reset} />
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
          //selectType={'type'} //defaultType 과 selectType 이 동일하면 동일한 한가지면 펼침메뉴에 나타난다.
          ref={datePickerRef}
        />
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="고객사 선택"
          ref={reactSelectRef}
        />
        <Search.Input
          title={'상품명'}
          name={'skuNm'}
          placeholder={'메인 제작 공장검색'}
          value={filters.skuNm}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <Search.DropDown
          title={'주기'}
          name={'searchType'}
          showAll={false}
          defaultOptions={[
            { key: 'D', label: '일별', value: 'D' },
            { key: 'W', label: '주별', value: 'W' },
            { key: 'M', label: '월별', value: 'M' },
          ]}
          value={filters.searchType}
          onChange={(name, value) => {
            onChangeFilters(name, value);
            setQueryKey(!queryKey);
          }}
        />
      </Search>
      <Search className="type_2">
        <Search.DropDown
          title={'수수료구분'}
          name={'feeType'}
          codeUpper={'10560'}
          showAll={false}
          value={filters.feeType}
          onChange={(name, value) => {
            onChangeFilters(name, value);
            setQueryKey(!queryKey);
          }}
        />
        <dt>
          <label style={{ fontSize: 13, fontFamily: 'NotoSansKR', color: '#333' }}>일반/제작 %</label>
        </dt>
        <Search.Input
          title={''}
          name={'serviceFee'}
          styles={{ width: 70 }} // 여기서 width 100 적용
          value={filters.serviceFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <Search.Input
          title={''}
          name={'orderFee'}
          value={filters.orderFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
          styles={{ width: 70 }} // 여기서 width 100 적용
        />
        <dt>
          <label style={{ fontSize: 13, fontFamily: 'NotoSansKR', color: '#333' }}>입출고비</label>
        </dt>
        <Search.Input
          title={''}
          name={'stockFee'}
          styles={{ width: 70 }} // 여기서 width 100 적용
          value={filters.stockFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <Search.Input
          title={''}
          name={'jobFee'}
          styles={{ width: 70 }} // 여기서 width 100 적용
          value={filters.jobFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <dt>
          <label style={{ fontSize: 13, fontFamily: 'NotoSansKR', color: '#333' }}>보관비</label>
        </dt>
        <Search.Input
          title={''}
          name={'maintFee'}
          styles={{ width: 70 }} // 여기서 width 100 적용
          value={filters.maintFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
        <Search.Input
          title={''}
          name={'hangerFee'}
          styles={{ width: 70 }} // 여기서 width 100 적용
          value={filters.hangerFee}
          onChange={onChangeFilters}
          onEnter={() => setQueryKey(!queryKey)}
        />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={gridData ? gridData.length : 0} search={onSearch} />
        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<InoutListResponse>
              ref={gridRef}
              rowData={gridData}
              columnDefs={gridColumns}
              defaultColDef={defaultColDef}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              className={'wmsDashboard check'}
              suppressRowClickSelection={false}
              pinnedBottomRowData={pinnedBottomRowData}
              getRowClass={getRowClass}
              rowSelection={'single'}
            />
            <div className="btnArea"> </div>

            {/* 미리보기 & 프린트 */}

            <div className="previewBox"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FeeSettle;
