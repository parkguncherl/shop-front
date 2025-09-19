import React, { useEffect, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupLayout } from '../PopupLayout';
import { useSettlementStore } from '../../../stores/useSattlementStore';
import { Utils } from '../../../libs/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { authApi } from '../../../libs';
import { SettlementRequestAsMoneyInput } from '../../../generated';

interface Props {
  workYmd: string;
}

const EnterPricePop = ({ workYmd }: Props) => {
  const queryClient = useQueryClient();
  /** store */
  const [modalType, openModal, closeModal, requestAsMoneyInput] = useSettlementStore((s) => [s.modalType, s.openModal, s.closeModal, s.requestAsMoneyInput]);

  // 단위
  const moneyUnits = [
    { name: 'won1000000', label: '백만원', type: '장', unitValue: 1000000 },
    { name: 'won100000', label: '십만원', type: '장', unitValue: 100000 },
    { name: 'won50000', label: '오만원', type: '장', unitValue: 50000 },
    { name: 'won10000', label: '만원', type: '장', unitValue: 10000 },
    { name: 'won5000', label: '오천원', type: '장', unitValue: 5000 },
    { name: 'won1000', label: '천원', type: '장', unitValue: 1000 },
    { name: 'wonEtc', label: '기타금액', type: '원', unitValue: 1 },
  ];
  // 2개씩 묶는 함수
  const chunkArray = (array: any, size: any) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };
  const chunkedUnits = chunkArray(moneyUnits, 2); // 2개씩 묶음

  // 각 금액 입력값을 관리하는 상태
  const [values, setValues] = useState(Array(moneyUnits.length).fill(0));

  const [total, setTotal] = useState(0); // 총액
  const [expectedCash, setExpectedCash] = useState(0); // 예상금액
  const [futureTense, setFutureTense] = useState(0); // 차기시제
  //const [isTotalPopupOpen, setTotalPopupOpen] = useState(false);

  // 합계 계산
  useEffect(() => {
    const sum = values.reduce((acc, curr, index) => acc + (Number(curr) || 0) * moneyUnits[index].unitValue, 0);
    setTotal(sum);
  }, [values]);

  // 값 변경 처리 함수
  const handleChange = (index: number, event: any) => {
    const updatedValues = [...values];
    // 입력값을 숫자로 변환 후 콤마를 추가해서 저장
    const newValue = event.target.value.replace(/,/g, ''); // 콤마 제거
    updatedValues[index] = parseInt(newValue || 0);
    setValues(updatedValues);
  };

  // 총액 값 수정하려 할 때 팝업 띄우기
  /*const handleTotalInputClick = (e: any) => {
    // 입력값이 '0'이 아니거나 다른 입력 필드에 값이 있을 경우
    const allFieldsEmpty = values.every((value) => value === 0 || value === '');
    if (e.target.value !== '0' && e.target.value !== '' && !allFieldsEmpty) {
      setTotalPopupOpen(true);
    }
  };*/

  const {
    data: moneyData,
    isSuccess: moneyDataIsFetched,
    refetch: moneyDataRefetch,
  } = useQuery([`/orderInfo/settlement/selectMoneyDetail/` + workYmd], () => authApi.get(`/orderInfo/settlement/selectMoneyDetail/` + workYmd, {}));

  useEffect(() => {
    if (moneyDataIsFetched) {
      const { resultCode, body, resultMessage } = moneyData.data;
      if (resultCode === 200) {
        // 데이터 변환
        console.log('body ==> ', body);
        if (body) {
          // 수정 동작 대기상태(기존 데이터 존재)
          if (modalType.type == 'ENTER_PRICE_CASH') {
            // 돈통 현금
            setValues([body.won1000000, body.won100000, body.won50000, body.won10000, body.won5000, body.won1000, body.wonEtc]);
          } else if (modalType.type == 'ENTER_SETT_END') {
            // 정산 마감
            setValues([body.sett1000000, body.sett100000, body.sett50000, body.sett10000, body.sett5000, body.sett1000, body.settEtc]);
          }
          setExpectedCash(body.expectedCash || 0);
          setFutureTense(body.futureTense || 0);
        }
      } else {
        toastError(resultMessage);
      }
    }
  }, [moneyData, moneyDataIsFetched]);

  const handleSubmit = () => {
    moneyUnits.map((unit, index) => {
      unit.unitValue = values[index];
    });

    if (modalType.type == 'ENTER_PRICE_CASH') {
      // 돈통 현금(돈넣기)
      const processedMoneyData: SettlementRequestAsMoneyInput = moneyUnits.reduce<any>((acc, { name, unitValue }, index) => {
        acc[name] = unitValue;
        return acc;
      }, {});
      requestAsMoneyDataInput({ ...processedMoneyData, workYmd: workYmd });
    } else if (modalType.type == 'ENTER_SETT_END') {
      // 정산 마감(돈빼기)
      const processedMoneyData: SettlementRequestAsMoneyInput = moneyUnits.reduce<any>((acc, { name, unitValue }) => {
        acc['sett' + name.slice(3)] = unitValue;
        return acc;
      }, {});
      requestAsMoneyDataInput({ ...processedMoneyData, workYmd: workYmd });
    }
  };

  const { mutate: requestAsMoneyDataInput } = useMutation(requestAsMoneyInput, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await moneyDataRefetch();
          await queryClient.invalidateQueries(['/orderInfo/settlement/dataForPage']); // 정산 페이지 출력 데이터 갱신
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /*const { mutate: insertMoneyData } = useMutation(insertMoney, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          moneyDataRefetch();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const { mutate: updateMoneyData } = useMutation(updateMoney, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('수정되었습니다.');
          moneyDataRefetch();
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });*/

  // 총액 수정팝업 확인
  /*const confirmTotalChange = () => {
    setValues(Array(moneyUnits.length).fill(0)); // 다른 입력 필드 초기화
    setTotalPopupOpen(false); // 팝업 닫기
  };*/

  /*const handleTotalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(/,/g, ''); // 콤마 제거
    const numericValue = isNaN(Number(newValue)) ? 0 : Number(newValue); // 숫자만 처리
    setTotal(numericValue);
  };*/
  const handleClick = (event: any) => {
    event.target.select();
  };

  return (
    <PopupLayout
      width={420}
      isEscClose={true}
      open={(modalType.type === 'ENTER_PRICE_CASH' || modalType.type === 'ENTER_SETT_END') && modalType.active}
      title={
        modalType.type === 'ENTER_PRICE_CASH' ? (
          <div className="cashTit">돈통에 남아있는 금액을 알려주세요</div>
        ) : (
          <div className="cashTit minus">뺄 돈이 얼마인가요?</div>
        )
      }
      onClose={() => {
        closeModal();
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={() => handleSubmit()}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal()}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="quantityInputDiv">
          <div className="inputDiv">
            <ul>
              {chunkedUnits.map((pair, index) => (
                <li key={index}>
                  {pair.map((unit: any, idx: any) => (
                    <dl key={idx}>
                      <dt>{unit.label}</dt>
                      <dd>
                        <input
                          type="text"
                          name={unit.name}
                          value={Utils.setComma(values[index * 2 + idx] || 0)}
                          onChange={(e) => handleChange(index * 2 + idx, e)}
                          onClick={handleClick}
                        />
                        <span>{unit.type}</span>
                      </dd>
                    </dl>
                  ))}
                </li>
              ))}
            </ul>
          </div>

          <dl className="title">
            <dt>총액</dt>
            <dd>
              <strong>{Utils.setComma(total)}</strong>
              <span>원</span>
            </dd>
            {modalType.type === 'ENTER_PRICE_CASH' ? (
              <>
                <dt>예상금액</dt>
                <dd>
                  <strong>{Utils.setComma(expectedCash)}</strong>
                  <span>원</span>
                </dd>
                <dt>오차금액</dt>
                <dd className={total > 0 ? 'red' : 'blue'}>
                  {/* 오차금액 -시 blue +시 red */}
                  <strong>{Utils.setComma(expectedCash - total)}</strong>
                  <span>원</span>
                </dd>
              </>
            ) : (
              <>
                <dt>차기시재</dt>
                <dd>
                  <strong>{Utils.setComma(futureTense)}</strong>
                  <span>원</span>
                </dd>
              </>
            )}
          </dl>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default EnterPricePop;
