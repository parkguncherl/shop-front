import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { LOCAL_STORAGE_HISTORY, LOCAL_STORAGE_WMS_HISTORY } from '../../libs/const';
import { useCommonStore, useMypageStore, HistoryType } from '../../stores';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess } from '../ToastMessage';
import { ApiResponseListSelectFavorites, SelectFavorites } from '../../generated';
import { authApi } from '../../libs';
import { ReactSortable, SortableEvent } from 'react-sortablejs';

interface Props {
  router: any;
}

type MenuHistory = {
  histMenuUri: string;
  histMenuNm: string;
  histParamList: [];
};
export const TabMenu = forwardRef<{ closeAllTabs: () => void }, Props>(({ router }, ref) => {
  const session = useSession();
  const [favoriteBtn, setFavoriteBtn] = useState(false); // 즐겨찾기 onoff
  const [historyList, setHistoryList] = useCommonStore((s) => [s.historyList, s.setHistoryList]);
  const [activeIndex, setActiveIndex] = useState<number | null>(0); // 활성화 탭
  const [translateXValue, setTranslateXValue] = useState<number>(0); // 왼쪽 오른쪽 이동
  const listRef = useRef<HTMLDivElement>(null); // list Ref 생성
  const listDivRef = useRef<HTMLDivElement>(null); // 전체 list div Ref 생성
  const [maxTranslateX, setMaxTranslateX] = useState<number>(0); // 최대 이동 범위
  const [divWidth, setDivWidth] = useState<number>(0); // 최대 이동 범위
  const containerRef = useRef<HTMLDivElement>(null); // 즐겨찾기 div 영역
  const [isButtonVisible, setIsButtonVisible] = useState<any>(true); // 즐겨찾기영역 이동 버튼
  const [favoriteList, setFavoriteList, regFavoritesAll] = useMypageStore((s) => [s.favoriteList, s.setFavoriteList, s.regFavoritesAll]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
  const [authGroupCd] = useState<string>(session.data?.user?.authCd ? session.data?.user.authCd?.substring(0, 1) : '');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null); // Hover 상태 관리
  const [localStorageHistory] = useState<string>(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY);

  // 로컬스토리지 업데이트
  const updateHistoryListInStorage = (updatedList: HistoryType[]) => {
    localStorage.setItem(localStorageHistory, JSON.stringify(updatedList));
  };

  interface ExtendedSortableEvent extends SortableEvent {
    originalEvent: DragEvent;
  }

  const dragStart = (event: ExtendedSortableEvent) => {
    const idx = event.oldIndex ?? -1; // 드래그 시작 시의 인덱스
    if (idx >= 0) {
      setActiveIndex(idx); // 드래깅 인덱스 업데이트
    }
  };

  // 드래그가 끝났을 때 최종 처리
  const dragEnd = (event: SortableEvent) => {
    const startIndex = event.oldIndex ?? -1; // 드래그 시작 인덱스
    const endIndex = event.newIndex ?? -1; // 드래그 끝 인덱스

    if (startIndex >= 0 && endIndex >= 0 && startIndex !== endIndex) {
      const updatedList = [...list];
      const [movedItem] = updatedList.splice(startIndex, 1); // 시작 인덱스에서 아이템 제거
      updatedList.splice(endIndex, 0, movedItem); // 끝 인덱스에 아이템 삽입

      setList(updatedList); // 리스트 상태 업데이트
      updateHistoryListInStorage(updatedList);
      // 드래그 종료된 페이지로 이동
      router.push(updatedList[endIndex].histMenuUri);
    }

    // 최종 드래깅한 아이템에 on 클래스 추가
    setActiveIndex(endIndex);
  };

  // 즐겨찾기 버튼
  const handleFavoriteBtnOnOff = () => {
    setFavoriteBtn(!favoriteBtn);
  };

  // 즐겨찾기 영역 외 클릭시 닫기
  useEffect(() => {
    // 컴포넌트가 마운트될 때 클릭 이벤트 리스너를 추가
    const handleClickOutside = (event: MouseEvent) => {
      // containerRef가 유효하고, 클릭된 요소가 containerRef의 외부에 있으면 드롭다운을 닫음
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFavoriteBtn(false);
      }
    };
    // document에 클릭 이벤트 리스너를 등록
    if (typeof window !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
    }
    // 컴포넌트가 언마운트될 때 클릭 이벤트 리스너를 제거
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('click', handleClickOutside);
      }
    };
  }, []);

  // 활성화 탭
  const handleActivateItem = (index: number, histMenuUri: string) => {
    //setActiveIndex(index); // 활성화된 div의 인덱스 업데이트
    updateButtonVisibility();
    if (histMenuUri !== router.pathname) {
      setActiveIndex(index);
      router.push(histMenuUri || '');
    }
  };

  // 현재 URI와 같은 histMenuUri를 가진 탭을 찾아 활성화
  useEffect(() => {
    const foundIndex = historyList.findIndex((item) => item.histMenuUri === router.pathname);
    if (foundIndex !== -1) {
      setActiveIndex(foundIndex);
    } else {
      setActiveIndex(null); // 현재 URI와 일치하는 히스토리 탭이 없으면 activeIndex를 null로 설정
    }
  }, [router.pathname, historyList]);

  // 닫기
  const closeHistory = (index: number) => {
    updateButtonVisibility();
    // 리스트에서 선택된 히스토리를 삭제
    const updatedList = historyList.filter((_, idx) => idx !== index);
    setHistoryList(updatedList);

    // 로컬 스토리지에 업데이트된 리스트 저장
    updateHistoryListInStorage(updatedList);

    // 남은 히스토리가 없으면 홈 페이지로 이동
    if (updatedList.length === 0) {
      router.push('/');
    } else {
      // 다음 히스토리가 있을 경우 해당 히스토리의 uri로 이동
      const nextIndex = index < updatedList.length ? index : updatedList.length - 1;
      const nextHistMenuUri = updatedList[nextIndex].histMenuUri;
      router.push(nextHistMenuUri);
    }
  };

  // 즐겨찾기 링크
  const handleFavoriteLink = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, menuUri: string | undefined) => {
    e.preventDefault();
    if (menuUri) {
      router.push(menuUri);
    }
  };

  // 즐겨찾기 링크
  const handleFavoriteAllOpen = () => {
    localStorage.removeItem(localStorageHistory);
    // 컨텍스트 메뉴 닫기
    closeContextMenu();
    // 상태 초기화
    const favHistoryList = favoriteList.map((menu: SelectFavorites) => ({
      histMenuNm: menu.menuNm,
      histMenuUri: menu.menuUri,
      histParamList: [],
    }));
    localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(favHistoryList));
    //setHistoryList(favHistoryList && []);
    location.reload();
  };

  // listRef와 listDivRef 크기 비교
  const updateButtonVisibility = () => {
    if (listRef.current && listDivRef.current) {
      const listWidth = listRef.current.offsetWidth;
      const divWidth = listDivRef.current.offsetWidth;
      // listRef가 listDivRef보다 크면 버튼 표시, 아니면 숨기기
      setIsButtonVisible(listWidth > divWidth);
      // 최대 이동 범위와 외부 div 크기 업데이트
      setMaxTranslateX(listWidth);
      setDivWidth(divWidth);
    }
  };

  // 초기 렌더링 및 창 크기 변경 이벤트 처리
  useEffect(() => {
    const updateVisibility = () => {
      updateButtonVisibility();
    };

    // 초기 계산을 약간 지연
    setTimeout(updateVisibility, 0);

    // 창 크기 변경 이벤트 추가
    window.addEventListener('resize', updateButtonVisibility);

    // cleanup 함수
    return () => {
      window.removeEventListener('resize', updateButtonVisibility);
    };
  }, []);

  const moveLeft = () => {
    if (translateXValue === 0) return; // 이미 최대값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue + 175; // 오른쪽으로 이동
    setTranslateXValue(Math.min(0, newValue)); // 최대값을 0으로 제한
  };

  const moveRight = () => {
    if (translateXValue <= -maxTranslateX + divWidth) return; // 이미 최소값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue - 175; // 왼쪽으로 이동
    setTranslateXValue(Math.max(-maxTranslateX + divWidth, newValue)); // 최소값을 -maxTranslateX + divWidth로 제한
  };

  // 모든탭 닫기
  const closeAllTabs = () => {
    // 로컬 스토리지에서 히스토리 제거
    localStorage.removeItem(localStorageHistory);
    // 컨텍스트 메뉴 닫기
    closeContextMenu();
    // 상태 초기화
    setHistoryList([]);
    setActiveIndex(null);
    router.push('/', undefined, { shallow: true });
  };

  const {
    data: favoriteData,
    refetch: favRefetch,
    isSuccess: isFavSuccess,
  } = useQuery([], () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}));

  useEffect(() => {
    setFavoriteList(favoriteData?.data?.body ? favoriteData?.data?.body : []);
  }, [favoriteData?.data?.body, isFavSuccess, setFavoriteList]);

  const { mutate: regFavoritesAllMutate } = useMutation(regFavoritesAll, {
    onSuccess: async (e) => {
      const { resultCode, body, resultMessage } = e.data;
      try {
        if (resultCode === 200) {
          toastSuccess('즐겨찾기 등록에 성공했습니다.');
          favRefetch();
        } else {
          console.log(e);
          toastError('등록 과정 중 문제 발생');
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  const makeFavorite = async () => {
    const history: MenuHistory[] = JSON.parse(localStorage.getItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY) || '[]');
    const historyArray: string[] = history.map((menu) => menu.histMenuUri); // Assuming 'name' is a string property in MenuHistory
    regFavoritesAllMutate({ menuUris: historyArray });
  };

  // useImperativeHandle 추가
  useImperativeHandle(ref, () => ({
    closeAllTabs,
    closeOtherTabs,
  }));

  // 우클릭 전체 닫기 이벤트
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };

  // 현재 탭을 제외한 다른 모든 탭 닫기
  const closeOtherTabs = () => {
    if (activeIndex !== null) {
      const currentTab = historyList[activeIndex];
      const updatedList = [currentTab];
      setHistoryList(updatedList);
      updateHistoryListInStorage(updatedList);
      closeContextMenu();
      setActiveIndex(0);
    } else {
      console.log('활성화된 탭이 없습니다.');
      closeAllTabs();
    }
  };
  // 현재 탭의 오른쪽에 있는 모든 탭 닫기
  const closeRightTabs = () => {
    if (activeIndex !== null) {
      // 현재 탭까지만 유지하고 나머지 오른쪽 탭들은 제거
      const updatedList = historyList.slice(0, activeIndex + 1);
      setHistoryList(updatedList);
      updateHistoryListInStorage(updatedList);
      closeContextMenu();
    }
  };

  // 현재 탭의 왼쪽에 있는 모든 탭 닫기
  const closeLeftTabs = () => {
    if (activeIndex !== null) {
      // 현재 탭부터 끝까지 유지하고 나머지 왼쪽 탭들은 제거
      const updatedList = historyList.slice(activeIndex);
      setHistoryList(updatedList);
      updateHistoryListInStorage(updatedList);
      setActiveIndex(0); // 현재 탭이 첫 번째 탭이 됨
      closeContextMenu();
    }
  };
  // 현재 탭만 닫기
  const closeCurrentTab = () => {
    if (activeIndex !== null) {
      const updatedList = historyList.filter((_, index) => index !== activeIndex);
      setHistoryList(updatedList);
      updateHistoryListInStorage(updatedList);
      closeContextMenu();
      if (updatedList.length === 0) {
        // 모든 탭이 닫혔다면 홈페이지로 이동
        router.push('/');
        setActiveIndex(null);
      } else {
        // 다음 탭으로 이동 (마지막 탭이었다면 이전 탭으로)
        const newActiveIndex = activeIndex >= updatedList.length ? updatedList.length - 1 : activeIndex;
        setActiveIndex(newActiveIndex);
        router.push(updatedList[newActiveIndex].histMenuUri);
      }
    }
  };

  //다른 곳 클릭시 전체탭 닫기 사라지게하기
  const contextMenuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        closeContextMenu();
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

  const [list, setList] = useState<any[]>([]);
  useEffect(() => {
    updateButtonVisibility();
    const updateList = historyList.map((item, index) => ({
      ...item,
      id: index, // ReactSortable에 필요한 고유 ID 추가
    }));
    setList(updateList);
  }, [historyList]);

  return (
    <>
      <div className="historyTab">
        <div className="historyBox" onContextMenu={handleContextMenu}>
          <div className="list" ref={listDivRef}>
            <div style={{ transform: `translateX(${translateXValue}px)` }} ref={listRef}>
              <ReactSortable
                list={list}
                setList={setList}
                animation={200} // 드래그 애니메이션
                multiDrag
                swap
                forceFallback
                onStart={(event: any) => dragStart(event)}
                onEnd={(event: any) => dragEnd(event)}
              >
                {list.map((item, index) => {
                  // 조건에 따라 클래스 설정
                  const isHover = index === hoverIndex;
                  const active = activeIndex || 0;
                  const activePrev = index === active - 1;
                  const isNotHover = hoverIndex !== null && index === hoverIndex - 1;

                  return (
                    <div
                      key={index}
                      className={`item-${index} ${isHover ? 'hover' : ''} ${isNotHover ? 'notHover' : ''} ${activePrev ? 'notHover' : ''} ${
                        index === activeIndex && router.pathname !== '/' && router.pathname !== '' ? 'on' : ''
                      }`}
                      onMouseEnter={() => setHoverIndex(index)} // 마우스가 들어오면 hover 상태 설정
                      onMouseLeave={() => setHoverIndex(null)} // 마우스가 나가면 hover 상태 초기화
                    >
                      <div onClick={() => handleActivateItem(index, item.histMenuUri)}>{item.histMenuNm}</div>
                      <button onClick={() => closeHistory(index)}>
                        <span></span>
                        <span></span>
                      </button>
                    </div>
                  );
                })}
              </ReactSortable>
            </div>
          </div>
          <div className="listBtn" style={{ display: isButtonVisible ? 'flex' : 'none' }}>
            <button onClick={moveLeft}>왼쪽</button>
            <button onClick={moveRight}>오른쪽</button>
          </div>
          {contextMenu.visible && (
            <ul
              className={`rightClickMenu ${contextMenu.visible ? 'on' : ''}`}
              ref={contextMenuRef}
              style={{
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
              }}
            >
              <li>
                <button onClick={makeFavorite}>· 즐겨찾기정보 일괄 생성</button>
              </li>
              <li>
                <button onClick={closeAllTabs}>· 전체 탭 닫기</button>
              </li>
              <li>
                <button onClick={closeOtherTabs}>· 다른 탭 닫기</button>
              </li>
              <li>
                <button onClick={closeRightTabs}>· 우측 탭 닫기</button>
              </li>
              <li>
                <button onClick={closeLeftTabs}>· 왼쪽 탭 닫기</button>
              </li>
              <li>
                <button onClick={closeCurrentTab}>· 현재 탭 닫기</button>
              </li>
            </ul>
          )}
        </div>
      </div>
      <div className={`favoriteBox ${favoriteBtn ? 'on' : ''}`} ref={containerRef}>
        <button className="favoriteBtn" onClick={handleFavoriteBtnOnOff}>
          즐겨찾기
        </button>
        <ul className="favoriteList">
          <li className="tabMenuListAdd">
            <Link
              href={''}
              onClick={(e) => {
                handleFavoriteAllOpen();
              }}
            >
              탭메뉴 생성
            </Link>
          </li>
          {favoriteList && favoriteList.length > 0 ? (
            favoriteList.map((data, index) => (
              <li key={'FAV_LIST_' + index}>
                <Link
                  href=""
                  onClick={(e) => {
                    handleFavoriteLink(e, data?.menuUri);
                  }}
                >
                  {data.menuNm}
                </Link>
              </li>
            ))
          ) : (
            <li>
              <span>즐겨찾기 메뉴가 없습니다.</span>
            </li>
          )}
        </ul>
      </div>
    </>
  );
});
TabMenu.displayName = 'TabMenu';
