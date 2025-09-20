/**
 * @file pages/oms/orderInfo/ohchulStatus.tsx
 * @description OMS > 오출고현황
 * @copyright 2025
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAgGridApi } from '../../../hooks';
import useFilters from '../../../hooks/useFilters';
import { AgGridReact } from 'ag-grid-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Search, TableHeader, Title, toastError, toastSuccess } from '../../../components';
import { GridSetting } from '../../../libs/ag-grid';
import { ColDef, IRowNode, SelectionChangedEvent } from 'ag-grid-community';
import CustomGridLoading from '../../../components/CustomGridLoading';
import CustomNoRowsOverlay from '../../../components/CustomNoRowsOverlay';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import TunedGrid from '../../../components/grid/TunedGrid';
import { WrongResponsePaging } from '../../../generated';
import { useWrongStore } from '../../../stores/useWrongStore';
import { useCommonStore } from '../../../stores';
import { ConfirmModal } from '../../../components/ConfirmModal';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../../../components/CustomShortcutButton';
import CustomNewDatePicker from '../../../components/CustomNewDatePicker';
import PrintLayout from '../../../components/print/PrintLayout';
import { useTodayStore } from '../../../stores/useTodayStore';
import { WrongDeliveryReqPop } from '../../../components/popup/orderInfo/WrongDeliveryReqPop';
import { useDeliveryStore } from '../../../stores/useDeliveryStore';
import { Utils } from '../../../libs/utils';

/**
 * @No.3
 * @file pages/oms/orderInfo/ohchulStatus.tsx
 * @description  OMS > 데이터 > 오출고현황
 * @status 기초생성
 * @copyright 2024
 */

