import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { AG_CHARTS_LOCALE_KO_KR } from 'ag-charts-locale';
import { useQueryClient } from '@tanstack/react-query';
import { useAgGridApi } from '../../../../../hooks';
import { defaultColDef, GridSetting } from '../../../../../libs/ag-grid';
import { PopupLayout } from '../../../PopupLayout';
import { PopupFooter } from '../../../PopupFooter';
import { PopupContent } from '../../../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../../../content';
import { CustomInput } from '../../../../CustomInput';
import { useZoneStore } from '../../../../../stores/wms/useZoneStore';
import { PartnerResponseForSearching, ZoneResponseLocSkuInfo } from '../../../../../generated';
import { toastError, toastSuccess } from '../../../../ToastMessage';
import { SearchBarRefInterface } from '../../../../search/SearchBar';
import { usePartnerStore } from '../../../../../stores/usePartnerStore';
import { Search } from '../../../../content';

interface LocDetInfoPopProps {
  location?: {
    locId: number;
    partnerId: number;
    partnerNm: string;
    locAlias: string;
  }; // 모달 활성화 여부
  onClose?: () => void;
}

/**
 *  창고 > LOCATION 등록 > LOCATION 상세정보
 */
export const LocDetInfoPop = ({ location, onClose }: LocDetInfoPopProps) => {
  const { onGridReady } = useAgGridApi();
  const queryClient = useQueryClient();
  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);
  const searchBarRef = useRef<SearchBarRefInterface>(null);

  /** 전역 상태 */
  const [selectLocationSkuListByLocId, updateLocation] = useZoneStore((s) => [s.selectLocationSkuListByLocId, s.updateLocation]);
  const [selectPartnerList] = usePartnerStore((s) => [s.selectPartnerList]);

  /** 지역 state */
  const [respondedLocSkuInfo, setRespondedLocSkuInfo] = useState<ZoneResponseLocSkuInfo[]>([]);

  const [originalLocationData, setOriginalLocationData] = useState<{ partnerId: number; partnerNm: string; locAlias: string } | undefined>(undefined);
  const [modifiableDatas, setModifiableDatas] = useState({
    partnerId: 0,
    partnerNm: '',
    locAlias: '',
  });

  useEffect(() => {
    /** 더블클릭으로 인하여 최초 open 시 location 할당에 따른 동작(모달을 열 시 최초 1회) */
    setOriginalLocationData({
      partnerId: location?.partnerId || 0,
      partnerNm: location?.partnerNm || '',
      locAlias: location?.locAlias || '',
    });
    setModifiableDatas({
      partnerId: location?.partnerId || 0,
      partnerNm: location?.partnerNm || '',
      locAlias: location?.locAlias || '',
    });
    if (location) {
      selectLocationSkuListByLocId({
        locId: location.locId,
      }).then((result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode == 200) {
          setRespondedLocSkuInfo((body as ZoneResponseLocSkuInfo[]) || []);
        } else {
          toastError(resultMessage);
        }
      });
    }
  }, [location]);

  /** 컬럼 정의 */
  const OtherInStockAddPopColDef = useMemo<ColDef<ZoneResponseLocSkuInfo>[]>(
    () => [
      {
        headerCheckboxSelection: false,
        headerName: '선택',
        checkboxSelection: true,
        filter: false,
        sortable: false,
        cellClass: 'stringType',
        maxWidth: 60,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
        hide: true,
      },
      {
        field: 'skuNm',
        headerName: '상품',
        maxWidth: 370,
        minWidth: 370,
        sortable: false,
        suppressHeaderMenuButton: true,
      },
      {
        field: 'skuCnt',
        headerName: '건수',
        maxWidth: 130,
        minWidth: 130,
        sortable: false,
        cellStyle: GridSetting.CellStyle.CENTER,
        suppressHeaderMenuButton: true,
      },
    ],
    [],
  );

  const closeHandler = useCallback(() => {
    if (onClose) {
      setRespondedLocSkuInfo([]);
      onClose();
    }
  }, [onClose]);

  return (
    <PopupLayout
      width={650}
      open={location != undefined}
      title={'적치상품 목록'}
      onClose={closeHandler}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              title="수정"
              onClick={() => {
                if (location && originalLocationData) {
                  if (originalLocationData.partnerId != modifiableDatas.partnerId || originalLocationData.locAlias != modifiableDatas.locAlias) {
                    // partnerId 혹은 locAlias 중 하나 이상에 변동시항이 존재할 경우
                    updateLocation({
                      id: location.locId,
                      partnerId: originalLocationData.partnerId != modifiableDatas.partnerId ? modifiableDatas.partnerId : undefined, // 변화 없을 경우 undefined(업데이트 수행하지 않음)
                      locAlias: originalLocationData.locAlias != modifiableDatas.locAlias ? modifiableDatas.locAlias : undefined, // 변화 없을 경우 undefined(업데이트 수행하지 않음)
                    }).then((result) => {
                      const { resultCode, resultMessage } = result.data;
                      if (resultCode == 200) {
                        toastSuccess('수정되었습니다.');
                        queryClient.invalidateQueries(['/zone/locList']); // /zone/locList

                        /** 비교 대상이 되는 오리지널 데이터 상태를 변경 */
                        setOriginalLocationData({
                          partnerId: modifiableDatas.partnerId,
                          partnerNm: modifiableDatas.partnerNm,
                          locAlias: modifiableDatas.locAlias,
                        });
                      } else {
                        toastError(resultMessage);
                      }
                    });
                  } else {
                    toastError('수정된 데이터가 존재하지 않아 업데이트 할 수 없습니다.');
                  }
                }
              }}
            >
              수정
            </button>
            <button className="btn" title="닫기" onClick={closeHandler}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <Search className={'type_2'}>
            {/* todo Search 대신 PopupSearchType 을 사용하여야 하나 이 경우 스타일이 깨지는 문제가 발생함, 수정하기*/}
            <PopupSearchType.Bar<PartnerResponseForSearching>
              title={'화주'}
              ref={searchBarRef}
              name={'partnerNm'}
              placeholder={'화주명 입력'}
              displayedObjKey={'partnerNm'}
              selectedData={{
                partnerId: modifiableDatas.partnerId,
                partnerNm: modifiableDatas.partnerNm,
              }}
              onDataSelected={(name, value) => {
                setModifiableDatas((prevState) => {
                  if (value.id && value.partnerNm) {
                    return { ...prevState, partnerId: value.id, partnerNm: value.partnerNm };
                  } else {
                    console.error('화주 정보 일부를 찾을 수 없습니다.');
                    return prevState;
                  }
                });
                /*if (location) {
                  updateLocation({
                    id: location.locId,
                    partnerId: value.id,
                  }).then((result) => {
                    const { resultCode, body, resultMessage } = result.data;
                    if (resultCode == 200) {
                      setModifiableDatas((prevState) => {
                        if (value.id && value.partnerNm) {
                          return { ...prevState, partnerId: value.id, partnerNm: value.partnerNm };
                        } else {
                          console.error('화주 정보 일부를 찾을 수 없습니다.');
                          return prevState;
                        }
                      });
                    } else {
                      toastError(resultMessage);
                    }
                  });
                }*/
              }}
              onSearch={(typedValue) => {
                return selectPartnerList({
                  partnerNm: typedValue,
                });
              }}
            />
            <CustomInput
              title={'별칭'}
              name={'locAlias'}
              placeholder={'상품명 입력'}
              value={modifiableDatas.locAlias}
              onChange={(name, value) => {
                console.log(value);
                setModifiableDatas((prevState) => {
                  prevState.locAlias = value.toString();
                  return { ...prevState };
                });
              }}
            />
          </Search>
        </PopupSearchBox>
        <div className="mt10">
          <div className={'ag-theme-alpine'}>
            <AgGridReact
              onGridReady={onGridReady}
              gridOptions={{ rowHeight: 28, localeText: AG_CHARTS_LOCALE_KO_KR }}
              headerHeight={35}
              columnDefs={OtherInStockAddPopColDef}
              rowData={respondedLocSkuInfo}
              defaultColDef={defaultColDef}
              /*onCellEditingStopped={(e) => {
                if (e.column.getColId() == 'prodNm' && e.rowIndex != null) {
                  if (filters.partnerId != 0) {
                    setSkuSearchPopEnabled(true);
                    setTypedKeyWord(e.newValue.toString());
                  } else {
                    e.node.setDataValue('prodNm', '');
                    toastError('고객사 선택 후 다시 시도하십시요.');
                  }
                }
              }}*/
              ref={RefForGrid}
              rowSelection={'single'}
              suppressRowClickSelection={true}
              suppressRowDeselection={true}
              className={'default check'}
            />
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
