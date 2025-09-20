import React from 'react';
import { Button } from '../../../Button';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Label } from '../../../index';
import { useContactState } from '../../../../stores';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import ModalLayout from '../../../ModalLayout';

export const AccessLogDeatilPop = () => {
  const { t } = useTranslation();
  const [modalType, closeModal, selectContact] = useContactState((s) => [s.modalType, s.closeModal, s.selectContact]);

  return (
    <PopupLayout
      width={600}
      isEscClose={true}
      open={modalType.type === 'DETAIL' && modalType.active}
      title={t('로그상세조회') || ''}
      onClose={() => closeModal('DETAIL')}
      footer={
        <PopupFooter>
          <div className={'btnArea'}>
            <button className={'btn'} onClick={() => closeModal('DETAIL')}>
              {t('닫기') || ''}
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <Label title={'ID(e-mail)'} value={selectContact?.loginId} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('이름') || ''} value={selectContact?.userNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('권한') || ''} value={selectContact?.authNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label
              title={t('소속') || ''}
              value={
                (isEmpty(selectContact?.belongNm) ? '-' : selectContact?.belongNm) + ' / ' + (isEmpty(selectContact?.deptNm) ? '-' : selectContact?.deptNm)
              }
            />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={'URI'} value={selectContact?.uri} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('거래명') || ''} value={selectContact?.uriNm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('접속 IP') || ''} value={selectContact?.contactIp} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('거래일시') || ''} value={selectContact?.creTm} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <Label title={t('입력 Param') || ''} value={selectContact?.inputParamCntn} />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};
