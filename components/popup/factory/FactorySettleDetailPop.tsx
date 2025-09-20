import React, { useEffect, useRef, useState } from 'react';
import { ColDef } from 'ag-grid-community';
import { GridSetting } from '../../../libs/ag-grid';
import { AgGridReact } from 'ag-grid-react';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { toastError, toastInfo, toastSuccess } from '../../ToastMessage';
import TunedGrid from '../../grid/TunedGrid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFactorySettleStore } from '../../../stores/useFactorySettleStore';
import {
  FactorySettleRequestTrans,
  FactorySettleResponsePaging,
  FactorySettleResponseTrans,
  ReceivingHistoryRequestDcAmtUpdate,
  ReceivingHistoryRequestFactorySpc,
} from '../../../generated';
import CustomNoRowsOverlay from '../../CustomNoRowsOverlay';
import CustomGridLoading from '../../CustomGridLoading';
import { authApi } from '../../../libs';
import { Utils } from '../../../libs/utils';
import FormInput from '../../FormInput';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Tooltip } from 'react-tooltip';
import { Switch, Tabs, TabsProps } from 'antd';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { div } from 'zrender/lib/core/vector';
import { useReceivingHistoryStore } from '../../../stores/useReceivingHistoryStore';
import { ConfirmModal } from '../../ConfirmModal';

/**
 *  생산처결제_입출고 거래상세 팝업
 */

interface Props {
  selectSettleData?: FactorySettleResponsePaging;
}

interface SettleState {
  inOutType?: string;
  dwTp?: string;
  workYmd?: string;
  inOutAmt?: number;
  settleDcAmt?: number;
  etcCntn?: string;
  todayTotAmt?: number;
  factoryId?: number;
  etcPrintYn?: string;
}

