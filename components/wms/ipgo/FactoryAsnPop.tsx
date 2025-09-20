/**
 *  입하정보 > 발주구분 > 입하처리 팝업
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import TunedGrid from '../../grid/TunedGrid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { Table } from '../../content';
import { toastError, toastInfo, toastSuccess } from '../../ToastMessage';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import dayjs from 'dayjs';
import { InstockRequestCreate, InstockRequestDelete, InstockResponseInstockFactoryAsnDetail } from '../../../generated';
import { AgGridReact } from 'ag-grid-react';
import { createStock, deleteStock } from '../../../api/wms-api';
import { useSession } from 'next-auth/react';
import { useMoveAndEdit } from '../../../customFn/useMoveAndEdit';
import { ConfirmModal } from '../../ConfirmModal';
import Loading from '../../Loading';
import { CheckBox } from '../../CheckBox';

const FactoryAsnPop = ({ dtlParam, titleData }: { dtlParam: any; titleData: any }) => {
  const session = useSession();
  const gridRef = useRef<AgGridReact>(null);
  const { moveAndEdit } = useMoveAndEdit(gridRef);
  const [modalType, closeModal] = useInstockStore((s) => [s.modalType, s.closeModal]);
  const [rowData, setRowData] = useState<InstockResponseInstockFactoryAsnDetail[]>();
  const [pinnedRowData, setPinnedRowData] = useState<any[]>();
  const [userList, setUserList] = useState<any[]>([]);
  const [stockUserLoginId, setStockUserLoginId] = useState<string>();
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [notDeleteOpen, setNotDeleteOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [immiCheck, setImmiCheck] = useState<boolean>(true);

  useEffect(() => {
    console.log('dtlParam >>', dtlParam);
    if (!dtlParam) {
      toastError('내용을 불러오지 못했어요.\n 페이지를 새로고침 후 다시 이용해주세요.');
      closeModal('INSTOCK_FACTORY_ASN_POP');
    }
  }, [dtlParam]);

  /** 상세 조회 */
  const {
    data: loadDetail,
    isLoading,
    isSuccess,
    refetch: detailRefetch,
  } = useQuery(
    ['/instock/detail', dtlParam],
    () =>
      authApi.get('/instock/detail', {
        params: dtlParam,
      }),
    {
      enabled: !!dtlParam,
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadDetail.data;
      if (resultCode === 200) {
        if (body) {
          console.log('상세내용 응답 >>', body);
          setRowData(body || []);
        } else {
          toastError('상세정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadDetail]);

  /** 입하등록 (저장) */
  const queryClient = useQueryClient();
  const { mutate: createStockMutate, isLoading: isCreateStockLoading } = useMutation(createStock, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        if (e.data.body) {
          // 입하등록시 일부 실패한 전달메세지가 있는 경우
          toastInfo(e.data.body);
        } else {
          toastSuccess('입하처리 되었습니다.');
        }
        setLoading(false); // 로딩 끝
        await queryClient.invalidateQueries(['/instock/paging']);
        await queryClient.invalidateQueries(['/instock/stat/dashboard']); // 통계데이타 refetch
        closeModal('INSTOCK_FACTORY_ASN_POP');
      } else {
        setLoading(false); // 로딩 끝
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      setLoading(false); // 로딩 끝
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 입하추가 삭제 */
  const { mutate: deleteStockMutate, isLoading: isDeleteStockLoading } = useMutation(deleteStock, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('해당건 삭제 되었습니다.');
        await queryClient.invalidateQueries(['/instock/detail']);
        await queryClient.invalidateQueries(['/instock/paging']);
        await queryClient.invalidateQueries(['/instock/stat/dashboard']); // 통계데이타 refetch
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      setLoading(false); // 로딩 끝
      console.error(err);
      toastError('삭제 중 오류가 발생하였습니다.');
    },
  });

  /** 저장 */
  const onSaveClick = () => {
    setLoading(true); // 로딩 시작
    const gridApi = gridRef.current?.api;
    const paramsArray: InstockRequestCreate[] = [];
    const selectedNodes = gridApi?.getSelectedNodes();
    gridApi?.stopEditing();
    if (selectedNodes && selectedNodes?.length > 0) {
      if (selectedNodes[0].data.asnStatNm === '입하완료') {
        setLoading(false); // 로딩 끝
        toastError('이미 입하된 항목이 존재합니다.', { autoClose: 1000 });
        return;
      }
      /*
      if (!stockUserLoginId) {
        setLoading(false); // 로딩 끝
        toastError('입하할 상품의 작업자를 선택해주세요.', { autoClose: 1000 });
        return;
      }
*/
      const invalidRow = selectedNodes.some((row: any) => row.data.stockCnt < 0);
      if (invalidRow) {
        setLoading(false); // 로딩 끝
        toastError('입하할 상품의 입력수량을 확인 해주세요 (음수오류)', { autoClose: 1000 });
        return;
      }

      selectedNodes.forEach((item) => {
        paramsArray.push({
          asnId: item.data.asnId,
          skuId: item.data.skuId,
          prodAttrCd: item.data.prodAttrCd,
          logisId: item.data.logisId,
          partnerId: item.data.partnerId,
          asnType: item.data.asnType,
          asnCnt: item.data.asnCnt,
          stockCnt: item.data.stockCnt,
          stockCd: item.data.stockCd, //입하구분
          //          stockUserLoginId: stockUserLoginId, // 작업자
          stockUserLoginId: session.data?.user.loginId, // 작업자 일단 로그인 한 사람
          immiInvenYn: immiCheck,
        });
      });
      console.log('입하처리 params>>', paramsArray);
      createStockMutate(paramsArray);
    } else {
      setLoading(false); // 로딩 끝
      toastError('입하할 상품의 입력수량을 입력해주세요.', { autoClose: 1000 });
    }
  };

  /** 입하추가 삭제(취소) 처리 */
  const onCancelAsnClick = () => {
    const gridApi = gridRef.current?.api;
    const paramsArray: InstockRequestDelete[] = [];

    const selectedNodes = gridApi?.getSelectedNodes();
    if (selectedNodes && selectedNodes?.length > 0) {
      // 대리입하예정처리 및 기타입하 추가한 경우만 삭제처리가 가능하다.
      const isInValid = selectedNodes.some((row: any) => row.data.repYn !== 'Y' && row.data.asnType !== '3');
      if (isInValid) {
        setNotDeleteOpen(true);
        // toastError('대리입하예정처리 또는 기타입하 추가한 항목만 삭제가 가능합니다.', { autoClose: 1000 });
        return;
      }

      selectedNodes.forEach((item) => {
        paramsArray.push({
          logisId: item.data.logisId,
          partnerId: item.data.partnerId,
          asnId: item.data.asnId,
          asnType: item.data.asnType,
          repYn: item.data.repYn,
        });
      });
      console.log('삭제처리 params>>', paramsArray);
      deleteStockMutate(paramsArray);
    } else {
      toastError('입하추가 삭제할 상품을 선택해주세요.', { autoClose: 1000 });
    }
  };

  /** 컬럼 정의 */
  const columns: ColDef[] = [
    {
      field: 'no',
      headerName: 'No.',
      minWidth: 50,
      maxWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      maxWidth: 130,
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'genCnt',
      headerName: '발주수량',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'asnCnt',
      headerName: 'ASN',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockCnt',
      headerName: '입고수량',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellEditor: 'agTextCellEditor', // 숫자로 하면  ArrowUp ArrowDown 시 숫자가 증감된다.
      editable: (params) => {
        if (params.node?.rowPinned === 'bottom') return false;
        return params.data.asnStatNm !== '입하완료';
      },
      cellClass: (params) => {
        if (params.data?.creTm) return ''; // creTm이 있으면 클래스 제거
        return !(params.node?.rowPinned === 'bottom') && params.data.asnStatNm !== '입하완료' ? 'editCell' : '';
      },
      // onCellValueChanged: (params) => {
      //   const rowNode = params.node;
      //   if (!rowNode || !params.api) return;
      //
      //   if (params.newValue < 0 || !params.newValue || isNaN(params.newValue)) {
      //     toastError('입하수량을 정확히 입력히 해주세요.');
      //     params.node?.setSelected(false);
      //     rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.data.orgStockCnt);
      //   } else {
      //     if (params.oldValue > 0) {
      //       params.node?.setSelected(true);
      //     }
      //     rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.newValue);
      //   }
      //
      //   updateTotals(); // 하단 합계 재계산
      // },

      cellRenderer: (params: any) => {
        const isEdited = params.value !== params.data.orgStockCnt; // 원래 값과 비교하여 변경 여부 확인
        // const isSelected = selectedRows[params.node.id]; // 스페이스바 선택 여부 확인
        const isSelected = params.node.selected;
        const className = isEdited || isSelected ? '' : 'txtItalic'; // 클래스 적용
        return <span className={className}>{params.value}</span>;
      },
    },
    {
      field: 'asnStatNm',
      headerName: '입하상태',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.data.repYn === 'Y' ? '(대리)' + params.value : params.value),
    },
    {
      field: 'stockUser',
      headerName: '작업자',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockTm',
      headerName: '작업일시',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => (params.value ? dayjs(params.value).format('M/DD (ddd) HH:mm:ss') : ''),
    },
  ];

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let genCnt = 0;
    let asnCnt = 0;
    let stockCnt = 0;

    gridRef.current?.api.forEachNode((node) => {
      genCnt += Number(node.data.genCnt || 0);
      asnCnt += Number(node.data.asnCnt || 0);
      stockCnt += Number(node.data.stockCnt || 0);
    });

    setPinnedRowData([
      {
        factoryNm: 'Total',
        genCnt: genCnt,
        asnCnt: asnCnt,
        stockCnt: stockCnt,
      },
    ]);
  };

  /** 작업자 조회 */
  const { data: userData, refetch: refetchUser } = useQuery(
    ['/user/mulyu'], // 쿼리 키
    () =>
      authApi.get('/user/mulyu', {
        params: {
          workLogisId: session.data?.user.workLogisId,
        },
      }),
    {
      staleTime: 5000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  );
  useEffect(() => {
    if (userData?.data) {
      const { resultCode, body, resultMessage } = userData.data;
      if (resultCode === 200) {
        const formattedData = body.map((item: any) => ({
          key: item.id,
          label: item.userNm,
          value: item.loginId,
        }));
        setUserList(formattedData);
      } else {
        toastError(resultMessage);
      }
    }
  }, [userData]);

  /** 작업자 변경 이벤트 */
  const handleChangeSelector = (value: any) => {
    setStockUserLoginId(value.value);
  };

  /** 셀 선택시 이벤트 */
  const onSelectionChanged = (params: any) => {
    const selectedNodes = params.api.getSelectedNodes();
    const selectedRowIds: Record<string, boolean> = {};

    selectedNodes.forEach((node: any) => {
      if (node.id != null) {
        selectedRowIds[node.id] = true;
      }
    });

    setSelectedRows(selectedRowIds);
  };

  const onCellValueChangedCallback = (params: any) => {
    console.log('params  ===>', params);
    if (!params.api || !params.node) return;

    const oldValue = params.data.stockCnt;
    const newValue = params.value;

    // 같은 값이라도 업데이트 트리거
    // if (oldValue === newValue) {
    //   params.api.getRowNode(params.node.id)?.setDataValue('stockCnt', newValue);
    // }

    // 기존 onCellValueChanged 로직
    if (newValue < 0 || !newValue || isNaN(newValue)) {
      toastError('입하수량을 정확히 입력해 주세요.');
      params.node?.setSelected(false);
      params.api.getRowNode(params.node.id)?.setDataValue('stockCnt', params.data.orgStockCnt);
    } else {
      if (oldValue > 0) {
        params.node?.setSelected(true);
      }
      params.api.getRowNode(params.node.id)?.setDataValue('stockCnt', newValue);
    }

    updateTotals(); // 하단 합계 재계산
  };

  return (
    <PopupLayout
      width={900}
      height={700}
      isEscClose={false}
      open={modalType.type === 'INSTOCK_FACTORY_ASN_POP' && modalType.active}
      onClose={() => {
        closeModal('INSTOCK_FACTORY_ASN_POP');
      }}
      title={
        <div className="instockTitle">
          <span className="partnerNm">{titleData.partnerNm}</span> 고객사의
          <span className="title"> {titleData.factoryNm}</span> 생산처 <span className="title"> {titleData.repAsnNm} </span>발주건 상세 내역
        </div>
      }
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button
                className="btn"
                title="입하추가 삭제"
                onClick={() => {
                  setDeleteOpen(true);
                }}
              >
                입하추가 삭제
              </button>
            </div>
            <div className="right">
              <button className="btn btnBlue" title="저장" onClick={onSaveClick}>
                저장
              </button>
              <button className="btn" title="닫기" onClick={() => closeModal('INSTOCK_FACTORY_ASN_POP')}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <div style={{ textAlign: 'right' }}>
        <CheckBox
          checked={immiCheck}
          onChange={(e) => {
            setImmiCheck(e.target.checked);
          }}
        >
          {'자동적치'}
        </CheckBox>
      </div>

      <PopupContent>
        {/*
        <Search className="type_2">
          <TunedReactSelector title={'작업자'} name={'stockUserLoginId'} onChange={handleChangeSelector} options={userList} placeholder="작업자 선택" />
        </Search>
*/}
        <Table>
          <TunedGrid
            ref={gridRef}
            onGridReady={(e) => {
              e.api.sizeColumnsToFit();
            }}
            rowData={rowData}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            onFirstDataRendered={onRowDataUpdated}
            onRowDataUpdated={onRowDataUpdated}
            pinnedBottomRowData={pinnedRowData}
            className={'wmsPop check'}
            getRowClass={(params) => (params.data.asnStatNm === '입하완료' ? 'noEditRow' : '')}
            onSelectionChanged={onSelectionChanged}
            //onCellEditingStopped={onCellEditingStopped}
            onCellValueChanged={onCellValueChangedCallback}
            onCellKeyDown={(event) => {
              const eventTriggeredRowIndex = event.rowIndex || 0;
              const api = event.api;
              const keyboardEvent = event.event as KeyboardEvent;
              const nowColId = api.getEditingCells().length > 0 ? api.getEditingCells()[0].colId : '';
              if (rowData && api && nowColId && nowColId == 'stockCnt' && keyboardEvent.key === 'ArrowDown') {
                api.stopEditing(false);
                moveAndEdit(eventTriggeredRowIndex == rowData.length - 1 ? eventTriggeredRowIndex : eventTriggeredRowIndex + 1, nowColId, 10, false, false);
              } else if (rowData && api && nowColId && nowColId == 'stockCnt' && keyboardEvent.key === 'ArrowUp') {
                api.stopEditing(false);
                moveAndEdit(eventTriggeredRowIndex == rowData.length - 1 ? eventTriggeredRowIndex : eventTriggeredRowIndex - 1, nowColId, 10, false, false);
              }
              event.event?.preventDefault(); // 다른 오작등을 막아보자
            }}
          />
        </Table>

        <ConfirmModal
          title={
            '<div class="confirmMsg"><span class="small">현재 선택한 상품을 </span><span class="big"><strong>입하등록</strong>에서&nbsp;삭제하시겠어요?</span><span class="notice">고객사가 발주한 상품만 발주조회에서 다시 조회 가능합니다</span></div>'
          }
          open={deleteOpen}
          onClose={() => {
            setDeleteOpen(false);
          }}
          onConfirm={() => {
            onCancelAsnClick();
            setDeleteOpen(false);
          }}
        />
        <ConfirmModal
          title={
            '<div class="confirmMsg"><span class="small">현재 선택한 상품은 </span><span class="big">입하등록에서&nbsp;삭제할 수 없어요</span><span class="notice">고객사가 ASN 수량을 삭제해줘야 합니다.</span></div>'
          }
          open={notDeleteOpen}
          onClose={() => {
            setNotDeleteOpen(false);
          }}
          onConfirm={() => {
            setNotDeleteOpen(false);
          }}
        />
      </PopupContent>
      {loading && <Loading />}
    </PopupLayout>
  );
};

export default FactoryAsnPop;
