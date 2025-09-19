import TunedGrid from '../../grid/TunedGrid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CellEditingStoppedEvent, CellPosition, ColDef, NewValueParams } from 'ag-grid-community';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { useLogisStore } from '../../../stores/wms/useLogisStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { toastError, toastSuccess } from '../../ToastMessage';
import { Utils } from '../../../libs/utils';
import {
  CodeDropDown,
  PartnerResponseForSearching,
  PartnerResponseSelect,
  ZoneRequestLocationInfo,
  ZoneRequestZoneInfo,
  ZoneResponseLocInfo,
  ZoneResponseZoneInfo,
} from '../../../generated';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { useZoneStore } from '../../../stores/wms/useZoneStore';
import { useCodeStore } from '../../../stores';
import { fetchPartners } from '../../../api/wms-api';
import { useSession } from 'next-auth/react';

interface LocRegPopProps {
  logisId: number;
  logisNm: string;
}

/**
 *  창고 > LOCATION 등록
 */
// todo zone 등록이 정상적으로 이루어지는지 테스트하기
export const LocRegPop = ({ logisId, logisNm }: LocRegPopProps) => {
  const queryClient = useQueryClient();
  const { modalType, closeModal, openModal } = useLogisStore();
  const session = useSession();
  const workLogisId = session.data?.user.workLogisId ? session.data?.user.workLogisId : 0;
  /** 전역 상태 */
  const [selectPartnerList] = usePartnerStore((s) => [s.selectPartnerList]);
  const [deleteZone, deleteLocation, updateLocation, updateZone, insertZone, insertLocationList] = useZoneStore((s) => [
    s.deleteZone,
    s.deleteLocation,
    s.updateLocation,
    s.updateZone,
    s.insertZone,
    s.insertLocationList,
  ]);
  const [selectDropdownByCodeUpper] = useCodeStore((s) => [s.selectDropdownByCodeUpper]);

  /** 그리드 참조 */
  const zoneGridRef = useRef<AgGridReact>(null);
  const locationGridRef = useRef<AgGridReact>(null);
  const [partnerList, setPartnerList] = useState<{ value: string; label: string }[]>([]);
  const defaultOption = { value: '', label: '선택' };

  /** 지역 상태 */
  const selectedZoneIdRef = useRef<number>(0);
  const [partnerSearchStatus, setPartnerSearchStatus] = useState<
    | {
        col: string;
        rowIndex: number;
        searchedList: PartnerResponseForSearching[];
      }
    | undefined
  >(undefined);

  const [loadedZoneListData, setLoadedZoneListData] = useState<ZoneResponseZoneInfo[]>([]);
  const [loadedLocListData, setLodedLocListData] = useState<ZoneResponseLocInfo[]>([]);

  const {
    data: zoneListData,
    isSuccess: isZoneListSuccess,
    refetch: fetchZoneList,
  } = useQuery(['/zone/zoneList' + logisId], (): any => authApi.get('/zone/zoneList/' + logisId));

  const {
    data: locListData,
    isSuccess: isLocListSuccess,
    refetch: fetchLocList,
  } = useQuery(['/zone/locList', selectedZoneIdRef.current], (): any => authApi.get('/zone/locList/' + selectedZoneIdRef.current));

  const { data: partners, isSuccess: isFetchPartnerSuccess } = useQuery(['fetchPartners', logisId], () => fetchPartners(logisId), { enabled: logisId > 0 });
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

  // 데이터 로딩 완료 시 실행되는 효과
  useEffect(() => {
    if (isZoneListSuccess) {
      const { resultCode, body, resultMessage } = zoneListData.data;
      if (resultCode === 200) {
        console.log('body ==>', body);
        if (body && body.length > 0) {
          setLoadedZoneListData(body);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isZoneListSuccess, zoneListData]);

  useEffect(() => {
    if (isLocListSuccess) {
      const { resultCode, body, resultMessage } = locListData.data;
      if (resultCode === 200) {
        console.log('body ==>', body);
        if (body && body.length > 0) {
          setLodedLocListData(body || []);
        } else {
          if (locationGridRef.current && locationGridRef.current.api) {
            const rowData: any[] = [];
            locationGridRef.current.api.forEachNode((node) => {
              rowData.push(node.data);
            });

            const lastRow = rowData[rowData.length - 1];

            // 마지막 행이 null이거나 비어있지 않은 경우만 추가
            const isLastRowEmpty = !lastRow || Object.values(lastRow).every((val) => val == null || val === '');

            if (!isLastRowEmpty || rowData.length === 0) {
              locationGridRef.current.api.applyTransaction({ add: [{}] });
            }
          }
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isLocListSuccess, locListData]);

  useEffect(() => {
    console.log('selectedZoneId ==>', selectedZoneIdRef.current);
  }, [selectedZoneIdRef.current]);

  /** 최초 컬럼 정의의 화주명 영역에서 값을 입력 후 editing 종료할 시 화주 검색으로 간주되며 이때 해당 함수가 이벤트를 핸들링한다. */
  const onPartnerSearchByNm = useCallback(
    (params: NewValueParams<ZoneResponseLocInfo, any>) => {
      // 기존 데이터 수정할 시
      selectPartnerList({
        partnerNm: params.newValue,
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        const fetchDataList = body as PartnerResponseForSearching[];
        if (resultCode == 200) {
          if (fetchDataList && fetchDataList.length > 0) {
            if (params.node) {
              if (params.column.getColId()) {
                setPartnerSearchStatus({
                  col: params.column.getColId(),
                  rowIndex: params.node.rowIndex as number,
                  searchedList: fetchDataList || [],
                });
              } else {
                console.error('params.colDef.colId 값을 찾을 수 없음');
              }
            } else {
              console.error('params.node 값을 찾을 수 없음');
            }
          } else {
            toastError('명칭이 검색되는 화주가 없습니다.');
          }
        } else {
          toastError(resultMessage);
        }
      });
    },

    [selectPartnerList],
  );

  /** 좌측 그리드 컬럼 기본값 */
  const zoneDataColDefaultDef = useMemo<ColDef<ZoneResponseZoneInfo>[]>(
    () => [
      {
        headerCheckboxSelection: false,
        headerName: '선택',
        checkboxSelection: true,
        filter: false,
        sortable: false,
        cellClass: 'stringType',
        minWidth: 60,
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'no',
        headerName: '#',
        minWidth: 40,
        maxWidth: 40,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'areaNm',
        headerName: 'AREA',
        sortable: false,
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditorSelector: () => {
          return {
            component: 'agSelectCellEditor',
            params: {
              values: [],
            },
          };
        },
      },
      {
        field: 'zoneCd',
        headerName: '존코드',
        sortable: false,
        maxWidth: 100,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'zoneCdNm',
        headerName: 'ZONE',
        sortable: false,
        maxWidth: 100,
        minWidth: 100,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        cellEditorSelector: () => {
          return {
            component: 'agSelectCellEditor',
            params: {
              values: [],
            },
          };
        },
      },
      {
        field: 'zoneType',
        headerName: '차원',
        sortable: false,
        maxWidth: 50,
        minWidth: 50,
        hide: true,
        editable: true,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'zoneDesc',
        headerName: 'ZONE 설명',
        sortable: false,
        maxWidth: 200,
        minWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
      },
      {
        field: 'invenCnt',
        headerName: '재고량',
        sortable: false,
        maxWidth: 70,
        minWidth: 70,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
    ],
    [],
  );

  const onPartnerSelectChanged = (params: any) => {
    const column = params.colDef.field;
    const isOld = params.data.locX;
    if (selectedZoneIdRef.current && selectedZoneIdRef.current > 0) {
      if (isOld && ((params.newValue && params.oldValue != params.newValu) || (params.newValue && !params.oldValue))) {
        console.log(`params ==>`, params);
        if (zoneListData.data) {
          const findData = zoneListData.data.body.find((data: any) => data.id === selectedZoneIdRef.current);
          if (confirm(`ZONE [${findData.zoneDesc}] 로 등록된 location 정보를 수정하시겠습니까?`)) {
            updateLocationMutate({
              id: params.data.y1LocId, // 원래 y2 영역도 있었는데 현재는 y1 영역만 있다.
              logisId: workLogisId,
              zoneId: selectedZoneIdRef.current,
              locX: params.data.locX,
              //locY: column.indexOf('y1') > -1 ? 1 : 2,
              locY: 1,
              locAlias: params.newValue,
              modType: column.indexOf('Alias') > -1 ? 'A' : column.indexOf('Desc') > -1 ? 'D' : 'P',
            });
          }
        }
      }
    } else {
      toastError(`왼쪽 그리드의 zone [${selectedZoneIdRef.current}] 을 선택하고 하세요`);
    }
  };

  /** 우측 그리드 컬럼 기본값(수정 가능한 값들의 행은 반드시 location Y 정보를 field 속성에 포함하여야 한다.) */
  const locDataColDefaultDef = useMemo<ColDef<ZoneResponseLocInfo>[]>(
    () => [
      {
        field: 'locX',
        headerName: 'No.',
        minWidth: 40,
        maxWidth: 40,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'y1Alias',
        headerName: 'LOCATION',
        sortable: false,
        maxWidth: 140,
        minWidth: 140,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: onPartnerSelectChanged,
      },
      {
        field: 'y1PartnerNm',
        headerName: '화주명',
        sortable: false,
        maxWidth: 120,
        minWidth: 120,
        hide: true,
        cellEditorParams: {
          values: partnerList.map((data) => data.label), // ✅ label만 추출
        },
        editable: true,
        cellEditor: 'agSelectCellEditor', // ✅ 콤보박스 에디터 지정
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        onCellValueChanged: onPartnerSelectChanged,
      },
      {
        field: 'y1LocDesc',
        headerName: 'LCTN 설명',
        sortable: false,
        maxWidth: 200,
        minWidth: 200,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: onPartnerSelectChanged,
      },
      {
        field: 'y1Cnt',
        headerName: '재고량',
        sortable: false,
        maxWidth: 90,
        minWidth: 90,
        cellStyle: GridSetting.CellStyle.RIGHT,
        suppressHeaderMenuButton: true,
        editable: false, // (params) => !params.data?.locX, // 데이터 추가를 위한 editable 조건
        valueFormatter: (params) => {
          return Utils.setComma(params.value);
        },
      },
      {
        field: 'y2Alias',
        headerName: '상단 별칭',
        sortable: false,
        maxWidth: 140,
        minWidth: 140,
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        editable: true,
        hide: true,
        onCellValueChanged: onPartnerSelectChanged,
      },
      {
        field: 'y2PartnerNm',
        headerName: '상단화주명',
        sortable: false,
        maxWidth: 120,
        minWidth: 120,
        // onCellValueChanged: onPartnerSearchByNm,
        cellEditorParams: {
          values: partnerList.map((data) => data.label), // ✅ label만 추출
        },
        editable: true,
        cellEditor: 'agSelectCellEditor', // ✅ 콤보박스 에디터 지정
        cellStyle: GridSetting.CellStyle.LEFT,
        suppressHeaderMenuButton: true,
        onCellValueChanged: onPartnerSelectChanged,
        hide: true,
      },
      {
        field: 'y2Cnt',
        headerName: '상단 수량',
        sortable: false,
        maxWidth: 90,
        minWidth: 90,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        editable: false,
        hide: true,
      },
    ],
    [partnerList],
  );

  /** 좌측 그리드 컬럼 상태 */
  const [zoneDataCols, setZoneDataCols] = useState<ColDef<ZoneResponseZoneInfo>[]>(zoneDataColDefaultDef);

  const [areaNmList, setAreaNmList] = useState<CodeDropDown[]>([]);
  const [zoneCdNmList, setZoneCdNmList] = useState<CodeDropDown[]>([]);

  useEffect(() => {
    selectDropdownByCodeUpper('10070').then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode == 200) {
        setAreaNmList(body || []);
        setZoneDataCols((prevState) => {
          for (let i = 0; i < prevState.length; i++) {
            if (prevState[i].field == 'areaNm') {
              prevState[i] = {
                ...prevState[i],
                cellEditorSelector: () => {
                  return {
                    component: 'agSelectCellEditor',
                    params: {
                      values: (body || []).map((data) => {
                        return data.codeNm;
                      }),
                    },
                  };
                },
              };
            }
          }
          return [...prevState];
        });
      } else {
        toastError(resultMessage);
      }
    });
    selectDropdownByCodeUpper('10510').then((result) => {
      const { resultCode, body, resultMessage } = result.data;
      if (resultCode == 200) {
        setZoneCdNmList(body || []);
        setZoneDataCols((prevState) => {
          for (let i = 0; i < prevState.length; i++) {
            if (prevState[i].field == 'zoneCdNm') {
              prevState[i] = {
                ...prevState[i],
                cellEditorSelector: () => {
                  return {
                    component: 'agSelectCellEditor',
                    params: {
                      values: (body || []).map((data) => {
                        return data.codeNm;
                      }),
                    },
                  };
                },
              };
            }
          }
          return [...prevState];
        });
      } else {
        toastError(resultMessage);
      }
    });
  }, [selectDropdownByCodeUpper]);

  /** 우측 그리드 컬럼 상태 */
  const [locationDataCols, setLocationDataCols] = useState<ColDef<ZoneResponseLocInfo>[]>(locDataColDefaultDef);

  const { mutate: updateLocationMutate } = useMutation(updateLocation, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
      } else {
        toastError(e.data.resultMessage);
      }
      fetchLocList();
    },
  });

  const { mutate: updateZoneMutate } = useMutation(updateZone, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('수정되었습니다.');
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const { mutate: deleteZoneMutate } = useMutation(deleteZone, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        queryClient.invalidateQueries(['/zone/zoneList']);
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const { mutate: deleteLocationMutate } = useMutation(deleteLocation, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('삭제되었습니다.');
        fetchLocList();
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  useEffect(() => {
    // cell text editor 에서 키워드 검색 후 화주목록을 반환받음
    setLocationDataCols((prevState) => {
      if (partnerSearchStatus != undefined) {
        for (let i = 0; i < prevState.length; i++) {
          if (prevState[i].field == partnerSearchStatus.col) {
            prevState[i] = {
              ...prevState[i],
              cellEditorSelector: (params) => {
                if (params.rowIndex == partnerSearchStatus.rowIndex) {
                  return {
                    component: 'agSelectCellEditor',
                    params: {
                      values: partnerSearchStatus.searchedList.map((partnerInfo) => partnerInfo.partnerNm),
                    },
                  };
                } else {
                  return {
                    component: 'SimpleTextEditor',
                  };
                }
              },
              onCellValueChanged: (params) => {
                if (params.node?.rowIndex == partnerSearchStatus.rowIndex) {
                  const selectedPartners = partnerSearchStatus.searchedList.filter((searched) => searched.partnerNm == params.newValue);
                  if (selectedPartners.length == 1) {
                    const locY = partnerSearchStatus.col.slice(0, 2); // location Y 정보
                    if (params.data.locX) {
                      // 기존 화주 정보 업데이트
                      const locId = Number((params.data as any)[locY + 'LocId']); // partnerSearchStatus.col.slice(0, 2) -> y1, y2...
                      if (!isNaN(locId)) {
                        updateLocation({
                          id: locId,
                          partnerId: selectedPartners[0].id,
                        }).then((result) => {
                          const { resultCode, body, resultMessage } = result.data;
                          if (resultCode == 200) {
                            toastSuccess('수정되었습니다.');
                            queryClient.invalidateQueries(['/zone/locList']);
                          } else {
                            toastError(resultMessage);
                          }
                          /** 옵션 중 하나를 선택할 시 초기화 절차 진행 */
                          setPartnerSearchStatus(undefined);
                        });
                      } else {
                        console.error('옵션 선택으로 인한 location 업데이트 과정에서 적절한 locId 를 찾을 수 없음');
                      }
                    } else {
                      // 신규 데이터 생성을 위한 행에서의 이벤트 핸들러
                      setLodedLocListData((prevState) => {
                        prevState[partnerSearchStatus.rowIndex] = {
                          ...prevState[partnerSearchStatus.rowIndex],
                          [locY + 'PartnerId']: selectedPartners[0].id, // 화주 id
                          [partnerSearchStatus.col]: selectedPartners[0].partnerNm, // 화주명
                        };
                        return [...prevState];
                      });
                      /** 옵션 중 하나를 선택할 시 초기화 절차 진행 */
                      setPartnerSearchStatus(undefined);
                    }
                  } else {
                    if (selectedPartners.length > 1) {
                      console.error('중복된 이름을 갖는 화주가 존재 --> ', selectedPartners);
                    } else {
                      console.error('해당하는 이름의 화주 정보를 찾을 수 없음');
                    }
                  }
                } else {
                  // 검색 동작이 이루어지지 않은 row 에는 기존 이벤트 핸들러가 적용됨
                  prevState[i].onCellValueChanged;
                }
              },
            };
          }
        }
        setTimeout(() => {
          locationGridRef.current?.api.startEditingCell({
            rowIndex: partnerSearchStatus.rowIndex,
            colKey: partnerSearchStatus.col,
          });
        }, 100);
        return [...prevState];
      } else {
        return [...locDataColDefaultDef];
      }
    });
  }, [partnerSearchStatus]);

  const onZoneRegisterBtnClicked = useCallback(
    (logisId: number, loadedZoneListData: ZoneResponseZoneInfo[]) => {
      if (loadedZoneListData.length == 0) {
        // 등록을 위한 비어있는 행 생성
        setLoadedZoneListData([{}]);
      } else {
        const initializedZoneListForInsert = loadedZoneListData.filter((data) => data.id == undefined);
        if (initializedZoneListForInsert.length == 1) {
          const initializedZoneForInsert = initializedZoneListForInsert[0];
          if (logisId && logisId != 0 && initializedZoneForInsert.areaCd && initializedZoneForInsert.zoneType && initializedZoneForInsert.zoneCd) {
            // 필수값 확인 후 동작하는 영역
            insertZone({
              logisId: logisId,
              areaCd: initializedZoneForInsert.areaCd,
              zoneType: initializedZoneForInsert.zoneType,
              zoneDesc: initializedZoneForInsert.zoneDesc, // 필수값 확인을 생략함
              zoneCd: initializedZoneForInsert.zoneCd,
            }).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('등록되었습니다.');
                fetchZoneList();
              } else {
                toastError(resultMessage);
              }
            });
          } else {
            if (!logisId && logisId == 0) {
              toastError('유효한 logisId 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.areaCd) {
              toastError('유효한 areaCd 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.zoneType) {
              toastError('유효한 zoneType 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.zoneCd) {
              toastError('유효한 zoneCd 를 찾을 수 없습니다.');
            }
          }
        } else {
          console.error('등록할 행을 찾을 수 없음');
        }
      }
    },
    [fetchZoneList, insertZone],
  );

  const onZoneDeleteBtnClicked = useCallback(
    (logisId: number, loadedZoneListData: ZoneResponseZoneInfo[]) => {
      if (loadedZoneListData.length == 0) {
        // 등록을 위한 비어있는 행 생성
        setLoadedZoneListData([{}]);
      } else {
        const initializedZoneListForInsert = loadedZoneListData.filter((data) => data.id == undefined);
        if (initializedZoneListForInsert.length == 1) {
          const initializedZoneForInsert = initializedZoneListForInsert[0];
          if (logisId && logisId != 0 && initializedZoneForInsert.areaCd && initializedZoneForInsert.zoneType && initializedZoneForInsert.zoneCd) {
            // 필수값 확인 후 동작하는 영역
            insertZone({
              logisId: logisId,
              areaCd: initializedZoneForInsert.areaCd,
              zoneType: initializedZoneForInsert.zoneType,
              zoneDesc: initializedZoneForInsert.zoneDesc, // 필수값 확인을 생략함
              zoneCd: initializedZoneForInsert.zoneCd,
            }).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('등록되었습니다.');
                fetchZoneList();
              } else {
                toastError(resultMessage);
              }
            });
          } else {
            if (!logisId && logisId == 0) {
              toastError('유효한 logisId 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.areaCd) {
              toastError('유효한 areaCd 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.zoneType) {
              toastError('유효한 zoneType 를 찾을 수 없습니다.');
            } else if (!initializedZoneForInsert.zoneCd) {
              toastError('유효한 zoneCd 를 찾을 수 없습니다.');
            }
          }
        } else {
          console.error('등록할 행을 찾을 수 없음');
        }
      }
    },
    [fetchZoneList, insertZone],
  );

  const onLocRegisterBtnClicked = useCallback(
    (loadedLocListData: ZoneResponseLocInfo[], selectedZoneId: number) => {
      if (loadedLocListData.length == 0) {
        // 등록을 위한 비어있는 행 생성
        setLodedLocListData([{}]);
      } else {
        locationGridRef.current?.api.stopEditing();
        console.log('loadedLocListData ==>', loadedLocListData);
        const emptyLocXRows: any[] = [];

        locationGridRef.current?.api.forEachNode((node) => {
          if (!node.data?.locX) {
            emptyLocXRows.push(node.data);
          }
        });

        console.log('emptyLocXRows ==>', emptyLocXRows);
        if (emptyLocXRows.length === 1) {
          const initializedLocForInsert: ZoneResponseLocInfo = emptyLocXRows[0];
          const locX = loadedLocListData.length;
          const typedValuesKeys = Object.keys(initializedLocForInsert);
          const insertedLocationList: ZoneRequestLocationInfo[] = [];
          for (let i = 0; i < typedValuesKeys.length; i++) {
            // 예를 들어 'y1' 일 때 slice(0, 1) == 'y', slice(1, 2) == '1'
            if (typedValuesKeys[i].slice(0, 1) == 'y') {
              const locY = typedValuesKeys[i].slice(1, 2); // location y 정보
              let targetIndex = -1;
              !insertedLocationList.map((insertedLocation, index) => {
                if (insertedLocation.locY?.toString() == locY) {
                  targetIndex = index;
                }
              });
              if (targetIndex == -1) {
                // insert 목록에 해당 locY 에 대응하는 신규 요소 추가(중복되는 locY 를 지니는 location 이 insert 되지 않도록 검증)
                insertedLocationList.push({
                  zoneId: selectedZoneId,
                  locX: locX,
                  locY: Number(locY),
                });
                targetIndex = insertedLocationList.length - 1; // 유효한 index 할당
              }
              if ((initializedLocForInsert as any)['y' + locY + 'Alias']) {
                insertedLocationList[targetIndex] = {
                  ...insertedLocationList[targetIndex],
                  //                  partnerId: (initializedLocForInsert as any)['y' + locY + 'PartnerId'] as number, // 예: y1PartnerId
                  partnerNm: (initializedLocForInsert as any)['y' + locY + 'PartnerNm'] as string, // 예: y1PartnerNm
                  locAlias: (initializedLocForInsert as any)['y' + locY + 'Alias'] as string, // 예: y1Alias
                  locDesc: (initializedLocForInsert as any)['y' + locY + 'LocDesc'] as string, // 예: LocDesc
                };
              } else {
                console.log('initializedLocForInsert ==>', initializedLocForInsert);
                if (!(initializedLocForInsert as any)['y' + locY + 'Alias']) {
                  toastError('Alias 는 필수값입니다, y' + locY + ' 영역에 Alias 를 입력한 후 다시 시도하십시요.');
                }

                /*
                if (!(initializedLocForInsert as any)['y' + locY + 'PartnerId']) {
                  toastError('화주 id는 필수값입니다, y' + locY + ' 영역에서 화주를 선택한 후 다시 시도하십시요.');
                } else if (!(initializedLocForInsert as any)['y' + locY + 'Alias']) {
                  toastError('Alias 는 필수값입니다, y' + locY + ' 영역에 Alias 를 입력한 후 다시 시도하십시요.');
                }
                return; // eject
                */
              }
            }
          }
          insertLocationList(insertedLocationList).then((result) => {
            const { resultCode, body, resultMessage } = result.data;
            if (resultCode == 200) {
              toastSuccess('등록되었습니다.');
              fetchLocList();
            } else {
              toastError(resultMessage);
            }
          });
        } else {
          toastError('등록은 한건씩만 할수 있습니다. 행추가는 Delete 키로 삭제가능합니다.');
        }
      }
    },
    [fetchLocList, insertLocationList],
  );

  const onCellEditingStoppedAtLeftGrid = useCallback(
    (event: CellEditingStoppedEvent<ZoneResponseZoneInfo, any>) => {
      if (event.newValue != event.oldValue) {
        if (event.column.getColId() == 'areaNm') {
          const rowIndex = event.node?.rowIndex;
          if (rowIndex != undefined) {
            setLoadedZoneListData((prevState) => {
              prevState[rowIndex] = {
                ...prevState[rowIndex],
                areaCd: areaNmList.filter((data) => data.codeNm == event.newValue)[0].codeCd,
              };
              return [...prevState];
            });

            if (event.node.data?.id) {
              updateZoneMutate({ ...event.node.data, areaCd: areaNmList.filter((data) => data.codeNm == event.newValue)[0].codeCd });
            }
          }
        } else if (event.column.getColId() == 'zoneCdNm') {
          const rowIndex = event.node?.rowIndex;
          if (rowIndex != undefined) {
            setLoadedZoneListData((prevState) => {
              prevState[rowIndex] = {
                ...prevState[rowIndex],
                zoneCd: zoneCdNmList.filter((data) => data.codeNm == event.newValue)[0].codeCd,
              };
              return [...prevState];
            });
          }
        } else if (event.column.getColId() == 'zoneType') {
          if (!isNaN(Number(event.newValue))) {
            if (Number(event.newValue) > 0 && Number(event.newValue) < 3) {
              const rowIndex = event.node?.rowIndex;
              if (rowIndex != undefined) {
                setLoadedZoneListData((prevState) => {
                  prevState[rowIndex] = {
                    ...prevState[rowIndex],
                    zoneType: event.newValue,
                  };
                  return [...prevState];
                });
              }
            } else {
              event.node?.setDataValue('zoneType', event.oldValue);
              toastError('1, 2차원 지정만 가능합니다.');
            }
          } else {
            event.node?.setDataValue('zoneType', event.oldValue);
            toastError('숫자 이외의 값은 입력할 수 없습니다.');
          }
        } else if (event.column.getColId() == 'zoneDesc') {
          const rowIndex = event.node?.rowIndex;
          if (rowIndex != undefined) {
            setLoadedZoneListData((prevState) => {
              prevState[rowIndex] = {
                ...prevState[rowIndex],
                zoneDesc: event.newValue,
              };
              return [...prevState];
            });
          }
        }
      }
    },
    [areaNmList, zoneCdNmList],
  );

  const onCellEditingStoppedAtRightGrid = useCallback((event: CellEditingStoppedEvent<ZoneResponseLocInfo, any>) => {
    if (event.newValue != event.oldValue) {
      console.log(event.newValue);
      const rowIndex = event.node?.rowIndex;
      if (rowIndex != undefined) {
        if (event.column.getColId().slice(2) == 'Alias') {
          setLodedLocListData((prevState) => {
            prevState[rowIndex] = {
              ...prevState[rowIndex],
              [event.column.getColId()]: event.newValue,
            };
            return [...prevState];
          });
        } else if (event.column.getColId().slice(2) == 'Cnt') {
          if (!isNaN(Number(event.newValue))) {
            if (Number(event.newValue) >= 0) {
              setLodedLocListData((prevState) => {
                prevState[rowIndex] = {
                  ...prevState[rowIndex],
                  [event.column.getColId()]: event.newValue,
                };
                return [...prevState];
              });
            } else {
              event.node?.setDataValue(event.column.getColId(), event.oldValue);
              toastError('0보다 작은 값을 입력할 수 없습니다.');
            }
          } else {
            event.node?.setDataValue(event.column.getColId(), event.oldValue);
            toastError('숫자가 아닌 값은 입력할 수 없습니다.');
          }
        }
      }
    }
  }, []);

  return (
    <PopupLayout
      width={1200}
      open={modalType.type === 'LOCATION_REG' && modalType.active}
      isEscClose={true}
      title={`LOCATION 등록(${logisNm})`}
      onClose={() => {
        closeModal('LOCATION_REG');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="right">
              {/* 창고 AREA, ZONE 등록, 삭제 기능 숨김 (예솔)
              <button
                className={'btn ' + (loadedZoneListData.filter((data) => data.id == undefined).length == 1 ? 'btnBlue' : '')}
                title="등록"
                onClick={() => {
                  zoneGridRef.current?.api.stopEditing();
                  setTimeout(() => {
                    onZoneRegisterBtnClicked(logisId, loadedZoneListData);
                  }, 10);
                }}
              >
                등록
              </button>
              <button
                className={'btn btnGreen'}
                title="삭제"
                onClick={() => {
                  const nodes = zoneGridRef.current?.api.getSelectedNodes();
                  if (nodes && nodes.length === 1) {
                    console.log('nodes ==>', nodes);
                    deleteZoneMutate({ id: nodes[0].data.id } as ZoneRequestZoneInfo);
                  }
                }}
              >
                삭제
              </button> */}
            </div>

            <div className="left">
              <button
                className={'btn ' + (loadedLocListData.filter((data) => data.locX == undefined).length == 1 ? 'btnBlue' : '')}
                title="등록"
                onClick={() => {
                  onLocRegisterBtnClicked(loadedLocListData, selectedZoneIdRef.current);
                }}
              >
                등록
              </button>
              <button
                className="btn"
                title="삭제"
                onClick={() => {
                  const nodes = locationGridRef.current?.api.getSelectedNodes();
                  if (nodes && nodes.length === 1) {
                    deleteLocationMutate({ id: nodes[0].data.y1LocId } as ZoneRequestZoneInfo);
                  }
                }}
              >
                삭제
              </button>
              <button className="btn" title="닫기" onClick={() => closeModal('LOCATION_REG')}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table></table>
        </div>
        <div className="layoutBox">
          {/* 왼쪽 */}
          <div className="layout50">
            <div className="gridBox">
              {/*<div style={{ height: '30px' }}>
                <h3>{logisNm}</h3>
              </div>*/}
              <TunedGrid<ZoneResponseZoneInfo>
                headerHeight={35}
                rowData={loadedZoneListData}
                columnDefs={zoneDataCols}
                defaultColDef={defaultColDef}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onCellKeyDown={(event) => {
                  const keyBoardEvent = event.event as KeyboardEvent;
                  const eventTriggeredRowIndex = event.rowIndex || 0;
                  if (keyBoardEvent.key == 'ArrowDown') {
                    if (eventTriggeredRowIndex == loadedZoneListData.length - 1 && loadedZoneListData[eventTriggeredRowIndex].no != undefined) {
                      setLoadedZoneListData([...loadedZoneListData, {}]);
                      if (event.api.getFocusedCell()) {
                        event.api.setFocusedCell(eventTriggeredRowIndex + 1, (event.api.getFocusedCell() as CellPosition).column);
                      }
                    }
                  } else if (keyBoardEvent.key == 'Delete') {
                    const focusedRow = loadedZoneListData[eventTriggeredRowIndex];

                    // 예: 추가된 새 행은 no, id 등이 undefined로 구분된다면
                    const isNewRow = !focusedRow.id && !focusedRow.no && Object.keys(focusedRow).length <= 1;

                    if (isNewRow) {
                      const updatedData = [...loadedZoneListData];
                      updatedData.splice(eventTriggeredRowIndex, 1);
                      setLoadedZoneListData(updatedData);
                    }
                  } else if (keyBoardEvent.key == 'Enter') {
                    if (event.data && event.data.id && event.data.id > 0) {
                      updateZoneMutate(event.data);
                    }
                  }
                }}
                onCellEditingStopped={onCellEditingStoppedAtLeftGrid}
                onRowClicked={(e) => {
                  setLodedLocListData([]);
                  if (e.data?.id) {
                    selectedZoneIdRef.current = e.data.id;
                  }
                }}
                ref={zoneGridRef}
                className={'pop'}
                rowSelection={'single'}
              />
            </div>
          </div>
          {/* 오른쪽 */}
          <div className="layout50">
            <div className="gridBox">
              {/*<div className="btnArea right">
                <button className="btn" title="옮기기">
                  옮기기
                </button>
                <button className="btn" title="추가">
                  추가
                </button>
                <button className="btn" title="미송">
                  미송
                </button>
              </div>*/}
              <TunedGrid<ZoneResponseLocInfo>
                headerHeight={35}
                rowData={loadedLocListData}
                columnDefs={locDataColDefaultDef}
                gridOptions={{ rowHeight: 24 }}
                loadingOverlayComponent={CustomGridLoading}
                noRowsOverlayComponent={CustomNoRowsOverlay}
                onCellKeyDown={(event) => {
                  const keyBoardEvent = event.event as KeyboardEvent;
                  const eventTriggeredRowIndex = event.rowIndex || 0;
                  if (keyBoardEvent.key == 'ArrowDown') {
                    if (eventTriggeredRowIndex == loadedLocListData.length - 1 && loadedLocListData[eventTriggeredRowIndex].locX != undefined) {
                      setLodedLocListData([...loadedLocListData, {}]);
                      if (event.api.getFocusedCell()) {
                        event.api.setFocusedCell(eventTriggeredRowIndex + 1, (event.api.getFocusedCell() as CellPosition).column);
                      }
                    }
                  }
                }}
                onCellEditingStopped={onCellEditingStoppedAtRightGrid}
                ref={locationGridRef}
                className={'pop'}
                rowSelection={'single'}
              />
            </div>
          </div>
          {/*<LocDetInfoPop
            location={doubleClickedLocation}
            onClose={() => {
              setDoubleClickedLocation(undefined);
            }}
          />*/}
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
