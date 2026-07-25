import React, { PropsWithChildren, useEffect, useState } from 'react';
import { TitleCategory } from './TitleCategory';
import { useMypageStore } from '@/stores';
import { ApiResponseListSelectFavorites } from '@/generated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/libs';
import { toastError, toastSuccess } from '@/components/ToastMessage';
import CustomShortcutButton from '@/components/CustomShortcutButton';

interface Props {
  title: string;
  reset?: () => void;
  search?: () => void;
  save?: () => void;
  remove?: () => void;
  close?: () => void;
  filters?: object;
  children?: JSX.Element;
  style?: React.CSSProperties;
  titleStyle?: React.CSSProperties;
  readOnly?: boolean;
  detail?: boolean;
  className?: string;
}

export const Title = ({ title, search, reset, children, detail, className }: PropsWithChildren<Props>) => {
  const favoriteList = useMypageStore((s) => s.favoriteList);
  const setFavoriteList = useMypageStore((s) => s.setFavoriteList);
  const modFavorite = useMypageStore((s) => s.modFavorite);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const { data: favoriteData, isSuccess: isFavSuccess } = useQuery({
    queryKey: ['favoriteList'],
    queryFn: () => authApi.get<ApiResponseListSelectFavorites>('/mypage/favorites', {}),
  });

  useEffect(() => {
    if (isFavSuccess) {
      const { resultCode, body, resultMessage } = favoriteData.data;
      if (resultCode == 200) {
        setFavoriteList(body || []);
      } else {
        toastError(resultMessage);
      }
    }
  }, [favoriteData]);

  useEffect(() => {
    let isMatch = false;
    if (favoriteList && favoriteList.length > 0) {
      for (let i = 0; i < favoriteList.length; i++) {
        if (typeof window !== 'undefined') {
          if (favoriteList[i].menuUri == window.location.pathname) {
            isMatch = true;
            break;
          }
        }
      }
    }
    setIsFavorite(isMatch);
  }, [favoriteList]);

  const onClickFavoriteReg = () => {
    modFavoriteMutate({
      isFavorite: isFavorite,
      menuUri: typeof window !== 'undefined' ? window.location.pathname : '',
    });
  };

  const { mutate: modFavoriteMutate } = useMutation({
    mutationFn: modFavorite,
    onSuccess: async (e) => {
      try {
        if (e.data.resultCode === 200) {
          if (isFavorite) {
            toastSuccess('즐겨찾기에서 삭제 되었습니다.');
          } else {
            toastSuccess('즐겨찾기에 추가되었습니다.');
          }
          await queryClient.invalidateQueries({ queryKey: ['favoriteList'] });
        } else {
          toastError(e.data.resultMessage);
        }
      } catch (e) {
        console.log(e);
      }
    },
  });
  /** 공통 스토어 - State */
  // 새로고침 애니메이션
  const [refreshBtn, setRefreshBtn] = useState<boolean>(false);
  const handleRefreshBtn = async () => {
    setRefreshBtn(false);
    setTimeout(() => setRefreshBtn(true), 10);
    if (reset) {
      await reset();
    }

    if (search) {
      await search();
    }
  };

  return (
    <div className="titleBox">
      <h3 className="bigTitle">
        <div className="left">
          <strong>{title}</strong>
          {!detail && (
            <div className="util">
              <CustomShortcutButton className={`refresh ${refreshBtn ? 'on' : ''}`} onClick={handleRefreshBtn}>
                새로고침
              </CustomShortcutButton>
              <CustomShortcutButton className={`favorite ${isFavorite ? 'on' : ''}`} onClick={onClickFavoriteReg}>
                즐겨찾기 등록
              </CustomShortcutButton>
            </div>
          )}
        </div>
        <div className="right">
          <div className="searchBtnArea">
            {search && (
              <>
                {/*<button className="search" onClick={onClickSearchBtn}>*/}
                {/*  검색*/}
                {/*</button>*/}
              </>
            )}
          </div>
        </div>
      </h3>
      {children}
    </div>
  );
};

Title.Category = TitleCategory;
