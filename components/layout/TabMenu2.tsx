import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { LOCAL_STORAGE_HISTORY, LOCAL_STORAGE_WMS_HISTORY } from '../../libs/const';
import { useCommonStore, useMypageStore, HistoryType } from '../../stores';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toastError, toastSuccess, toastSuccessEnableCancel } from '../ToastMessage';
import { ApiResponseListSelectFavorites, RetailResponsePaging, SelectFavorites } from '../../generated';
import { authApi } from '../../libs';

/** 20250219 이제 안쓰이는 탭메뉴 */
interface Props {
  router: any;
}

type MenuHistory = {
  histMenuUri: string;
  histMenuNm: string;
  histParamList: [];
};

export const TabMenu2 = forwardRef<{ closeAllTabs: () => void }, Props>(({ router }, ref) => {
  const session = useSession();
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [draggingOverIndex, setDraggingOverIndex] = useState<number | null>(null);
  const [favoriteBtn, setFavoriteBtn] = useState(false); // 즐겨찾기 onoff
  const [historyList, setHistoryList] = useCommonStore((s) => [s.historyList, s.setHistoryList]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null); // 드래그 중인 아이템 인덱스
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
  const [localStorageHistory] = useState<string>(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY);

  // 로컬스토리지 업데이트
  const updateHistoryListInStorage = (updatedList: HistoryType[]) => {
    localStorage.setItem(localStorageHistory, JSON.stringify(updatedList));
  };

  const dragStart = (idx: number) => {
    if (typeof window !== 'undefined') {
      dragItem.current = idx;
      setDraggingIndex(idx); // 드래그 시작 시 드래깅 인덱스 업데이트

      // on 제거
      const items = document.querySelectorAll('.historyBox div');
      items.forEach((e) => {
        e.classList.remove('on');
      });
    }
  };

  const dragEnter = (idx: number) => {
    if (draggingIndex !== null && draggingIndex !== idx) {
      const copyListItems = [...historyList];
      const draggedItem = copyListItems[draggingIndex];
      copyListItems.splice(draggingIndex, 1); // 드래그 중인 아이템 삭제
      copyListItems.splice(idx, 0, draggedItem); // 드롭 대상 위치에 삽입

      // 배열 순서 변경을 반영하여 화면 업데이트
      setHistoryList(copyListItems); // 리스트 상태 업데이트
      setDraggingIndex(idx); // 드래깅 인덱스 업데이트
    }

    setDraggingOverIndex(idx); // 드래그 아이템이 진입한 인덱스 설정
    dragOverItem.current = idx; // dragOverItem 업데이트
  };

  // 드래그가 끝났을 때 최종 처리
  const dragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;

    // 로컬 스토리지에 업데이트된 리스트 저장
    updateHistoryListInStorage(historyList);

    // 이미 리스트 순서가 변경된 copyListItems를 사용하므로, 여기서는 별도의 업데이트가 필요 없음
    // 드래그 종료된 페이지로 이동
    router.push(historyList[dragOverItem.current].histMenuUri);

    // 최종 드래깅한 아이템에 on 클래스 추가
    setActiveIndex(dragOverItem.current);

    // 참조된 값 초기화
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null); // 드래그 종료 시 드래깅 인덱스 초기화
  };

  // 현재 드래깅 중인 아이템이면 dragging 클래스 추가
  const getItemClassName = (index: number, histMenuUri: string) => {
    // draggingIndex가 유효하고, 현재 인덱스가 draggingIndex와 같은 경우 'dragging' 클래스를 반환
    if (draggingIndex !== null && index === draggingIndex) {
      return 'dragging';
    }
    // 현재 경로와 일치하지 않는 경우 'on' 클래스를 제거
    if (histMenuUri !== router.pathname) {
      return '';
    }
    // 그렇지 않으면 빈 문자열을 반환하여 클래스를 제거
    return 'on';
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

  const closeHistory = (index: number) => {
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
    const favHistoryList = favoriteList.map((menu: SelectFavorites) => ({ histMenuNm: menu.menuNm, histMenuUri: menu.menuUri, histParamList: [] }));
    localStorage.setItem(authGroupCd === '3' ? LOCAL_STORAGE_HISTORY : LOCAL_STORAGE_WMS_HISTORY, JSON.stringify(favHistoryList));
    //setHistoryList(favHistoryList && []);
    location.reload();
  };
  // 버튼 숨김처리
  const checkWidth = () => {
    if (typeof window !== 'undefined') {
      const body = document.querySelector('body');

      if (body instanceof HTMLElement) {
        if (body.classList.contains('wms')) {
          // wms
          if (listRef.current && listRef.current.offsetWidth <= 1289) {
            setIsButtonVisible(false); // 너비가 1289 이하일 때 버튼을 숨김
          } else {
            setIsButtonVisible(true); // 너비가 1289 초과일 때 버튼을 보임
          }
        } else {
          // oms
          if (listRef.current && listRef.current.offsetWidth <= 795) {
            setIsButtonVisible(false); // 너비가 795 이하일 때 버튼을 숨김
          } else {
            setIsButtonVisible(true); // 너비가 795 초과일 때 버튼을 보임
          }
        }
      }
    }
  };
  // 버튼 작용
  // width값 가져오기
  useEffect(() => {
    const calculateWidths = () => {
      if (listRef.current) {
        setMaxTranslateX(listRef.current.offsetWidth);
      }
      if (listDivRef.current) {
        setDivWidth(listDivRef.current.offsetWidth - 20);
      }
    };

    // 초기 렌더링 후 setTimeout을 사용하여 크기 계산
    setTimeout(() => {
      calculateWidths();
    }, 100);
    checkWidth();
  }, [historyList]); // 컴포넌트가 마운트될 때 한 번 실행

  const moveLeft = () => {
    if (translateXValue === 0) return; // 이미 최대값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue + 175; // 오른쪽으로 이동
    setTranslateXValue(Math.min(0, newValue)); // 최대값을 0으로 제한
  };

  const moveRight = () => {
    if (translateXValue === -maxTranslateX + divWidth) return; // 이미 최소값에 도달한 경우, 더 이상 이동하지 않음

    const newValue = translateXValue - 175; // 왼쪽으로 이동
    setTranslateXValue(Math.max(-maxTranslateX + divWidth, newValue)); // 최소값을 -maxTranslateX + divWidth로 제한
  };

  //모든탭 닫기
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

  //우클릭 전체 닫기 이벤트
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
  const contextMenuRef = useRef<HTMLDivElement>(null);

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
  return (
    <div className="historyTab">
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
      <div className="historyBox" onContextMenu={handleContextMenu}>
        <div className="list" ref={listDivRef}>
          <div style={{ transform: `translateX(${translateXValue}px)` }} ref={listRef}>
            {historyList.map((item, index) => (
              <div key={index}>
                <div
                  draggable
                  onDragStart={() => dragStart(index)}
                  onDragEnter={() => dragEnter(index)}
                  onDragEnd={dragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => handleActivateItem(index, item.histMenuUri)}
                  className={`item-${index} ${getItemClassName(index, item.histMenuUri)} ${draggingOverIndex === index ? 'draggingOver' : ''} ${
                    index === activeIndex && router.pathname != '/' && router.pathname != '' ? 'on' : ''
                  }`}
                >
                  {item.histMenuNm}
                </div>
                <button
                  onClick={() => {
                    closeHistory(index);
                  }}
                >
                  <span></span>
                  <span></span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="listBtn" style={{ display: isButtonVisible ? 'flex' : 'none' }}>
          <button onClick={moveLeft}>왼쪽</button>
          <button onClick={moveRight}>오른쪽</button>
        </div>
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              top: `${contextMenu.y}px`,
              left: `${contextMenu.x}px`,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '5px 0',
              zIndex: 1000,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              fontSize: '12px',
              minWidth: '80px',
              textAlign: 'left',
            }}
          >
            <div
              onClick={makeFavorite}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 즐겨찾기정보 일괄 생성
            </div>
            <div
              onClick={closeAllTabs}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 전체 탭 닫기
            </div>
            <div
              onClick={closeOtherTabs}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 다른 탭 닫기
            </div>
            <div
              onClick={closeRightTabs}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 우측 탭 닫기
            </div>
            <div
              onClick={closeLeftTabs}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 왼쪽 탭 닫기
            </div>
            <div
              onClick={closeCurrentTab}
              style={{
                cursor: 'pointer',
                padding: '6px 20px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f2f2f2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              · 현재 탭 닫기
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
TabMenu2.displayName = 'TabMenu2';
