import React, { useEffect, useRef, useState } from 'react';
import styles from '../../styles/layout/layout.module.scss';
import { Header, OrderReg, RightNav } from './index';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Loading from '../Loading';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../libs';
import { ApiResponseAuthResponseMenuAuth } from '../../generated';
import useAppStore from '../../stores/useAppStore';
import { LOCAL_STORAGE_HISTORY, LOCAL_STORAGE_WMS_HISTORY } from '../../libs/const';
import { LeftNav } from './LeftNav';
import { HeaderWms } from './HeaderWms';
import Head from 'next/head';
import { useCommonStore } from '../../stores';
import { HeaderDesignMobile } from './HeaderDesignMobile';

interface Props {
  children: React.ReactNode;
}

type MenuHistory = {
  histMenuUri: string;
  histMenuNm: string;
  histParamList: [MenuParam];
};

type MenuParam = {
  paramNm: string;
  paramValue: string;
};

export const Layout = ({ children }: Props) => {
  const router = useRouter();
  const [closed, setClosed] = useState<boolean>(false);
  const session = useSession();
  const { session: storeSession } = useAppStore();
  const [authGroupCd] = useState<string>(session.data?.user?.authCd ? session.data?.user.authCd?.substring(0, 1) : '');
  const [isMobile] = useState<boolean>(session.data?.user?.isMobileLogin === 'Y');
  const menuHistoryRef = useRef<MenuHistory>({
    histMenuNm: '',
    histMenuUri: '',
    histParamList: [{ paramNm: '', paramValue: '' }],
  });
  /** 공통 스토어 - State */
  const [setHistoryList, isOrderOn, setIsOrderOn] = useCommonStore((s) => [s.setHistoryList, s.isOrderOn, s.setIsOrderOn]);
  const isMatch = useRef(false);

  const {
    data: menuAuthList,
    isLoading,
    isSuccess: isMenuCheckSuccess,
  } = useQuery(
    ['/auth/check/menu', router.pathname],
    () =>
      authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
        params: {
          menuUri: router.pathname,
        },
      }),
    {
      enabled: !!storeSession?.user,
    },
  );

  /**
   * 히스토리탭에서 사용되는 uri 목록 생성
   * */
  useEffect(() => {
    if (menuAuthList && menuAuthList.data && menuAuthList.data.body && menuAuthList.data.body.menuNm) {
      const history: MenuHistory[] = JSON.parse(localStorage.getItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY) || '[]');
      menuHistoryRef.current.histMenuNm = menuAuthList.data.body.menuNm;
      menuHistoryRef.current.histMenuUri = router.pathname;
      const historyListData: MenuHistory[] = [];
      // 히스토리가 없는경우
      if (!history || history.length === 0) {
        if (menuAuthList.data.body.menuNm !== 'mainPage') {
          // 메인페이지는  추가 하지 않는다.
          historyListData.push(JSON.parse(JSON.stringify(menuHistoryRef.current)));
          localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(historyListData));
          setHistoryList(historyListData);
          // 기존히스토리가 있는경우는 중복체크해서 없는것만 추가된다.
        }
      } else {
        if (menuAuthList.data.body.menuNm !== 'mainPage') {
          isMatch.current = false;
          for (let i = 0; i < history.length; i++) {
            if (history[i].histMenuUri === menuHistoryRef.current.histMenuUri) {
              isMatch.current = true;
              break;
            }
          }

          if (!isMatch.current) {
            // 기존에 열린 목록과 일치하는것이 하나도 없으면 새로운 페이지임
            history.unshift(JSON.parse(JSON.stringify(menuHistoryRef.current)));
            localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(history));
          }
        }
        setHistoryList(history);
      }
    }
  }, [isMenuCheckSuccess, menuAuthList, router.pathname]);

  if (session.status === 'loading') {
    return <Loading />;
  }

  if (!session?.data || authGroupCd === '') {
    router.push('/login', undefined, { shallow: true });
  }

  // body에 class 부여
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bodyClassList = document.querySelector('body')?.classList;
      if (authGroupCd === '3' && !isMobile) {
        bodyClassList?.remove('wms');
        bodyClassList?.add('oms');
      } else if (authGroupCd === '3' && isMobile) {
        bodyClassList?.remove('oms');
        bodyClassList?.remove('wms');
      } else {
        bodyClassList?.remove('oms');
        bodyClassList?.add('wms');
      }
    }
  }, [authGroupCd]);

  if (authGroupCd === '3' && !isMobile) {
    // oms 사용자
    return (
      <>
        {session.status === 'authenticated' && !isLoading && (
          <div className={`omsLayout ${styles.layout} ${isOrderOn ? 'isOrderOn' : ''}`}>
            <Head>
              <title>BINBLUR OMS</title>
            </Head>
            <Header
              closed={closed}
              toggle={() => setClosed(!closed)}
              onClick={() => {
                localStorage.setItem('OMS_AREA', 'OTHER');
              }}
            />
            <div className={`container ${styles.container} ${closed ? styles.on : ''}`}>
              <OrderReg
                onClick={() => {
                  localStorage.setItem('OMS_AREA', 'ORDER');
                }}
              />
              <div
                className={`content ${styles.content}`}
                onClick={() => {
                  localStorage.setItem('OMS_AREA', 'OTHER');
                }}
              >
                {children}
              </div>
              <RightNav
                onClick={() => {
                  localStorage.setItem('OMS_AREA', 'OTHER');
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  } else if (authGroupCd === '3' && isMobile) {
    // admin wms 사용자
    return (
      <>
        {session.status === 'authenticated' && !isLoading && (
          <div>
            <Head>
              <title>BINBLUR MOBILE</title>
            </Head>
            <HeaderDesignMobile closed={closed} toggle={() => setClosed(!closed)} />
            <div>
              <div>{children}</div>
            </div>
          </div>
        )}
      </>
    );
  } else {
    // admin wms 사용자
    return (
      <>
        {session.status === 'authenticated' && !isLoading && (
          <div className={`wmsLayout ${styles.layout}`}>
            <Head>
              <title>BINBLUR WMS</title>
            </Head>
            <HeaderWms closed={closed} toggle={() => setClosed(!closed)} />
            <div className={`container ${styles.container} ${closed ? styles.on : ''}`}>
              <LeftNav />
              <div className={`content ${styles.content}`}>{children}</div>
            </div>
          </div>
        )}
      </>
    );
  }
};
