/**
 WMS > 입고 > 입하이력 페이지
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Title, toastError } from '../../../components';
import { InstockHistoryRequestPagingFilter, PartnerResponseSelect } from '../../../generated';
import { useQuery } from '@tanstack/react-query';
import { fetchPartners } from '../../../api/wms-api';
import useFilters from '../../../hooks/useFilters';
import { useSession } from 'next-auth/react';
import { PartnerDropDownOption } from '../../../types/PartnerDropDownOption';
import { useCommonStore } from '../../../stores';
import { TunedReactSelector } from '../../../components/TunedReactSelector';
import StoreReturnAsnHistoryComponent from '../../../components/wms/ipgo/StoreReturnAsnHistory';
import FactoryAsnHistoryComponent from '../../../components/wms/ipgo/FactoryAsnHistory';
import dayjs from 'dayjs';

const InstockHistory = () => {
  const nowPage = 'wms_instockHistory'; // filter 저장 예솔수정
  const session = useSession();

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
    s.getFilterData, //filter 예솔수정
    s.selectedRetail, //filter 예솔수정
  ]);
  const startDt = dayjs().subtract(0, 'month').startOf('month').format('YYYY-MM-DD'); // 당월 1일자로 조회한다.
  const today = dayjs(new Date()).add(6, 'hour').format('YYYY-MM-DD'); // 6시간 더하기
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;

  /** 필터 상태 예솔수정으로 주석처리함 */
  /*const [filters, onChangeFilters] = useFilters<InstockHistoryRequestPagingFilter>({
    logisId: session.data?.user.workLogisId ? Number(session.data?.user.workLogisId) : undefined, // 물류 계정 창고검색필터
    partnerId: undefined,
    factoryNm: '',
    asnType: '1', // 발주구분
    startDate: startDt,
    endDate: today,
  });*/

  const initialFilters = {
    logisId: workLogisId,
    partnerId: undefined,
    factoryNm: '',
    asnType: '1', // 발주구분 발주로 지정
    startDate: startDt,
    endDate: today,
  };

  const [filters, onChangeFilters] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 예솔수정

  /** 화주옵션 조회 */
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerList, setPartnerList] = useState<PartnerDropDownOption[]>([]);
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery({ queryKey: ['fetchPartners'], queryFn: () => fetchPartners(workLogisId) });
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
        const partnerCodes = body?.map((item: PartnerResponseSelect) => ({
          value: item.id,
          label: item.partnerNm,
        }));
        setPartnerList([defaultOption, ...partnerCodes]);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  /** 필터 초기화 */
  const reset = async () => {
    const defaultFilter: InstockHistoryRequestPagingFilter = {
      logisId: Number(session.data?.user.workLogisId) || undefined,
      partnerId: undefined,
      factoryNm: '',
      asnType: '1',
      startDate: startDt,
      endDate: today,
    };
  };

  /** 고객사 변경 이벤트 */
  const handleChangePartner = useCallback(
    async (option: any) => {
      onChangeFilters('partnerId', option.value);
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    [onChangeFilters],
  );

  return (
    <>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} />

      {/* 필터 영역 */}
      <Search className="type_2">
        <Search.DropDown
          title={'발주구분'}
          name={'asnType'}
          showAll={false}
          defaultOptions={[
            { label: '발주&수선', value: '1' },
            { label: '매장분', value: '2' },
          ]}
          value={filters.asnType}
          onChange={async (_, value) => {
            onChangeFilters('asnType', value);
          }}
        />
        {partnerList && partnerList.length > 1 && (
          <TunedReactSelector
            title={'고객사'}
            name={'partnerId'}
            onChange={handleChangePartner}
            options={partnerList}
            values={filters.partnerId}
            placeholder="고객사 선택"
          />
        )}
        {['1', '9'].includes(filters.asnType || '') && (
          <Search.Input
            title={'생산처'}
            name={'factoryNm'}
            placeholder={'생산처명 입력'}
            value={filters.factoryNm}
            onChange={onChangeFilters}
            filters={filters}
          />
        )}
        <Search.TwoDatePicker
          title={'일자'}
          startName={'startDate'}
          endName={'endDate'}
          filters={filters}
          value={[filters.startDate ?? '', filters.endDate ?? '']}
          onChange={onChangeFilters}
        />
      </Search>

      {/* 그리드 영역 */}
      {filters.asnType === '2' ? <StoreReturnAsnHistoryComponent filters={filters} /> : <FactoryAsnHistoryComponent filters={filters} />}
    </>
  );
};

export default InstockHistory;
