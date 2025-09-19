import React, { useEffect, useRef, useState } from 'react';
import { CellValueChangedEvent, ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { toastError, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FactoryResponseSelectList, ReceivingHistoryResponseSkuFactoryItems } from '../../../generated';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import { Tooltip } from 'react-tooltip';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import { Search, Table } from '../../content';
import { TableHeader } from '../../TableHeader';
import { fetchFactories } from '../../../api/wms-api';
import { DataListDropDown } from '../../DataListDropDown';
import CustomTooltip from '../../CustomTooltip';
import Loading from '../../Loading';
import { PopupSearchBox, PopupSearchType } from '../content';

/**
 *  입고내역 > 반출등록 팝업
 */

const ReceivingHistOutGoingAddPop = () => {
  /** store & state */
  const [modalType, closeModal, createOutGoing] = useReceivingHistoryStore((s) => [s.modalType, s.closeModal, s.createOutGoing]);
  const [selectedFactoryId, setSelectedFactoryId] = useState<number>();
  const [SkuFactoryMejangItems, setSkuFactoryMejangItems] = useState<ReceivingHistoryResponseSkuFactoryItems[]>([]);
  const [outGoingType, setOutGoingType] = useState<boolean>(true);
  const gridRef = useRef<AgGridReact>(null);
  // const buttonOkRef = useRef<HTMLButtonElement>(null);
  // const buttonCancelRef = useRef<HTMLButtonElement>(null);

  /** 공장옵션 조회 */
  const [factoryOption, setFactoryOption] = useState<any>([]);
  const { data: factories, isSuccess: isFetchFactorySuccess, refetch } = useQuery(['fetchFactories'], fetchFactories);
  useEffect(() => {
    if (isFetchFactorySuccess && factories) {
      const { resultCode, body, resultMessage } = factories.data;
      if (resultCode === 200) {
        const factoryCodes = body?.map((item: FactoryResponseSelectList) => ({
          key: item.id,
          value: item.id,
          label: item.compNm,
        }));

        setFactoryOption(factoryCodes);
      } else {
        toastError(resultMessage);
      }
    }
  }, [isFetchFactorySuccess, factories]);

  /** 생산처 매장재고 목록 조회 */
  const {
    data: loadMejangItems,
    isLoading,
    isSuccess,
    refetch: mejangItemsRefetch,
  } = useQuery(
    ['/receiving-history/sku-factory/mejang-items/list', selectedFactoryId],
    () =>
      authApi.get('/receiving-history/sku-factory/mejang-items/list', {
        params: {
          factoryId: selectedFactoryId ?? 0,
        },
      }),
    {
      // enabled: !!selectedFactoryId,
      refetchOnWindowFocus: false, // 윈도우 포커스시 리패치 비활성화
      refetchOnReconnect: true, // 네트워크 재연결시 리패치
      retry: 1, // 실패시 1회 재시도
    },
  );
  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadMejangItems.data;
      if (resultCode === 200) {
        if (body) {
          console.log('매장재고 목록 조회 응답 >>', body);
          setSkuFactoryMejangItems(body);
        } else {
          toastError('매장재고 정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadMejangItems]);

  /** 반출상품등록 API */
  const queryClient = useQueryClient();
  const { mutate: createOutGoingMutate } = useMutation(createOutGoing, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/receiving-history/paging']);
        closeModal('OUTGOING_CREATE');
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 컬럼 정의 */
  const columnDefs: ColDef[] = [
    {
      field: 'no',
      headerName: 'No.',
      width: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'factoryNm',
      headerName: '생산처명',
      width: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      width: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      filter: 'agSetColumnFilter',
    },
    {
      field: 'orgAmt',
      headerName: '판매원가',
      width: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'centerInventoryCnt',
      headerName: '빈블러',
      width: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'partnerInventoryCnt',
      headerName: '매장',
      width: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'inpOutGoingCnt',
      headerName: '반출',
      width: 60,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellClass: 'editCell',
      editable: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
      tooltipComponent: CustomTooltip,
      tooltipValueGetter: (params) => {
        if (params.data?.inpOutGoingCnt > params.data.partnerInventoryCnt) return '매장재고수량에 대해 반출처리가 가능해요.';
      },
    },
    {
      field: 'outGoingFactoryId',
      headerName: '반출처ID[API전달값]',
      hide: true,
    },
    {
      field: 'outGoingFactoryNm',
      headerName: '반출처',
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      cellClass: 'editCell',
      cellEditor: 'agRichSelectCellEditor',
      editable: true,
      cellEditorParams: (params: any) => {
        return {
          values: factoryOption.map((item: any) => item.label),
          allowTyping: true,
          filterList: true,
          highlightMatch: true,
        };
      },
      onCellValueChanged: (params) => {
        const selectedFactoryNm = params.newValue;
        const selectedFactoryObj = factoryOption.find((item: any) => item.label === selectedFactoryNm);
        if (selectedFactoryObj) {
          const rowNode = params.node;
          if (rowNode) {
            rowNode.setDataValue('outGoingFactoryId', selectedFactoryObj.value);
          }
        }
      },
    },
    {
      field: 'inpGagongAmt',
      headerName: '공임비',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'outGoingAmt',
      headerName: outGoingType ? '반출금액' : '폐기금액',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'inpDcAmt',
      headerName: '단가DC',
      width: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
    },
  ];

  // /** 최초 데이터 렌더링 시 그리드 업데이트 */
  // const onRowDataUpdated = (params: any) => {
  //   params.api.forEachNode((node: any) => {
  //     if (node.data) {
  //       // node.setDataValue('outGoingFactoryNm', node.data.factoryNm); // 반출처 원 생산처명으로 지정해준다
  //     }
  //   });
  // };

  /** 셀 입력시 이벤트 핸들러 */
  const onCellValueChanged = (event: CellValueChangedEvent): void => {
    const { colDef, node, newValue, oldValue } = event;

    if (!['inpOutGoingCnt', 'inpGagongAmt', 'inpDcAmt'].includes(colDef.field!)) return; // 수량, 금액, 단가DC는 무시

    let isVerify = true;

    // 반출수량 변경
    if (colDef.field === 'inpOutGoingCnt') {
      if (isNaN(newValue) || newValue <= 0) {
        toastError('반출수량은 0 이상의 숫자만 입력해주세요.');
        isVerify = false;
      }

      if (newValue > node.data.partnerInventoryCnt) {
        toastError('매장재고 수량 이하로 입력해주세요.', { autoClose: 300 });
        isVerify = false;
      }

      if (isVerify) {
        if (oldValue === undefined) {
          // 최초 반출수량입력시만 기본입력값들을 셋팅해준다.
          node.setDataValue('inpDcAmt', node.data.factorySpcDcAmt); // 단가DC
          node.setDataValue('inpGagongAmt', node.data.mainGagongAmt); // 공임비
          node.setDataValue('outGoingFactoryNm', node.data.factoryNm); // 반출처
          node.setDataValue('outGoingAmt', node.data.mainGagongAmt > 0 ? newValue * (node.data.mainGagongAmt - node.data.inpDcAmt) : 0); // 반출금액
        } else {
          // 이후 반출수량입력시 반출금액 계산
          node.setDataValue('outGoingAmt', node.data.inpGagongAmt > 0 ? newValue * (node.data.inpGagongAmt - node.data.inpDcAmt) : 0);
        }
      }
    }

    // 공임비 변경시 반출금액 재계산한다.
    if (colDef.field === 'inpGagongAmt') {
      if (isNaN(newValue) || newValue <= 0) {
        toastError('공임비는 0 이상의 숫자만 입력해주세요.');
        isVerify = false;
      }

      if (isVerify) {
        node.setDataValue('outGoingAmt', node.data.inpOutGoingCnt > 0 ? (newValue - node.data.inpDcAmt) * node.data.inpOutGoingCnt : 0);
      }
    }

    // 단가DC 변경시 반출금액을 재계산한다.
    if (colDef.field === 'inpDcAmt') {
      if (isNaN(newValue)) {
        toastError('단가DC는 숫자만 입력해주세요.');
        node.setDataValue('inpDcAmt', 0);
        isVerify = false;
      }

      if (isVerify) {
        node.setDataValue('outGoingAmt', node.data.inpOutGoingCnt > 0 ? (node.data.inpGagongAmt - newValue) * node.data.inpOutGoingCnt : 0);
      }
    }

    // 정상입력시 셀 선택
    node.setSelected(['inpOutGoingCnt', 'inpGagongAmt', 'inpDcAmt'].includes(colDef.field!) && isVerify);
  };

  /** 저장 이벤트 핸들러 */
  const handleSave = async () => {
    const gridApi = gridRef.current?.api;
    gridApi?.stopEditing(); // 입력도중 저장을 눌렀을때 입력을 마무리 한다

    const selectedRows: any = gridApi?.getSelectedRows();

    if (selectedRows?.length === 0) {
      toastError('반출할 상품을 선택해주세요.', { autoClose: 1000 });
      return;
    } else {
      // 반출수량과 반출처, 공임비 유효성 체크
      const invalidRow = selectedRows.some((row: any) => row.inpOutGoingCnt <= 0 || row.inpGagongAmt <= 0 || !row.outGoingFactoryNm);

      if (invalidRow) {
        toastError('반출할 상품의 반출수량, 공임비 또는 반출처를 다시 확인해주세요.', { autoClose: 1000 });
        return;
      }

      const params = selectedRows.map((row: any) => ({
        ...row,
        outGoingType, // 반출타입 추가
      }));
      console.log('반출등록 params >>', params);
      createOutGoingMutate(params);
    }
  };

  // 화살표 키 동작을 활성화시키는 영역
  // const handleArrowKey = (event: KeyboardEvent) => {
  //   const activeElement = document.activeElement;
  //   const inputElements = ['INPUT', 'TEXTAREA', 'SELECT'];
  //
  //   // 현재active 된것들이 input 등이 아닌경우 에만 화살표 키가 먹는다.
  //   if (event.key === 'F10') {
  //     buttonOkRef.current?.click();
  //   } else if (!inputElements.includes(activeElement?.tagName || '')) {
  //     if (event.key === 'ArrowLeft') {
  //       buttonOkRef.current?.focus();
  //     }
  //     if (event.key === 'ArrowRight') {
  //       buttonCancelRef.current?.focus();
  //     }
  //   }
  // };

  const search = async () => {
    await mejangItemsRefetch();
  };

  const [selectedFactory, setSelectedFactory] = useState<any>();
  const handleChangeFactory = async (option: any) => {
    setSelectedFactory(option);
    setSelectedFactoryId(option.value);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await search();
  };

  return (
    <PopupLayout
      width={1050}
      isEscClose={false}
      open={modalType.type === 'OUTGOING_CREATE' && modalType.active}
      title={'반출상품 등록'}
      onClose={() => {
        closeModal('OUTGOING_CREATE');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left"></div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              <button
                className="btn btnBlue"
                title="저장"
                // ref={buttonOkRef}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={handleSave}
              >
                저장
              </button>

              <button
                className="btn"
                title="닫기"
                // ref={buttonCancelRef}
                onClick={() => {
                  closeModal(modalType.type);
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <Search className="type_1">
          <DataListDropDown
            title={'생산처'}
            name={'factoryId'}
            value={selectedFactory}
            onChange={handleChangeFactory}
            options={factoryOption}
            placeholder="생산처 선택"
            required={true}
          />
          <Search.Switch
            title={'수선/완불'}
            name={'outGoingType'}
            checkedLabel={'수선'}
            uncheckedLabel={'완불'} // 폐기
            onChange={(e, value) => {
              setOutGoingType(value);
            }}
            value={outGoingType}
          />
        </Search>

        <Table>
          <TableHeader count={0} isCount={false} title={'상품명 '} gridRef={gridRef} />
          <TunedGrid<ReceivingHistoryResponseSkuFactoryItems>
            ref={gridRef}
            rowData={SkuFactoryMejangItems ?? []}
            columnDefs={columnDefs}
            loadingOverlayComponent={CustomGridLoading}
            noRowsOverlayComponent={CustomNoRowsOverlay}
            rowSelection={'multiple'}
            enableRangeSelection={true}
            suppressRowClickSelection={true}
            preventPersonalizedColumnSetting={true}
            className={'factorySettleDetailPop'}
            onCellValueChanged={onCellValueChanged}
            // onRowDataUpdated={onRowDataUpdated}
          />
        </Table>
      </PopupContent>
      {isLoading && <Loading />}
    </PopupLayout>
  );
};

export default ReceivingHistOutGoingAddPop;
