import React, { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import styles from '../../styles/layout/header.module.scss';
import { Button } from '../Button';
import Link from 'next/link';
import useAppStore, { appStoreContext } from '../../stores/useAppStore';
import { useAuthStore, useCommonStore, useMypageStore } from '../../stores';
import { authApi } from '../../libs';
import { useRouter } from 'next/router';
import { toastError } from '../ToastMessage';
import { ApiResponseAuthResponseMenuAuth, ApiResponseListSelectFavorites } from '../../generated';
import { useQuery } from '@tanstack/react-query';
import { TabMenu } from './TabMenu';
import { TabMenu2 } from './TabMenu2';
import { ConfirmModal } from '../ConfirmModal';

interface Props {
  closed?: boolean;
  toggle: () => void;
}

export const HeaderWms = ({ closed = false, toggle }: Props) => {
  const router = useRouter();
  const { session } = useAppStore();
  const [logout] = useAuthStore((s) => [s.logout]);
  /** 공통 스토어 - State */
  const [setUpMenuNm, setMenuNm, setMenuUpdYn, setMenuExcelYn] = useCommonStore((s) => [s.setUpMenuNm, s.setMenuNm, s.setMenuUpdYn, s.setMenuExcelYn]);
  const [setFavoriteList] = useMypageStore((s) => [s.setFavoriteList]);
  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);

  const authCheck = async () => {
    const result = await authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
      params: {
        menuUri: router.pathname,
      },
    });
    const { body, resultCode, resultMessage } = result.data;
    if (body) {
      if (body.menuReadYn === 'N') {
        toastError('비정상적인 접근입니다2.');
        await logout(session?.user?.loginId ? session?.user?.loginId : '');
        await signOut({ redirect: true, callbackUrl: '/login' });
      } else {
        setUpMenuNm(body.upMenuNm || '');
        setMenuNm(body.menuNm || '');
        setMenuUpdYn(body.menuUpdYn === 'Y');
        setMenuExcelYn(body.menuExcelYn === 'Y');
      }
    } else {
      toastError(' wms 비정상적인 접근입니다3.');
      await logout(session?.user?.loginId ? session?.user?.loginId : '');
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  const { data: favoriteData, isSuccess: isFavSuccess } = useQuery([], () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}));

  // 즐겨찾기 데이터가 변경될 때 상태 업데이트
  useEffect(() => {
    setFavoriteList(favoriteData?.data?.body ? favoriteData?.data?.body : []);
  }, [favoriteData?.data?.body, isFavSuccess, setFavoriteList]);

  useEffect(() => {
    authCheck();
  }, [router.pathname]);

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await logout(session?.user?.loginId ? session?.user?.loginId : '');
    await signOut({ redirect: true, callbackUrl: '/login' });
    appStoreContext.setState({
      session: undefined,
    });
  };

  return (
    <header className={`${styles.header} ${styles.wmsHeader}`}>
      <div className={styles.left}>
        <h1>
          <Link href={'/wmsIndex'}>{'logo'}</Link>
        </h1>
      </div>
      <TabMenu router={router} />
      <div className={styles.right}>
        <button title={'로그아웃'} onClick={handleLogout}>
          {'로그아웃'}
        </button>
      </div>
      <ConfirmModal
        title={'빈블러 시스템을 종료할까요?'}
        open={logoutConfirmModal}
        onConfirm={handleLogout}
        onClose={() => {
          setLogoutConfirmModal(false);
        }}
      />
    </header>
  );
};
