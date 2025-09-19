import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { PopupContent } from '../PopupContent';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { useOrderStore } from '../../../stores/useOrderStore';
import FormInput from '../../FormInput';
import { FieldError, useForm } from 'react-hook-form';
import {
  Order,
  OrderDetCreate,
  OrderRequestUpdateInfo,
  PayRequestCreate,
  PayRequestUpdate,
  RetailResponseDetail,
  RetailResponsePaging,
} from '../../../generated';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { CheckboxRef, InputRef, Switch } from 'antd';
import { Utils } from '../../../libs/utils';
import { PartnerDropDown } from '../../PartnerDropDown';
import { BaseSelectRef } from 'rc-select';
import { usePartnerStore } from '../../../stores/usePartnerStore';
import { usePaymentStore } from '../../../stores/usePaymentStore';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import { useCommonStore } from '../../../stores';
import { ProductStatus } from '../../../libs/const';
import CustomCheckBox from '../../CustomCheckBox';
import { Tooltip } from 'react-tooltip';
import { OrderRequestCreateInfo } from '../../../generated';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import CustomDebounceSelect from '../../CustomDebounceSelect';
import TunedButtonAtom, { TunedButtonAtomRefInterface } from '../../atom/TunedButtonAtom';

interface ForControlledForm {
  payRequest: PayRequestCreate | PayRequestUpdate;
  order: Order;
}

interface Props {
  OrderPrint?: (id: any) => Promise<void>;
  setPrintType?: Dispatch<SetStateAction<string>>;
  onRequestSuccess?: (type: 'create' | 'update') => void;
  preventDefaultBehavior?: boolean;
}

/**
 * 주문결제 팝업
 * 본 함수는 orderReg 영역에서만 사용될 것이라는 전제하에 작성됨
 * */
