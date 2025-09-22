import { Search } from '../../content';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { RetailResponseDetail } from '../../../generated';
import { toastError, toastSuccess, toastSuccessEnableCancel } from '../../ToastMessage';
import { useRetailStore } from '../../../stores/useRetailStore';
import { ConfirmModal } from '../../ConfirmModal';
import { useMutation } from '@tanstack/react-query';
import { SearchBarRefInterface } from '../SearchBar';

type modalType = 'CONFIRM_REGISTER';

interface Props {
  title?: string;
  name: string;
  placeholder?: string;
  onRetailSelected: (retailInfo: RetailResponseDetail | undefined) => void;
  onRetailInserted?: (response: RetailResponseDetail) => void;
  onRetailDeleted?: () => void;
  selectedRetail?: RetailResponseDetail | undefined; // 선택된 소매처 상태
  allowNewRetail: boolean; // 새로운 소매처 팝업 여부
  emptyMessage?: string;
}

export interface retailSearchBarRefInterface {
  focusOnInput: () => void;
}
/**
 * 소매처명 일부를 사용해서 어떠한 소매처를 특정하고자 희망할 시 사용 가능한 컴포넌트,
 * 키워드 입력을 통해 받은 소매처 목록에서 한 소매처를 선택함으로서 해당 소매처의 전반적 정보를 콜백 함수(onRetailSelected)의 인자로 받을 수 있다
 * */
export const RetailSearchBar = forwardRef<retailSearchBarRefInterface, Props>(
  ({ title, name, placeholder, onRetailSelected, onRetailInserted, onRetailDeleted, selectedRetail, allowNewRetail, emptyMessage }, ref) => {
    /** 전역 상태로 관리되는 조회, 추가, 삭제 요청 영역 */
    const [selectRetailListForReg, insertRetail, deleteRetail] = useRetailStore((s) => [s.selectRetailListForReg, s.insertRetail, s.deleteRetail]);

    const [synchedInputValue, setSynchedInputValue] = useState<string>(''); // SearchBar 의 inputValue 와 달리 본 상태는 콜백 호출과 같은 특정 이벤트가 발생하는 경우에만 동기화됨(소매처 검색을 위하여 입력한 오리지널 키워드를 가진다)
    const [modalType, setModalType] = useState<modalType | undefined>(undefined);

    const searchBarRef = useRef<SearchBarRefInterface>(null);

    useImperativeHandle(ref, () => ({
      focusOnInput: () => {
        searchBarRef.current?.focusOnInput();
      },
    }));

    /** 검색 */
    const onRetailSearch = useCallback(
      (sellerNm: string) => {
        console.log(sellerNm);
        setSynchedInputValue(sellerNm);
        return selectRetailListForReg({ sellerNm: sellerNm, sellerType: allowNewRetail ? 'O' : 'E' });
      },
      [selectRetailListForReg],
    );

    /** 소매처 드롭다운에서 값을 선택할 시 작동(데이터를 찾을 수 없을 시 value == undefined) */
    const onDataSelected = ({ nameArg = name, retailInfoResponse }: { nameArg?: string; retailInfoResponse: RetailResponseDetail | undefined }) => {
      if (retailInfoResponse == undefined || (retailInfoResponse.sellerNm && String(retailInfoResponse.sellerNm).indexOf('shopNewSeller') > -1)) {
        // 응답값이 undefined(검색된 데이터 없음) 이거나 응답(소매처명)이 특정 조건을 만족하는 경우(신규 소매처 식별자) 동작
        setModalType('CONFIRM_REGISTER');
        if (retailInfoResponse?.sellerNm) {
          return retailInfoResponse.sellerNm.replace('shopNewSeller', ''); // 식별자 'shopNewSeller' 제거
        }
      } else {
        onRetailSelected(retailInfoResponse);
      }
    };

    const cancelFn = (body: RetailResponseDetail) => {
      if (body && body.id) {
        deleteRetailMutate(body?.id);
      }
    };

    /** 소매처(seller) 추가 */
    const { mutate: postSellerRequestForInsert } = useMutation(insertRetail, {
      onSuccess: async (result) => {
        const { resultCode, body, resultMessage } = result.data;
        if (resultCode === 200) {
          toastSuccessEnableCancel({ message: '소매처 등록에 성공하였습니다.', cancelFunction: () => cancelFn(body as RetailResponseDetail) });
          onDataSelected({ nameArg: name, retailInfoResponse: body });
          if (onRetailInserted) {
            onRetailInserted(body as RetailResponseDetail);
          }
        } else {
          toastError(resultMessage || '소매처 등록 과정에서 문제가 발생했습니다.');
        }
      },
    });

    /** 판매처 삭제 */
    const { mutate: deleteRetailMutate } = useMutation(deleteRetail, {
      onSuccess: async (result) => {
        const { resultCode, resultMessage } = result.data;
        if (resultCode === 200) {
          toastSuccess('등록이 취소되었습니다.');
          if (onRetailDeleted) {
            onRetailDeleted();
            searchBarRef.current?.focusOnInput(); // 포커스 이동
          }

          setTimeout(() => {
            searchBarRef.current?.focusOnInput(); // 포커스 이동
          }, 10);
        } else {
          toastError(resultMessage || '소매처 등록 취소 과정에서 문제가 발생했습니다.');
        }
      },
    });

    return (
      <>
        <Search.Bar<RetailResponseDetail>
          title={title}
          name={name || 'sellerNm'}
          placeholder={placeholder || '소매처 검색'}
          displayedObjKey={'sellerNm'}
          onDataSelected={(name, value) => {
            return onDataSelected({ nameArg: name, retailInfoResponse: value });
          }}
          onSearch={onRetailSearch}
          ref={searchBarRef}
          selectedData={selectedRetail}
          emptyMessage={emptyMessage}
          onDataErased={(typedValue, type) => {
            if (type == 'all') {
              if (onRetailDeleted) {
                onRetailDeleted();
              }
              setSynchedInputValue('');
            }
          }}
        />
        {allowNewRetail && (
          <ConfirmModal
            width={400}
            title={`<span>${synchedInputValue}</span> 새로운 소매처로 등록하시겠어요?`}
            confirmText={'등록'}
            className={'newSellerPop'}
            open={modalType === 'CONFIRM_REGISTER'}
            onConfirm={() => {
              setModalType(undefined);
              postSellerRequestForInsert({ sellerNm: synchedInputValue });
            }}
            onClose={() => setModalType(undefined)}
          />
        )}
      </>
    );
  },
);

RetailSearchBar.displayName = 'RetailSearchBar';
