import React from 'react';
import { Modal, Button, Form, Input, Row, Col } from 'antd';
import { HomeResponseDetail, HomeRequestUpdate, CodeRequestCreate, HomeRequestInsert } from '../../../generated';
import { PopupLayout } from '../PopupLayout';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import { Label } from '../../Label';
import { isEmpty } from 'lodash';
import FormInput from '../../FormInput';
import { PopupFooter } from '../PopupFooter';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { useHomeStore } from '../../../stores/wms/useHomeStore';

const HomeFormModal: React.FC = () => {
  /** store */
  const [selectedHome, modalType, closeModal, insertHome, updateHome, deleteHome] = useHomeStore((s) => [
    s.selectedHome,
    s.modalType,
    s.closeModal,
    s.insertHome,
    s.updateHome,
    s.deleteHome,
  ]);
  const {
    watch,
    handleSubmit,
    control,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<HomeRequestInsert>({
    // resolver: yupResolver(YupSchema.CodeRequest()),
    defaultValues: {
      homeNm: selectedHome?.homeNm,
      ceoNm: selectedHome?.ceoNm,
      repTelNo: selectedHome?.repTelNo,
      homeCompNo: selectedHome?.homeCompNo,
      homeAddr: selectedHome?.homeAddr,
      homeTelNo: selectedHome?.homeTelNo,
      homeFaxNo: selectedHome?.homeFaxNo,
      homeEmail: selectedHome?.homeEmail,
      homeAccount: selectedHome?.homeAccount,
    },
    mode: 'onSubmit',
  });

  /** 등록 */
  const queryClient = useQueryClient();
  const { mutate: insertHomeMutate, isLoading } = useMutation(insertHome, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/home']);
          closeModal();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
      console.log(e, '데이터');
    },
  });
  /** 수정 */
  const { mutate: updateHomeMutate } = useMutation(updateHome, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('수정되었습니다.');
          await queryClient.invalidateQueries(['/home']);
          closeModal();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
      console.log(e, '데이터');
    },
  });
  /** 삭제 */
  const { mutate: deleteHomeMutate } = useMutation(deleteHome, {
    onSuccess: async (e) => {
      try {
        const { resultCode, body, resultMessage } = e.data;
        if (resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/home']);
          closeModal();
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
      console.log(e, '데이터');
    },
  });
  const onValid: SubmitHandler<HomeRequestInsert> = (data) => {
    if (modalType.type === 'MOD') {
      updateHomeMutate(data);
    } else {
      insertHomeMutate(data);
    }
  };

  /** 수정 */

  return (
    <PopupLayout
      open={(modalType.type === 'MOD' || modalType.type === 'ADD') && modalType.active}
      width={600}
      title={modalType.type === 'MOD' ? '회사정보 수정' : '회사정보 생성'}
      isEscClose={true}
      onClose={closeModal}
      footer={
        <PopupFooter>
          <div className={'btnArea between'}>
            <div className="left">
              {modalType.type === 'MOD' ? (
                <button
                  className={'btn'}
                  onClick={() => {
                    deleteHomeMutate();
                  }}
                >
                  회사정보 삭제
                  {/*  TODO 삭제 처리 해야됨 */}
                </button>
              ) : (
                ''
              )}
            </div>
            <div className="right">
              <button className="btn btnBlue" onClick={handleSubmit(onValid)}>
                {modalType.type === 'MOD' ? '수정' : '생성'}
              </button>
              <button className={'btn'} onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupSearchBox>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'업체명'} name={'homeNm'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'대표자명'} name={'ceoNm'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'대표연락처'} name={'repTelNo'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'사업자번호'} name={'homeCompNo'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'주소'} name={'homeAddr'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'전화번호'} name={'homeTelNo'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'팩스번호'} name={'homeFaxNo'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'이메일'} name={'homeEmail'} />
          </PopupSearchType>
          <PopupSearchType className={'type_1'}>
            <FormInput control={control} label={'입금계좌'} name={'homeAccount'} />
          </PopupSearchType>
        </PopupSearchBox>
      </PopupContent>
    </PopupLayout>
  );
};

export default HomeFormModal;
