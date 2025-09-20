import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../../libs';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiResponseListCodeDropDown, ApiResponseListLeftMenu, ApiResponseListLogisCodeDropDown, LogisCodeDropDown } from '../../generated';
import Loading from '../Loading';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { DEFAULT_ADD_HOURE } from '../../libs/const';
import useAppStore from '../../stores/useAppStore';
import { Utils } from '../../libs/utils';
import { toastError } from '../ToastMessage';
import data from '@react-google-maps/api/src/components/drawing/Data';

interface IMenu {
  menuNm?: string;
  menuCd?: string;
  iconClassName?: string;
  menuUri?: string;
  items?: Array<IMenu>;
}

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

const MenuItem = ({ item }: { item: IMenu }) => {
  return hasChildren(item) ? <MultiLevel item={item} /> : <SingleLevel item={item} />;
};

/** 단독 메뉴 */
const SingleLevel = ({ item }: { item: IMenu }) => {
  return (
    <li>
      <Link
        href={item.menuUri || ''}
        onClick={async () => {
          closeSideMenu();
        }}
      >
        <span className={item.iconClassName}></span>
        <strong>{item.menuNm}</strong>
      </Link>
    </li>
  );
};

/** 하위 메뉴가 있는 메뉴 */
const MultiLevel = ({ item }: { item: IMenu }) => {
  const { items: children } = item;
  const router = useRouter();
  const isSelected = false;

  const bigUri = !item.menuUri ? '' : item.menuUri;

  /*if (router.pathname) {
    if (bigUri == router.pathname.split('/')[1]) {
      isSelected = true;
    }
  }*/
  // url 직접 들어왔을때 대메뉴 활성화 끝

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const aSide = e.currentTarget;

    // parentNode가 Element인지 확인하는 타입 가드 함수
    const isElement = (node: Node): node is Element => {
      return node.nodeType === node.ELEMENT_NODE;
    };

    const parent = aSide.parentNode;
    if (parent && isElement(parent)) {
      if (parent.classList.contains('on')) {
        parent.classList.remove('on');
      } else {
        // 모든 nav li 요소의 'on' 클래스를 제거
        if (typeof window !== 'undefined') {
          document.querySelectorAll('nav li').forEach((item: Element) => {
            item.classList.remove('on');
          });
          parent.classList.add('on');
        }
      }
    }
  };

  return (
    <li className={`${isSelected ? 'on' : ''}`}>
      <Link href={''} onClick={(e) => handleClick(e)}>
        <span className={item.iconClassName}></span>
        <strong>{item.menuNm}</strong>
      </Link>
      <ul>
        {children?.map((child, key) => (
          <ChildLevel key={key} item={child} />
        ))}
      </ul>
    </li>
  );
};

/** 메뉴 닫기 */
const closeSideMenu = () => {
  if (typeof window !== 'undefined') {
    const openSideMenu = document.querySelectorAll('nav li.on');

    for (let i = 0; i < openSideMenu.length; i++) {
      openSideMenu[i].classList.remove('on');
    }
  }
};

/** 하위 메뉴 링크 */
const ChildLevel = ({ item }: { item: IMenu }) => {
  const router = useRouter();
  const lastUri = !item.menuUri ? '' : item.menuUri;
  let isSelected = false;
  let routerPathname = router.pathname;
  // _ 로 연결된 하위메뉴도 style 적용받게하기위해
  if (routerPathname.indexOf('_') > -1) {
    routerPathname = routerPathname.substring(0, routerPathname.indexOf('_'));
  }

  if (routerPathname === lastUri) {
    isSelected = true;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // const openHeader = document.getElementsByClassName(`${headerStyles.menu_slide_btn} ${headerStyles.on}`);

    const aSide: HTMLAnchorElement = e.currentTarget;
    //aSide.parentNode?.parentNode?.classList.remove('on');
  };

  useEffect(() => {
    closeSideMenu();

    if (typeof window !== 'undefined') {
      const openHeader = document.getElementsByClassName(`${router.pathname.split('/')[2]}`);

      // 마이페이지는 제외
      if (router.pathname !== '/mypageForWms') {
        for (let i = 0; i < openHeader.length; i++) {
          openHeader[i].parentNode?.parentNode?.parentElement?.classList.add('on');
        }
      }
    }
  }, [router.pathname]);

  return (
    <li>
      <Link
        className={`${isSelected ? 'on' : ''} ${lastUri.split('/')[2]}`}
        href={router.pathname === lastUri ? '#' : lastUri}
        onClick={(e) => {
          handleClick(e);
          if (router.pathname === lastUri) {
            router.push(item.menuUri || '');
          }
        }}
      >
        {item.menuNm}
      </Link>
    </li>
  );
};

