import React, { useEffect, useRef, useState } from 'react';
import { PopupFooter } from '../PopupFooter';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { MisongResponseResponse } from '../../../generated';
import { useMisongStore } from '../../../stores/useMisongStore';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useMutation } from '@tanstack/react-query';
import { CheckBox } from '../../CheckBox';

interface MisongComponentProps {
  data?: MisongResponseResponse;
  fetchPopUp: () => void;
}

const MisongProcessPop: React.FC<MisongComponentProps> = (props) => {
  console.log('MisongProcessPop ==>', props);
  const [modalType, closeModal, treatSingleMisong] = useMisongStore((s) => [s.modalType, s.closeModal, s.treatSingleMisong]);
  const [tranCnt, setTranCnt] = useState<number>(props.data?.remainCnt || 0);
  const [onSiteCheck, setOnSiteCheck] = useState<boolean>(false);
  const buttonConfConfirmRef = useRef<HTMLButtonElement>(null);
  const buttonConfCancelRef = useRef<HTMLButtonElement>(null);

  /** 주문 등록 */
  const { mutate: treatSingleMisongMutate } = useMutation(treatSingleMisong, {
    onSuccess: async (e) => {
      if (e.data.resultCode === 200) {
        toastSuccess('저장되었습니다.');
        closeModal('ONETRAN');
        props.fetchPopUp();
        /** 새로운 주문을 받을수 있도록 모든 정보(상태) 초기화 */
      } else {
        toastError(e.data.resultMessage);
      }
    },
  });

  const handleSubmit = () => {
    if (props.data?.remainCnt && tranCnt > 0 && props.data?.remainCnt >= tranCnt) {
      treatSingleMisongMutate({ orderDetId: parseInt(props.data.orderDetId || '0'), tranCnt: tranCnt, onSiteCheck: onSiteCheck });
    } else {
      toastError('최대 처리가능건수는 0보다 커야하고  ' + props.data?.remainCnt + ' 보다 작아야 합니다.');
    }
  };

  const handleArrowKey = (event: KeyboardEvent) => {
    console.log('event.key=======>', event.key);
    if (event.key === 'Escape') {
      if (closeModal) {
        closeModal('ONETRAN');
      }
    } else if (event.key === 'ArrowLeft') {
      buttonConfConfirmRef.current?.focus();
    } else if (event.key === 'ArrowRight') {
      buttonConfCancelRef.current?.focus();
    }
  };

  useEffect(() => {
    if (modalType.active) {
      setTimeout(() => {
        buttonConfConfirmRef.current?.focus();
      }, 100);

      // 키 이벤트 리스너 추가
      window.addEventListener('keydown', handleArrowKey);
      return () => {
        // 컴포넌트 언마운트 시 이벤트 리스너 제거, 중복 클릭 방지를 위한 ref 를 초기화
        window.removeEventListener('keydown', handleArrowKey);
      };
    }
  }, [open]);

  return (
    <PopupLayout
      width={420}
      isEscClose={true}
      open={modalType.type === 'ONETRAN' && modalType.active}
      title={'발송처리'}
      onClose={() => {
        closeModal('ONETRAN');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" onClick={handleSubmit} ref={buttonConfConfirmRef}>
              확인
            </button>
            <button className="btn" title="닫기" onClick={() => closeModal('ONETRAN')} ref={buttonConfCancelRef}>
              취소
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox noLine">
          <table>
            <colgroup>
              <col width="25%" />
              <col width="25%" />
              <col width="25%" />
              <col width="25%" />
            </colgroup>
            <thead>
              <tr>
                <th>미송</th>
                <th>발송</th>
                <th>잔량</th>
                <th>처리건수</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="agnC">{props.data?.misongCnt}</td>
                <td className="agnC">{props.data?.sendCnt}</td>
                <td className="agnC">{props.data?.remainCnt}</td>
                <td>
                  <div className="formBox">
                    <input
                      type="text"
                      value={tranCnt}
                      onChange={(e) => setTranCnt(e.target.value ? parseInt(e.target.value) : 0)}
                      onFocus={(e) => e.target.select()}
                      className="agnC"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ position: 'absolute', bottom: '47px', left: '50px' }}>
            <CheckBox label={'매장재고에서 처리'} checked={onSiteCheck} onChange={() => setOnSiteCheck(!onSiteCheck)}></CheckBox>
          </div>
        </div>
      </PopupContent>
      {/*
      <ConfirmModal
        title={'발주예정 상품으로 추가하시겠습니까?'}
        open={confirmModal}
        onConfirm={confirmedAsnAdd}
        onKeyDown={onKeyDownAtConfirmModal}
        onClose={() => setConfirmModal(false)}
      />
*/}
    </PopupLayout>
  );
};

export default MisongProcessPop;
