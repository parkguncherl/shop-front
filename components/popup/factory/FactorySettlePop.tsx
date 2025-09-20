/**
 * 생산처 정산 결제 Modal Popup
 */
import { PopupLayout } from '../PopupLayout';
import { useFactorySettleStore } from '../../../stores/useFactorySettleStore';
import { Tooltip } from 'react-tooltip';
import { toastError, toastInfo, toastSuccess } from '../../ToastMessage';
import { PopupFooter } from '../PopupFooter';
import React, { useEffect, useRef, useState } from 'react';
import FormDatePicker from '../../FormDatePicker';
import { Utils } from '../../../libs/utils';
import FormInput from '../../FormInput';
import { InputRef, Switch } from 'antd';
import { PopupContent } from '../PopupContent';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FactorySettleResponsePaging } from '../../../generated';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../libs';
import { Placeholder } from '../../../libs/const';
import Loading from '../../Loading';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import CustomNewDatePicker from '../../CustomNewDatePicker';

interface Props {
  factoryId: number;
  selectSettleData?: FactorySettleResponsePaging; // 수정할 결제정보
}

interface FactorySettleRequestState {
  factoryId: number;
  workYmd: string;
  tranYmd: string;
  currentBalance: number;
  beforeBalance: number;
  balance: number;
  cashAmt: number | string;
  accountAmt: number | string;
  dcAmt: number | string;
  etcCntn?: string;
  etcPrintYn?: string;
  tranId?: number;
}

interface SettleState {
  currentBalance: number;
  currentBalanceMsg: string;
  balance: number;
  isPosibleSave: boolean;
  tranId?: number;
}