interface Props {
  closed?: boolean;
}

export const LeftNav = ({ closed = false }: Props) => {
  const [nowTime, setNowTime] = useState(new Date());
  const [delayTime, setDelaytime] = useState(new Date());
  const { data: session, update: updateSession } = useSession();
  // 센터관련
  const initialCenters = [''];
  const [selectedCenter, setSelectedCenter] = useState(initialCenters[0]);
  const [centers, setCenters] = useState(initialCenters.slice(1));
  const [centerOn, setCenterOn] = useState(false);
  const centerRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (centerRef.current && !centerRef.current.contains(event.target as Node)) {
        // 클릭한 요소가 centerRef 내부가 아닐 경우
        setCenterOn(false); // 영역 외 클릭 시 centerOn을 false로 설정
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [centerRef]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      now.setHours(now.getHours() - (session?.user?.addTime ? session?.user?.addTime : DEFAULT_ADD_HOURE));
      setDelaytime(now);
      setNowTime(new Date());
    }, 1000);
  }, []);

  const sessions = useSession();
  const { data: menus, isFetching } = useQuery(['/menu/leftMenu'], () => authApi.get<ApiResponseListLeftMenu>('/menu/leftMenu'), {
    enabled: sessions.status === 'authenticated',
  });

  const { data: logisDropDown, isSuccess } = useQuery(['/logis/dropdown'], () => authApi.get<ApiResponseListLogisCodeDropDown>('/logis/dropdown'), {
    enabled: sessions.status === 'authenticated',
  });

  useEffect(() => {
    console.log(logisDropDown);
  }, [isSuccess]);

  if (isFetching) {
    return <Loading />;
  }

  // 센터 관련
  const handleCenterBtn = () => {
    setCenterOn(!centerOn);
  };
  const handleDdClick = async (logisId: string, logisNm: string) => {
    // 이전 선택을 dd 목록에 다시 추가
    setCenters((prevCenters) => [...prevCenters, selectedCenter].sort());
    // 선택된 항목을 dt로 이동시키고 dd 목록에서 제거
    setSelectedCenter(logisId);
    setCenters((prevCenters) => prevCenters.filter((c) => c !== logisId));
    handleCenterBtn();
    const response = await authApi.get<ApiResponseListCodeDropDown>('/auth/changeLogisId/' + logisId);
    if (response.data.resultCode === 200) {
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          workLogisId: logisId,
          workLogisNm: logisNm,
        },
      });
    } else {
      toastError('시간 업데이트에 실패했습니다.');
    }
  };

  return (
    <aside className={`${closed ? 'on' : ''}`}>
      <ul>
        <li
          className="ico_user"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/mypage/mypageForWms';
            }
          }}
        >
          {session?.user?.userNm || ''}
        </li>
        <li className={`ico_mulyu ${centerOn ? 'on' : ''}`} ref={centerRef}>
          <dl>
            <dt onClick={handleCenterBtn}>{session?.user.workLogisNm}</dt>
            {logisDropDown?.data.body &&
              logisDropDown.data.body
                .filter((data) => data?.codeCd !== session?.user.workLogisId)
                .map((data, index) => (
                  <dd key={index} onClick={() => handleDdClick(data?.codeCd || '', data?.codeNm || '')} aria-selected={true}>
                    {data.codeNm}
                  </dd>
                ))}
          </dl>
          <button onClick={handleCenterBtn}>
            <span></span>
          </button>
        </li>
        <li className="ico_date">
          <div>
            <span>{format(delayTime, 'M/d')}</span>
            <span>{format(nowTime, 'M/d(EEE) HH:mm:ss', { locale: ko })}</span>
          </div>
        </li>
      </ul>
      <nav>
        <ul>{menus && menus.data?.body?.map((item, key) => <MenuItem key={key} item={item} />)}</ul>
      </nav>
    </aside>
  );
};
