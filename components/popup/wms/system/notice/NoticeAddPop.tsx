import React, { useEffect, useState } from 'react';
import { useNoticeStore } from '../../../../../stores/useNoticeStore';
import { PopupFooter } from '../../../PopupFooter';
import { PopupContent } from '../../../PopupContent';
import { PopupLayout } from '../../../PopupLayout';
import FormInput from '../../../../FormInput';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../../../../ToastMessage';
import FormDropDown from '../../../../FormDropDown';
import { DropDownOption } from '../../../../../types/DropDownOptions';

interface NoticeRequestCreate {
  title: string;
  noticeCd: string;
  noticeCntn: string;
}

const NoticeAddPop = () => {
  /** store */
  const { createNotice, openModal, modalType, closeModal } = useNoticeStore();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<NoticeRequestCreate>({
    //resolver: yupResolver(YupSchema.PartnerRequest()),
    defaultValues: {},
    mode: 'onSubmit',
  });

  // 공지사항 코드
  const [dropDownData, setDropDownData] = useState<DropDownOption[]>([]);
  useEffect(() => {
    const hardCodedData = [
      { key: '20110', value: '20110', label: '공지사항' },
      { key: '20120', value: '20120', label: '메뉴얼' },
    ];
    setDropDownData(hardCodedData);
  }, []);

  /** 공지사항 등록 */
  const queryClient = useQueryClient();
  const { mutate: insertNoticeMutate, isLoading } = useMutation(createNotice, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.' || '');
          await queryClient.invalidateQueries(['/notice/paging']);
          closeModal('ADD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });
  const onValid: SubmitHandler<NoticeRequestCreate> = (data) => {
    insertNoticeMutate(data);
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'ADD'}
      title={'공지사항 등록'}
      onClose={() => {
        closeModal('ADD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn btnBlue" title="저장" onClick={handleSubmit(onValid)}>
              저장
            </button>
            <button
              className="btn"
              title="닫기"
              onClick={() => {
                closeModal('ADD');
              }}
            >
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <div className="tblBox popInpWidth100">
          <table>
            <caption></caption>
            <colgroup>
              <col width="20%" />
              <col width="*" />
            </colgroup>
            <tbody>
              <tr>
                <th>구분</th>
                <td>
                  <FormDropDown<NoticeRequestCreate> control={control} name={'noticeCd'} options={dropDownData} />
                </td>
              </tr>
              <tr>
                <th>제목</th>
                <td>
                  <FormInput<NoticeRequestCreate> control={control} name={'title'} />
                </td>
              </tr>
              <tr>
                <th>내용</th>
                <td>
                  <div style={{ minHeight: '150px' }}>
                    <FormInput<NoticeRequestCreate> control={control} inputType={'textarea'} name={'noticeCntn'} style={{ minHeight: '150px' }} />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </PopupContent>
    </PopupLayout>
  );
};

export default NoticeAddPop;
