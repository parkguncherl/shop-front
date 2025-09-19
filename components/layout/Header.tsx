import React, { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import styles from '../../styles/layout/header.module.scss';
import { appStoreContext } from '../../stores';
import { useAuthStore, useCommonStore, useMypageStore } from '../../stores';
import { authApi } from '../../libs';
import { Utils } from '../../libs/utils';
import { useRouter } from 'next/router';
import { toastError } from '../ToastMessage';
import { ApiResponseAuthResponseMenuAuth, ApiResponseListSelectFavorites, OrderDetCreate, StoreRequestReqCreate } from '../../generated';
import { useQuery } from '@tanstack/react-query';
import { TabMenu } from './TabMenu';
import { ko } from 'date-fns/locale';
import { ConfirmModal } from '../ConfirmModal';
import { useOrderStore } from '../../stores/useOrderStore';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { LOCAL_STORAGE_HISTORY } from '../../libs/const';
import Link from 'next/link';
import CustomShortcutButton, { COMMON_SHORTCUTS } from '../CustomShortcutButton';
import Mypage from './mypage/Mypage';

// 컴포넌트 Props 인터페이스 정의
interface Props {
  closed?: boolean;
  toggle: () => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

// Header 컴포넌트 정의
export const Header = ({ closed = false, toggle, onClick }: Props) => {
  // 상태 및 훅 초기화
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [logout] = useAuthStore((s) => [s.logout]);
  const [partnerBtnOnoff, setPartnerBtnOnoff] = useState(false);
  const partnerStoreRef = useRef<HTMLLIElement | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);
  const [partnerId, setPartnerId] = useState<number | undefined>(0);
  const [partnerNm, setPartnerNm] = useState('');
  const [setUpMenuNm, setMenuNm, setMenuUpdYn, setMenuExcelYn] = useCommonStore((s) => [s.setUpMenuNm, s.setMenuNm, s.setMenuUpdYn, s.setMenuExcelYn]);
  const [setFavoriteList] = useMypageStore((s) => [s.setFavoriteList]);
  const [waitCount] = useOrderStore((s) => [s.waitCount]);
  const delayTime = session?.user?.workYmd ? new Date(session?.user?.workYmd + 'T00:00:00') : new Date();
  const firstWorkYmd = session?.user?.firstWorkYmd ? new Date(session?.user?.firstWorkYmd + 'T00:00:00') : new Date();
  const [setHistoryList, isOrderOn, setIsOrderOn] = useCommonStore((s) => [s.setHistoryList, s.isOrderOn, s.setIsOrderOn]);

  // 메뉴 권한 체크 함수
  const authCheck = async () => {
    const result = await authApi.get<ApiResponseAuthResponseMenuAuth>('/auth/check/menu', {
      params: {
        menuUri: router.pathname,
      },
    });
    const { body, resultCode, resultMessage } = result.data;
    if (body) {
      if (body.menuReadYn === 'N') {
        toastError('해당메뉴[' + router.pathname + ']에 접근권한이 없습니다. (history 삭제)');
        localStorage.removeItem(LOCAL_STORAGE_HISTORY);
        setHistoryList([]);
        router.push('/', undefined, { shallow: true });
      } else {
        setUpMenuNm(body.upMenuNm || '');
        setMenuNm(body.menuNm || '');
        setMenuUpdYn(body.menuUpdYn === 'Y');
        setMenuExcelYn(body.menuExcelYn === 'Y');
      }
    } else {
      toastError('토큰이 만료되었습니다.');
      await logout(session?.user?.loginId ? session?.user?.loginId : '');
      await signOut({ redirect: true, callbackUrl: '/login' });
    }
  };

  // 컴포넌트가 로드될 때 메뉴 권한 확인
  useEffect(() => {
    authCheck();
  }, [router.pathname]);

  // 즐겨찾기 목록 가져오기
  const { data: favoriteData, isSuccess: isFavSuccess } = useQuery([], () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}));

  // 즐겨찾기 데이터가 변경될 때 상태 업데이트
  useEffect(() => {
    setFavoriteList(favoriteData?.data?.body ? favoriteData?.data?.body : []);
  }, [favoriteData?.data?.body, isFavSuccess, setFavoriteList]);

  // 날짜 변경 시 처리 함수
  const handleDateChange = async (date: Date) => {
    try {
      const response = await authApi.get('/auth/changeWorkYmd/' + Utils.toStringByFormatting(date));
      if (response.data.resultCode === 200) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            workYmd: Utils.toStringByFormatting(date),
          },
        });
      } else {
        toastError('입점일 이전으로는 시간을 변경할수없습니다.');
      }
    } catch (error) {
      console.error('Failed to update addTime:', error);
      toastError('시간 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    await logout(session?.user?.loginId ? session?.user?.loginId : '');
    await signOut({ redirect: true, callbackUrl: '/login' });
    appStoreContext.setState({
      session: undefined,
    });
  };

  // 파트너 버튼 토글 처리 함수
  const handlePartnerBtnOnoff = () => {
    if (session?.user.myPartners && session?.user.myPartners.length > 1) {
      setPartnerBtnOnoff(!partnerBtnOnoff);
    }
  };

  // 외부 클릭 시 파트너 버튼 닫기
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

  // 파트너 변경 처리 함수
  const handleChangePartner = async () => {
    const res = await authApi.get('/auth/changePartnerId/' + partnerId);
    if (res.data.resultCode === 200) {
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          partnerId: partnerId,
          partnerNm: partnerNm,
        },
      });
      location.reload();
    } else {
      toastError('도매변경에 실패했습니다.');
    }
  };

  // 특정 경로로 이동하는 함수
  const goWaitMng = () => {
    router.push('/oms/sims/notice');
  };

  // 마이페이지 state
  const [mypageState, setMypageState] = useState(false);

  // 헤더 컴포넌트 렌더링
  return (
    <header className={styles.header} onClick={onClick}>
      {/* 왼쪽 메뉴 및 사용자 정보 */}
      <div className={styles.left}>
        <h1>
          <CustomShortcutButton
            shortcut={COMMON_SHORTCUTS.logo}
            onClick={() => {
              setIsOrderOn(!isOrderOn);
            }}
            isButton={false}
          >
            <Link href={''}>logo</Link>
          </CustomShortcutButton>
        </h1>
        <ul>
          {/* 사용자 이름 표시 */}
          <CustomShortcutButton
            className={styles.ico_user}
            shortcut={COMMON_SHORTCUTS.mypage}
            isButton={false} // li로 사용
            onClick={() => {
              //router.push('/mypage/mypage');
              setMypageState(!mypageState);
            }}
            as="li" // 'li' 태그로 렌더링
          >
            {session?.user?.userNm || ''}
          </CustomShortcutButton>
          {/* 파트너 변경 버튼 */}
          <li className={`${styles.ico_store} ${partnerBtnOnoff ? styles.on : ''}`} ref={partnerStoreRef}>
            <button onClick={handlePartnerBtnOnoff}>{session?.user?.partnerNm || ''}</button>
            {session?.user && session.user.myPartners && session.user.myPartners.length > 0 && (
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
          {/* 날짜 및 시간 선택기 */}
          <li className={styles.ico_date}>
            <div className={styles.customButtonWrapper}>
              <DatePicker
                selected={new Date()}
                onChange={handleDateChange}
                dateFormat="MM/dd"
                locale={ko}
                customInput={
                  <button className={`${styles.customButton} ${Utils.isEqualDay(firstWorkYmd, delayTime) ? '' : styles.blinking}`}>
                    {format(delayTime, 'MM/dd (EE)', { locale: ko })}
                  </button>
                }
                calendarClassName="customCalendar"
                renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
                  <div className="datePickerHeader">
                    <button onClick={decreaseMonth}></button>
                    <span>
                      {date.getFullYear()}년 {date.getMonth() + 1}월
                    </span>{' '}
                    {/* 년도/월 순서로 표시 */}
                    <button onClick={increaseMonth}></button>
                  </div>
                )}
              />
            </div>
          </li>
        </ul>
      </div>
      {/* 탭 메뉴 */}
      <TabMenu router={router} />

      {/* 버튼 리스트 */}
      <div className={styles.right}>
        <ul>
          <li>
            {/* 대기 관리 버튼 */}
            <button className={`${styles.ico_alarm}`} onClick={goWaitMng}>
              알림
              {waitCount > 0 ? <span>{waitCount}</span> : ''}
            </button>
          </li>
          <li>
            <CustomShortcutButton
              className={styles.ico_logout}
              shortcut={COMMON_SHORTCUTS.logout}
              onClick={() => {
                setLogoutConfirmModal(true);
              }}
              isButton={true}
            >
              로그아웃
            </CustomShortcutButton>
          </li>
        </ul>
      </div>

      {/* 마이페이지 */}
      <Mypage className={`${mypageState ? 'on' : ''}`} setMypageState={setMypageState} />

      {/* 파트너 변경 확인 모달 */}
      <ConfirmModal
        title={'도매 변경시 화면이 초기화 됩니다. \n도매를 변경하시겠습니까?'}
        open={confirmModal}
        onConfirm={handleChangePartner}
        onClose={() => setConfirmModal(false)}
      />
      <ConfirmModal
        className={'logout'}
        title={'빈블러 시스템을 종료할까요?'}
        confirmText={'종료하기'}
        open={logoutConfirmModal}
        onConfirm={handleLogout}
        onClose={() => {
          setLogoutConfirmModal(false);
        }}
      />
    </header>
  );
};