const FactorySettleDetailPop = ({ selectSettleData }: Props) => {
  const gridRef = useRef<AgGridReact>(null);
  const buttonOkRef = useRef<HTMLButtonElement>(null);
  const buttonCancelRef = useRef<HTMLButtonElement>(null);
  const isClickedSaveRef = useRef<boolean>(false);
  const dcInpRef = useRef<HTMLInputElement>(null);

  /** store */
  const [modalType, closeModal, updateTransDcAmt] = useFactorySettleStore((s) => [s.modalType, s.closeModal, s.updateTransDcAmt]);
  const [updateDcAmt, upsertFactorySpc] = useReceivingHistoryStore((s) => [s.updateDcAmt, s.upsertFactorySpc]);
  const [isSettlementView, setIsSettlementView] = useState<boolean>(false); // 화면스위칭
  const [transReqParam, setTransReqParam] = useState<FactorySettleRequestTrans>();
  const [transData, setTransData] = useState<FactorySettleResponseTrans[]>([]);
  const [confirmModal, setConfirmModal] = useState<boolean>(false);
  const [settleData, setSettleData] = useState<SettleState>({
    inOutAmt: 0,
    settleDcAmt: 0,
    etcCntn: '',
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid },
    setValue,
    getValues,
  } = useForm<SettleState>({
    defaultValues: {
      ...settleData,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    // console.log('선택된데이타 >> ', selectSettleData);
    if (!selectSettleData) {
      toastError('선택된 정보가 없어 다시 이용해주세요.');
      closeModal('SETTLE_DETAIL');
    }
    setTransReqParam({
      factoryId: selectSettleData?.factoryId,
      dwDp: selectSettleData?.dwTp,
      workYmd: selectSettleData?.workYmd,
    });

    // 이벤트 리스너 추가
    window.addEventListener('keydown', handleArrowKey);
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleArrowKey);
    };
  }, [selectSettleData]);

  /** 페이징 목록 조회 */
  const {
    data: loadTrans,
    isLoading,
    isSuccess,
    refetch: transRefetch,
  } = useQuery(
    ['/factory-settle/trans', transReqParam],
    () =>
      authApi.get('/factory-settle/trans', {
        params: transReqParam,
      }),
    {
      enabled: !!transReqParam, // transData가 존재할 때만 실행
    },
  );

  useEffect(() => {
    if (isSuccess) {
      const { resultCode, body, resultMessage } = loadTrans.data;
      if (resultCode === 200) {
        if (body) {
          // console.log('거래내역 응답 >>', body);
          reset();
          // 거래내역
          setTransData(body || []);
          // 결제정보
          const sumOfInoutAmt = body.reduce((sum: number, item: FactorySettleResponseTrans) => sum + item.inOutAmt!, 0); // 입고,반출금액 합계
          const sumOfDcAmt = body.reduce((sum: number, item: FactorySettleResponseTrans) => sum + item.settleDcAmt!, 0); // 할인금액 합계
          setSettleData({
            inOutType: body[0].inOutType.includes('입고') ? '입고' : '반출',
            dwTp: body[0].dwTp,
            workYmd: body[0].workYmd,
            todayTotAmt: sumOfInoutAmt - sumOfDcAmt, // 당일합계
            etcCntn: body[0].etcCntn,
            factoryId: body[0].factoryId,
          });
          setValue('inOutAmt', Utils.setComma(body.reduce((sum: number, item: FactorySettleResponseTrans) => sum + item.inOutAmt!, 0)));
          setValue('settleDcAmt', Utils.setComma(body.reduce((sum: number, item: FactorySettleResponseTrans) => sum + item.settleDcAmt!, 0)));
          setValue('etcCntn', body[0].etcCntn);
          setValue('etcPrintYn', body[0].etcPrintYn);
          setSelectedValues({ ['etcCntn']: body[0].etcCntn });
          setEtcInfo();
        } else {
          toastError('거래정보가 없어 잠시 후 다시 이용해주세요');
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [isSuccess, loadTrans]);

  /** 결제거래 등록 */
  const queryClient = useQueryClient();
  const { mutate: modifyTransDcAmtMutate, isLoading: isCreateLoading } = useMutation(updateTransDcAmt, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/factory-settle/paging']);
          closeModal(modalType.type);
        } else {
          toastError(resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 거래내역 단가DC 적용 업데이트  */
  const { mutate: updateDcAmtMutate } = useMutation(updateDcAmt, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        await queryClient.invalidateQueries(['/factory-settle/paging']);
        closeModal(modalType.type);
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: (err): void => {
      console.error(err);
      toastError('등록 중 오류가 발생하였습니다.');
    },
  });

  /** 생산처 품목 단가DC 업데이트  */
  const { mutate: upsertFactorySpcMutate } = useMutation(upsertFactorySpc, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setConfirmModal(false);
        transRefetch();
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
      field: 'inOutType',
      headerName: '유형',
      minWidth: 70,
      maxWidth: 70,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value.includes('일반') ? params.value.replace('일반', '') : params.value;
      },
    },
    {
      field: 'skuNm',
      headerName: '상품명',
      maxWidth: 180,
      minWidth: 160,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
    },
    {
      field: 'unitPrice',
      headerName: '단가',
      maxWidth: 100,
      minWidth: 80,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'inOutCnt',
      headerName: '수량',
      maxWidth: 50,
      minWidth: 50,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'totAmt',
      headerName: '금액',
      maxWidth: 120,
      minWidth: 100,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      valueFormatter: (params) => {
        return params.value && Utils.setComma(params.value);
      },
    },
    {
      field: 'asnDcAmt',
      headerName: '단가DC',
      maxWidth: 90,
      minWidth: 90,
      cellStyle: GridSetting.CellStyle.CENTER,
      suppressHeaderMenuButton: true,
      editable: true,
      cellClass: 'editCell',
      onCellValueChanged: (params) => {
        console.log('단가 Params >>', params);
        // if (params.newValue === params.oldValue) return; // 값이 변경되지 않았다면 실행하지 않음

        if (isNaN(params.newValue)) {
          toastError('0 이상의 숫자만 입력가능해요.');
          params.node?.setDataValue('asnDcAmt', params.oldValue); // 잘못된 값이면 원래 값으로 되돌리기
          return;
        }

        console.log('단가, 금액변경 >>', {
          단가: params.data.gagongAmt - params.newValue,
          금액: (params.data.gagongAmt - params.newValue) * params.data.inOutCnt,
        });

        params.node?.setDataValue('unitPrice', params.data.gagongAmt - params.newValue); // 단가
        params.node?.setDataValue('totAmt', params.data.inOutCnt > 0 ? (params.data.gagongAmt - params.newValue) * params.data.inOutCnt : 0);
        // params.node?.setDataValue('asnDcAmt', params.newValue);

        // 사용자가 직접 입력한 경우에만 단가DC 저장 실행
        if (!params.data._isAutoSet) {
          if (params.newValue !== params.data.orgAsnDcAmt) {
            setConfirmModal(true);
          }
        }

        params.data._isAutoSet = false; // 이후 값이 변경되었음을 표시
      },
      valueFormatter: (params) => {
        if (!params.data.asnDcAmt && params.data.factorySpcDcAmt) {
          // 기존 적용된 단가DC가 없을때 생산처단가DC테이블에서 가져온다.
          if (!params.data._isAutoSet) {
            // 자동 설정된 값이 아니라면
            params.node?.setDataValue('asnDcAmt', params.data.factorySpcDcAmt);
            params.data._isAutoSet = true; // 자동 설정된 값임을 표시
          }
          return params.data.factorySpcDcAmt;
        }
        return params.data.asnDcAmt;
      },
    },
  ];

  // 화살표 키 동작을 활성화시키는 영역
  const handleArrowKey = (event: KeyboardEvent) => {
    const activeElement = document.activeElement;
    const inputElements = ['INPUT', 'TEXTAREA', 'SELECT'];

    // 현재active 된것들이 input 등이 아닌경우 에만 화살표 키가 먹는다.
    if (event.key === 'F10') {
      buttonOkRef.current?.click();
    } else if (!inputElements.includes(activeElement?.tagName || '')) {
      if (event.key === 'ArrowLeft') {
        buttonOkRef.current?.focus();
      }
      if (event.key === 'ArrowRight') {
        buttonCancelRef.current?.focus();
      }
    }
  };

  /** 단가DC 업데이트 저장 */
  const handleDanDcUpdateConfirm = async () => {
    const gridApi = gridRef.current?.api;
    const focusedCell = gridApi?.getFocusedCell();
    const rowNode = gridApi?.getDisplayedRowAtIndex(focusedCell?.rowIndex as number);

    if (rowNode) {
      const rowData = rowNode.data;
      // 단가DC가 변경된 것만 저장한다.
      if (!rowData.factoryId || !rowData.prodId || isNaN(rowData.asnDcAmt)) {
        toastError('저장할 내용이 없어 다시 확인후 이용해주세요');
      }

      const params: ReceivingHistoryRequestFactorySpc = {
        factoryId: rowData.factoryId,
        prodId: rowData.prodId,
        updDcAmt: rowData.asnDcAmt, // 단가DC
      };
      console.log('단가DC저장 params >>', params);
      upsertFactorySpcMutate(params);
    } else {
      toastError('선택된 항목이 없어 단가DC 저장을 못했어요.');
    }
  };

  /** 결제정보 저장 이벤트 핸들러 */
  const onValid: SubmitHandler<SettleState> = (formData) => {
    if (!formData || !settleData) {
      toastError('결제 생성과 관련된 정보를 찾을 수 없습니다.');
    }
    try {
      // 비고내용 업데이트
      formData.etcCntn = selectedValues.etcCntn;
      formData.etcPrintYn = formData.etcPrintYn ?? 'N';

      const dcAmtInp: string | number = formData.settleDcAmt || '';
      let settleDcAmt = 0;
      if (dcAmtInp) {
        if (typeof dcAmtInp !== 'number') {
          const parsedAmount = parseFloat(dcAmtInp.replace(/,/g, ''));
          if (isNaN(parsedAmount)) {
            setValue('settleDcAmt', 0);
            dcInpRef.current?.focus();
            toastError('할인금액은 숫자만 입력가능해요.');
            throw new Error('할인금액은 숫자만 입력가능해요.'); // 에러 발생 시 처리 중단
          }
          settleDcAmt = Number(Utils.removeComma(parsedAmount.toString()));
        } else {
          settleDcAmt = dcAmtInp;
        }
      }

      const updateDcAmtRequest = {
        ...settleData,
        ...formData,
        settleDcAmt: settleDcAmt,
      };

      console.log('저장: ', { 폼데이타: { formData }, loadState: { settleData }, 전송데이타: { updateDcAmtRequest } });

      // return;
      if (!isClickedSaveRef.current) {
        isClickedSaveRef.current = true; // 이중클릭 방지용

        modifyTransDcAmtMutate(updateDcAmtRequest); // 수정 처리

        closeModal(modalType.type);
        setTimeout(() => {
          isClickedSaveRef.current = false;
        }, 5000);
      } else {
        toastInfo('중복저장 방지를 위해 5초 후 사용 가능해요.');
      }
    } catch (error) {
      console.error('에러 발생:', error);
    }
  };

  /** 거래내역 저장 이벤트 핸들러 */
  const handleDcAmtSave = async () => {
    const gridApi = gridRef.current?.api;
    gridApi?.stopEditing(); // 입력도중 저장을 눌렀을때 입력을 마무리 한다

    const paramsArray: ReceivingHistoryRequestDcAmtUpdate[] = [];
    gridApi?.forEachNode((node) => {
      // 기존단가DC가 변경된 것만 저장한다.
      // console.log(node.data.settleId, node.data.orgAsnDcAmt, node.data.asnDcAmt);
      if (node.data && node.data.orgAsnDcAmt !== node.data.asnDcAmt) {
        paramsArray.push({
          settleId: node.data.transId,
          updDcAmt: node.data.asnDcAmt,
        });
      }
    });
    console.log('저장 params >>', paramsArray);
    if (paramsArray.length > 0) {
      updateDcAmtMutate(paramsArray);
    } else {
      toastError('단가DC가 수정된 내역이 없어요.');
    }
  };

  /** 탭 관련 */
  const [activeTabKey, setActiveTabKey] = useState<string>('1');
  const onChange = (key: string) => {
    setActiveTabKey(key);
  };
  const items: TabsProps['items'] = [
    { key: '1', label: '결제정보' },
    { key: '2', label: '거래내역' },
  ];

  /** 비고 관련 */
  const [selectMyPartner, updatePartnerAll] = usePartnerStore((s) => [s.selectMyPartner, s.updatePartnerAll]);
  const [textAreaValues, setTextAreaValues] = useState<{
    facsettleEtcCntn: string;
  }>({
    facsettleEtcCntn: '',
  });
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({
    etcCntn: '',
  });
  /** 화주(비고) 수정하기 */
  const { mutate: updatePartnerEtcInfoMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setEtcInfo();
      } else {
        toastError(e.data.resultMessage);
      }
    },
    onError: async (e: any) => {
      toastError(e.data.resultMessage);
    },
  });

  /** 비고정보 호출 및 설정 */
  const setEtcInfo = async () => {
    const { data: partnerData } = await selectMyPartner();
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      if (body) {
        const infoData = (body as any).facsettleEtcCntn || '';
        setTextAreaValues((prev) => ({ ...prev, ['facsettleEtcCntn']: infoData }));
      }
    } else {
      toastError(resultMessage);
    }
  };

  // 비고스위치
  const [isCheck, setIsCheck] = useState<boolean>(getValues('etcPrintYn') === 'Y');
  const etcCntnSwichChange = (value: boolean) => {
    setValue('etcPrintYn', value ? 'Y' : 'N');
    setIsCheck(value);
  };

  return (
    <PopupLayout
      width={700}
      isEscClose={false}
      open={modalType.type === 'SETTLE_DETAIL' && modalType.active}
      title={'거래내역'}
      onClose={() => {
        closeModal('SETTLE_DETAIL');
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
                ref={buttonOkRef}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="단축키는 (F10)입니다."
                data-tooltip-place="top-end"
                onClick={activeTabKey === '1' ? handleSubmit(onValid) : handleDcAmtSave}
              >
                저장
              </button>

              <button
                className="btn"
                title="닫기"
                ref={buttonCancelRef}
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
        <Tabs defaultActiveKey={activeTabKey} items={items} onChange={onChange} className={'antTabBox'} />
        {/*결제정보*/}
        {activeTabKey === '1' ? (
          <div className={'paymentBox pay mt10'}>
            <div className="paymentDiv factorySettle">
              <dl>
                <dt>{settleData?.inOutType === '입고' ? '입고' : '반출'}일자</dt>
                <dd>
                  <span>{settleData?.workYmd}</span>
                </dd>
              </dl>

              <dl>
                <dt className="balance">당일합계</dt>
                <dd>
                  <span>{Utils.setComma(settleData?.todayTotAmt ?? 0)}원</span>
                </dd>
              </dl>
            </div>
            <div className="paymentDiv factorySettle">
              <dl>
                <dt>{settleData?.inOutType === '입고' ? '입고' : '반출'}금액</dt>
                <dd className="txt">
                  <span>
                    <strong>{getValues('inOutAmt')}</strong>
                    <span>원</span>
                  </span>
                </dd>

                <dt>할인금액</dt>
                <dd>
                  <span>
                    <FormInput<SettleState>
                      type="text"
                      control={control}
                      name={'settleDcAmt'}
                      inputType={'number'}
                      placeholder={''}
                      onChange={(e) => {
                        const inputValue = Number(Utils.removeComma(e.target.value));
                        const parsedValue = Number.isNaN(inputValue) ? 0 : inputValue;
                        // 당일합계 계산
                        setSettleData((prevState) => ({
                          ...prevState,
                          todayTotAmt: Number(Utils.removeComma((getValues('inOutAmt') || 0).toString())) - parsedValue,
                        }));
                      }}
                      allowClear={false}
                      price={true}
                      ref={dcInpRef}
                    />
                    <span>원</span>
                  </span>
                </dd>
              </dl>
            </div>

            <div className="paymentDiv etc">
              <div className="etcBox">
                <Switch onChange={etcCntnSwichChange} checkedChildren="비고" unCheckedChildren="비고" className="paySwitch" checked={isCheck} />
                <CustomDebounceSelect
                  type={'single'}
                  defaultValue={getValues('etcCntn')}
                  fetchOptions={textAreaValues.facsettleEtcCntn}
                  onChange={(value) => setSelectedValues({ ['etcCntn']: value })}
                  onEditItem={(item) => {
                    updatePartnerEtcInfoMutate({ ['facsettleEtcCntn']: item });
                  }}
                  onSearchChange={(newSearchValue: any) => {
                    setSelectedValues((prevSelectedValues) => ({
                      ...prevSelectedValues,
                      etcCntn: newSearchValue,
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          /*거래내역*/
          <div className="gridBox pop">
            <TunedGrid<FactorySettleResponseTrans>
              ref={gridRef}
              rowData={transData ?? []}
              columnDefs={columnDefs}
              loadingOverlayComponent={CustomGridLoading}
              noRowsOverlayComponent={CustomNoRowsOverlay}
              preventPersonalizedColumnSetting={true}
              className={'factorySettleDetailPop'}
            />
          </div>
        )}
      </PopupContent>
      <ConfirmModal
        title={`해당 제품에 대한 일괄 할인을 적용하시겠습니까?`}
        open={confirmModal}
        onConfirm={handleDanDcUpdateConfirm}
        onClose={() => setConfirmModal(false)}
      />
    </PopupLayout>
  );
};

export default FactorySettleDetailPop;