export const FactorySettlePop = ({ factoryId: propFactoryId, selectSettleData: propSettleData }: Props) => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');

  const [settleState, setSettleState] = useState<SettleState>({
    currentBalance: 0, // 예정금액 (현잔액)
    currentBalanceMsg: '', // 예정금액 조회 전달메세지
    balance: 0, //잔액
    isPosibleSave: false, // 저장가능
  });

  const [modalType, closeModal, insertFactorySettle, updateFactorySettle] = useFactorySettleStore((s) => [
    s.modalType,
    s.closeModal,
    s.insertFactorySettle,
    s.updateFactorySettle,
  ]);
  const buttonOkRef = useRef<HTMLButtonElement>(null);
  const buttonCancelRef = useRef<HTMLButtonElement>(null);
  const isClickedSaveRef = useRef<boolean>(false);
  const cashInpRef = useRef<InputRef>(null);
  const accountInpRef = useRef<InputRef>(null);
  const dcInpRef = useRef<InputRef>(null);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    // clearErrors,
    setValue,
    getValues,
    // watch,
  } = useForm<FactorySettleRequestState>({
    defaultValues: {
      cashAmt: propSettleData?.cashPayAmt ? Utils.setComma(propSettleData.cashPayAmt) : 0,
      accountAmt: propSettleData?.accountPayAmt ? Utils.setComma(propSettleData.accountPayAmt) : 0,
      dcAmt: propSettleData?.settleDcAmt ? Utils.setComma(propSettleData?.settleDcAmt) : 0,
      etcCntn: propSettleData?.etcCntn ?? '',
      etcPrintYn: propSettleData?.etcPrintYn ?? '',
    },
    mode: 'onSubmit',
  });

  /** 초기 렌더링 */
  // 버튼이벤트 리스너 설정
  useEffect(() => {
    console.log('최초 useEffect!!');
    if (!propFactoryId) {
      toastError('결제거래 추가를 위해 먼저 생산처를 선택 후 이용해주세요.');
      closeModal(modalType.type);
      return;
    }

    if (modalType.type === 'PAYMENT_UPDATE' && !propSettleData) {
      toastError('결제거래 수정을 위해 먼저 해당 결제를 선택 후 이용해주세요.');
      closeModal(modalType.type);
      return;
    }

    if (modalType.type === 'PAYMENT_UPDATE' && propSettleData) {
      console.log('결제거래수정 Props >>', propSettleData);
      setSettleState({
        currentBalance: propSettleData.beforeBalance ?? 0, // 수정시 예정금액은 전잔이다.
        currentBalanceMsg: '지난 결제거래의 예정금액이에요.',
        balance: propSettleData.currentBalance ?? 0, // 수정시 잔액은 현잔이다.
        isPosibleSave: true,
        tranId: propSettleData.tranId,
      });

      setValue('tranYmd', dayjs(propSettleData.tranYmd).format('YYYY-MM-DD'));
      setValue('workYmd', dayjs(propSettleData.workYmd).format('YYYY-MM-DD'));
      setSelectedValues({ ['etcCntn']: getValues('etcCntn') });
    }

    //등록시 최근거래장부일 가져오기
    if (modalType.type === 'PAYMENT_CREATE') {
      fetchLastTranDate(propFactoryId).then((response) => {
        const { resultCode, body, resultMessage } = response.data;
        if (resultCode === 200 && body) {
          console.log('최근거래장부일 조회 >>', body.lastTranDate);
          // 지급일자, 대상기간에 최근 거래일자를 셋팅한다.
          setValue('tranYmd', dayjs(body.lastTranDate).format('YYYY-MM-DD'));
          setValue('workYmd', dayjs(body.lastTranDate).format('YYYY-MM-DD'));

          // 최근거래일기준의 예정금액을 조회한다.
          fetchCurrentBalance(propFactoryId, body.lastTranDate);
        } else {
          setValue('tranYmd', today);
          setValue('workYmd', today);
        }
      });
    }

    setEtcInfo(); // 비고 텍스트데이터

    // 이벤트 리스너 추가
    window.addEventListener('keydown', handleArrowKey);
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('keydown', handleArrowKey);
    };
  }, [propFactoryId, propSettleData]);

  /* 대상기간 변경시 예정금액 조회하기  */
  const handleWorkYmdChange = (watchWorkYmd: Date) => {
    if (watchWorkYmd && modalType.type === 'PAYMENT_CREATE') {
      if (dayjs(new Date()).isBefore(watchWorkYmd)) {
        setSettleState((prevState) => ({
          ...prevState,
          currentBalance: 0,
          currentBalanceMsg: '영업일 이전으로 대상기간을 다시 선택해주세요.',
          isPosibleSave: false,
        }));
        return;
      }

      const updatedWorkYmd = dayjs(watchWorkYmd).format('YYYY-MM-DD');
      setSettleState((prevState) => ({
        ...prevState,
        currentBalance: 0,
        currentBalanceMsg: '',
        isPosibleSave: true,
      }));

      // 예정금액 조회
      fetchCurrentBalance(propFactoryId, updatedWorkYmd);
    }
  };

  /** 예정금액 조회 */
  const fetchCurrentBalance = async (factoryId: number, workYmd: string) => {
    const response = await authApi.get('/factory-settle/currentBalance', {
      params: {
        factoryId,
        workYmd,
      },
    });

    const { resultCode, body, resultMessage } = response.data;
    if (resultCode === 200) {
      if (body) {
        console.log('예정거래가격 가져옴 >>', body);
        setSettleState((prevState) => ({
          ...prevState,
          currentBalance: body.currentBalance,
          currentBalanceMsg: '대상기간에 예정금액이에요.',
        }));
      } else {
        setSettleState((prevState) => ({
          ...prevState,
          currentBalance: 0,
          currentBalanceMsg: '대상기간에 거래내역이 없어요.',
        }));
      }
    } else {
      setSettleState((prevState) => ({
        ...prevState,
        currentBalance: 0,
        currentBalanceMsg: '대상기간 조회 오류가 발생했어요. 관리자에게 문의해주세요.',
        isPosibleSave: true,
      }));
      toastError(resultMessage);
    }
  };

  /** 최근 거래장부일자 가져오기 */
  const fetchLastTranDate = (factoryId: number) => authApi.get('/factory-settle/lastTranDate/' + factoryId);

  /** 결제거래 등록 */
  const queryClient = useQueryClient();
  const { mutate: createFactorySettle, isLoading: isCreateLoading } = useMutation(insertFactorySettle, {
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

  /** 결제거래 수정 */
  const { mutate: updateFactorySettleMutate, isLoading: isUpdateLoading } = useMutation(updateFactorySettle, {
    onSuccess: async (e) => {
      try {
        const { resultCode, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('수정되었어요.');
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

  /** 저장 이벤트 핸들러 */
  const onValid: SubmitHandler<FactorySettleRequestState> = (formData) => {
    if (!propFactoryId) {
      toastError('결제거래 추가를 위해 먼저 생산처를 선택 후 이용해주세요.');
      closeModal(modalType.type);
      return;
    }

    if (!formData || !settleState) {
      toastError('결제 생성과 관련된 정보를 찾을 수 없습니다.');
      return;
    }

    // 입력 금액 파싱
    const parseAndValidateAmount = (
      amount: string | number | undefined,
      field: 'cashAmt' | 'accountAmt' | 'dcAmt',
      ref: React.RefObject<InputRef>,
      errorMessage: string,
    ): number => {
      if (amount) {
        if (typeof amount !== 'number') {
          const parsedAmount = parseFloat(amount.replace(/,/g, ''));
          if (isNaN(parsedAmount)) {
            setValue(field, 0);
            ref.current?.focus();
            toastError(errorMessage);
            throw new Error(errorMessage); // 에러 발생 시 처리 중단
          }
          return Number(Utils.removeComma(parsedAmount.toString()));
        }
        return amount;
      }
      return 0;
    };

    try {
      const factorySettleRequest = {
        ...formData,
        factoryId: propFactoryId,
        workYmd: dayjs(formData.workYmd).format('YYYY-MM-DD'),
        tranYmd: dayjs(formData.tranYmd).format('YYYY-MM-DD'),
        currentBalance: settleState.currentBalance,
        cashAmt: parseAndValidateAmount(formData.cashAmt, 'cashAmt', cashInpRef, '현금입금은 숫자만 입력가능해요'),
        accountAmt: parseAndValidateAmount(formData.accountAmt, 'accountAmt', accountInpRef, '통장입금은 숫자만 입력가능해요'),
        dcAmt: parseAndValidateAmount(formData.dcAmt, 'dcAmt', dcInpRef, '할인금액은 숫자만 입력가능해요'),
        etcCntn: selectedValues?.etcCntn,
      };

      console.log('결제저장', { 결제저장데이타: { formData, settleState }, 등록전송데이타: { factorySettleRequest } });

      /*return;*/
      if (!isClickedSaveRef.current) {
        isClickedSaveRef.current = true; // 이중클릭 방지용

        if (modalType.type === 'PAYMENT_CREATE') {
          /* 결제등록 */
          createFactorySettle(factorySettleRequest);
        } else {
          /* 결제수정 */
          if (settleState.tranId) {
            factorySettleRequest.tranId = settleState.tranId; // 결제 아이디
            factorySettleRequest.beforeBalance = propSettleData?.beforeBalance ?? 0; // 전 잔액
            updateFactorySettleMutate(factorySettleRequest);
          } else {
            toastError('결제할 항목정보가 없어 수정하지 못했어요.\n결제수정할 항목을 선택후 이용해주세요');
          }
        }

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

  if (isCreateLoading || isUpdateLoading) {
    console.log('loading!!');
    return <Loading />;
  }

  return (
    <PopupLayout
      width={600}
      open={true}
      isEscClose={false}
      title={modalType.type === 'PAYMENT_CREATE' ? '생산처 지급하기' : '생산처 지급수정'}
      onClose={() => closeModal(modalType.type)}
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
                onClick={handleSubmit(onValid)}
                disabled={!settleState.isPosibleSave}
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
        <div className={'paymentBox pay'}>
          <div className="paymentDiv pay">
            <ul>
              <li>
                <dl>
                  <dt>지급일자</dt>
                  <dd>
                    <span>
                      {/*<FormDatePicker<FactorySettleRequestState> control={control} name={'tranYmd'} />*/}
                      <CustomNewDatePicker
                        name={'tranYmd'}
                        type={'date'}
                        value={getValues('tranYmd')}
                        onChange={(name, value) => {
                          setValue(name, value);
                        }}
                      />
                    </span>
                  </dd>
                </dl>
              </li>
              <li>
                <dl>
                  <dt>대상기간</dt>
                  <dd>
                    <span>
                      {/*<FormDatePicker<FactorySettleRequestState>*/}
                      {/*  control={control}*/}
                      {/*  name={'workYmd'}*/}
                      {/*  disabled={modalType.type === 'PAYMENT_UPDATE'}*/}
                      {/*  onPropsChange={(e) => handleWorkYmdChange(e.target.value)}*/}
                      {/*/>*/}
                      <CustomNewDatePicker
                        name={'workYmd'}
                        type={'date'}
                        value={getValues('tranYmd')}
                        disabled={modalType.type === 'PAYMENT_UPDATE'}
                        onChange={(name, value) => {
                          handleWorkYmdChange(new Date(value));
                        }}
                      />
                    </span>
                  </dd>
                </dl>
              </li>
            </ul>

            <dl>
              <dt className="balance">예정금액</dt>
              <dd>
                <span>{Utils.setComma(settleState.currentBalance ?? 0)}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv">
            <dl>
              <dt>현금지급</dt>
              <dd>
                <span>
                  <FormInput<FactorySettleRequestState>
                    type="text"
                    control={control}
                    name={'cashAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={cashInpRef}
                    onChange={(e) => {
                      const inputValue = Number(Utils.removeComma(e.target.value));
                      const parsedValue = Number.isNaN(inputValue) ? 0 : inputValue;
                      // 잔액계산
                      setSettleState((prevState) => ({
                        ...prevState,
                        balance:
                          prevState.currentBalance -
                          (parsedValue +
                            Number(Utils.removeComma((getValues('accountAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('dcAmt') || 0).toString()))),
                      }));
                    }}
                    allowClear={false}
                    price={true}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt>통장지급</dt>
              <dd>
                <span>
                  <FormInput<FactorySettleRequestState>
                    type="text"
                    control={control}
                    name={'accountAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={accountInpRef}
                    onChange={(e) => {
                      const inputValue = Number(Utils.removeComma(e.target.value));
                      const parsedValue = Number.isNaN(inputValue) ? 0 : inputValue;
                      setSettleState((prevState) => ({
                        ...prevState,
                        balance:
                          prevState.currentBalance -
                          (parsedValue +
                            Number(Utils.removeComma((getValues('cashAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('dcAmt') || 0).toString()))),
                      }));
                    }}
                    allowClear={false}
                    price={true}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt>할인금액</dt>
              <dd>
                <span>
                  <FormInput<FactorySettleRequestState>
                    type="text"
                    control={control}
                    name={'dcAmt'}
                    inputType={'number'}
                    placeholder={''}
                    allowClear={false}
                    price={true}
                    ref={dcInpRef}
                    onChange={(e) => {
                      const inputValue = Number(Utils.removeComma(e.target.value));
                      const parsedValue = Number.isNaN(inputValue) ? 0 : inputValue;
                      setSettleState((prevState) => ({
                        ...prevState,
                        balance:
                          prevState.currentBalance -
                          (parsedValue +
                            Number(Utils.removeComma((getValues('cashAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('accountAmt') || 0).toString()))),
                      }));
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>

              <dt className="balance">지급잔액</dt>
              <dd>
                <span>{Utils.setComma(settleState.balance)}원</span>
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
      </PopupContent>
    </PopupLayout>
  );
};
