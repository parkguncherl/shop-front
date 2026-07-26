'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { PARTNER_CODE } from '@/libs/const';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import { PopupLayout } from '@/components/popup/PopupLayout';
import { PopupContent } from '@/components/popup/PopupContent';
import { PopupFooter } from '@/components/popup/PopupFooter';
import PopupFormBox from '@/components/popup/content/PopupFormBox';
import PopupFormGroup from '@/components/popup/content/PopupFormGroup';
import PopupFormType from '@/components/popup/content/PopupFormType';
import FormInput from '@/components/form/FormInput';
import Loading from '@/components/Loading';
import { useController } from 'react-hook-form';

type MyInfoFields = {
  userNm: string;
  phoneNo?: string;
  belongNm: string;
  deptNm?: string;
  positionNm?: string;
  tema?: string;
};

const schema = yup.object({
  userNm: yup.string().required('이름은 필수입니다.'),
  phoneNo: yup.string().optional(),
  belongNm: yup.string().required('소속은 필수입니다.'),
  deptNm: yup.string().optional(),
  positionNm: yup.string().optional(),
  tema: yup.string().optional(),
});

const temaOptions = [
  { value: 'white', label: 'White' },
  { value: 'dark', label: 'Dark' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

// 시즌 순서 - 라벨(codeNm)/정렬값(codeOrder)은 파트너코드 정보에서 그대로 사용, 콤보 변경 즉시 CODE_ORDER 반영
type SeasonCodeRow = { id: number; codeCd: string; codeNm?: string; codeOrder?: number };

const SeasonOrderSection = ({ open }: { open: boolean }) => {
  const [rows, setRows] = React.useState<SeasonCodeRow[]>([]);

  const fetchRows = React.useCallback(async () => {
    const { data } = await authApi.get('/partnerCode/lowerCodeList', { params: { codeUpper: PARTNER_CODE.season.code, orderType: 'CODE' } });
    if (data?.resultCode === 200) {
      const list = (data.body ?? []) as SeasonCodeRow[];
      list.sort((a, b) => (a.codeOrder ?? 99) - (b.codeOrder ?? 99)); // 보이는 순서 = 실제 정렬순서
      setRows(list);
    }
  }, []);

  React.useEffect(() => {
    if (open) fetchRows();
  }, [open, fetchRows]);

  const onChangeOrder = async (row: SeasonCodeRow, codeOrder: number) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, codeOrder } : r))); // 낙관적 반영 (위치는 유지)
    try {
      const { data } = await authApi.put('/partnerCode/order', null, { params: { id: row.id, codeOrder } });
      if (data?.resultCode === 200) toastSuccess(`${row.codeNm} 순서를 ${codeOrder}로 변경했습니다.`);
      else {
        toastError(data?.resultMessage ?? '순서 변경 중 오류가 발생했습니다.');
        fetchRows();
      }
    } catch {
      toastError('순서 변경 중 오류가 발생했습니다.');
      fetchRows();
    }
  };

  return (
    <dl>
      <dt>
        <label>시즌 순서</label>
      </dt>
      <dd>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'nowrap', alignItems: 'center', whiteSpace: 'nowrap' }}>
          {rows.map((row) => (
            <label key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ minWidth: 28 }}>{row.codeNm}</span>
              <select
                value={row.codeOrder ?? ''}
                onChange={(e) => onChangeOrder(row, Number(e.target.value))}
                style={{ height: 28, borderRadius: 4, padding: '0 6px' }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
                {/* 9 = 노출 제외(안보임) */}
                <option value={9}>9 (안보임)</option>
              </select>
            </label>
          ))}
        </div>
      </dd>
    </dl>
  );
};

const TemaRadio = ({ control }: { control: any }) => {
  const { field } = useController({ name: 'tema', control });
  return (
    <dl>
      <dt>
        <label>테마</label>
      </dt>
      <dd>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '28px' }}>
          {temaOptions.map((opt) => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="radio"
                value={opt.value}
                checked={field.value === opt.value}
                onChange={() => field.onChange(opt.value)}
                style={{ cursor: 'pointer', accentColor: '#7c3aed' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </dd>
    </dl>
  );
};

export const MyInfoPop = ({ open, onClose }: Props) => {
  const { data: session, update } = useSession();
  const user = session?.user;

  const { handleSubmit, control } = useForm<MyInfoFields>({
    resolver: yupResolver(schema),
    values: {
      userNm: user?.userNm || '',
      phoneNo: user?.phoneNo || '',
      belongNm: user?.belongNm || '',
      deptNm: user?.deptNm || '',
      positionNm: user?.positionNm || '',
      tema: (user as any)?.tema || 'white',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MyInfoFields) =>
      authApi.put('/mypage', {
        id: user?.id,
        loginId: user?.loginId,
        ...data,
      }),
    onSuccess: async (res, variables) => {
      // 280 = SUCCESS_CHANGE_USER_INFO (백엔드가 사용자 정보 변경 성공 시 200 이 아닌 280 을 반환)
      if (res.data.resultCode === 200 || res.data.resultCode === 280) {
        toastSuccess('저장되었습니다.');
        onClose();
        // 세션을 갱신해야 ThemeApplier 가 테마(tema) 변경을 즉시 반영한다 (재로그인 불필요)
        await update({ user: { ...user, ...variables } });
      } else {
        toastError(res.data.resultMessage);
      }
    },
    onError: () => toastError('저장 중 오류가 발생했습니다.'),
  });

  const onValid: SubmitHandler<MyInfoFields> = (data) => {
    onClose();
    mutate(data);
  };

  return (
    <PopupLayout
      width={700}
      height={500}
      open={open}
      title="내 정보 수정"
      onClose={onClose}
      isEscClose={true}
      footer={
        <PopupFooter>
          <div className="btnArea right">
            <button className="btn btn_primary" onClick={handleSubmit(onValid)} disabled={isPending}>
              저장
            </button>
            <button className="btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </PopupFooter>
      }
    >
      <PopupContent>
        <PopupFormBox>
          <PopupFormGroup>
            <PopupFormType className="type1">
              <FormInput control={control} name="userNm" label="이름" required placeholder="이름을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="phoneNo" label="휴대전화" placeholder="010-0000-0000" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="belongNm" label="소속" required placeholder="소속을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="deptNm" label="부서" placeholder="부서를 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <FormInput control={control} name="positionNm" label="직책" placeholder="직책을 입력하세요" />
            </PopupFormType>
            <PopupFormType className="type1">
              <TemaRadio control={control} />
            </PopupFormType>
            <PopupFormType className="type1">
              <SeasonOrderSection open={open} />
            </PopupFormType>
          </PopupFormGroup>
        </PopupFormBox>
      </PopupContent>
      {isPending && <Loading />}
    </PopupLayout>
  );
};