const OhChulStatus = () => {
  const session = useSession();
  const { onGridReady } = useAgGridApi();
  const gridRef = useRef<AgGridReact>(null);
  const [queryKey, setQueryKey] = useState<boolean>(false);

  // 날짜 초기값 설정 (3개월)
  const startDt = dayjs().subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  /** 공통 스토어 - State */
  const [upMenuNm, menuNm] = useCommonStore((s) => [s.upMenuNm, s.menuNm]);
  const [setSelectedPagingElement, deliveryModalType, deliveryOpenModal] = useDeliveryStore((s) => [s.setSelectedPagingElement, s.modalType, s.openModal]);
  const [paging, setPaging, modalType, openModal, closeModal, deleteWrongInfo] = useWrongStore((s) => [
    s.paging,
    s.setPaging,
    s.modalType,
    s.openModal,
    s.closeModal,
    s.deleteWrongInfo,
  ]);

  const [getTodayOrderDetail, getTodayOrderDetailByPayId] = useTodayStore((s) => [s.getTodayOrderDetail, s.getTodayOrderDetailByPayId]);

  // 필터 상태 관리
  const [filters, onChangeFilters, onFiltersReset] = useFilters({
    startDate: Utils.getStartDayBeforeMonth(12), // 1 달전
    endDate: today,
    sellerNm: '',
    wrongStatCd: 'R', // 진행중
  });

  const [isPreView, setIsPreView] = useState<boolean>(true);
  const [selectedDetail, setSelectedDetail] = useState<any>([]); // 전표상세
  const [isPrinting, setIsPrinting] = useState(false); // 프린트 여부

  // row Data
  const [wrongStatusList, setWrongStatusList] = useState<WrongResponsePaging[]>([]);

  const [selectedNode, setSelectedNode] = useState<IRowNode | undefined>(undefined);

  // AG-Grid 컬럼 정의
  const [columnDefs] = useState<ColDef<WrongResponsePaging>[]>([
    {
      field: 'no',
      headerName: 'No.',
      maxWidth: 40,
      minWidth: 40,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'workYmd',
      headerName: '영업일자',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'regYmd',
      headerName: '등록일자', // before 확인일시
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    /* 완료상태 */
    {
      field: 'jobTypeNm',
      headerName: '거래유형',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'sellerNm',
      headerName: '소매처',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'wrongStatCdNm',
      headerName: '진행상태', // before 상태
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'etcCntn',
      headerName: '비고',
      minWidth: 140,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
  ]);

  // 오출고 현황 조회 API 호출
  const {
    data: wrongList,
    isLoading: isWrongListLoading,
    isSuccess: isWrongListSuccess,
    refetch: fetchWrongList,
  } = useQuery({
    queryKey: ['/orderInfo/wrong/paging', queryKey, filters.wrongStatCd],
    queryFn: (): any =>
      authApi.get('/orderInfo/wrong/paging', {
        params: {
          curPage: paging.curPage,
          pageRowCount: paging.pageRowCount,
          ...filters,
        },
      }),
  });

  // API 응답 처리
  useEffect(() => {
    if (isWrongListSuccess) {
      const { resultCode, body, resultMessage } = wrongList.data;
      if (resultCode === 200) {
        setPaging(body?.paging);
        setWrongStatusList(body.rows || []);
        setTimeout(() => {
          gridRef.current?.api.ensureIndexVisible(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
          );
          gridRef.current?.api.setFocusedCell(
            body.rows ? (body.rows.length > body.paging.pageRowCount ? body.paging.pageRowCount - 1 : body.rows.length - 1) : 0,
            'sellerNm',
          );
        }, 0); // 하단 포커스
      } else {
        toastError(resultMessage);
      }
    }
  }, [wrongList, isWrongListSuccess]);

  /**
   * 검색 버튼 클릭 핸들러
   */
  const onSearch = async () => {
    setQueryKey(!queryKey);
  };

  /**
   * 초기화 버튼 클릭 핸들러
   */
  const onReset = async () => {
    onFiltersReset();
    onChangeFilters('startDate', startDt);
    onChangeFilters('endDate', today);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await onSearch();
  };

  // 프린트 버튼 클릭 이벤트
  const handlePrintBtnClick = () => {
    if (!isPreView) {
      return;
    }
    setIsPrinting(true);
  };

  const handleSelectionChanged = async (event: SelectionChangedEvent<WrongResponsePaging, any>) => {
    // todo 현재는 그리드 인자를 통해 단일 선택만 가능하므로 해당 코드가 복수의 행을 필요로 할 시 정상 동작하지 않을 수 있음에 유념
    // 선택된 모든 행을 가져옴
    setSelectedNode(event.api.getSelectedNodes()[0]); // 단일 선택만 가능한 그리드라는 전제 하에 동작함
    const selectedNodes = gridRef.current?.api.getSelectedNodes();

    // 각 항목을 객체 형태로 저장하여 orderId와 payId 구분
    const items = selectedNodes?.map((node) => (node.data.orderId ? { orderId: node.data.orderId } : { payId: node.data.payId })) || [];

    try {
      const orderIds = items.filter((item) => item.orderId).map((item) => item.orderId);
      const payIds = items.filter((item) => item.payId).map((item) => item.payId);
      // 각 ID와 payId에 대해 API 호출
      const orderIdResponse = orderIds.length > 0 ? await getTodayOrderDetail(orderIds) : { data: { body: [] as any[] } }; // 0 으로 파트너 아이디를 던지면 backend 에서 다시 조회해서 처리
      const payIdResponse = payIds.length > 0 ? await getTodayOrderDetailByPayId(payIds) : { data: { body: [] as any[] } };

      // 응답 데이터를 원래 순서에 맞춰 매핑
      const combinedResponse = items.map((item) => {
        if (item.orderId && (orderIdResponse?.data?.body as any[])) {
          const matchedOrder = (orderIdResponse.data.body as any[]).find((detail: { orderId: number }) => detail.orderId === item.orderId);
          return (
            matchedOrder || {
              orderId: item.orderId,
              error: 'No details found',
            }
          );
        } else if (payIdResponse?.data?.body) {
          const matchedPay = (payIdResponse.data.body as any[]).find((detail: { payId: number }) => detail.payId === item.payId);
          return (
            matchedPay || {
              payId: item.payId,
              error: 'No details found',
            }
          );
        } else {
          return {
            error: 'No details found',
          };
        }
      });
      console.log('combinedResponse :+_', combinedResponse);
      setSelectedDetail(combinedResponse); // 순서에 맞는 상세 정보 저장
    } catch (error) {
      console.error('API 호출 중 오류 발생: ', error);
    }
  };

  return (
    <div>
      <Title title={upMenuNm && menuNm ? `${menuNm}` : ''} filters={filters} reset={onReset} search={onSearch} />
      <Search className="type_2">
        <CustomNewDatePicker
          type={'range'}
          title={'기간'}
          startName={'startDate'}
          endName={'endDate'}
          value={[filters.startDate, filters.endDate]}
          onChange={onChangeFilters}
          filters={filters}
          defaultType={'type'}
        />
        <Search.DropDown title={'오출고상태'} name={'wrongStatCd'} codeUpper={'10460'} value={filters.wrongStatCd} onChange={onChangeFilters} />
        <Search.Input
          title={'소매처'}
          name={'sellerNm'}
          placeholder={'소매처 검색'}
          value={filters.sellerNm}
          onChange={onChangeFilters}
          filters={filters}
          onEnter={() => {
            onSearch();
          }}
        />
      </Search>
      <div className={`makePreviewArea ${isPreView ? 'preview' : ''}`}>
        <TableHeader count={paging.totalRowCount || 0} paging={paging} setPaging={setPaging} search={onSearch} isPaging={false}>
          <CustomShortcutButton
            className={`btn ${isPreView ? 'on' : ''}`}
            title="미리보기"
            onClick={() => setIsPreView(!isPreView)}
            shortcut={COMMON_SHORTCUTS.alt1}
          >
            미리보기
          </CustomShortcutButton>
          <CustomShortcutButton className="btn icoPrint" title="프린트" onClick={handlePrintBtnClick} shortcut={COMMON_SHORTCUTS.print}>
            프린트
          </CustomShortcutButton>
        </TableHeader>
        <div className="gridBox">
          <div className="tblPreview">
            <TunedGrid<WrongResponsePaging>
              ref={gridRef}
              rowData={wrongStatusList}
              loading={isWrongListLoading}
              columnDefs={columnDefs}
              onGridReady={onGridReady}
              onSelectionChanged={handleSelectionChanged}
              suppressRowClickSelection={false}
              paginationPageSize={paging.pageRowCount}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              rowSelection={'single'}
              onRowClicked={(e) => console.log(e.data)}
              className={'default'}
            />
            <div className="btnArea">
              <CustomShortcutButton
                className="btn"
                title="오출고수정"
                shortcut={COMMON_SHORTCUTS.alt1}
                onClick={() => {
                  if (gridRef.current?.api.getSelectedNodes()[0]) {
                    setSelectedPagingElement(gridRef.current.api.getSelectedNodes()[0].data);
                    deliveryOpenModal('REG_WRONG');
                  } else {
                    toastError('수정할 오출고를 선택하십시요.');
                  }
                }}
              >
                오출고수정
              </CustomShortcutButton>
              <CustomShortcutButton
                className="btn"
                title="오출고취소"
                shortcut={COMMON_SHORTCUTS.alt2}
                onClick={() => {
                  if (selectedNode) {
                    if (selectedNode.data.jobId) {
                      if (selectedNode.data.wrongStatCd == 'S' || selectedNode.data.wrongStatCd == 'C') {
                        toastError('이미 처리 혹은 반려된 오출고는 수정할 수 없습니다.');
                      } else {
                        openModal('WRONG_CANCEL');
                      }
                    } else {
                      console.error('jobId 를 찾을 수 없음');
                    }
                  } else {
                    toastError('취소할 오출고를 선택하십시요.');
                  }
                }}
              >
                오출고취소
              </CustomShortcutButton>
            </div>
          </div>
          <div>
            {isPreView ? (
              <div className="previewBox">
                {selectedDetail ? (
                  <PrintLayout selectedDetail={selectedDetail} isPrinting={isPrinting} setIsPrinting={setIsPrinting} type={'default'} />
                ) : (
                  <div className="noRowsOverlayBox">주문을 선택하면 상세 정보가 표시됩니다.</div>
                )}
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={modalType.type == 'WRONG_CANCEL' && modalType.active}
        title={`<div class="confirmMsg"><span><strong>${selectedNode?.data.sellerNm || ''}</strong> 에 관한 <strong>${
          selectedNode?.data.jobTypeNm || ''
        }</strong> </span><span>오출고 등록을 취소 처리하시겠습니까?</span></div>`}
        onConfirm={() => {
          if (selectedNode) {
            deleteWrongInfo(selectedNode.data.jobId)
              .then((result) => {
                const { resultCode, resultMessage } = result.data;
                if (resultCode == 200) {
                  toastSuccess('취소 처리되었습니다.');
                  fetchWrongList();
                } else {
                  toastError(resultMessage);
                }
              })
              .catch((error) => console.error(error));
          } else {
            console.error('선택된 행을 찾을 수 없음');
          }
        }}
        onClose={() => {
          closeModal('WRONG_CANCEL');
        }}
      />
      {deliveryModalType.type === 'REG_WRONG' && deliveryModalType.active && <WrongDeliveryReqPop />}
    </div>
  );
};

export default OhChulStatus;
