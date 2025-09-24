import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../../libs';
import Link from 'next/link';
import styles from '../../styles/layout/rightnav.module.scss';
import classNames from 'classnames/bind';
import { useQuery } from '@tanstack/react-query';
import { ApiResponseListLeftMenu } from '../../generated';

const cx = classNames.bind(styles);

// 메뉴 아이템의 인터페이스 정의
interface IMenu {
  menuNm?: string;
  menuCd?: string;
  iconClassName?: string;
  menuUri?: string;
  items?: Array<IMenu>;
}

interface Props {
  onClick?: React.MouseEventHandler<HTMLElement>;
}

// 하위 메뉴 존재 여부 확인 함수
const hasChildren = (item: IMenu) => {
  const { items: children } = item;
  if (children === undefined) {
    return false;
  }
  if (children.constructor !== Array) {
    return false;
  }
  if (!children.length) {
    return false;
  }
  return true;
};

// 메뉴 아이템 컴포넌트
const MenuItem = ({ item, setIsNavOn }: { item: IMenu; setIsNavOn: any }) => {
  return hasChildren(item) ? <MultiLevel item={item} setIsNavOn={setIsNavOn} /> : <SingleLevel item={item} />;
};

// 단일 레벨 메뉴 컴포넌트
const SingleLevel = ({ item }: { item: IMenu }) => {
  return (
    <li>
      <Link
        href={item.menuUri || ''}
        className={'acc_btn'}
        onClick={async () => {
          // closeSideMenu();
        }}
      >
        <span className={cx(item.iconClassName)}></span>
        <strong>{item.menuNm}</strong>
      </Link>
    </li>
  );
};

// 다중 레벨 메뉴 컴포넌트
const MultiLevel = ({ item, setIsNavOn }: { item: IMenu; setIsNavOn: any }) => {
  const { items: children } = item;
  const [isOpen, setIsOpen] = useState(false); // 메뉴 열림/닫힘 상태 추가

  // 메뉴 클릭 핸들러 추가
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <li className={`${styles.more} ${isOpen ? styles.on : ''}`}>
      <Link href={''} onClick={handleClick}>
        <span className={cx(item.iconClassName)}></span>
        <strong>{item.menuNm}</strong>
      </Link>
      <ul>
        {/*{isOpen && ( 20240912 hover시 2depth메뉴 안뜨는 문제로 인해 주석처리 */}
        {children?.map((child, key) => (
          <ChildLevel key={key} item={child} setIsNavOn={setIsNavOn} />
        ))}
        {/*)}*/}
      </ul>
    </li>
  );
};

// 하위 메뉴 컴포넌트
const ChildLevel = ({ item, setIsNavOn }: { item: IMenu; setIsNavOn: any }) => {
  const router = useRouter();
  const lastUri = !item.menuUri ? '' : item.menuUri;
  const isSelected = router.pathname === lastUri;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const openHeader = document.getElementsByClassName(`${router.pathname.split('/')[2]}`);

      // 마이페이지는 제외
      if (router.pathname !== '/mypage') {
        for (let i = 0; i < openHeader.length; i++) {
          openHeader[i].parentNode?.parentNode?.parentElement?.classList.add(styles.on);
        }
      }
    }
  }, [router.pathname]);

  return (
    <li>
      <Link
        className={`${isSelected ? styles.on : ''} ${lastUri.split('/')[2]}`}
        href={isSelected ? '#' : lastUri}
        onClick={(e) => {
          if (isSelected) {
            e.preventDefault();
          }
          setIsNavOn(false);
          localStorage.setItem('isNavOn', 'false');
        }}
      >
        {item.menuNm}
      </Link>
    </li>
  );
};

// 메인 RightNav 컴포넌트
export const RightNav = ({ onClick }: Props) => {
  // 네비게이션 상태 관리
  const [isNavOn, setIsNavOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isNavOn') === 'true';
    }
    return false;
  });
  const navRef = useRef<HTMLDivElement>(null);

  // 메뉴 데이터 가져오기
  const { data: menus, isFetching } = useQuery(['/menu/leftMenu'], () => authApi.get<ApiResponseListLeftMenu>('/menu/leftMenu'));

  // 네비게이션 토글 함수
  const toggleNav = () => {
    const newState = !isNavOn;
    setIsNavOn(newState);
    localStorage.setItem('isNavOn', newState.toString());
  };

  // 영역 외 클릭시 네비게이션 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNavOn(false);
        localStorage.setItem('isNavOn', 'false');
      }
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  return (
    <>
      <nav ref={navRef} className={`${styles.nav} ${isNavOn ? styles.on : ''}`} onClick={onClick}>
        <button onClick={toggleNav}>{isNavOn ? '열기' : '닫기'}</button>
        <ul>
          <li>
            <Link href={'/'}>
              <span className={styles.ico_dashboard}></span>
              <strong>대시보드</strong>
            </Link>
          </li>
          {menus && menus.data?.body?.map((item, key) => <MenuItem key={key} item={item} setIsNavOn={setIsNavOn} />)}
          {/* 스티커 아이콘 및 팝업 토글 기능 */}
        </ul>
      </nav>
      {/* 스티커 팝업 컴포넌트 조건부 렌더링 */}
    </>
  );
};
