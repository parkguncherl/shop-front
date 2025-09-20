/**
 데이타 이관 예정 목록 Component
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { ApiResponseBoolean, MigrationResponseMigrationList, PartnerResponseSelect } from '../../../generated';
import { Search, Table, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import { DataListDropDown } from '../../DataListDropDown';
import { fetchPartners } from '../../../api/wms-api';
import { MigrationTemplate } from '../../popup/wms/system/storedatamigration/migrationTemplate';
import Loading from '../../Loading';
import DataMigrationPop from '../../popup/wms/system/DataMigrationPop';
import TunedGrid from '../../grid/TunedGrid';
import { useSession } from 'next-auth/react';

const DataMigrationComponent = () => {
  const gridRef = useRef<AgGridReact>(null);
  const { onGridReady } = useAgGridApi();
  const [partnerId, setPartnerId] = useState<number>();
  const [transTp, setTransTp] = useState<string>();
  const [transTpNm, setTransTpNm] = useState<string>();
  const [rowData, setRowData] = useState<any[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(false);
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  const [filters, onChangeFilters] = useFilters({
    transTp: 'A',
    partnerId: 0,
    resultCd: '',
  });

  /**
   *  API
   */

  // 화주옵션 조회
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
        setPartnerOption(partnerCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchPartnerSuccess, partners]);

  // 데이타 목록 조회
  const getMigrationData = async () => {
    if (!filters.transTp || !filters.partnerId) {
      toastError('화주 또는 이관구분을 선택해주세요');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await authApi.get('/migration/list', { params: { ...filters } });
      const { resultCode, body, resultMessage } = data;
      if (resultCode == 200) {
        console.log('목록데이타 응답 >>', body);
        if (body.length > 0) {
          const loadTransTp = body[0].transTp;
          const loadTransTpNm = body[0].transTpNm;
          const loadPartnerId = body[0].partnerId;

          const selectedTemplate = MigrationTemplate.find((data) => data.typeCd === loadTransTp)?.column;
          console.log('선택된 템플릿:', selectedTemplate);
          if (!selectedTemplate) {
            toastError('해당 이관에 대한 템플릿 정보가 없습니다.');
            return;
          }

          const commonColumn = [
            {
              field: 'id',
              headerName: 'id',
              hide: true,
            },
            {
              field: 'result',
              headerName: '이전결과',
              headerCheckboxSelection: true, // 헤더에 체크박스 추가
              checkboxSelection: true, // 각 행에 체크박스 추가
              filter: true,
              resizable: true,
              minWidth: 100,
              cellStyle: GridSetting.CellStyle.CENTER,
              suppressHeaderMenuButton: true,
            },
            {
              field: 'resultMsg',
              headerName: '오류메세지',
              // resizable: true,
              minWidth: 150,
              cellStyle: GridSetting.CellStyle.CENTER,
              suppressHeaderMenuButton: true,
              valueFormatter: (params: any) => {
                return params?.data.isInvalid ? ('error [' + params.value ? '' : params.value + ']') : params.value;
              },
            },
          ];

          // 동적 컬럼 생성
          const columns = selectedTemplate?.map((item, index) => {
            return {
              field: item.header,
              headerName: item.header,
              cellStyle: GridSetting.CellStyle.LEFT,
              filter: true,
              resizable: true,
              suppressHeaderMenuButton: true,
            };
          });

          setColumnDefs([...commonColumn, ...columns]);
          setRowData(verifyData(body)); // 데이타 검증 후 데이타 넣는다.
          setPartnerId(loadPartnerId);
          setTransTp(loadTransTp);
          setTransTpNm(loadTransTpNm);
        } else {
          setRowData([]);
          toastError('데이타가 없습니다.');
        }
      } else {
        toastError(resultMessage);
      }
    } catch {
      toastError('목록 조회 API 오류');
    } finally {
      setIsLoading(false);
    }
  };

  // 데이타 이전 등록 API
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { mutate: createMigrationMutate, isLoading: createLoading } = useMutation(
    (params: any) => authApi.post<ApiResponseBoolean>('/migration/create', params),
    {
      onSuccess: async (e) => {
        if (e.data.resultCode === 200) {
          console.log(e);
          if (e.data.resultMessage) {
            // 팝업
            setErrorMessage(e.data.resultMessage);
            setErrorPop(true);
            //toastError(e.data.resultMessage, { autoClose: false, draggable: true, theme: 'light' });
          } else {
            toastSuccess('저장되었습니다.');
          }

          getMigrationData();
        } else {
          toastError(e.data.resultMessage);
        }
      },
      onError: (error) => {
        console.error(error);
        toastError('등록 중 오류가 발생하였습니다.');
      },
    },
  );

  /**
   * Event Handler
   */
  // 이관시작
  const handleMigration = async () => {
    const gridApi = gridRef.current?.api;
    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('이관할 데이타가 선택이 누락되었습니다.', { autoClose: 1000 });
      return;
    } else {
      const invalidRow = selectedRows.some((row: any) => row.isInvalid);

      /*
      if (invalidRow) {
        toastError('검증 문제가 있는 항목이 선택되어 확인후 이관처리 하세요.', { autoClose: 1000 });
        return;
      }
*/

      if (!partnerId || !transTp) {
        toastError('전송할 데이타상에 화주아이디와 이관구분코드가 누락되었습니다.', { autoClose: 1000 });
        return;
      }

      console.log('선택된 행 >>', selectedRows);

      const params = {
        partnerId: partnerId,
        transTp: transTp,
        transTpNm: transTpNm,
        transJson: JSON.stringify(selectedRows),
      };

      console.log('이관 전송 데이타 >>', params);
      createMigrationMutate(params);
    }
  };

  // 필터 옵션 선택
  const [selectedPartner, setSelectedPartner] = useState();

  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value);
  };

  // 데이타 검증
  const verifyData = (loadData: MigrationResponseMigrationList[]) => {
    if (!loadData || !loadData[0]?.transTpNm) return [];

    const parsedTransTpNm = loadData[0].transTpNm;
    console.log('parsedTransTpNm >>', parsedTransTpNm);
    // 유효성 검사 규칙 정의
    const validationRules: { [key: string]: (item: any, otherItem: any) => boolean } = {
      생산처: (item, otherItem) => item['생산처'] === otherItem['생산처'] || isNaN(item['현잔액']),
      판매처: (item, otherItem) => item['판매처'] === otherItem['판매처'] || isNaN(item['현잔액']),
      상품: (item, otherItem) => item['품명'] === otherItem['품명'] && item['칼라'] === otherItem['칼라'] && item['사이즈'] === otherItem['사이즈'],
      미송: (item, otherItem) =>
        !item['미송일자'] || !item['판매처'] || !item['품명'] || isNaN(item['거래단가']) || isNaN(item['잔량']) || isNaN(item['잔량금액']),
      샘플미회수: (item, otherItem) =>
        !item['샘플일자'] || !item['판매처'] || !item['품명'] || isNaN(item['거래단가']) || isNaN(item['잔량']) || isNaN(item['잔량금액']),
      판매원장: (item, otherItem) =>
        !item['거래일자'] ||
        !item['판매처'] ||
        !item['품명'] ||
        isNaN(item['거래단가']) ||
        isNaN(item['단가DC']) ||
        isNaN(item['판매량']) ||
        isNaN(item['판매금액']) ||
        isNaN(item['반품량']) ||
        isNaN(item['반품금액']),
      샘플회수: (item, otherItem) => !item['샘플일자'] || !item['판매처'] || !item['품명'] || isNaN(item['샘플']) || isNaN(item['회수']) || isNaN(item['잔량']),
      미송발송: (item, otherItem) => !item['미송일자'] || !item['판매처'] || !item['품명'] || isNaN(item['미송']) || isNaN(item['발송']) || isNaN(item['잔량']),
      입고원장: (item, otherItem) =>
        !item['거래일자'] ||
        !item['입고처'] ||
        !item['품명'] ||
        isNaN(item['거래단가']) ||
        isNaN(item['단가DC']) ||
        isNaN(item['입고량']) ||
        isNaN(item['입고금액']) ||
        isNaN(item['반출량']) ||
        isNaN(item['반출금액']),
      부가세미입금: (item, otherItem) =>
        !item['청구일자'] ||
        !item['판매처'] ||
        isNaN(item['청구금액']) ||
        isNaN(item['현금입금']) ||
        isNaN(item['통장입금']) ||
        isNaN(item['할인금액']) ||
        isNaN(item['잔액']),
    };

    // 선택된 유효성 검사 규칙
    const validationRule = validationRules[parsedTransTpNm];
    if (!validationRule) return []; // 규칙이 없을 경우 빈 배열 반환

    const transJsonArr = loadData.map((data) => ({
      id: data.id,
      result: data.resultCdNm,
      resultMsg: data.resultMsg,
      transJson: data.transJson ? JSON.parse(data.transJson) : {},
    }));

    // 각 항목에 대해 검증 수행
    const verifiedData: any[] = transJsonArr.map(({ id, result, resultMsg, transJson }, index: number, self: any[]) => ({
      ...transJson,
      id: id,
      result: result,
      resultMsg: resultMsg,
      isInvalid: self.some(({ transJson: otherTransJson, result }, otherIndex: number) => otherIndex !== index && validationRule(transJson, otherTransJson)),
    }));

    console.log('데이타 검증 결과 >> ', verifiedData);

    // 검증 오류 데이타 우선 정렬
    return verifiedData ? verifiedData.sort((a: any, b: any) => (a.isInvalid === b.isInvalid ? 0 : a.isInvalid ? -1 : 1)) : [];
  };

  // 검증 오류 데이타 행 배경색 변경
  const rowStyle = (params: any) => {
    return params.data.isInvalid ? { backgroundColor: 'tomato', color: 'gray' } : undefined;
  };

  // 최초 데이타 렌더링 및 재렌더링시
  const onRowDataUpdated = (params: any) => {
    params.api.forEachNode((node: any) => {
      if (!node.data.isInvalid) {
        node.setSelected(true); // 선택 상태로 설정
      }
    });
  };

  const [errorPop, setErrorPop] = useState<boolean>(false);

  useEffect(() => {
    if (filters.transTp) {
      getMigrationData();
    }
  }, [filters.transTp, filters.resultCd]);

  return (
    <div>
      <Title title={'이관 예정 목록'} filters={filters} detail={true} search={() => getMigrationData()} />
      <Search className="type_2 full">
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 선택"
        />
        <Search.DropDown title={'이관구분'} name={'transTp'} codeUpper={'10470'} value={filters.transTp} onChange={onChangeFilters} />
        <Search.DropDown title={'이관결과'} name={'resultCd'} codeUpper={'10480'} value={filters.resultCd} onChange={onChangeFilters} />
      </Search>

      <Table>
        <TableHeader count={rowData?.length || 0}>
          <button className="btn btnBlue" onClick={handleMigration}>
            이관시작
          </button>
        </TableHeader>
        <TunedGrid
          ref={gridRef}
          loading={isLoading}
          rowData={rowData || []}
          columnDefs={columnDefs || []}
          // defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          gridOptions={{ rowHeight: 24, headerHeight: 35 }}
          rowSelection={'multiple'}
          suppressRowClickSelection={true}
          loadingOverlayComponent={CustomGridLoading}
          noRowsOverlayComponent={CustomNoRowsOverlay}
          enableRangeSelection={true}
          //suppressMultiRangeSelection={false}
          getRowStyle={rowStyle}
          onFirstDataRendered={onRowDataUpdated}
          onRowDataUpdated={onRowDataUpdated}
        />
      </Table>

      {createLoading && <Loading />}
      {errorPop ? <DataMigrationPop message={errorMessage} state={errorPop} setState={setErrorPop} /> : ''}
    </div>
  );
};

export default DataMigrationComponent;
