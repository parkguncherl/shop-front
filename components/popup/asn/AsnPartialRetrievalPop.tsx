import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { useAsnMngStore } from '../../../stores/useAsnMngStore';
import { AsnMngResponsePaging, AsnMngRequestRetrieval } from '../../../generated';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { CellKeyDownEvent, ColDef, FullWidthCellKeyDownEvent } from 'ag-grid-community';
import { ConfirmModal } from '../../ConfirmModal';
import { toastError, toastSuccess } from '../../ToastMessage';

const AsnPartialRetrievalPop = () => {
  /** store */
  const [modalType, openModal, closeModal, insertAsnsAsExpect, selectedAsnPagingList, setSelectedAsnPagingList, asnPartialRetrieval] = useAsnMngStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.insertAsnsAsExpect,
    s.selectedAsnPagingList,
    s.setSelectedAsnPagingList,
    s.asnPartialRetrieval,
  ]);

  /** 컬럼 정의 */
  const ColsForPop: ColDef<AsnMngResponsePaging>[] = [
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
      field: 'asnYmd',
      headerName: '발주일자',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: false,
    },
    {
      field: 'genCnt',
      headerName: '발주수량',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      onCellValueChanged: (event) => {
        if (event.node?.rowIndex) {
          const rowIndex = event.node?.rowIndex;
          const changedPagingList = asnPagingList;
          changedPagingList[rowIndex] = { ...changedPagingList[rowIndex], genCnt: event.newValue };
          setAsnPagingList(changedPagingList);
        }
      },
    },
    {
      field: 'asnCnt', // 발주예정수량
      headerName: 'ASN',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      onCellValueChanged: (event) => {
        if (event.node?.rowIndex) {
          const rowIndex = event.node?.rowIndex;
          const changedPagingList = asnPagingList;
          changedPagingList[rowIndex] = { ...changedPagingList[rowIndex], asnCnt: event.newValue };
          setAsnPagingList(changedPagingList);
        }
      },
    },
    {
      field: 'realCnt',
      headerName: '완료수량',
      minWidth: 120,
      maxWidth: 120,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: false,
    },
  ];

  /** Component 참조 */
  const RefForGrid = useRef<AgGridReact>(null);

  const [asnPagingList, setAsnPagingList] = useState<AsnMngResponsePaging[]>([]);
  const [confirmModal, setConfirmModal] = useState(false);

  const onCellKeyDown = (event: CellKeyDownEvent | FullWidthCellKeyDownEvent, currentRef: AgGridReact | null) => {
    const keyBoardEvent = event.event as KeyboardEvent;
    if (event.rowIndex != null) {
      const eventTriggeredRowIndex = event.rowIndex as number;
      if (keyBoardEvent.key == 'ArrowDown' && eventTriggeredRowIndex == asnPagingList.length - 1 && asnPagingList.length < 5) {
        // 최하단 영역에서 arrowDown
        setAsnPagingList([...asnPagingList, { asnYmd: asnPagingList[0].asnYmd }]);
      } else if (keyBoardEvent.key == 'Backspace' && asnPagingList[eventTriggeredRowIndex].asnId == undefined) {
        // 기존 asn 데이터가 아닌(추가된) 데이터를 삭제하려 할 시
        const oneRowDeleted = asnPagingList.filter((_data, index) => index != eventTriggeredRowIndex);
        setAsnPagingList(oneRowDeleted);
      }
    }
  };

  useEffect(() => {
    // 랜더링 시 선택된 발주와 동기화(ASN 값은 genCnt(발주수량) 과 동기화)
    if (selectedAsnPagingList[0]) {
      setAsnPagingList([{ ...selectedAsnPagingList[0], asnCnt: selectedAsnPagingList[0].genCnt }]);
    }
  }, [selectedAsnPagingList]);

  return (
    <PopupLayout
      width={580}
      isEscClose={true}
      open={modalType.type === 'RETRIEVAL_PARTIAL' && modalType.active}
      title={'부분출고등록'}
      onClose={() => {
        closeModal('RETRIEVAL_PARTIAL');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button
              className="btn btnBlue"
              onClick={() => {
                setConfirmModal(true);
              }}
            >
              저장
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('RETRIEVAL_PARTIAL')}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className={'ag-theme-alpine'}>
          <AgGridReact
            headerHeight={35}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={asnPagingList}
            columnDefs={ColsForPop}
            defaultColDef={defaultColDef}
            gridOptions={{
              rowHeight: 24,
            }}
            onCellKeyDown={(e) => {
              onCellKeyDown(e, RefForGrid.current);
            }}
            ref={RefForGrid}
          />
        </div>
      </PopupContent>
      <ConfirmModal
        title={'부분출고로 등록하시겠습니까?'}
        open={confirmModal}
        onConfirm={() => {
          const partialRetrievalList: AsnMngRequestRetrieval[] = [];
          for (let i = 0; i < asnPagingList.length; i++) {
            if ((asnPagingList[i].genCnt && asnPagingList[i].asnCnt) || asnPagingList[i].genCnt) {
              partialRetrievalList[i] = {
                id: asnPagingList[i].asnId,
                genCnt: asnPagingList[i].genCnt,
                asnCnt: asnPagingList[i].asnCnt,
                asnStatCd: '3', // 공장출고
              };
            }
          }
          if (partialRetrievalList.length != 0) {
            asnPartialRetrieval(partialRetrievalList).then((result) => {
              const { resultCode, body, resultMessage } = result.data;
              if (resultCode == 200) {
                toastSuccess('등록되었습니다.');
                setConfirmModal(false);
                setSelectedAsnPagingList([]); // 빈 배열을 설정하여 페이징 데이터 refetch
                closeModal('RETRIEVAL_PARTIAL');
              } else {
                toastError(resultMessage);
              }
            });
          }
        }}
        /*        onKeyDown={(event) => {
          if (event.key == 'Enter') {
            const partialRetrievalList: AsnRequestRetrieval[] = [];
            for (let i = 0; i < asnPagingList.length; i++) {
              if ((asnPagingList[i].genCnt && asnPagingList[i].asnCnt) || asnPagingList[i].genCnt) {
                partialRetrievalList[i] = {
                  id: asnPagingList[i].asnId,
                  genCnt: asnPagingList[i].genCnt,
                  asnCnt: asnPagingList[i].asnCnt,
                  asnStatCd: '3', // 공장출고
                };
              }
            }
            if (partialRetrievalList.length != 0) {
              asnPartialRetrieval(partialRetrievalList).then((result) => {
                const { resultCode, body, resultMessage } = result.data;
                if (resultCode == 200) {
                  toastSuccess('등록되었습니다.');
                  setConfirmModal(false);
                  setSelectedAsnPagingList([]); // 빈 배열을 설정하여 페이징 데이터 refetch
                  closeModal('RETRIEVAL_PARTIAL');
                } else {
                  toastError(resultMessage);
                }
              });
            }
          }
        }}*/
        onClose={() => setConfirmModal(false)}
      />
    </PopupLayout>
  );
};

export default AsnPartialRetrievalPop;
