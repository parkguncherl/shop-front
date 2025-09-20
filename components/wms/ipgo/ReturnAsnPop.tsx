import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PopupContent, PopupFooter, PopupLayout } from '../../popup';
import { defaultColDef, GridSetting } from '../../../libs/ag-grid';
import TunedGrid from '../../grid/TunedGrid';
import { ColDef } from 'ag-grid-community';
import CustomGridLoading from '../../CustomGridLoading';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import { Search, Table } from '../../content';
import { InstockRequestCreate, InstockReturnResponseDetail } from '../../../generated';
import { toastError, toastInfo, toastSuccess } from '../../ToastMessage';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { useInstockStore } from '../../../stores/wms/uselnstockStore';
import { AgGridReact } from 'ag-grid-react';
import { createStock } from '../../../api/wms-api';
import { TunedReactSelector } from '../../TunedReactSelector';
import { useSession } from 'next-auth/react';
import { AddReturnProdPop } from '../../popup/wms/ipgo/AddReturnProdPop';
import { ConfirmModal } from '../../ConfirmModal';
import Loading from '../../Loading';
import { CheckBox } from '../../CheckBox';

interface Props {
  dtlParam: any;
  titleData: any;
}

const ReturnAsnPop = ({ dtlParam, titleData }: Props) => {
  const session = useSession();
  const [userList, setUserList] = useState<any[]>([]);
  const [stockUserLoginId, setStockUserLoginId] = useState<string>();
  const gridRef = useRef<AgGridReact>(null);
  const [modalType, openModal, closeModal] = useInstockStore((s) => [s.modalType, s.openModal, s.closeModal]);
  const [rowData, setRowData] = useState<(InstockReturnResponseDetail & { diff: number })[]>();
  const [pinnedRowData, setPinnedRowData] = useState<any[]>();
  const [AddReturnProdPopOpen, setAddReturnProdPopOpen] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [immiCheck, setImmiCheck] = useState<boolean>(true);

  /** detail 조회 */
  const {
    data: detailData,
    isLoading: isDetailLoading,
    isSuccess: isDetailSuccess,
    refetch: refetchDetail,
  } = useQuery(
    ['/instock/return/detail', dtlParam], // 쿼리 키
    () =>
      authApi.get('/instock/return/detail', {
        params: {
          partnerId: dtlParam?.partnerId, // 선택된 데이터에서 가져옴
          creTm: dtlParam?.creTm,
        },
      }),
    {
      enabled: !!dtlParam, // selectedData가 있을 때만 쿼리 실행
      staleTime: 5000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  );
  useEffect(() => {
    if (isDetailSuccess && detailData?.data) {
      const { resultCode, body, resultMessage } = detailData.data;
      if (resultCode === 200) {
        // console.log('데이터', body);
        setRowData(body);
      } else {
        toastError(resultMessage);
      }
    }
  }, [detailData, isDetailSuccess]);

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
      minWidth: 130,
      cellStyle: GridSetting.CellStyle.LEFT,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'partnerInventoryAmt',
      headerName: '매장재고',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'genCnt',
      headerName: '반납확정',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockCnt',
      headerName: '입고수량',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: (params) => {
        if (params.node?.rowPinned === 'bottom') return false;
        return !params.data?.creTm; // creTm 값이 있으면 false
      },
      cellClass: (params) => {
        if (params.data?.creTm) return ''; // creTm이 있으면 클래스 제거
        return !(params.node?.rowPinned === 'bottom') && params.column.getColDef().editable ? 'editCell' : '';
      },
      // onCellValueChanged: (params) => {
      //   const rowNode = params.node;
      //   if (!rowNode || !params.api) return;
      //
      //   // 반납이 되는 최소값 계산
      //   const minStockCount = params.data.partnerInventoryAmt + params.data.genCnt;
      //
      //   if (params.newValue < 0 || !params.newValue || isNaN(params.newValue)) {
      //     toastError('입하수량을 정확히 입력히 해주세요.');
      //     params.node?.setSelected(false);
      //     rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.data.orgStockCnt);
      //   } else if (params.newValue > minStockCount) {
      //     toastError(`반납 입하수량은 매장재고보다 많을 수 없습니다.`);
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
        const isSelected = params.node.selected;
        const className = isEdited || isSelected ? '' : 'txtItalic'; // 클래스 적용
        return <span className={className}>{params.value}</span>;
      },
    },
    {
      field: 'diff',
      headerName: '매장재고 ↑',
      minWidth: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellRenderer: (params: any) => {
        const genCnt = params.data.genCnt || 0;
        const stockCnt = params.data.stockCnt || 0;
        const diff = genCnt - stockCnt;

        if (diff > 0) {
          return <span className={'txtBlue'}>+{diff}</span>;
        } else if (diff < 0) {
          return <span className={'txtRed'}>{diff}</span>;
        } else {
          return <span>{diff}</span>;
        }
      },
    },
    {
      field: 'asnStatNm',
      headerName: '입하상태',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'stockUser',
      headerName: '작업자',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'creTm',
      headerName: '입하일시',
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        if (params.value) {
          return dayjs(params.value).format('MM/DD(ddd) HH:mm:ss');
        }
        return '';
      },
    },
  ];

  /** 최초 데이타 렌더링 및 데이타 업데이트시 이벤트  */
  const onRowDataUpdated = useCallback(() => {
    updateTotals(); // 하단 합계 계산
  }, []);

  /** 그리드 하단 합계 업데이트 함수 */
  const updateTotals = () => {
    let partnerInventoryAmt = 0;
    let genCnt = 0;
    let stockCnt = 0;
    let diff = 0;
    const uniqueSkuNm = new Set();

    gridRef.current?.api.forEachNode((node) => {
      const { skuNm } = node.data || {};

      partnerInventoryAmt += Number(node.data.partnerInventoryAmt || 0);
      genCnt += Number(node.data.genCnt || 0);
      stockCnt += Number(node.data.stockCnt || 0);
      diff += Number(node.data.diff || 0);

      if (skuNm) {
        uniqueSkuNm.add(String(skuNm).split('.')[0].trim());
      }
    });

    setPinnedRowData([
      {
        skuNm: `품목: ${uniqueSkuNm.size}`,
        partnerInventoryAmt: partnerInventoryAmt,
        genCnt: genCnt,
        stockCnt: stockCnt,
        diff: diff,
      },
    ]);
  };

  /** 입하등록 (저장) */
  const queryClient = useQueryClient();
  const { mutate: createStockMutate, isLoading: isCreateStockLoading } = useMutation(createStock, {
    onSuccess: async (e) => {
      const { resultCode, resultMessage, body } = e.data;
      if (resultCode === 200) {
        if (body) {
          toastError(body);
        } else {
          toastSuccess('입하처리 되었습니다.');
        }

        setLoading(false); // 로딩 끝
        await queryClient.invalidateQueries(['/instock/return/paging']);
        closeModal('INSTOCK_RETURN_ASN_POP');
      } else {
        setLoading(false); // 로딩 끝
        toastError(body);
      }
    },
    onError: (err): void => {
      console.error(err);
      setLoading(false); // 로딩 끝
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 저장 */
  const onSaveClick = () => {
    const gridApi = gridRef.current?.api;
    const paramsArray: InstockRequestCreate[] = [];

    const selectedNodes = gridApi?.getSelectedNodes();
    if (selectedNodes && selectedNodes?.length > 0) {
      if (selectedNodes[0].data.creTm) {
        toastError('이미 입하된 항목이 존재합니다.', { autoClose: 1000 });
        return;
      }
      /*
      if (!stockUserLoginId) {
        toastError('입하할 상품의 작업자를 선택해주세요.', { autoClose: 1000 });
        return;
      }
*/
      const invalidRow = selectedNodes.some((row: any) => row.stockCnt < 0);
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
          asnType: '2',
          asnCnt: item.data.asnCnt,
          stockCnt: item.data.stockCnt,
          stockCd: item.data.stockCd, // 입하구분
          stockUserLoginId: stockUserLoginId, // 작업자
          immiInvenYn: immiCheck,
        });
      });
      console.log('입하처리 params>>', paramsArray);
      createStockMutate(paramsArray);
    } else {
      toastError('선택된 입하할 상품이 없습니다.', { autoClose: 1000 });
    }
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

  const onCellEditingStopped = (params: any) => {
    const rowNode = params.node;
    if (!params.api || !params.node) return;

    // 기존 onCellValueChanged 로직
    // 반납이 되는 최소값 계산
    const minStockCount = params.data.partnerInventoryAmt + params.data.genCnt;

    if (params.newValue < 0 || !params.newValue || isNaN(params.newValue)) {
      toastError('입하수량을 정확히 입력히 해주세요.');
      params.node?.setSelected(false);
      rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.data.orgStockCnt);
    } else if (params.newValue > minStockCount) {
      toastError(`반납 입하수량은 매장재고보다 많을 수 없습니다.`);
      params.node?.setSelected(false);
      rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.data.orgStockCnt);
    } else {
      if (params.oldValue > 0) {
        params.node?.setSelected(true);
      }
      rowNode.id != null && params.api.getRowNode(rowNode?.id)?.setDataValue('stockCnt', params.newValue);
    }

    updateTotals(); // 하단 합계 재계산
  };

  return (
    <PopupLayout
      width={900}
      isEscClose={false}
      open={modalType.type === 'INSTOCK_RETURN_ASN_POP' && modalType.active}
      title={
        <div className="instockTitle">
          <span className="partnerNm">{titleData.partnerNm}</span> 고객사의 <span className="title">{titleData.type}</span> 입하처리 상세 내역
        </div>
      }
      onClose={() => {
        closeModal('INSTOCK_RETURN_ASN_POP');
      }}
      isSubPopUpOpened={AddReturnProdPopOpen}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button
                className="btn"
                title="반납상품 추가"
                onClick={() => {
                  setAddReturnProdPopOpen(true);
                }}
              >
                반납상품 추가
              </button>
            </div>
            <div className="right">
              <button
                className="btn btnBlue"
                title="수정"
                onClick={() => {
                  setOpen(true);
                }}
              >
                저장
              </button>
              <button className="btn" title="닫기" onClick={() => closeModal('INSTOCK_RETURN_ASN_POP')}>
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
            rowSelection={'multiple'}
            defaultColDef={defaultColDef}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            pinnedBottomRowData={pinnedRowData}
            onFirstDataRendered={onRowDataUpdated}
            onSelectionChanged={onSelectionChanged}
            onCellEditingStopped={onCellEditingStopped}
            className={'pop instock check'}
            getRowClass={(params) => (params.data.creTm ? 'noEditRow' : '')}
          />
        </Table>
      </PopupContent>
      <AddReturnProdPop
        active={AddReturnProdPopOpen}
        onClose={() => {
          setAddReturnProdPopOpen(false);
        }}
        partnerId={dtlParam?.partnerId}
        creTm={dtlParam?.creTm}
      />
      <ConfirmModal
        title={
          '<div class="confirmMsg"><span class="small">현재 입력된 상품을 </span><span class="big"><strong>입하</strong>&nbsp;처리하시겠어요?</span></div>'
        }
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        onConfirm={() => {
          onSaveClick();
          setOpen(false);
        }}
      />
      {loading && <Loading />}
    </PopupLayout>
  );
};

export default ReturnAsnPop;
