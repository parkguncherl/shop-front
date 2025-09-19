import axios from 'axios';
import { getCookie } from 'cookies-next';
import { appStoreContext } from '../stores';
import { getSession } from 'next-auth/react';
import dayjs from 'dayjs';
import { Session } from 'next-auth';
import { ISessionUser } from '../types/next-auth';

const baseURL = process.env.NEXT_PUBLIC_SMART_API_ENDPOINT;
const env = process.env.NEXT_PUBLIC_APP_ENV;

export const instance = () => {
  const instance = axios.create({ baseURL, withCredentials: true });
  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error?.response?.data?.resultMessage) {
        Object.assign(error, {
          message: error.response.data.resultMessage,
        });
      }
      return Promise.reject(error);
    },
  );
  return instance;
};

export const publicApi = instance();
export const authApi = instance();
export const authDownApi = axios.create({ baseURL, withCredentials: true, responseType: 'blob' });

authApi.interceptors.request.use(
  async function (config) {
    const session = appStoreContext.getState()?.session;
    const token = session?.user.token;
    if (!token) {
      // toastError('토큰이 존재하지 않습니다.');
      // signOut({ redirect: false });
      // throw new axios.Cancel('토큰이 존재하지 않습니다');
    }

    if (token) {
      // if (new Date(token.refreshTokenExpireDate!) < new Date()) {
      //   // toastError('리프레시 토큰이 만료 되었습니다.');
      //   // signOut({ redirect: false });
      //   // throw new axios.Cancel('리프레시 토큰이 만료되었습니다.');
      // }
      //
      // // access token 만료시간 체크 (PROD, DEV: 30분 이하, LOCAL: 10분 이하)
      // const seconds = env === 'local' ? 600 : 1800;
      // const accessTokenExpired = new Date(token.accessTokenExpireDate!) <= dayjs().add(seconds, 'seconds').toDate();
      // if (accessTokenExpired) {
      //   session = (await getSession()) as Session & {
      //     user: ISessionUser;
      //   };
      //   if (!session || !session.user.token) {
      //     // toastError('토큰 발급이 실패했습니다.');
      //     // signOut({ redirect: false });
      //     // throw new axios.Cancel('토큰 발급이 실패했습니다.');
      //   }
      //   token = session.user.token;
      //   appStoreContext.setState({ session });
      // }

      config.headers.set({
        Authorization: `Bearer ${token.accessToken}`,
      });
    }
    return config;
  },
  function (err) {
    return Promise.reject(err);
  },
);

authDownApi.interceptors.request.use(
  async function (config) {
    let session = appStoreContext.getState()?.session;
    let token = session?.user.token;
    if (!token) {
      // toastError('토큰이 존재하지 않습니다.');
      // signOut({ redirect: false });
      // throw new axios.Cancel('토큰이 존재하지 않습니다');
    }

    if (token) {
      if (new Date(token.refreshTokenExpireDate!) < new Date()) {
        // toastError('리프레시 토큰이 만료 되었습니다.');
        // signOut({ redirect: false });
        // throw new axios.Cancel('리프레시 토큰이 만료되었습니다.');
      }

      // TODO : 토큰만료 30초전 -> 5분전
      const accessTokenExpired = new Date(token.accessTokenExpireDate!) <= dayjs().add(30, 'seconds').toDate();
      if (accessTokenExpired) {
        session = (await getSession()) as Session & {
          user: ISessionUser;
        };
        // if (!session || !session.user.token) {
        // toastError('토큰 발급이 실패했습니다.');
        // signOut({ redirect: false });
        // throw new axios.Cancel('토큰 발급이 실패했습니다.');
        // }
        if (session?.user?.token) {
          token = session.user.token;
          appStoreContext.setState({ session });
        }
      }

      config.headers.set({
        Authorization: `Bearer ${token.accessToken}`,
      });
    }
    return config;
  },
  function (err) {
    return Promise.reject(err);
  },
);
authDownApi.interceptors.request.use((config) => {
  config.headers.Authorization = getCookie('access_token');
  return config;
});
