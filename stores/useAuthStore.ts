import { create, StateCreator } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi, publicApi } from '../libs';
import { ApiResponse, ApiResponseLoginResponse, JwtAuthToken, LoginRequest, User } from '../generated';
import { AxiosPromise } from 'axios';

type ModalType = 'FIRST' | 'LONGTIMENOSEE' | 'FINDPASS';

interface AuthState {
  token: JwtAuthToken | undefined; // undefined를 명시적으로 포함
  user?: User;
  isAuthenticated: boolean;
  setUser: (user?: User) => void;
  setJwtAuthToken: (jwtAuthToken: JwtAuthToken) => void;
  onVerification: (req: LoginRequest) => AxiosPromise<ApiResponse>;
  onSubmitLogin: (req: LoginRequest) => AxiosPromise<ApiResponseLoginResponse>;
  onSendOtp: (req: LoginRequest) => AxiosPromise<ApiResponseLoginResponse>;
  setChangePassword: (req: LoginRequest) => AxiosPromise<ApiResponseLoginResponse>;
  setStayPassword: (req: LoginRequest) => AxiosPromise<ApiResponseLoginResponse>;
  onFindPassword: (req: LoginRequest) => AxiosPromise<ApiResponseLoginResponse>;
  logout: (loginId: string) => AxiosPromise<ApiResponseLoginResponse>;
  modalType: { type: ModalType; active: boolean };
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
}
const initialStateCreator: StateCreator<AuthState, any> = (set, get, api) => {
  return {
    token: undefined,
    isAuthenticated: false,
    setJwtAuthToken: (jwtAuthToken) => {
      if (jwtAuthToken.accessToken) {
        localStorage.setItem('access_token', jwtAuthToken.accessToken);
      }
      set((state) => ({
        token: jwtAuthToken,
        isAuthenticated: true,
      }));
    },
    setUser: (user?) => {
      set((state) => ({
        user: user,
      }));
    },
    onVerification: (req) => publicApi.post('/auth/verification', req),
    onSubmitLogin: (req) => publicApi.post('/auth/login', req),
    onSendOtp: (req) => publicApi.post('/auth/makeOtpNo', req),
    setChangePassword: (req) => publicApi.post('/auth/updatePassword', req),
    setStayPassword: (req) => publicApi.post('/auth/stayPassword', req),
    onFindPassword: (req) => publicApi.post('/auth/passwordInit', req),
    logout: (loginId) => authApi.get('/auth/logout/' + loginId),

    modalType: { type: 'FIRST', active: false },
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
  };
};

export const useAuthStore = create<AuthState>()(devtools(immer(initialStateCreator)));
