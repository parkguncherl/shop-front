import React, { useRef, useState } from 'react';
import { usePayMngStore } from '../../../stores/usePayMngStore';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { Input } from '../../Input';
import DropDownAtom from '../../atom/DropDownAtom';
import CustomDatePicker from '../../CustomDatePicker';

/** 결제추가 팝업 */
export const PayMngAddPop = () => {
  const [etcPrintOn, setEtcPrintOn] = useState<boolean>(false); // 비고인쇄 추가하기 버튼
  const cashInp = useRef<any>(null);

  /** 입금관리 스토어 - State */
  const [openModal, modalType, closeModal, onClear, insertOrder] = usePayMngStore((s) => [s.openModal, s.modalType, s.closeModal, s.onClear, s.selectedOrder]);

  return (
    <PopupLayout
      width={630}
      isEscClose={true}
      open={modalType.type === 'PAYMANAGE'}
      title={'결제거래 추가하기'}
      onClose={() => {
        closeModal();
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="추가">
              추가
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal();
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox payment">
          <table>
            <caption></caption>
            <colgroup>
              <col width="25%" />
              <col width="*%" />
            </colgroup>
            <tbody>
              <tr>
                <th className="agnL">입금일자</th>
                <td>
                  <div className="formBox">
                    <CustomDatePicker title={''} name={'ip'} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">대상기간</th>
                <td>
                  <div className="formBox">
                    <CustomDatePicker title={''} name={'ip'} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">예정금액</th>
                <td>
                  <div className="formBox">
                    <Input title={''} disable={true} value={'00'} />
                    {/*<FormInput type="text" control={} name={'transAmt'} placeholder={''} />*/}
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">현금입금</th>
                <td>
                  <div className="formBox inpChk">
                    <Input title={''} disable={true} value={'00'} />
                    {/*<FormInput type="text" control={} name={'order.cashAmt'} placeholder={''} ref={cashInp} />*/}
                    <div className="chkBox">
                      <span>
                        <input id="chk2" type="checkbox" />
                        <label htmlFor="chk2">영수완료</label>
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">통장입금</th>
                <td>
                  <div className="formBox inpSel">
                    <Input title={''} disable={true} value={'00'} />
                    {/*<FormInput type="text" control={} name={'order.nonCashAmt'} placeholder={''} ref={cashInp} />*/}
                    <DropDownAtom name="ff" placeholder="선택" options={[]} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">할인금액</th>
                <td>
                  <div className="formBox">
                    <Input title={''} disable={true} value={'00'} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">결제잔액</th>
                <td>
                  <div className="formBox">
                    <Input title={''} disable={true} value={'00'} />
                  </div>
                </td>
              </tr>
              <tr>
                <th className="agnL">비고</th>
                <td>
                  <div className="formBox">
                    <input type="text" />
                    {/*<FormInput type="text" control={controll} name={''} placeholder={''} ref={cashInp} />*/}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopupContent>
      {/*<Loading />*/}
    </PopupLayout>
  );
};
