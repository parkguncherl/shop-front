import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { Button } from '../../Button';
import { PopupLayout } from '../PopupLayout';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import TunedGrid from '../../grid/TunedGrid';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { AgGridReact } from 'ag-grid-react';
import { CellPosition, ColDef } from 'ag-grid-community';
import { usePartnerCodeStore } from '../../../stores';
import { authApi } from '../../../libs';

interface GubunElement {
  id?: number;
  codeUpper?: string;
  codeNm?: string;
}
interface GubunListElement {
  gubun1Id?: number;
  gubun1CodeUpper?: string;
  gubun1CodeNm?: string;
  gubun2Id?: number;
  gubun2CodeUpper?: string;
  gubun2CodeNm?: string;
}

/** 주문관리 - 생산처관리 - 구분 관리 팝업 */
export const GubunListPop = () => {
  const queryClient = useQueryClient();

  /** 생산처관리 스토어 - State */
  const [modalType, closeModal] = useFactoryListStore((s) => [s.modalType, s.closeModal]);

  /** 파트너코드 스토어 - State */
  const [savePartnerCode] = usePartnerCodeStore((s) => [s.savePartnerCode]);

  const RefForGrid = useRef<AgGridReact>(null);

  const [gubunList, setGubunList] = useState<GubunListElement[]>([]);

  const {
    data: gubun1List,
    isLoading: isGubun1ListLoading,
    isSuccess: isGubun1ListFetched,
    refetch: fetchGubun1List,
  } = useQuery(['P0006'], () =>
    authApi.get('/partnerCode/lowerCodeList', {
      params: {
        codeUpper: 'P0006',
      },
    }),
  );

  const {
    data: gubun2List,
    isLoading: isGubun2ListLoading,
    isSuccess: isGubun2ListFetched,
    refetch: fetchGubun2List,
  } = useQuery(['P0007'], () =>
    authApi.get('/partnerCode/lowerCodeList', {
      params: {
        codeUpper: 'P0007',
      },
    }),
  );

  useEffect(() => {
    if (isGubun1ListFetched) {
      const { resultCode, body, resultMessage } = gubun1List.data;
      if (resultCode == 200) {
        const updatedGubunList = gubunList;
        for (let i = 0; i < body.length; i++) {
          updatedGubunList[i] = {
            ...updatedGubunList[i],
            gubun1Id: body[i].id,
            gubun1CodeUpper: body[i].codeUpper,
            gubun1CodeNm: body[i].codeNm,
          };
        }
        console.log(updatedGubunList);
        setGubunList(updatedGubunList);
      }
    }
  }, [gubun1List, isGubun1ListFetched]);

  useEffect(() => {
    if (isGubun2ListFetched) {
      const { resultCode, body, resultMessage } = gubun2List.data;
      if (resultCode == 200) {
        const updatedGubunList = gubunList;
        for (let i = 0; i < body.length; i++) {
          updatedGubunList[i] = {
            ...updatedGubunList[i],
            gubun2Id: body[i].id,
            gubun2CodeUpper: body[i].codeUpper,
            gubun2CodeNm: body[i].codeNm,
          };
        }
        console.log(updatedGubunList);
        setGubunList(updatedGubunList);
      }
    }
  }, [gubun2List, isGubun2ListFetched]);

  /** 컬럼 정의 */
  const GubunListColsForPop = useMemo<ColDef<GubunListElement>[]>(
    () => [
      {
        field: 'gubun1CodeNm',
        headerName: '구분1',
        minWidth: 200,
        maxWidth: 200,
        cellStyle: (params) => {
          if (gubun1List && gubun1List.data.body) {
            for (let i = 0; i < gubun1List.data.body.length; i++) {
              // 기존 구분 수정 시 대조를 통해 값이 다를 경우 배경색 처리
              if (
                gubun1List.data.body[i].id == gubunList[params.rowIndex].gubun1Id &&
                gubun1List.data.body[i].codeNm != gubunList[params.rowIndex].gubun1CodeNm
              ) {
                // 구분 코드명이 변경되었을 경우
                return { ...GridSetting.CellStyle.CENTER, backgroundColor: '#f9e79f' };
              }
            }
          }
          if (gubunList[params.rowIndex].gubun1Id == undefined && gubunList[params.rowIndex].gubun1CodeNm) {
            // 신규 구분 1 데이터
            return { ...GridSetting.CellStyle.CENTER, backgroundColor: '#85c1e9' };
          }
          return GridSetting.CellStyle.CENTER;
        },
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (event) => {
          setGubunList((prevState) => {
            const newList = [...prevState];
            for (let i = 0; i < prevState.length; i++) {
              if (i == event.node?.rowIndex) {
                newList[i] = {
                  ...newList[i],
                  gubun1CodeNm: event.newValue,
                };
              }
            }
            return newList;
          });
        },
      },
      {
        field: 'gubun2CodeNm',
        headerName: '구분2',
        minWidth: 200,
        maxWidth: 200,
        cellStyle: (params) => {
          if (gubun2List && gubun2List.data.body) {
            for (let i = 0; i < gubun2List.data.body.length; i++) {
              // 기존 구분 수정 시 대조를 통해 값이 다를 경우 배경색 처리
              if (
                gubun2List.data.body[i].id == gubunList[params.rowIndex].gubun2Id &&
                gubun2List.data.body[i].codeNm != gubunList[params.rowIndex].gubun2CodeNm
              ) {
                // 구분 코드명이 변경되었을 경우
                return { ...GridSetting.CellStyle.CENTER, backgroundColor: '#f9e79f' };
              }
            }
          }
          if (gubunList[params.rowIndex].gubun2Id == undefined && gubunList[params.rowIndex].gubun2CodeNm) {
            // 신규 구분 1 데이터
            return { ...GridSetting.CellStyle.CENTER, backgroundColor: '#85c1e9' };
          }
          return GridSetting.CellStyle.CENTER;
        },
        suppressHeaderMenuButton: true,
        editable: true,
        onCellValueChanged: (event) => {
          setGubunList((prevState) => {
            const newList = [...prevState];
            for (let i = 0; i < prevState.length; i++) {
              if (i == event.node?.rowIndex) {
                newList[i] = {
                  ...newList[i],
                  gubun2CodeNm: event.newValue,
                };
              }
            }
            return newList;
          });
        },
      },
    ],
    [gubunList],
  );

  /** 구분 목록 변화를 반영하는 영역(저장) */
  const reflectSomeChanges = () => {
    const gubun1ChangedList = [];
    const gubun2ChangedList = [];
    const gubun1AddedList = [];
    const gubun2AddedList = [];
    /*for (let i = 0; i < gubunList.length; i++) {
      if (gubunList[i].gubun1Id)
    }*/
  };

  return (
    <PopupLayout
      width={500}
      isEscClose={true}
      open={modalType.type === 'GUBUN_LIST' && modalType.active}
      title={'구분 목록'}
      onClose={() => closeModal('GUBUN_LIST')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn btnBlue'} onClick={reflectSomeChanges}>
              저장
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table>
            <caption></caption>
            <colgroup>
              <col width="15%" />
              <col width="35%" />
              <col width="15%" />
              <col width="35%" />
            </colgroup>
            <tbody></tbody>
          </table>
        </div>
        <div>
          <TunedGrid<GubunListElement>
            headerHeight={35}
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
            }}
            columnDefs={GubunListColsForPop}
            rowData={gubunList}
            defaultColDef={defaultColDef}
            gridOptions={{ rowHeight: 24 }}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onCellKeyDown={(e) => {
              const keyBoardEvent = e.event as KeyboardEvent;
              if (keyBoardEvent.key == 'ArrowDown') {
                if (e.rowIndex == gubunList.length - 1 && (gubunList[e.rowIndex].gubun1Id || gubunList[e.rowIndex].gubun2Id)) {
                  // 추가를 위한 새 행 추가
                  setGubunList([...gubunList, {}]);
                  if (e.api.getFocusedCell()) {
                    e.api.setFocusedCell(e.rowIndex + 1, (e.api.getFocusedCell() as CellPosition).column.getColId());
                  }
                }
              }
            }}
            onRowClicked={(e) => {
              console.log(e.data);
            }}
            ref={RefForGrid}
          />
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
