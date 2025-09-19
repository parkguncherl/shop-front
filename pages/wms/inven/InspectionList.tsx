import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCommonStore } from '../../../stores';
import { useSession } from 'next-auth/react';
import { DataListDropDown } from '../../../components/DataListDropDown';
import { InspectionInfoResponsePaging, InventoryLocationListResponse, PartnerResponseSelect, SkuLocationInfoListResponse } from '../../../generated';
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
import { InspectionInfoResponseDetail } from '../../../generated';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useInspectionListStore } from '../../../stores/wms/useInspectionListStore';
import data from '@react-google-maps/api/src/components/drawing/Data';
import dayjs from 'dayjs';
import Loading from '../../../components/Loading';

/**
 * 재고정보 메인 페이지 컴포넌트
 * SKU단위와 LOC단위 보기를 전환할 수 있는 메인 컴포넌트
 */
const InspectionList: React.FC = () => {
  // 스위치 상태 관리 (true: SKU단위, false: LOC단위)
  const [selectedRow, setSelectedRow] = useState<InspectionInfoResponsePaging>({});
  const [selectedRowId, setSelectedRowId] = useState<number>(0);

  // 세션 정보
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  // 메뉴 정보
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [modalType, closeModal, openModal, updateInspectionState, updateInspectionEtc] = useInspectionListStore((s) => [
    s.modalType,
    s.closeModal,
    s.openModal,
    s.updateInspectionState,
    s.updateInspectionEtc,
  ]);
  const [zoneOption, setZoneOption] = useState([]); // 존 리스트
  const topGridDivRef = useRef<HTMLDivElement>(null);
  const rightGridDivRef = useRef<HTMLDivElement>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>();
  const [selectedZone, setSelectedZone] = useState<any>();
  const [rowData, setRowData] = useState<InventoryLocationListResponse[]>();
  const [rowDataRight, setRowDataRight] = useState<InspectionInfoResponseDetail[]>();
  const [isUpdateing, setIsUpdateing] = useState<boolean>(false);

  const gridRef = useRef<AgGridReact>(null);
  const subGridRef = useRef<AgGridReact>(null);
  // 재고 정보 스토어
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    logisId: workLogisId,
    partnerId: undefined,
    zoneId: '0',
    skuNm: '',
  });

  const gridColumns = useMemo<ColDef<InspectionInfoResponsePaging>[]>(
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
        field: 'partnerNm',
        headerName: '고객사',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'inspectStatCdNm',
        headerName: '진행상태',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'inspectCdNm',
        headerName: '신청구분',
        minWidth: 65,
        maxWidth: 65,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.CENTER,
      },
      {
        field: 'inspectTitle',
        headerName: '실사제목',
        minWidth: 80,
        maxWidth: 150,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'creTm',
        headerName: '요청일',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return dayjs(params.value).format('YY-MM-DD(ddd)');
        },
      },
      {
        field: 'creTm',
        headerName: '요청시간',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return dayjs(params.value).format('HH:mm');
        },
      },
      {
        field: 'inspectTm',
        headerName: '실사일',
        minWidth: 80,
        maxWidth: 80,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return params.value ? dayjs(params.value).format('YY-MM-DD(ddd)') : '-';
        },
      },
      {
        field: 'inspectTm',
        headerName: '실사시간',
        minWidth: 65,
        maxWidth: 65,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return params.value ? dayjs(params.value).format('HH:mm') : '-';
        },
      },
      {
        field: 'addCnt',
        headerName: '증감',
        minWidth: 40,
        maxWidth: 40,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'createUser',
        headerName: '신청자',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'updateUser',
        headerName: '작업자',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'inspectEtc',
        headerName: '비고',
        minWidth: 90,
        maxWidth: 90,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (params) => {
          if (params.data?.id) {
            updateInspectionEtcMutate({ inspectId: params.data.id, inspectEtc: params.newValue });
          }
        },
      },
      /*
      {
        field: 'prodCnt',
        headerName: '상품#',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'skuCnt',
        headerName: 'SKU#',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'zoneCnt',
        headerName: 'ZONE #',
        minWidth: 52,
        maxWidth: 52,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'locCnt',
        headerName: 'LTCN #',
        minWidth: 50,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'befCnt',
        headerName: '신청시',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'centerCnt',
        headerName: '빈블러',
        minWidth: 60,
        maxWidth: 60,
        suppressHeaderMenuButton: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
*/
    ],
    [],
  );

  const rightGridColumns = useMemo<ColDef<InspectionInfoResponseDetail>[]>(
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
        field: 'zoneCdNm',
        headerName: 'ZONE',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'locAlias',
        headerName: 'LTCN',
        minWidth: 100,
        maxWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuNm',
        headerName: '상품',
        minWidth: 200,
        maxWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'befCnt',
        headerName: '신청시',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'centerCnt',
        headerName: '빈블러',
        minWidth: 50,
        maxWidth: 50,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'aftCnt',
        headerName: '실사결과',
        minWidth: 60,
        maxWidth: 60,
        editable: true,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        headerClass: 'custom-header-class',
        valueFormatter: (params) => {
          if (params.value) {
            return Utils.setComma(params.value);
          }
        },
      },
    ],
    [],
  );

  const { data: zonList, isSuccess: isZoneListSuccess } = useQuery(
    ['/zone/dropDownZoneList'], // 쿼리 키에 zoneId 포함
    (): any => authApi.get(`/zone/dropDownZoneList/` + workLogisId),
    {
      enabled: !!workLogisId, // logisId가 유효할 때에만 실행
    },
  );

  useEffect(() => {
    if (isZoneListSuccess && zonList) {
      const { resultCode, body, resultMessage } = zonList.data;
      if (resultCode === 200) {
        const updateList = body?.map((item: any) => ({
          key: item.id,
          value: item.id,
          label: item.zoneCdNm,
          zoneId: item.zoneId,
        }));
        setZoneOption(updateList);
      } else {
        toastError(resultMessage);
      }
    }
  }, [zonList, isZoneListSuccess]);

  // 화주 변경 핸들러
  const handleChangePartner = (option: any) => {
    setSelectedPartner(option);
    onChangeFilters('partnerId', option.value.toString());
    setTimeout(() => {
      search();
    }, 10);
  };

  const handleChangeZone = (option: any) => {
    setSelectedZone(option);
    onChangeFilters('zoneId', option.value);
    setTimeout(() => {
      search();
    }, 10);
  };

  // 검색 기능
  const search = async () => {
    // 검색 시 페이지 1로 초기화
    refetchInspectionInfo().then(() => console.log('search refetchInvenSku ==='));
  };

  // 초기화 기능
  const reset = async () => {
    onChangeFilters('logisId', workLogisId);
    onChangeFilters('partnerId', undefined);
    onChangeFilters('zoneId', '0');
    onChangeFilters('skuNm', '');
    setSelectedPartner(null);
    refetchInspectionInfo().then(() => console.log('reset refetchInvenSku ==='));
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

  // 재고위치정보 목록 조회
  const {
    data: inspectionInfo,
    isFetching: isFetching,
    isSuccess: isInspectionInfosSuccess,
    refetch: refetchInspectionInfo,
  } = useQuery(
    ['/wms/inven/pagingInspectInfo'], // filters 추가
    () =>
      authApi.get('/wms/inven/pagingInspectInfo', {
        params: filters,
      }),
    {
      enabled: !!filters.logisId,
    },
  );

  // 재고위치정보 목록 조회
  const { refetch: refetchSkuInspection } = useQuery({
    queryKey: ['/wms/inven/selectInspectDetList', selectedRowId], // filters 추가
    queryFn: () => authApi.get('/wms/inven/selectInspectDetList/' + selectedRowId),
    enabled: (selectedRowId && (selectedRowId || 0)) > 0,
  });

  const { mutate: updateInspectionStateMutate } = useMutation(updateInspectionState, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await refetchInspectionInfo();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setIsUpdateing(false);
      }
    },
  });

  const { mutate: updateInspectionEtcMutate } = useMutation(updateInspectionEtc, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await refetchInspectionInfo();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  useEffect(() => {
    console.log('inspectionInfo ==>', inspectionInfo);
    if (isInspectionInfosSuccess && inspectionInfo) {
      const { resultCode, body, resultMessage } = inspectionInfo.data;
      if (resultCode === 200 && body) {
        setRowData((body.rows as InspectionInfoResponsePaging[]) || []);
      } else {
        toastError(resultMessage || '재고 목록 조회에 실패했습니다.');
      }
    }
  }, [inspectionInfo, isInspectionInfosSuccess]);

  useEffect(() => {
    refetchSkuInspection().then((result) => {
      if (result.data && result.status == 'success') {
        console.log('fetchVatInouts==>', result.data);
        const { resultCode, body, resultMessage } = result.data.data;
        if (resultCode === 200) {
          setRowDataRight(body);
        } else {
          toastError(resultMessage);
        }
      }
    });
  }, [selectedRowId]);

  const getRowClass = useCallback((params: RowClassParams) => {
    let rtnValue = '';
    if (params.data.inspectStatCdNm === '완료') {
      rtnValue = rtnValue ? rtnValue + ' ag-row-canceled-row' : 'ag-row-canceled-row';
    }

    return rtnValue;
  }, []);

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} search={search} filters={filters} reset={reset} />
      <Search className="type_2">
        <DataListDropDown
          title={'화주'}
          name={'partnerId'}
          value={selectedPartner}
          onChange={handleChangePartner}
          options={partnerOption}
          placeholder="화주 입력"
        />
        <Search.Input title={'상품명'} name={'skuNm'} placeholder={'메인 제작 공장검색'} value={filters.skuNm} onChange={onChangeFilters} onEnter={search} />
        <Search.DropDown title={'ZONE'} name={'zoneId'} value={selectedZone} onChange={handleChangeZone} defaultOptions={zoneOption} />
      </Search>
      <div className={`makePreviewArea`}>
        {/* 테이블 헤더 - 총 건수 및 페이징 정보 표시 */}
        <TableHeader count={rowData?.length || 0} search={search}></TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <div className="layoutBox pickinginfo">
              <div className={'layout60'}>
                <div className="InfoGrid" ref={topGridDivRef}>
                  <TunedGrid<InspectionInfoResponsePaging>
                    ref={gridRef}
                    rowData={rowData}
                    columnDefs={gridColumns}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    rowSelection={'single'}
                    className={'wmsDashboard check'}
                    onRowClicked={(e) => {
                      setSelectedRowId(e.data?.id || 0);
                    }}
                    getRowClass={getRowClass}
                  />
                  <div className="btnArea"></div>
                </div>
              </div>
              <div className={'layout40'}>
                <div className="InfoGrid" ref={rightGridDivRef}>
                  <TunedGrid<SkuLocationInfoListResponse>
                    ref={subGridRef}
                    rowData={rowDataRight}
                    columnDefs={rightGridColumns}
                    defaultColDef={defaultColDef}
                    suppressRowClickSelection={false}
                    noRowsOverlayComponent={CustomNoRowsOverlay}
                    rowSelection={'single'}
                    singleClickEdit={true}
                    className={'wmsDashboard check'}
                  />
                  <div className="btnArea">
                    <div className="btnArea">
                      {' '}
                      <CustomShortcutButton
                        onClick={() => {
                          subGridRef.current?.api.stopEditing(false);
                          subGridRef.current?.api.forEachNode((node, index) => {
                            node.setDataValue('aftCnt', 0); // 컬럼 field 이름이 정확히 "skuCnt" 여야 함
                          });
                        }}
                        shortcut={COMMON_SHORTCUTS.NONE}
                        className="btn"
                        /*
                        disabled={
                          !(
                            gridRef.current?.api &&
                            gridRef.current?.api.getSelectedNodes() &&
                            gridRef.current?.api.getSelectedNodes().length === 1 &&
                            gridRef.current.api.getSelectedNodes()[0].data.inspectStatCd === '9'
                          )
                        }
*/
                      >
                        재고초기화
                      </CustomShortcutButton>
                      <CustomShortcutButton
                        onClick={() => {
                          const selectedNodes: InspectionInfoResponseDetail[] | undefined = gridRef.current?.api
                            .getSelectedNodes()
                            ?.map((node, index) => ({ ...node.data, no: ++index }));

                          subGridRef.current?.api.stopEditing(false);

                          if (selectedNodes && selectedNodes.length === 1) {
                            if (rowDataRight?.some((data) => data.aftCnt === null)) {
                              toastError(' 변경후 정보는 모두 입력되어야 합니다.');
                            } else {
                              setSelectedRow(selectedNodes[0]);
                              openModal('UPDATE_INSPECTION');
                            }
                          } else if (selectedNodes && selectedNodes.length === 0) {
                            toastError('선택된건이 존재하지 않습니다.');
                          }
                        }}
                        shortcut={COMMON_SHORTCUTS.save}
                        className="btn"
                      >
                        처리완료
                      </CustomShortcutButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 미리보기 & 프린트 */}
          <div className="previewBox"></div>
        </div>
      </div>
      <ConfirmModal
        title={
          `<div class="confirmMsg"><span class="small">` +
          selectedRow.inspectTitle +
          `</span><span class="big"><strong>재고실사 처리완료</strong>&nbsp;하시겠어요?</span>`
        }
        open={modalType.type === 'UPDATE_INSPECTION' && modalType.active}
        onConfirm={() => {
          setIsUpdateing(true);
          updateInspectionStateMutate({ inspectId: selectedRow.id, inspectStatCd: '9', inspectDetList: rowDataRight });
        }}
        onClose={() => {
          closeModal('UPDATE_INSPECTION');
        }}
      />
      {isUpdateing && <Loading />}
    </div>
  );
};

export default React.memo(InspectionList);
