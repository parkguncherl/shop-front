/**
 WMS > 입고 > 입하정보 페이지
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import FactoryAsnComponent from '../../../components/wms/ipgo/FactoryAsn';
import StoreReturnAsnComponent from '../../../components/wms/ipgo/StoreReturnAsn';
import { Search, Title, toastError } from '../../../components';
import { InstockPagingFilter, InstockResponseStatDashBoard, PartnerResponseSelect } from '../../../generated';
import { useQuery } from '@tanstack/react-query';
import { fetchPartners } from '../../../api/wms-api';
import useFilters from '../../../hooks/useFilters';
import { useSession } from 'next-auth/react';
import { PartnerDropDownOption } from '../../../types/PartnerDropDownOption';
import { useCommonStore } from '../../../stores';
import { ReactSelectorInterface, TunedReactSelector } from '../../../components/TunedReactSelector';
import { Progress } from 'antd';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';

const Instockinfo = () => {
  const nowPage = 'wms_instockinfo'; // filter 저장 예솔수정
  const session = useSession();

  const [upMenuNm, menuNm, filterDataList, setFilterDataList, getFilterData] = useCommonStore((s) => [
    s.upMenuNm,
    s.menuNm,
    s.filterDataList, //filter 예솔수정
    s.setFilterDataList, //filter 예솔수정
    s.getFilterData, //filter 예솔수정
    s.selectedRetail, //화주 예솔수정
  ]);
  const [instockStatData, setInstockStatData] = useState<InstockResponseStatDashBoard>();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const reactSelectRef = useRef<ReactSelectorInterface>(null);

  /** 필터 상태 예솔수정으로 주석처리함 */
  /*const [filters, onChangeFilters] = useFilters<InstockPagingFilter>({
    logisId: session.data?.user.workLogisId ? Number(session.data?.user.workLogisId) : undefined, // 물류 계정 창고검색필터
    partnerId: undefined,
    factoryNm: '',
    asnType: '1', // 발주구분
  });*/

  const initialFilters = {
    logisId: session.data?.user.workLogisId ? Number(session.data?.user.workLogisId) : undefined,
    partnerId: undefined,
    factoryNm: '',
    asnType: '1', // 발주구분 발주로 지정
  };

  const [filters, onChangeFilters, onFiltersReset] = useFilters(getFilterData(filterDataList, nowPage) || initialFilters); // filter 예솔수정

  /** 통계 대시보드 데이타 조회 */
  const { data: instockStat, isSuccess: isStatSuccess } = useQuery({
    queryKey: ['/instock/stat/dashboard', filters.logisId, filters.partnerId],
    queryFn: () =>
      authApi.get('/instock/stat/dashboard', {
        params: {
          logisId: filters.logisId ? filters.logisId : Number(session.data?.user.workLogisId),
        },
      }),
    enabled: !!filters.logisId,
    staleTime: 5000, // 데이터 신선도 시간 설정 (5초)
    refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
    refetchOnReconnect: true, // 네트워크 재연결시 리패치
    retry: 1, // 실패시 1회 재시도
  });

  useEffect(() => {
    if (isStatSuccess && instockStat) {
      const { resultCode, body, resultMessage } = instockStat.data;
      if (resultCode == 200) {
        setFilterDataList([...filterDataList, { uri: nowPage, filterData: filters }]); // filter 예솔수정
        setInstockStatData(body || {});
      } else {
        toastError(resultMessage);
        setInstockStatData({
          totalFactoryInstock: 0,
          pastFactoryInstockedCnt: 0,
          totalOutgoingInstock: 0,
          pastOutgingInstockedCnt: 0,
          totalStoreReqInstock: 0,
          pastStoreReqInstockedCnt: 0,
        });
      }
    }
  }, [instockStat, isStatSuccess]);

  /** 화주옵션 조회 */
  const defaultOption: any = { value: 0, label: '전체' };
  const [partnerList, setPartnerList] = useState<PartnerDropDownOption[]>([]);
  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners'], () => fetchPartners(workLogisId));
  useEffect(() => {
    if (isFetchPartnerSuccess && partners) {
      const { resultCode, body, resultMessage } = partners.data;
      if (resultCode === 200) {
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
    const defaultFilter: InstockPagingFilter = {
      logisId: Number(session.data?.user.workLogisId) || undefined,
      partnerId: 0,
      factoryNm: '',
      asnType: '1',
    };

    Object.entries(defaultFilter).forEach(([key, value]) => {
      console.log('key ==>', key, value);
      onChangeFilters(key as keyof InstockPagingFilter, value);
    });

    reactSelectRef.current?.reactSelectorReset();
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
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} reset={reset} />

      {/* 필터 영역 */}
      <Search className="type_2">
        <Search.DropDown
          title={'발주구분'}
          name={'asnType'}
          showAll={false}
          defaultOptions={[
            { label: '발주', value: '1' },
            { label: '수선발주', value: '9' },
            { label: '매장분', value: '2' },
          ]}
          value={filters.asnType}
          onChange={async (_, value) => {
            onChangeFilters('asnType', value);
          }}
        />
        <TunedReactSelector
          title={'고객사'}
          name={'partnerId'}
          onChange={handleChangePartner}
          options={partnerList}
          placeholder="고객사 선택"
          ref={reactSelectRef}
          values={filters.partnerId}
        />
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
      </Search>

      {/* 대시보드 영역 */}
      <div className="tableDashboard">
        <div className="itemBox instock">
          <dl>
            <dt>
              <strong>발주</strong>
              <Progress
                percent={
                  instockStatData?.totalFactoryInstock
                    ? Number(((Number(instockStatData?.pastFactoryInstockedCnt ?? 0) / Number(instockStatData?.totalFactoryInstock ?? 1)) * 100).toFixed(0))
                    : 0
                }
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>완료</strong>
                  <span>{Utils.setComma(Number(instockStatData?.pastFactoryInstockedCnt))}장</span>
                </li>
                <li>
                  <strong>예정</strong>
                  <span>{Utils.setComma(Number(instockStatData?.totalFactoryInstock))}장</span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>수선</strong>
              <Progress
                percent={
                  instockStatData?.totalOutgoingInstock
                    ? Number(((Number(instockStatData?.pastOutgingInstockedCnt ?? 0) / Number(instockStatData?.totalOutgoingInstock ?? 1)) * 100).toFixed(0))
                    : 0
                }
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>완료</strong>
                  <span>{Utils.setComma(Number(instockStatData?.pastOutgingInstockedCnt))}장</span>
                </li>
                <li>
                  <strong>예정</strong>
                  <span>{Utils.setComma(Number(instockStatData?.totalOutgoingInstock))}장</span>
                </li>
              </ul>
            </dd>
          </dl>
          <dl>
            <dt>
              <strong>매장분</strong>
              <Progress
                percent={
                  instockStatData?.totalStoreReqInstock
                    ? Number(((Number(instockStatData?.pastStoreReqInstockedCnt ?? 0) / Number(instockStatData?.totalStoreReqInstock ?? 1)) * 100).toFixed(0))
                    : 0
                }
              />
            </dt>
            <dd>
              <ul>
                <li>
                  <strong>완료</strong>
                  <span>{Utils.setComma(Number(instockStatData?.pastStoreReqInstockedCnt))}장</span>
                </li>
                <li>
                  <strong>예정</strong>
                  <span>{Utils.setComma(Number(instockStatData?.totalStoreReqInstock))}장</span>
                </li>
              </ul>
            </dd>
          </dl>
        </div>
      </div>

      {/* 그리드 영역 */}
      {filters.asnType === '2' ? <StoreReturnAsnComponent filters={filters} /> : <FactoryAsnComponent filters={filters} />}
    </div>
  );
};

export default Instockinfo;
