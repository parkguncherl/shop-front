import React, { useRef, useState } from 'react';
import { authApi } from '../../../../libs';
import { ApiResponseListAuthResponseEntity, Auth, Menu } from '../../../../generated';
import { PopupContent, PopupFooter, PopupLayout } from '../../index';
import { PopupSearchBox, PopupSearchType } from '../../content';
import { Input, toastError, toastSuccess } from '../../../index';
import { useMenuStore } from '../../../../stores';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Loading from '../../../Loading';

interface Props {
  data: Menu;
  callback?: () => void;
}

export const MenuAuthPop = ({ data, callback }: Props) => {
  const queryClient = useQueryClient();
  const el = useRef<HTMLDListElement | null>(null);
  const [authCodes, setAuthCodes] = useState<Auth[]>([]);
  const [modalType, closeModal, updateAuth] = useMenuStore((s) => [s.modalType, s.closeModal, s.updateAuth]);
  /** 메뉴 권한 조회 수정 */
  const { data: auths, isLoading } = useQuery(
    ['/menu/auth', data.menuCd],
    () => authApi.get<ApiResponseListAuthResponseEntity>(`/menu/auth/${data.menuCd}`, {}),
    {
      enabled: !!data.upMenuCd,
      refetchOnMount: 'always',
      onSuccess: (e) => {
        const { body, resultCode } = e.data;
        if (resultCode === 200) {
          setAuthCodes(body || []);
        }
      },
    },
  );

  /** 변경 */
  const { mutate: updateAuthMutate, isLoading: updateIsLoading } = useMutation(updateAuth, {
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          toastSuccess('저장되었습니다.');
          await Promise.all([
            queryClient.invalidateQueries(['/menu/leftMenu']),
            queryClient.invalidateQueries(['/menu/paging']),
            queryClient.invalidateQueries(['/menu/top']),
          ]);
          closeModal('AUTH_MOD');
        } else {
          toastError(e.data.resultMessage);
          throw new Error(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });

  /** 권한저장 버튼 클릭 시 */
  const updateAuthFn = async () => {
    updateAuthMutate({
      menuCd: data.menuCd,
      authList: authCodes,
    });
  };

  /**
   * 체크박스 제어
   * */
  const handleOptionOnClick = (e: React.ChangeEvent<HTMLInputElement>, authType: string, auth: Auth) => {
    setAuthCodes(makeCheck(authType, auth));
  };

  const makeCheck = (authType: string, auth: Auth) => {
    const resultArray = new Array<Auth>();

    if (authType === 'A') {
      for (let i = 0; i < authCodes.length; i++) {
        if (auth.authCd === authCodes[i].authCd) {
          if (authCodes[i].menuAllAuthYn === 'N') {
            authCodes[i].menuAllAuthYn = 'Y';
            authCodes[i].menuReadYn = 'Y';
            authCodes[i].menuUpdYn = 'Y';
            authCodes[i].menuExcelYn = 'Y';
          } else {
            authCodes[i].menuAllAuthYn = 'N';
            authCodes[i].menuReadYn = 'N';
            authCodes[i].menuUpdYn = 'N';
            authCodes[i].menuExcelYn = 'N';
          }
        }
      }
    } else if (authType === 'R') {
      for (let i = 0; i < authCodes.length; i++) {
        if (auth.authCd === authCodes[i].authCd) {
          if (authCodes[i].menuUpdYn === 'N' && authCodes[i].menuExcelYn === 'N') {
            if (authCodes[i].menuReadYn === 'N') {
              authCodes[i].menuReadYn = 'Y';
            } else {
              authCodes[i].menuReadYn = 'N';
            }
          }
        }
      }
    } else if (authType === 'U') {
      for (let i = 0; i < authCodes.length; i++) {
        if (auth.authCd === authCodes[i].authCd) {
          if (authCodes[i].menuUpdYn === 'N') {
            authCodes[i].menuReadYn = 'Y';
            authCodes[i].menuUpdYn = 'Y';
          } else {
            authCodes[i].menuUpdYn = 'N';
          }
        }
      }
    } else if (authType === 'E') {
      for (let i = 0; i < authCodes.length; i++) {
        if (auth.authCd === authCodes[i].authCd) {
          if (authCodes[i].menuExcelYn === 'N') {
            authCodes[i].menuReadYn = 'Y';
            authCodes[i].menuExcelYn = 'Y';
          } else {
            authCodes[i].menuExcelYn = 'N';
          }
        }
      }
    }

    for (let i = 0; i < authCodes.length; i++) {
      if (auth.authCd === authCodes[i].authCd) {
        if (authCodes[i].menuReadYn === 'Y' && authCodes[i].menuUpdYn === 'Y' && authCodes[i].menuExcelYn === 'Y') {
          authCodes[i].menuAllAuthYn = 'Y';
        } else if (authCodes[i].menuReadYn === 'N' || authCodes[i].menuUpdYn === 'N' || authCodes[i].menuExcelYn === 'N') {
          authCodes[i].menuAllAuthYn = 'N';
        }
      }
    }

    for (let i = 0; i < authCodes.length; i++) {
      resultArray.push(authCodes[i]);
    }

    return resultArray;
  };

  return (
    <dl ref={el}>
      <PopupLayout
        width={820}
        isEscClose={false}
        open={modalType.type === 'AUTH_MOD' && modalType.active}
        title={'페이지 권한 수정'}
        onClose={() => closeModal('AUTH_MOD')}
        footer={
          <PopupFooter>
            <div className={'btnArea'}>
              <button className="btn btnBlue" onClick={updateAuthFn}>
                저장
              </button>
              <button className="btn" onClick={() => closeModal('AUTH_MOD')}>
                닫기
              </button>
            </div>
          </PopupFooter>
        }
      >
        <PopupContent>
          <PopupSearchBox>
            <PopupSearchType className={'type_2'}>
              <Input title={'이름'} disable={true} value={data.menuNm} />
              <Input title={'코드'} disable={true} value={data.menuCd} />
            </PopupSearchType>
          </PopupSearchBox>

          <div className="tblBox mt20">
            <table>
              <caption>테이블</caption>
              <colgroup>
                <col width={'20%'} />
                <col width={'80%'} />
              </colgroup>
              <thead>
                <tr>
                  <th>{'권한명'}</th>
                  <th>{'부여권한 목록'}</th>
                </tr>
              </thead>
              <tbody>
                {authCodes &&
                  authCodes.map((item, key) => (
                    <tr key={item.authCd}>
                      <td>{item.authNm}</td>
                      <td className={'agn_l'}>
                        <div className={'chkBox'}>
                          <span>
                            <input
                              id={'id_' + item.authCd + '_A'}
                              type={'checkbox'}
                              checked={item.menuAllAuthYn === 'Y' ? true : false}
                              onChange={(e) => handleOptionOnClick(e, 'A', item)}
                            />
                            <label htmlFor={'id_' + item.authCd + '_A'}>{'전체선택'}</label>
                          </span>
                          <span>
                            <input
                              id={'id_' + item.authCd + '_R'}
                              type={'checkbox'}
                              checked={item.menuReadYn === 'Y' ? true : false}
                              onChange={(e) => handleOptionOnClick(e, 'R', item)}
                            />
                            <label htmlFor={'id_' + item.authCd + '_R'}>{'읽기'}</label>
                          </span>
                          {/*
                          <span>
                            <input
                              id={'id_' + item.authCd + '_U'}
                              type={'checkbox'}
                              checked={item.menuUpdYn === 'Y' ? true : false}
                              onChange={(e) => handleOptionOnClick(e, 'U', item)}
                            />
                            <label htmlFor={'id_' + item.authCd + '_U'}>{'쓰기/수정하기'}</label>
                          </span>
                          <span>
                            <input
                              id={'id_' + item.authCd + '_E'}
                              type={'checkbox'}
                              checked={item.menuExcelYn === 'Y' ? true : false}
                              onChange={(e) => handleOptionOnClick(e, 'E', item)}
                            />
                            <label htmlFor={'id_' + item.authCd + '_E'}>{'엑셀 다운로드'}</label>
                          </span>
*/}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </PopupContent>
        {(isLoading || updateIsLoading) && <Loading />}
      </PopupLayout>
    </dl>
  );
};
