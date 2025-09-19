import React, { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from '../../styles/layout/header.module.scss';
import { Button } from '../Button';
import { appStoreContext } from '../../stores';
import { useAuthStore, useCommonStore, useMypageStore } from '../../stores';
import { authApi } from '../../libs';
import { useRouter } from 'next/router';
import { toastError } from '../ToastMessage';
import { ApiResponseAuthResponseMenuAuth, ApiResponseListSelectFavorites } from '../../generated';
import { useQuery } from '@tanstack/react-query';
import { TabMenu } from './TabMenu';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DEFAULT_ADD_HOURE } from '../../libs/const';
import { ConfirmModal } from '../ConfirmModal';
import { useOrderStore } from '../../stores/useOrderStore';
import Link from 'next/link';

interface Props {
  closed?: boolean;
  toggle: () => void;
  handleOrderView: () => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

export const Header = ({ closed = false, toggle, handleOrderView, onClick }: Props) => {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [logout] = useAuthStore((s) => [s.logout]);
  const [nowTime, setNowTime] = useState(new Date());
  const [delayTime, setDelaytime] = useState(new Date());
  const [partnerBtnOnoff, setPartnerBtnOnoff] = useState(false);
  const partnerStoreRef = useRef<HTMLLIElement | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [partnerId, setPartnerId] = useState<number | undefined>(0);
  const [partnerNm, setPartnerNm] = useState('');
  /** 공통 스토어 - State */
  const [setUpMenuNm, setMenuNm, setMenuUpdYn, setMenuExcelYn] = useCommonStore((s) => [s.setUpMenuNm, s.setMenuNm, s.setMenuUpdYn, s.setMenuExcelYn]);
  const [setFavoriteList] = useMypageStore((s) => [s.setFavoriteList]);
  const [waitCount] = useOrderStore((s) => [s.waitCount]);

  const authCheck = async () => {
    const result = await authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
      params: {
        menuUri: router.pathname,
      },
    });
    const { body, resultCode, resultMessage } = result.data;
    if (body) {
      if (body.menuReadYn === 'N') {
        toastError('해당메뉴에 접근권한이 없습니다!!!!!!');
        //        await logout(session?.user?.loginId ? session?.user?.loginId : '');
        //        await signOut({ redirect: true, callbackUrl: '/login' });
      } else {
        setUpMenuNm(body.upMenuNm || '');
        setMenuNm(body.menuNm || '');
        setMenuUpdYn(body.menuUpdYn === 'Y');
        setMenuExcelYn(body.menuExcelYn === 'Y');
      }
    } else {
      toastError('토큰이 만료되었습니다!!');
      await logout(session?.user?.loginId ? session?.user?.loginId : '');
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  const {
    data: favoriteData,
    refetch: favRefetch,
    isSuccess: isFavSuccess,
  } = useQuery([], () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}));

  useEffect(() => {
    authCheck();
  }, [router.pathname]);

  useEffect(() => {
    setFavoriteList(favoriteData?.data?.body ? favoriteData?.data?.body : []);
  }, [favoriteData?.data?.body, isFavSuccess, setFavoriteList]);

  useEffect(() => {
    favRefetch();
    const timer = setInterval(() => {
      const now = new Date();
      now.setHours(now.getHours() - (session?.user?.addTime ? session?.user?.addTime : DEFAULT_ADD_HOURE));
      setDelaytime(now);
      setNowTime(new Date());
    }, 1000);
  }, []);

  // 파트너 스토어 버튼
  const handlePartnerBtnOnoff = () => {
    // 도매리스트가 있다면
    if (session?.user.myPartners && session?.user.myPartners.length > 1) {
      setPartnerBtnOnoff(!partnerBtnOnoff);
    }
  };
  // 영역 외 클릭시 닫기
  const handleClickOutside = (event: MouseEvent) => {
    if (partnerStoreRef.current && !partnerStoreRef.current.contains(event.target as Node)) {
      setPartnerBtnOnoff(false);
    }
  };
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  const handleChangePartner = async () => {
    const res = await authApi.get('/auth/changePartnerId/' + partnerId);
    if (res.data.resultCode === 200) {
      const result = await update({
        ...session,
        user: {
          ...session?.user,
          partnerId: partnerId,
          partnerNm: partnerNm,
        },
      });
    } else {
      toastError('도매변경에 실패했습니다.');
    }
  };

  const goWaitMng = () => {
    router.push('/orderTran/boryu');
  };

  return (
    <header className={styles.header} onClick={onClick}>
      <div className={styles.left}>
        <h1>
          <Link href={''} onClick={handleOrderView}>
            logo
          </Link>
        </h1>
        <ul>
          <li
            className={styles.ico_user}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/mypage/mypage';
              }
            }}
          >
            {session?.user?.userNm || ''}
          </li>
          <li className={`${styles.ico_store} ${partnerBtnOnoff ? styles.on : ''}`} ref={partnerStoreRef}>
            <button onClick={handlePartnerBtnOnoff}>{session?.user?.partnerNm || ''}</button>
            {session?.user.myPartners && session?.user.myPartners.length > 0 && (
              <ul>
                {session.user.myPartners.map((data, index) => (
                  <li key={'PARTNER_LIST_' + index} hidden={session?.user.partnerId === data.id}>
                    <button
                      onClick={() => {
                        setPartnerId(data.id);
                        setPartnerNm(data?.partnerNm || '');
                        setConfirmModal(true);
                      }}
                    >
                      {data?.partnerNm}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className={styles.ico_date}>
            {format(delayTime, 'M/d')}
            <span> </span>
            {format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}
          </li>
        </ul>
        <button className={waitCount > 0 ? styles.on : styles.on} onClick={goWaitMng}>
          <span>{waitCount}</span> {/* todo 대기 건수가 아닌 알림검수(물류에서 오는 으로 변경예정) */}
        </button>
      </div>
      <TabMenu router={router} />
      <div className={styles.right}>
        <button
          title={'로그아웃'}
          onClick={async () => {
            await logout(session?.user?.loginId ? session?.user?.loginId : '');
            await signOut({ redirect: true, callbackUrl: '/login' });
            appStoreContext.setState({
              session: undefined,
            });
          }}
        >
          {'로그아웃'}
        </button>
        <ConfirmModal title={'도매를 변경하시겠습니까?'} open={confirmModal} onConfirm={handleChangePartner} onClose={() => setConfirmModal(false)} />
      </div>
    </header>
  );
};
