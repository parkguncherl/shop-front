import React, { useEffect, useRef, useState } from 'react';
import { authApi } from '../../../libs';
import { ApiResponseListAuthResponseEntity, MenuRequestWithAuth, MenuResponseWithAuth } from '../../../generated';
import { PopupContent, PopupFooter, PopupLayout } from '../index';
import { toastError, toastSuccess } from '../../index';
import { useMypageStore } from '../../../stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const UserAuthPop = () => {
  const queryClient = useQueryClient();
  const el = useRef<HTMLDListElement | null>(null);
  const [authCodes, setAuthCodes] = useState<MenuResponseWithAuth[]>([]);

  const [modalType, openModal, closeModal, selectedUser, updateUserMenuAuth] = useMypageStore((s) => [
    s.modalType,
    s.openModal,
    s.closeModal,
    s.selectedUser,
    s.updateUserMenuAuth,
  ]);
  /** 메뉴 권한 조회 수정 */
  const {
    data: auths,
    isLoading: isLeftMenuLoading,
    isSuccess: isLeftMenuLoaded,
  } = useQuery(['/menu/withAuth', selectedUser.id], () => authApi.get<ApiResponseListAuthResponseEntity>(`/menu/withAuth/${selectedUser.id}`, {}), {
    enabled: true,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (isLeftMenuLoaded) {
      const { body, resultCode } = auths.data;
      if (resultCode === 200) {
        const resultArray = body as MenuResponseWithAuth[];
        for (let i = 0; i < resultArray.length; i++) {
          const resultArrayItems = resultArray[i].items || [];
          // 모든 아이템의 authYn이 Y인 경우
          resultArray[i].authYn = 'Y';
          for (let j = 0; j < resultArrayItems.length; j++) {
            if (resultArrayItems[j].authYn == 'N') {
              resultArray[i].authYn = 'N';
              break;
            }
          }
        }
        setAuthCodes(resultArray || []);
      }
    }
  }, [auths, isLeftMenuLoading]);

  /** 변경 */
  const { mutate: updateUserAuth, isLoading: updateIsLoading } = useMutation(updateUserMenuAuth, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('반영되었습니다.');
          await Promise.all([queryClient.invalidateQueries(['/menu/withAuth'])]);
          closeModal('USER_AUTH_MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 확인 모달에서 '확인' 클릭 시 */
  const updateAuthFn = async () => {
    const requestWithAuth: MenuRequestWithAuth = {
      withAuthList: [],
      userId: selectedUser.id,
    };
    for (let i = 0; i < authCodes.length; i++) {
      (requestWithAuth.withAuthList as MenuRequestWithAuth[])[i] = { ...authCodes[i], userId: selectedUser.id };
    }
    console.log(requestWithAuth);
    updateUserAuth(requestWithAuth);
  };

  /**
   * 체크박스 제어
   * */
  const handleOptionOnClick = (e: React.ChangeEvent<HTMLInputElement>, authType: string, item: MenuResponseWithAuth) => {
    if (item.authYn == null) {
      item.authYn = 'N';
    }
    setAuthCodes(makeCheck(authType, item));
  };

  const makeCheck = (authType: string, item: MenuResponseWithAuth) => {
    const resultArray = [...authCodes];
    if (authType === 'T') {
      /** 탑메뉴 */
      if (item.items) {
        if (item.authYn == 'Y') {
          // 탑메뉴의 authYn 값은 전체선택, 해제 동작을 구현하기 위해서만 사용함
          for (let i = 0; i < resultArray.length; i++) {
            if (resultArray[i].menuCd == item.menuCd) {
              console.log(item.authCd);
              resultArray[i].authYn = 'N';
              const items = resultArray[i].items || [];
              for (let j = 0; j < items.length; j++) {
                if (items[j]) {
                  items[j].authYn = 'N';
                }
              }
              resultArray[i].items = items;
            }
          }
        } else if (item.authYn == 'N') {
          for (let i = 0; i < resultArray.length; i++) {
            if (resultArray[i].menuCd == item.menuCd) {
              resultArray[i].authYn = 'Y';
              const items = resultArray[i].items || [];
              for (let j = 0; j < items.length; j++) {
                if (items[j]) {
                  items[j].authYn = 'Y';
                }
              }
              resultArray[i].items = items;
            }
          }
        }
      }
    } else if (authType == 'I') {
      /** 하위 메뉴(응답 목록의 아이템 각각의 요청에 관한 동기화 작업 수행) */
      console.log(item.upMenuCd);
      if (item.authYn == 'Y') {
        for (let i = 0; i < resultArray.length; i++) {
          if (resultArray[i].menuCd == item.upMenuCd) {
            let isUpperAuthYn = true;
            const items = resultArray[i].items || [];
            for (let j = 0; j < items.length; j++) {
              if (items[j].menuCd == item.menuCd) {
                // 아이템 요소 authYn 수정
                items[j].authYn = 'N';
              }
              if (isUpperAuthYn && items[j].authYn != 'Y') {
                isUpperAuthYn = false;
              }
            }
            // 할당
            resultArray[i].items = items;
            if (isUpperAuthYn) {
              resultArray[i].authYn = 'Y';
            } else {
              resultArray[i].authYn = 'N';
            }
          }
        }
      } else if (item.authYn == 'N') {
        for (let i = 0; i < resultArray.length; i++) {
          if (resultArray[i].menuCd == item.upMenuCd) {
            const items = resultArray[i].items || [];
            let isUpperAuthYn = true;
            for (let j = 0; j < items.length; j++) {
              if (items[j].menuCd == item.menuCd) {
                // 아이템 요소 authYn 수정
                items[j].authYn = 'Y';
              }
              if (isUpperAuthYn && items[j].authYn != 'Y') {
                isUpperAuthYn = false;
              }
            }
            // 할당
            resultArray[i].items = items;
            if (isUpperAuthYn) {
              resultArray[i].authYn = 'Y';
            } else {
              resultArray[i].authYn = 'N';
            }
          }
        }
      }
    }
    return resultArray;
  };

  return (
    <dl ref={el}>
      <PopupLayout
        width={1650}
        isEscClose={true}
        open={modalType.type === 'USER_AUTH_MOD' && modalType.active}
        title={'[ ' + selectedUser.userNm + ' ] 사용자 권한 수정'}
        onClose={() => closeModal('USER_AUTH_MOD')}
        footer={
          <PopupFooter>
            <div className={'btnArea'}>
              <button className="btn btnBlue" onClick={updateAuthFn}>
                저장
              </button>
              <button className="btn" onClick={() => closeModal('USER_AUTH_MOD')}>
                닫기
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <div className="tblBox mt20">
            <table>
              <caption>테이블</caption>
              <colgroup>
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
                <col width="9%" />
              </colgroup>
              <thead>
                <tr>
                  {authCodes &&
                    authCodes.map((code, key) => (
                      <th key={key}>
                        <div className={'chkBox solo'}>
                          <span>
                            <input
                              id={'id_' + code.menuCd + '_top'}
                              type={'checkbox'}
                              checked={code.authYn === 'Y'}
                              onChange={(e) => handleOptionOnClick(e, 'T', code)}
                            />
                            <label htmlFor={'id_' + code.menuCd + '_top'}>{code.menuNm}</label>
                          </span>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {authCodes &&
                    authCodes.map((code, key) => (
                      <td key={key} className="verticalTop">
                        <div className={'chkBox left'}>
                          {code.items &&
                            code.items.map((item, key) => (
                              <span key={key}>
                                <input
                                  id={'id_' + item.menuCd + '_item'}
                                  type={'checkbox'}
                                  checked={item.authYn === 'Y'}
                                  onChange={(e) => handleOptionOnClick(e, 'I', item)}
                                />
                                <label htmlFor={'id_' + item.menuCd + '_item'}>{item.menuNm}</label>
                              </span>
                            ))}
                        </div>
                      </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </PopupContent>
      </PopupLayout>
    </dl>
  );
};
