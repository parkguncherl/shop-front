import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ApiResponse, FavoritesMenuList, MenuRequestWithAuth, ModFavoritesRequest, PageObject, SelectFavorites, UserResponsePaging } from '../generated';
import { StateCreator } from 'zustand/esm';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';

type ModalType = 'USER_ADD' | 'USER_MOD' | 'PARTNER_INFO' | 'USER_AUTH_MOD';

/** 코드 페이징 필터 */

interface MypageState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  favoriteList: SelectFavorites[];
  setFavoriteList: (selectFavorites: SelectFavorites[]) => void;
  selectedUser: UserResponsePaging;
  setSelectedUser: (selectedUser: UserResponsePaging) => void;
  modFavorite: (modFavoritesRequest: ModFavoritesRequest) => AxiosPromise<ApiResponse>;
  regFavoritesAll: (modFavoritesRequest: FavoritesMenuList) => AxiosPromise<ApiResponse>;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  updateUserMenuAuth: (withAuthList: MenuRequestWithAuth) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<MypageState, any> = (set, get, api) => {
  return {
    paging: {
      curPage: 1,
      pageRowCount: 20,
    },
    setPaging: (pageObject) => {
      set((state) => ({
        paging: {
          ...state.paging,
          ...pageObject,
        },
      }));
    },
    favoriteList: [{}],
    setFavoriteList: (selectFavorites: SelectFavorites[]) => {
      set((state) => ({
        favoriteList: selectFavorites,
      }));
    },
    selectedUser: {},
    setSelectedUser: (selectedUser: UserResponsePaging) => {
      set((state) => ({
        selectedUser: selectedUser,
      }));
    },
    modFavorite: (modFavoritesRequest) => {
      return authApi.put('/mypage/modFavorite', modFavoritesRequest);
    },
    regFavoritesAll: (favoritesMenuList) => {
      return authApi.put('/mypage/regFavoritesAll', favoritesMenuList);
    },
    modalType: { type: 'USER_ADD', active: false },
    openModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: true,
        },
      }));
    },
    closeModal: (type) => {
      set((state) => ({
        modalType: {
          type,
          active: false,
        },
      }));
    },
    updateUserMenuAuth: (withAuthList) => {
      return authApi.patch('/menu/userMenuAuth', withAuthList);
    },
  };
};
export const useMypageStore = create<MypageState>()(devtools(immer(initialStateCreator)));