export const OrderPaymentPop = ({ OrderPrint, setPrintType, onRequestSuccess, preventDefaultBehavior }: Props) => {
  const session = useSession();
  const today = session.data?.user?.workYmd ? dayjs(session.data?.user?.workYmd).format('YYYY-MM-DD') : dayjs(new Date()).format('YYYY-MM-DD');
  const queryClient = useQueryClient();

  const [inThisSum, setInThisSum] = useState<string>('0'); // 해당합계 값을 표시하는 용도 한정
  const [balance, setBalance] = useState(0); // 잔액 값을 표시하는 용도 한정
  //const [etcPrnYn, setEtcPrnYn] = useState<'Y' | 'N'>('N');

  const [errorMessageList, setErrorMessageList] = useState<{ name: string; message: string }[]>([]);

  const cashInp = useRef<InputRef>(null);
  const accountInp = useRef<InputRef>(null);
  const discountInfo = useRef<InputRef>(null);
  const sendingFee = useRef<InputRef>(null);
  const partnerDropDownRef = useRef<BaseSelectRef>(null);
  const vatInp = useRef<CheckboxRef>(null);

  const f5Count = useRef<number>(0);
  const f6Count = useRef<number>(0);
  const buttonOkRef = useRef<TunedButtonAtomRefInterface>(null);
  const buttonCancelRef = useRef<HTMLButtonElement>(null);
  const boryuButtonRef = useRef<HTMLButtonElement>(null);

  /** 공통 스토어 - State */
  const [selectedRetail, setSelectedRetail, removeEmptyRows] = useCommonStore((s) => [s.selectedRetail, s.setSelectedRetail, s.removeEmptyRows]);

  /** 주문관리 스토어 - State */
  const [modalType, closeModal, insertOrderInfo, updateOrderInfo, orderDetList, setOrderDetList, order, setOrder, productState, setProductState] =
    useOrderStore((s) => [
      s.modalType,
      s.closeModal,
      s.insertOrderInfo,
      s.updateOrderInfo,
      s.orderDetList,
      s.setOrderDetList,
      s.order,
      s.setOrder,
      s.productState,
      s.setProductState,
    ]);

  /** 데이터 불러오기 */
  const [selectMyPartner, updatePartnerAll] = usePartnerStore((s) => [s.selectMyPartner, s.updatePartnerAll]);

  const { handleSubmit, control, setValue, getValues } = useForm<ForControlledForm>({
    defaultValues: {
      payRequest: {
        cashAmt: 0,
        accountAmt: 0,
        discountAmt: 0,
        tranYmd: today,
        workYmd: today,
      },
      order: {
        // 본 두개는 입력 영역에서 별도 입력이 필요하므로 다음과 같이 명시적 선언, 이외의 order 정보는 전역 상태에 의지
        logisAmt: 0,
        logisCd: undefined,
      },
    },
    resolver: yupResolver(YupSchema.OrderCreateOrUpdateRequest()), // 완료
    mode: 'onSubmit',
  });

  /** 결제정보 전역상태 */
  const [paymentInfo, setPaymentInfo] = usePaymentStore((s) => [s.paymentInfo, s.setPaymentInfo]);

  const doInitializingProcess = useCallback(async () => {
    setOrderDetList([{}]);
    setOrder({ bundleYn: 'N', orderCd: '9' });
    setSelectedRetail(undefined);
    setPaymentInfo({});
    setProductState(ProductStatus.sell); // orderReg 영역 라디오버튼 선택 상태를 order 상태에 맞춤
    setValue('order.logisAmt', 0);
    setValue('order.logisCd', '');

    await queryClient.invalidateQueries(['/orderInfo/today/paging']); // 금일내역 쿼리 무효화(refetch)
    await queryClient.invalidateQueries(['/order']); // Order 페이지(보류) 쿼리 무효화
  }, [queryClient, setOrder, setOrderDetList, setPaymentInfo, setProductState, setSelectedRetail]);

  const commonBehaviorOnFailure = useCallback(() => {
    // 실패할 시 '저장' 버튼 재활성화
    buttonOkRef.current?.enableClickBehavior();
  }, []);

  /** 주문 등록(create) */
  const { mutate: postOrderRequest, isLoading: postOrderRequestIsInLoading } = useMutation(insertOrderInfo, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if (body && body.id && OrderPrint && setPrintType) {
          // 전표인쇄
          OrderPrint(body.id);
          setPrintType('orderDefault');
        }
        if (!preventDefaultBehavior) {
          /** 별도 억제 설정 부재할 시 기본 동작(토스트, 상태 초기화 등) */
          toastSuccess('저장되었습니다.');
          await doInitializingProcess(); // 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화
          closeModal(modalType.type);
        }
        if (onRequestSuccess) {
          onRequestSuccess('create');
        }
      } else {
        toastError(resultMessage || '주문 등록 과정에서 문제가 발생하였습니다.');
        commonBehaviorOnFailure();
      }
    },
  });

  /** 주문 수정(update) */
  const { mutate: patchOrderRequest, isLoading: patchOrderRequestIsInLoading } = useMutation(updateOrderInfo, {
    onSuccess: async (e: any) => {
      const { resultCode, body, resultMessage } = e.data;
      if (resultCode === 200) {
        if (body && body.id && OrderPrint && setPrintType) {
          // 전표인쇄
          OrderPrint(body.id);
          setPrintType('orderDefault');
        }
        if (!preventDefaultBehavior) {
          /** 별도 억제 설정 부재할 시 기본 동작(토스트, 상태 초기화 등) */
          toastSuccess('주문수정 되었습니다.');
          await doInitializingProcess(); // 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화
          closeModal(modalType.type);
        }
        if (onRequestSuccess) {
          onRequestSuccess('update');
        }
      } else {
        toastError(resultMessage || '주문 수정 과정에서 문제가 발생하였습니다.');
        commonBehaviorOnFailure();
      }
    },
  });

  /**
   * 신규 주문 생성
   * order 전역상태와 data.order 값이 같은 필드 내에서 다른 값을 가질 시 data.order 가 우선
   **/
  const onValidForCreate = useCallback(
    (
      data: ForControlledForm,
      //etcPrnYn: 'Y' | 'N',
      inThisSum: string,
      order: Order,
      orderDetList: OrderDetCreate[],
      selectedRetail: RetailResponseDetail | undefined,
    ) => {
      /*if (order.holdYn == 'Y') {
        toastError('이미 보류처리가 완료된 주문입니다.');
        return;
      }*/

      if (selectedRetail) {
        const vatInput = vatInp.current as CheckboxRef;
        const SelectedSellerId = Number(selectedRetail.id);
        const orderRequestCreateInfo: OrderRequestCreateInfo = {
          orderDetList: removeEmptyRows(orderDetList, 'skuNm') /** 주문상세(orderDet) 정보 설정 */,
        }; // 주문 생성

        if (!order.sellerId) {
          order = { ...order, sellerId: SelectedSellerId };
        }

        console.log('data.order ==>', data.order);
        console.log('order ==>', order);

        const orderRequestCrate: Order = { ...data.order, ...order }; // 주문 (data.order 는 본 영역에서 입력을 통해 얻어야 하는 정보를 대상으로 제한적 사용, 나머지는 order 전역 상태로 덮어씀)
        const payRequestCreate: PayRequestCreate = { ...data.payRequest }; // 결제

        if (!isNaN(SelectedSellerId)) {
          /** 주문(order) 정보 설정 */
          vatInput.input?.checked ? (orderRequestCrate.vatYn = 'Y') : (orderRequestCrate.vatYn = 'N'); /** 부가세 */
          orderRequestCrate.logisAmt = Number(Utils.removeComma(orderRequestCrate.logisAmt?.toString() || '0'));

          if (orderRequestCrate.logisAmt != 0 && orderRequestCrate.logisCd == undefined) {
            // 물류비가 0이 아닐 시 물류코드가 정의되어 있어야
            toastError('물류비 구분을 정의하십시요');
            return; // 정의되지 않았을 시 요청할 수 없음
          }
          //orderRequestCrate.etcPrintYn = etcPrnYn; order 전역 상태에 값을 설정하였으므로 본 코드 불필요
          orderRequestCreateInfo.orderRequestCreate = orderRequestCrate;

          /** 결제(pay) 정보 설정 */
          payRequestCreate.sellerId = SelectedSellerId;
          payRequestCreate.inoutCd = 'O';

          // 천단위 콤마 제거
          payRequestCreate.totAmt = Number(Utils.removeComma(inThisSum));
          payRequestCreate.accountAmt = Number(Utils.removeComma((payRequestCreate.accountAmt || 0).toString()));
          payRequestCreate.cashAmt = Number(Utils.removeComma((payRequestCreate.cashAmt || 0).toString()));
          payRequestCreate.discountAmt = Number(Utils.removeComma((payRequestCreate.discountAmt || 0).toString()));
          // payAmt 는 백앤드 영역에서 처리
          orderRequestCreateInfo.payRequestCreate = payRequestCreate;

          postOrderRequest(orderRequestCreateInfo);
        } else {
          console.error('invalid SellerId');
        }
      } else {
        toastError('소매처 입력 후 다시 시도하십시요.');
      }
    },
    [postOrderRequest, removeEmptyRows],
  );

  /**
   * 기존 주문 업데이트
   * order 전역상태와 data.order 값이 같은 필드 내에서 다른 값을 가질 시 data.order 가 우선
   **/
  const onValidForUpdate = useCallback(
    (
      data: ForControlledForm,
      //etcPrnYn: 'Y' | 'N',
      inThisSum: string,
      order: Order,
      orderDetList: OrderDetCreate[],
      selectedRetail: RetailResponseDetail | undefined,
    ) => {
      if (selectedRetail) {
        const vatInput = vatInp.current as CheckboxRef;
        const SelectedSellerId = Number(selectedRetail.id);

        const orderRequestUpdateInfo: OrderRequestUpdateInfo = {
          orderDetList: removeEmptyRows(orderDetList, 'skuNm') /** 주문상세(orderDet) 정보 설정 */,
        }; // 주문 수정

        const orderRequestUpdate: Order = { ...data.order, ...order }; // 주문 (data.order 는 본 영역에서 입력을 통해 얻어야 하는 정보를 대상으로 제한적 사용, 나머지는 order 전역 상태로 덮어씀)
        const payRequestUpdate: PayRequestUpdate = { ...data.payRequest }; // 결제

        if (!isNaN(SelectedSellerId)) {
          /** 주문(order) 정보 설정 */
          vatInput.input?.checked ? (orderRequestUpdate.vatYn = 'Y') : (orderRequestUpdate.vatYn = 'N'); /** 부가세 */

          if (order.payType != '3') {
            /** 영수(완) ("3") 이 아닌 경우 */
            if (Number(Utils.removeComma((getValues('payRequest.cashAmt') || 0).toString())) < Number(Utils.removeComma(inThisSum))) {
              /** 현금액이 해당합계금액 이하일 시 입금유형은 청구("1") */
              orderRequestUpdate.payType = '1';
            } else {
              /** 현금액이 해당합계금액 이상이나 영수완료 버튼이 체크되지 아니한 경우 입금유형은 영수("2") */
              orderRequestUpdate.payType = '2';
            }
          }
          orderRequestUpdate.logisAmt = Number(Utils.removeComma(orderRequestUpdate.logisAmt?.toString() || '0'));

          if (orderRequestUpdate.logisAmt != 0 && orderRequestUpdate.logisCd == undefined) {
            // 물류비가 0이 아닐 시 물류코드가 정의되어 있어야
            toastError('물류비 구분을 정의하십시요');
            return; // 정의되지 않았을 시 요청할 수 없음
          }
          //orderRequestUpdate.etcPrintYn = etcPrnYn; order 전역 상태에 값을 설정하였으므로 본 코드 불필요
          orderRequestUpdateInfo.orderRequestUpdate = orderRequestUpdate;

          /** 결제(pay) 정보 설정 */
          payRequestUpdate.sellerId = SelectedSellerId;
          payRequestUpdate.inoutCd = 'O';
          payRequestUpdate.totAmt = Number(Utils.removeComma(inThisSum));
          payRequestUpdate.accountAmt = Number(Utils.removeComma((payRequestUpdate.accountAmt as number).toString()));
          payRequestUpdate.cashAmt = Number(Utils.removeComma((payRequestUpdate.cashAmt as number).toString()));
          payRequestUpdate.discountAmt = Number(Utils.removeComma((payRequestUpdate.discountAmt as number).toString()));
          // payAmt 는 백앤드 영역에서 처리
          orderRequestUpdateInfo.payRequestUpdate = payRequestUpdate;

          patchOrderRequest(orderRequestUpdateInfo);
        } else {
          console.error('invalid SellerId');
        }
      } else {
        toastError('소매처 입력 후 다시 시도하십시요.');
      }
    },
    [getValues, patchOrderRequest, removeEmptyRows],
  );

  /** 비고 관련 */
  const [textAreaValues, setTextAreaValues] = useState<{
    orderEtc: string;
  }>({
    orderEtc: '',
  });

  /** 화주(비고) 수정하기 */
  const { mutate: updatePartnerAllMutate } = useMutation(updatePartnerAll, {
    onSuccess: async (e: any) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        setEtcInfo();
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  /** 비고정보 호출 및 설정 */
  const setEtcInfo = useCallback(async () => {
    const { data: partnerData } = await selectMyPartner();
    const { resultCode, body, resultMessage } = partnerData;
    if (resultCode === 200) {
      if (body) {
        const infoData = (body as any).etcAccCntn || '';
        setTextAreaValues((prev) => ({ ...prev, ['orderEtc']: infoData }));
      }
    } else {
      toastError(resultMessage);
    }
  }, [selectMyPartner]);

  const f5Change = useCallback(
    (balance: number, nowAmt: number | undefined, inThisSum: string) => {
      const cashAmt = Number(Utils.removeComma((getValues('payRequest.cashAmt') || 0).toString()));
      const accountAmt = Number(Utils.removeComma((getValues('payRequest.accountAmt') || 0).toString()));
      const discountAmt = Number(Utils.removeComma((getValues('payRequest.discountAmt') || 0).toString()));
      if (f5Count.current === 0) {
        setValue('payRequest.cashAmt', Utils.setComma(Number(Utils.removeComma(inThisSum)) - discountAmt));
        setValue('payRequest.accountAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance(nowAmt || 0); // 현잔(nowAmt)
      } else if (f5Count.current === 1) {
        setValue('payRequest.cashAmt', Utils.setComma(cashAmt + accountAmt + balance));
        setValue('payRequest.accountAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance(0); // 본 동작에 따른 청구금액의 변화(두번째 동작으로 이어짐)
      } else {
        setValue('payRequest.cashAmt', 0);
        setValue('payRequest.accountAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance((nowAmt || 0) + Number(Utils.removeComma(inThisSum)) - discountAmt); // 현잔 + 해당합계 - 할인금액
      }
      setTimeout(() => {
        cashInp.current?.select();
      }, 0);
    },
    [getValues, setValue],
  );

  const f6Change = useCallback(
    (balance: number, nowAmt: number | undefined, inThisSum: string) => {
      const cashAmt = Number(Utils.removeComma((getValues('payRequest.cashAmt') || 0).toString()));
      const accountAmt = Number(Utils.removeComma((getValues('payRequest.accountAmt') || 0).toString()));
      const discountAmt = Number(Utils.removeComma((getValues('payRequest.discountAmt') || 0).toString()));
      if (f6Count.current === 0) {
        setValue('payRequest.accountAmt', Utils.setComma(Number(Utils.removeComma(inThisSum)) - discountAmt));
        setValue('payRequest.cashAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance(nowAmt || 0); // 현잔(nowAmt)
      } else if (f6Count.current === 1) {
        setValue('payRequest.accountAmt', Utils.setComma(cashAmt + accountAmt + balance));
        setValue('payRequest.cashAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance(0); // 본 동작에 따른 청구금액의 변화(두번째 동작으로 이어짐)
      } else {
        setValue('payRequest.accountAmt', 0);
        setValue('payRequest.cashAmt', 0); // 통장에 있는 금액이 현금 영역에 더해졌으므로 0으로 처리
        setBalance((nowAmt || 0) + Number(Utils.removeComma(inThisSum)) - discountAmt); // 현잔 + 해당합계 - 할인금액
      }
      setTimeout(() => {
        accountInp.current?.select();
      }, 0);
    },
    [getValues, setValue],
  );

  /** 본 팝업 입력 영역 에러 목록을 관리하는 함수(PaymentPop 의 콜백과 코드를 상당 부분 공유) */
  const fieldErrorCallBack = useCallback(
    (error: FieldError | undefined, name: string, errorMessageList: { name: string; message: string }[]) => {
      if (error) {
        if (errorMessageList.filter((errorMessage) => errorMessage.name == name).length == 0) {
          // 입력 영역 에러 목록에 해당 에러가 존재하지 않는 경우
          setErrorMessageList((prevState) => {
            prevState.push({ name: name, message: error.message as string });
            return prevState;
          });
        }
        toastError(error.message);
      } else {
        setErrorMessageList((prevState) => prevState.filter((prev) => prev.name != name)); // 에러 목록에서 해당 에러 제거(필터링 값으로 업데이트)
      }
    },
    [setErrorMessageList],
  );

  /** 랜더링 후 즉시 실행할 동작들(modalType.active 값 변화에 의하여 트리거됨), 전역 상태를 의존 배열에 추가하지 말 것!(생성, 수정 요청시 전역 상태가 변할 가능성 존재 -> 의도치 않은 코드 실행 위험)  */
  useEffect(() => {
    if ((modalType.type === 'PAY_CREATE' || modalType.type === 'PAY_UPDATE' || modalType.type === 'BORYU_CREATE') && modalType.active) {
      setOrder({ ...order, totalRowCount: removeEmptyRows(orderDetList, 'skuNm').length });
      setEtcInfo(); // 비고정보 호출 및 설정

      let totalThisSum = 0; // 해당합계
      for (let i = 0; i < orderDetList.length; i++) {
        if (orderDetList[i].totAmt != undefined && orderDetList[i].skuId) {
          if (orderDetList[i].orderDetCd == '80') {
            // 미출은 수요를 예상하여 주문하는 단순 재고이므로 해당합계에 반영되지 않는다.
          } else if (orderDetList[i].orderDetCd == '40') {
            totalThisSum -= orderDetList[i].totAmt as number;
          } else {
            totalThisSum += orderDetList[i].totAmt as number;
          }
        }
      }
      // 당일합계는 없어짐
      setInThisSum(Utils.setComma(totalThisSum)); // 해당합계를 상태로서 set
      setBalance(
        (selectedRetail?.nowAmt || 0) +
          totalThisSum -
          ((paymentInfo?.cashAmt || totalThisSum) + (paymentInfo?.accountAmt || 0) + (paymentInfo?.discountAmt || 0)),
      ); // 전잔 + 당일합계 + 해당합계 - (현금(전역상태에 값이 부재할 경우 해당합계 값을 할당) + 통장입금)

      /** 요청 시 사용할 값을 react hook form 영역에 등록 */
      setValue('payRequest.payEtc', paymentInfo.payEtc);

      setValue('payRequest.etcPrintYn', paymentInfo.etcPrintYn);
      setOrder({ ...order, etcPrintYn: 'Y' });

      setValue('payRequest.discountAmt', Utils.setComma(Number(paymentInfo?.discountAmt || 0)));
      setValue('payRequest.cashAmt', Utils.setComma(Number(paymentInfo?.cashAmt || totalThisSum))); // 전역상태에 값이 부재할 경우 해당합계 값을 할당
      setValue('payRequest.accountAmt', Utils.setComma(Number(paymentInfo?.accountAmt || 0)));

      setValue('payRequest.workYmd', paymentInfo.workYmd);
      setValue('payRequest.tranYmd', paymentInfo.tranYmd);
      setValue('order.logisCd', order?.logisCd);
      setValue('order.logisAmt', order?.logisAmt);

      /** 부가세YN 값에 따라 랜더링 시 체크박스 체크 */
      const vatInput = vatInp.current as CheckboxRef;
      if ((selectedRetail as RetailResponsePaging).vatYn == 'Y') {
        if (vatInput && vatInput.input) {
          vatInput.input.checked = true;
        }
      } else if (order.vatYn == 'Y') {
        if (vatInput && vatInput.input) {
          vatInput.input.checked = true;
        }
      }

      /** 화살표 키 동작을 활성화시키는 영역 */
      const handleArrowKey = (event: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const inputElements = ['INPUT', 'TEXTAREA', 'SELECT'];
        // 현재active 된것들이 input 등이 아닌경우 에만 화살표 키가 먹는다.
        if (event.key === 'F10') {
          buttonOkRef.current?.other()?.click();
        } else if (!inputElements.includes(activeElement?.tagName || '')) {
          if (event.key === 'ArrowLeft') {
            buttonOkRef.current?.other()?.focus();
          }

          if (event.key === 'ArrowRight') {
            buttonCancelRef.current?.focus();
          }
        }
      };

      // 초기화
      f5Count.current = 0;
      f6Count.current = 0;

      if (modalType.type === 'BORYU_CREATE') {
        setTimeout(() => {
          boryuButtonRef.current?.click();
        }, 100);
      } else {
        setTimeout(() => {
          cashInp.current?.select();
        }, 100); // 최초에는 현금입력에 포커스
      }

      // F5 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);

      // 컴포넌트 언마운트 시 이벤트 리스너 제거
      return () => {
        window.removeEventListener('keydown', handleArrowKey);
      };
    }
  }, [modalType.active, modalType.type]);

  return (
    <PopupLayout
      width={700}
      isEscClose={true}
      open={modalType.active && (modalType.type === 'PAY_CREATE' || modalType.type === 'PAY_UPDATE' || modalType.type === 'BORYU_CREATE')}
      title={
        order.id == undefined
          ? modalType.type === 'BORYU_CREATE'
            ? '보류처리'
            : order.onSiteYn == 'Y'
            ? order.orderCd == '7'
              ? '샘플결제'
              : '주문결제  (매장)'
            : '주문결제'
          : '주문결제수정'
      }
      onClose={() => {
        closeModal(modalType.type);
      }}
      footer={
        <PopupFooter>
          <div className="btnArea between">
            <div className="left">
              <button
                className="btn"
                title="보류처리"
                onClick={(event) => {
                  if (errorMessageList.length != 0) {
                    toastError(errorMessageList[errorMessageList.length - 1].message);
                  }
                  handleSubmit((data) => {
                    if (order.id) {
                      // 해당 요청이 기존 주문에 기반할 시(id 존재 유무에 따라) 업데이트 요청
                      onValidForUpdate(data, inThisSum, { ...order, holdYn: 'Y' }, orderDetList, selectedRetail);
                    } else {
                      onValidForCreate(data, inThisSum, { ...order, holdYn: 'Y' }, orderDetList, selectedRetail);
                    }
                  })(event);
                }}
                ref={boryuButtonRef}
              >
                보류저장
              </button>
            </div>
            <div className="right">
              <Tooltip id="my-tooltip" />
              {modalType.type !== 'BORYU_CREATE' && (
                <TunedButtonAtom
                  className="btn btnBlue"
                  title="저장"
                  ref={buttonOkRef}
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="단축키는 (F10)입니다."
                  data-tooltip-place="top-end"
                  onClick={(event) => {
                    if (errorMessageList.length != 0) {
                      toastError(errorMessageList[errorMessageList.length - 1].message);
                    }
                    handleSubmit((data) => {
                      if (order) {
                        if (order.id) {
                          // 해당 요청이 기존 주문에 기반할 시(id 존재 유무에 따라) 업데이트 요청
                          onValidForUpdate(data, inThisSum, order, orderDetList, selectedRetail);
                        } else {
                          onValidForCreate(data, inThisSum, order, orderDetList, selectedRetail);
                        }
                      } else {
                        toastError('주문 관련 정보를 찾을 수 없습니다.');
                      }
                    })(event);
                  }}
                  clickPreventTime={-1} // 음수일 때는 참조의 함수를 호출해야만 버튼이 재활성화됨
                >
                  저장
                </TunedButtonAtom>
              )}
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
        <div className={'paymentBox'}>
          <div className="paymentDiv">
            <dl>
              <dt className="strong">전잔액</dt>
              <dd>
                <span>
                  <span>{Utils.setComma((selectedRetail?.nowAmt || '0').toString())}</span>원
                </span>
                <em>
                  {selectedRetail && selectedRetail.latestWorkYmdOfPay
                    ? `${selectedRetail.latestWorkYmdOfPay?.slice(2, 4)}년 ${selectedRetail.latestWorkYmdOfPay?.slice(
                        5,
                        7,
                      )}월 ${selectedRetail.latestWorkYmdOfPay?.slice(8, 10)}일이 최근 입금일 이에요.`
                    : '첫거래 입니다.'}
                </em>
              </dd>

              <dt className="strong">당일합계</dt>
              <dd>
                <span>
                  <span>{inThisSum}</span>원
                </span>
                <CustomCheckBox
                  control={control}
                  name={'order.vatYn'}
                  label={'부가세'}
                  className={'btnChk payChk'}
                  disabled={inThisSum == '0' || productState[0] == '50'}
                  ref={vatInp}
                />
              </dd>

              <dt>물류비</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'order.logisAmt'}
                    inputType={'number'}
                    allowClear={false}
                    price={true}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                        setOrder({ ...order, logisAmt: 0 });
                      } else {
                        setOrder({ ...order, logisAmt: e.target.value });
                      }
                    }}
                    ref={sendingFee}
                    handleOnFocus={() => sendingFee.current?.select()}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'order.logisAmt', errorMessageList);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        discountInfo.current?.focus(); // 할인금액 영역으로 포커싱
                      }
                    }}
                  />
                  <span>원</span>
                </span>
                <PartnerDropDown
                  name={'order.logisCd'}
                  codeUpper={'P0001'}
                  partnerId={selectedRetail?.partnerId}
                  onChange={(event, value, defaultValue) => {
                    console.log('event ===>', event, value, defaultValue);
                    if (isNaN(Number(value))) {
                      setOrder({ ...order, logisCd: undefined });
                    } else {
                      if (defaultValue) {
                        setOrder({ ...order, logisCd: value.toString(), logisAmt: Number(defaultValue) });
                        setValue('order.logisAmt', Utils.setComma(Number(defaultValue))); // 예: 숫자 12345로 변경
                      } else {
                        setOrder({ ...order, logisCd: value.toString() });
                      }
                    }
                  }}
                  value={order.logisCd}
                  ref={partnerDropDownRef}
                  filterData={'택배비,화물비'}
                />
              </dd>

              <dt>할인금액</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'payRequest.discountAmt'}
                    inputType={'number'}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                      }

                      let appliedDiscountAmt = 0;

                      appliedDiscountAmt = Number(Utils.removeComma(e.target.value));
                      setBalance(
                        (selectedRetail?.nowAmt || 0) +
                          Number(Utils.removeComma(inThisSum)) -
                          (Number(Utils.removeComma((getValues('payRequest.cashAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('payRequest.accountAmt') || 0).toString())) +
                            appliedDiscountAmt),
                      ); // 전잔 + 당일합계 - (현금 + 통장입금 + 할인금액(변경되는 값))
                    }}
                    placeholder={''}
                    ref={discountInfo}
                    disable={productState[0] == '50'} /** productState 가 샘플(50) 인 경우 */
                    allowClear={false}
                    price={true}
                    handleOnFocus={() => discountInfo.current?.select()}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'payRequest.discountAmt', errorMessageList);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        cashInp.current?.focus(); // 할인금액 영역으로 포커싱
                      }
                    }}
                  />
                  <span>원</span>
                </span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv">
            <dl>
              <dt>현금입금</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'payRequest.cashAmt'}
                    inputType={'number'}
                    placeholder={''}
                    ref={cashInp}
                    disable={productState[0] == '50'} /** productState 가 샘플(50) 인 경우 */
                    onKeyDown={(e) => {
                      if (e.key == 'F5') {
                        // 현금입금 영역 단축키
                        f5Change(balance, selectedRetail?.nowAmt, inThisSum);
                        f5Count.current = Utils.max3Rotation(f5Count.current);
                      } else if (e.key == 'F6') {
                        // 통장입금 영역 단축키(현금입금에서 진행중인 동작의 흐름을 통장입금 영역으로 이동시킨다)
                        accountInp.current?.focus(); // 통장입금 영역으로 포커싱
                        f6Change(balance, selectedRetail?.nowAmt, inThisSum);
                      } else if (e.key == 'F10') {
                        buttonOkRef.current?.other()?.click();
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        accountInp.current?.focus(); // 통장입금 영역으로 포커싱
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                        setValue('payRequest.receiptIsDone', '0'); // 금액이 0 이되면 영수완료 체크 푼다
                      } else if (e.target.value == '0') {
                        setValue('payRequest.receiptIsDone', '0'); // 금액이 0 이되면 영수완료 체크 푼다
                      }
                      setBalance(
                        (selectedRetail?.nowAmt || 0) +
                          Number(Utils.removeComma(inThisSum)) -
                          (Number(Utils.removeComma(e.target.value) || 0) +
                            Number(Utils.removeComma((getValues('payRequest.accountAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('payRequest.discountAmt') || 0).toString()))),
                      ); // 전잔 + 당일합계  - (현금(변경되는 값) + 통장입금 + 할인금액)
                    }}
                    allowClear={false}
                    price={true}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'payRequest.cashAmt', errorMessageList);
                    }}
                    handleOnFocus={() => cashInp.current?.select()}
                  />
                  <span>원</span>
                </span>
                <CustomCheckBox
                  control={control}
                  name={'payRequest.receiptIsDone'}
                  label={'영수완료'}
                  className={'btnChk payChk'}
                  onChange={(checked) => {
                    if (checked) {
                      // 영수완료
                      setValue(
                        'payRequest.cashAmt',
                        Utils.setComma(Number(Utils.removeComma(inThisSum)) - Number(Utils.removeComma((getValues('payRequest.discountAmt') || 0).toString()))),
                      );
                      setValue('payRequest.accountAmt', 0);
                      setBalance(selectedRetail?.nowAmt || 0); // 잔액은 전잔(영수완료 시 현잔 전액)

                      setOrder({ ...order, payType: '3' }); //  영수(완) ("3")
                    } else {
                      // 영수완료 해제
                      setOrder({ ...order, payType: undefined });
                    }
                  }}
                />
              </dd>

              <dt>통장입금</dt>
              <dd>
                <span>
                  <FormInput
                    type="text"
                    control={control}
                    name={'payRequest.accountAmt'}
                    inputType={'number'}
                    ref={accountInp}
                    disable={productState[0] == '50'} /** productState 가 샘플(50) 인 경우 */
                    onKeyDown={(e) => {
                      if (e.key == 'F6') {
                        // 통장입금 영역 단축키
                        f6Change(balance, selectedRetail?.nowAmt, inThisSum);
                        f6Count.current = Utils.max3Rotation(f6Count.current);
                      } else if (e.key == 'F5') {
                        cashInp.current?.focus(); // 통장입금 영역으로 포커싱
                        f5Change(balance, selectedRetail?.nowAmt, inThisSum);
                      } else if (e.key == 'F10') {
                        buttonOkRef.current?.other()?.click();
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        buttonOkRef.current?.other()?.focus(); // 저장 버튼 영역으로 포커싱
                      }
                    }}
                    onChange={(e) => {
                      if (e.target.value == '') {
                        // 값을 완전히 지울 시 기본값 0
                        e.target.value = '0';
                      }
                      setBalance(
                        (selectedRetail?.nowAmt || 0) +
                          Number(Utils.removeComma(inThisSum)) -
                          (Number(Utils.removeComma(e.target.value) || 0) +
                            Number(Utils.removeComma((getValues('payRequest.cashAmt') || 0).toString())) +
                            Number(Utils.removeComma((getValues('payRequest.discountAmt') || 0).toString()))),
                      ); // 전잔 + 당일합계  - (현금(변경되는 값) + 통장입금 + 할인금액)
                    }}
                    allowClear={false}
                    price={true}
                    onFieldErrorChanged={(error) => {
                      fieldErrorCallBack(error, 'payRequest.accountAmt', errorMessageList);
                    }}
                    handleOnFocus={() => accountInp.current?.select()}
                  />
                  <span>원</span>
                </span>
              </dd>
              <dt className="balance">잔액</dt>
              <dd>
                <span>{Utils.setComma(balance)}원</span>
              </dd>
            </dl>
          </div>
          <div className="paymentDiv etc">
            <div className="etcBox">
              <Switch checkedChildren="비고" unCheckedChildren="비고" className="paySwitch" defaultChecked={false} />
              <CustomDebounceSelect
                type={'single'}
                defaultValue={order.orderEtc}
                fetchOptions={textAreaValues.orderEtc}
                onChange={(value) => {
                  setOrder({ ...order, orderEtc: value });
                }}
                onEditItem={(item) => {
                  updatePartnerAllMutate({ ['etcAccCntn']: item });
                }}
              />
            </div>
          </div>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
