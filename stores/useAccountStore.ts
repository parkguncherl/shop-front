import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  ApiResponse,
  PageObject,
  UserRequestCreate,
  UserRequestUpdate,
  UserRequestDelete,
  UserControllerApiSelectUserPagingRequest,
  ApiResponseUserResponseSelect,
  UserRequestEmail,
  UserRequestUnLock,
  ApiResponseUserResponseSelectByLoginId,
  UserResponseSelectByLoginId,
} from '../generated';
import { AxiosPromise } from 'axios';
import { authApi } from '../libs';
import { StateCreator } from 'zustand/esm';

type ModalType = 'ADD' | 'MOD' | 'UNLOCK';

export type AccountPagingFilter = Pick<
  UserControllerApiSelectUserPagingRequest,
  'userNm' | 'authCd' | 'phoneNo' | 'belongNm' | 'deptNm' | 'positionNm' | 'useYn' | 'partnerNm' | 'omsWmsTp'
>;

interface AccountState {
  paging: PageObject;
  setPaging: (pagingInfo: PageObject | undefined) => void;
  selectedUser: UserResponseSelectByLoginId | undefined;
  setSelectedUser: (user: UserResponseSelectByLoginId) => void;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  onClear: () => void;
}

interface AccountApiState {
  insertUser: (userRequest: UserRequestCreate) => AxiosPromise<ApiResponseUserResponseSelect>;
  updateUser: (userRequest: UserRequestUpdate) => AxiosPromise<ApiResponse>;
  deleteUser: (userRequest: UserRequestDelete) => AxiosPromise<ApiResponse>;
  sendMailUser: (userRequest: UserRequestEmail) => AxiosPromise<ApiResponse>;
  updateUserUnLock: (userRequest: UserRequestUnLock) => AxiosPromise<ApiResponse>;
  updatePasswordInit: (userRequest: UserRequestUpdate) => AxiosPromise<ApiResponse>;
  selectUserByLoginId: (loginId: string) => AxiosPromise<ApiResponseUserResponseSelectByLoginId>;
  createAuthForPartner: (userId: number) => AxiosPromise<ApiResponse>;
}

const initialStateCreator: StateCreator<AccountState & AccountApiState, any> = (set, get, api) => {
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
    selectedUser: undefined,
    setSelectedUser: (user) => {
      set((state) => ({
        selectedUser: user,
      }));
    },
    modalType: { type: 'ADD', active: false },
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
    insertUser: (userRequest) => {
      return authApi.post('/user', userRequest);
    },
    updateUser: (userRequest) => {
      return authApi.put('/user', userRequest);
    },
    deleteUser: (userRequest) => {
      return authApi.delete('/user', {
        data: userRequest,
      });
    },
    sendMailUser: (userRequest) => {
      return authApi.post('/user/send-mail', userRequest);
    },
    updateUserUnLock: (userRequest) => {
      return authApi.put('/user/un-lock', userRequest);
    },
    updatePasswordInit: (userRequest) => {
      return authApi.put('/user/password-init', userRequest);
    },
    selectUserByLoginId: (id) => {
      return authApi.get('/user/' + id);
    },
    createAuthForPartner: (id) => {
      return authApi.get('/user/createAuthForPartner/' + id);
    },

    onClear: () => {
      set(() => initialStateCreator(set, get, api), true);
    },
  };
};

export const useAccountStore = create<AccountState & AccountApiState>()(devtools(immer(initialStateCreator)));
