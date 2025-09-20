import React, { useState } from 'react';
import { FactoryRequestDelete, FactoryRequestUpdate, FactoryResponsePaging } from '../../../generated';
import { useFactoryListStore } from '../../../stores/useFactoryListStore';
import { useCommonStore } from '../../../stores';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { YupSchema } from '../../../libs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../ToastMessage';
import { PopupLayout } from '../PopupLayout';
import { PopupFooter } from '../PopupFooter';
import { PopupContent } from '../PopupContent';
import { PopupSearchBox, PopupSearchType } from '../content';
import FormInput from '../../FormInput';
import { DefaultOptions, Placeholder } from '../../../libs/const';
import { DeleteConfirmModal } from '../../DeleteConfirmModal';
import FormDropDown from '../../FormDropDown';

type FactoryRequestUpdateFields = {
  id?: number;
  partnerId?: number;
  partnerNm?: string;
  factoryCd?: string;
  compNm: string;
  compTelNo?: string;
  personNm?: string;
  personTelNo?: string;
  compNo?: string;
  detailInfo?: string;
  compEmail?: string;
  creUser?: string;
  updUser?: string;
  creTm?: string;
  updTm?: string;
};

interface Props {
  data: FactoryResponsePaging;
}
const FactoryListModPop = ({ data }: Props) => {
  /** 스토어 */
  const [modalType, closeModal] = useFactoryListStore((s) => [s.modalType, s.closeModal]);
  const [commonModalType, commonOpenModal, getFileUrl] = useCommonStore((s) => [s.modalType, s.openModal, s.getFileUrl]);

  /** 공장관리 스토어 - State */
  const [selectedFactory, setSelectedFactory, updateFactory, deleteFactory] = useFactoryListStore((s) => [
    s.selectedFactory,
    s.setSelectedFactory,
    s.updateFactory,
    s.deleteFactory,
  ]);

  const [confirmModal, setConfirmModal] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<FactoryRequestUpdateFields>({
    resolver: yupResolver(YupSchema.FactoryRequest()), // 완료
    defaultValues: {
      id: selectedFactory?.id,
      partnerId: selectedFactory?.partnerId,
      partnerNm: selectedFactory?.partnerNm,
      factoryCd: selectedFactory?.factoryCd,
      compNm: selectedFactory?.compNm,
      compTelNo: selectedFactory?.compTelNo,
      personNm: selectedFactory?.personNm,
      personTelNo: selectedFactory?.personTelNo,
      compNo: selectedFactory?.compNo,
      detailInfo: selectedFactory?.detailInfo,
      compEmail: selectedFactory?.compEmail,
      creUser: selectedFactory?.creUser,
      creTm: selectedFactory?.creTm,
      updUser: selectedFactory?.updUser,
      updTm: selectedFactory?.updTm,
    },
    mode: 'onSubmit',
  });
  const queryClient = useQueryClient();

  /** 공장 수정하기 */
  const { mutate: updateFactoryMutate } = useMutation(updateFactory, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await queryClient.invalidateQueries(['/factory/partnerId/paging']);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 공장 삭제하기 */
  const { mutate: deleteFactoryMutate, isLoading: deleteCodeIsLoading } = useMutation(deleteFactory, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.');
          await queryClient.invalidateQueries(['/factory/partnerId/paging']);
          closeModal('MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 삭제 버튼 클릭 시 */
  const deleteAccountFn = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deleteFactoryMutate({ id: selectedFactory?.id } as FactoryRequestDelete);
  };

  const onValid: SubmitHandler<FactoryRequestUpdate> = (data) => {
    updateFactoryMutate(data);
  };

  return (
    <div>
      <PopupLayout
        width={820}
        isEscClose={true}
        open={modalType.type === 'MOD'}
        title={'공장 수정하기'}
        onClose={() => {
          closeModal('MOD');
        }}
        footer={
          <PopupFooter>
            <div className="btnArea">
              <button className="btn" title="저장" onClick={(e) => setConfirmModal(true)}>
                삭제
              </button>
              <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
                저장
              </button>
              <button
                className="btn"
                title="닫기"
                onClick={() => {
                  closeModal('MOD');
                }}
              >
                닫기
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestUpdateFields> control={control} name={'compNm'} label={'회사명'} placeholder={Placeholder.Input || ''} required={true} />
              <FormDropDown<FactoryRequestUpdateFields>
                control={control}
                title={'공장종류코드'}
                name={'factoryCd'}
                defaultOptions={[...DefaultOptions.Select]}
                codeUpper={'10060'}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestUpdateFields>
                control={control}
                name={'compTelNo'}
                label={'회사전화번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
              <FormInput<FactoryRequestUpdateFields>
                control={control}
                name={'compNo'}
                label={'사업자번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <FormInput<FactoryRequestUpdateFields>
                control={control}
                name={'personNm'}
                label={'담당자명'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
              <FormInput<FactoryRequestUpdateFields>
                control={control}
                name={'personTelNo'}
                label={'담당자전화번호'}
                placeholder={Placeholder.Input || ''}
                required={true}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_1'}>
              <FormInput<FactoryRequestUpdateFields>
                control={control}
                name={'compEmail'}
                label={'회사이메일'}
                placeholder={Placeholder.Input || ''}
                required={false}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_1'}>
              <FormInput<FactoryRequestUpdateFields>
                inputType="textarea"
                control={control}
                name={'detailInfo'}
                label={'상세정보'}
                placeholder={Placeholder.Input || ''}
                required={false}
              />
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <dl>
                <dt>등록자</dt>
                <dd>{selectedFactory?.creUser ? selectedFactory?.creUser : 'system'}</dd>
              </dl>
              <dl>
                <dt>등록시간</dt>
                <dd>{selectedFactory?.creTm}</dd>
              </dl>
            </PopupSearchType>
            <PopupSearchType className={'type_2'}>
              <dl>
                <dt>수정자</dt>
                <dd>{selectedFactory?.updUser ? selectedFactory?.updUser : 'system'}</dd>
              </dl>
              <dl>
                <dt>수정시간</dt>
                <dd>{selectedFactory?.updTm}</dd>
              </dl>
            </PopupSearchType>
          </PopupSearchBox>
        </PopupContent>
        {/*<Loading />*/}
        <DeleteConfirmModal open={confirmModal} onConfirm={deleteAccountFn} onClose={() => setConfirmModal(false)} />
      </PopupLayout>
    </div>
  );
};

export default FactoryListModPop;
