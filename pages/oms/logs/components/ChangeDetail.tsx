/**
 * @file pages/oms/pastHistory/components/ReceivingHistoryLayout.tsx
 * @description 변경 내역 상세 보기 모달 컴포넌트
 * @copyright 2024
 */

import React from 'react';
import { PopupLayout, PopupFooter, PopupContent } from '../../../../components/popup';
import { Utils } from '../../../../libs/utils';

export interface ModalData {
  changedFields: string[];
  currentData: any;
  prevData: any;
}

interface ChangeDetailProps {
  /** 모달 표시 여부 */
  open: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 변경 데이터 */
  data: ModalData;
  /** 필드 매핑 정보 */
  fieldMappings: Record<string, string>;
}

/**
 * 변경 내역 상세 정보를 보여주는 모달 컴포넌트
 * @component
 * @example
 * <ReceivingHistoryLayout
 *   open={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   data={modalData}
 *   fieldMappings={fieldMappings}
 * />
 */
export const ChangeDetail: React.FC<ChangeDetailProps> = ({ open, onClose, data, fieldMappings }) => {
  return (
    <PopupLayout
      width={700}
      isEscClose={true}
      open={open}
      title={'변경 내역 상세'}
      onClose={onClose}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="닫기" onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox">
          <table>
            <caption></caption>
            <colgroup>
              <col width="20%" />
              <col width="40%" />
              <col width="40%" />
            </colgroup>
            <thead>
              <tr>
                <th className="agnC">컬럼</th>
                <th className="agnC">변경전</th>
                <th className="agnC">변경후</th>
              </tr>
            </thead>
            <tbody>
              {data.changedFields.map((field) => {
                console.log('data ==>', data);
                const isPhoneNumber = field === 'personTelNo' || field === 'ceoTelNo';
                const prevValue = isPhoneNumber ? Utils.getPhoneNumFormat(data.prevData[field]) : data.prevData[field];
                const currentValue = isPhoneNumber ? Utils.getPhoneNumFormat(data.currentData[field]) : data.currentData[field];

                return (
                  <tr key={field}>
                    <td className="agnC">{fieldMappings[field]}</td>
                    <td className="agnC edit">{prevValue || '-'}</td>
                    <td className="agnC">{currentValue || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};
export default ChangeDetail;
