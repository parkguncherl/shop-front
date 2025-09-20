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

interface NoticeRequestUpdate {
  id: number;
  title: string;
  noticeCd: string;
  noticeCntn: string;
}

const NoticeModPop = () => {
  /** store */
  const { selectedNotice, updateNotice, deleteNotice, openModal, modalType, closeModal } = useNoticeStore();
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<NoticeRequestUpdate>({
    //resolver: yupResolver(YupSchema.PartnerRequest()),
    defaultValues: {
      id: selectedNotice?.id,
      title: selectedNotice?.title,
      noticeCd: selectedNotice?.noticeCd,
      noticeCntn: selectedNotice?.noticeCntn,
    },
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

  /** 공지사항 업데이트 */
  const queryClient = useQueryClient();
  const { mutate: updateNoticeMutate, isLoading } = useMutation(updateNotice, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.' || '');
          await queryClient.invalidateQueries(['/notice/paging']);
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
  const onValid: SubmitHandler<NoticeRequestUpdate> = (data) => {
    updateNoticeMutate(data);
  };

  /** 공지사항 삭제 */
  const { mutate: deleteNoticeMutate, isLoading: isDeleteLoading } = useMutation(deleteNotice, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('삭제되었습니다.' || '');
          await queryClient.invalidateQueries(['/notice/paging']);
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

  const onDeleteValid: SubmitHandler<NoticeRequestUpdate> = (data) => {
    const noticeId = data.id;
    deleteNoticeMutate(noticeId);
  };

  return (
    <PopupLayout
      width={820}
      isEscClose={false}
      open={modalType.type === 'MOD'}
      title={`${selectedNotice?.noticeCd === '20120' ? '매뉴얼' : '공지사항'} 상세`}
      onClose={() => {
        closeModal('MOD');
      }}
      footer={
        <PopupFooter>
          <div className="btnArea">
            <button className="btn" title="삭제" onClick={handleSubmit(onDeleteValid)}>
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
                  <FormDropDown<NoticeRequestUpdate> control={control} name={'noticeCd'} options={dropDownData} />
                </td>
              </tr>
              <tr>
                <th>제목</th>
                <td>
                  <FormInput<NoticeRequestUpdate> control={control} name={'title'} />
                </td>
              </tr>
              <tr>
                <th>내용</th>
                <td>
                  <div style={{ minHeight: '150px' }}>
                    <FormInput<NoticeRequestUpdate> control={control} inputType={'textarea'} name={'noticeCntn'} style={{ minHeight: '150px' }} />
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

export default NoticeModPop;
