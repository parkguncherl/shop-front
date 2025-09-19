import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { publicApi } from '../../../libs';
import { ApiResponseLoginResponse } from '../../../generated';
import { appStoreContext } from '../../../stores';
import { ISessionUser } from '../../../types/next-auth';
import dayjs from 'dayjs';
import axios from 'axios';

let refreshCount = 0;
const baseURL = process.env.NEXT_PUBLIC_SMART_API_ENDPOINT;
const env = process.env.NEXT_PUBLIC_APP_ENV;

const options: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // maxAge(seconds) = 2시간 (만료)
    //maxAge: 1 * 60 * 60 * 2,
    maxAge: 7 * 24 * 60 * 60, //1 주일
    // updateAge(seconds) = 30분 (갱신)
    updateAge: 1 * 60 * 30,
  },
  secret: process.env.NEXT_PUBLIC_SMART_API_ENDPOINT,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        loginId: {
          type: 'text',
        },
        password: {
          type: 'password',
        },
        otpNo: {
          type: 'text',
        },
        isMobileLogin: {
          type: 'text',
        },
        countryCode: {
          type: 'text',
        },
      },
      async authorize(credentials) {
        if (credentials) {
          const { loginId, password, otpNo, isMobileLogin, countryCode } = credentials;
          const { data } = await publicApi.post<ApiResponseLoginResponse>('/auth/login', {
            loginId,
            password,
            otpNo,
            isMobileLogin,
            countryCode,
          });
          const { body, resultCode, resultMessage } = data;
          const user = body?.user;
          const token = body?.token;
          if (user && token) {
            appStoreContext.setState({
              session: {
                user: {
                  ...user,
                  token,
                } as any,
                token,
                expires: token.accessTokenExpireDate!,
              },
            });
          }
          return {
            ...user,
            token,
            refreshCount,
          } as ISessionUser & {
            id: any;
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/error',
  },
  callbacks: {
    async jwt(params) {
      if (params.trigger === 'update') {
        params.token.user.partnerId = params.session.user.partnerId;
        params.token.user.partnerNm = params.session.user.partnerNm;
        params.token.user.workYmd = params.session.user.workYmd;
        params.token.user.workLogisId = params.session.user.workLogisId;
        params.token.user.workLogisNm = params.session.user.workLogisNm;
        params.token.user.isPageAuth = params.session.user.isPageAuth;
        params.token.user.seller1 = params.session.user.seller1;
        params.token.user.seller2 = params.session.user.seller2;
        params.token.user.factory1 = params.session.user.factory1;
        params.token.user.factory2 = params.session.user.factory2;
        params.token.user.sku1 = params.session.user.sku1;
        params.token.user.sku2 = params.session.user.sku2;
      }

      const currentUser = params.user || params.token.user;
      if (currentUser) {
        // access token 만료시간 체크 (PROD, DEV: 30분 이하, LOCAL: 10분 이하)
        //const seconds = env === 'local' ? 1800 : 1800;
        const seconds = 60 * 30; // 30 분
        const accessTokenExpired = new Date(currentUser.token.accessTokenExpireDate!) <= dayjs().add(seconds, 'seconds').toDate();
        console.log('[' + currentUser.token.accessTokenExpireDate + '] vs [' + dayjs().add(seconds, 'seconds').toDate() + ']', accessTokenExpired);
        if (!accessTokenExpired) {
          params.token.user = currentUser as any;
          return params.token;
        }
        try {
          // access token 만료 30분전이라면 refresh token으로 토큰 재발급
          // refresh token 만료시간 이전이면
          if (new Date(currentUser.token.refreshTokenExpireDate!) > dayjs().toDate()) {
            if (currentUser.token.accessToken) {
              const { data } = await axios.get(`${baseURL}/auth/refresh`, {
                headers: {
                  Authorization: `Bearer ${currentUser.token.accessToken}`,
                },
              });
              const { body, resultCode, resultMessage } = data;
              if (resultCode === 200) {
                refreshCount++;
                Object.assign(params.token, {
                  user: {
                    ...params.user,
                    ...currentUser,
                    token: body,
                    refreshCount,
                  },
                });
              } else {
                Object.assign(params.token, {
                  user: null,
                  error: resultMessage || '토큰 재발급 실패했습니다',
                });
              }
            }
          } else {
            // refresh token 만료된 경우
            Object.assign(params.token, {
              user: null,
              error: '토큰이 만료되었습니다. 다시 로그인 해주세요.',
            });
          }
        } catch (err) {
          Object.assign(params, {
            token: {
              user: null,
              error: err,
            },
          });
        }
      }
      return params.token;
    },
    async session({ session, token }) {
      /*
      console.log('>>> next auth session callback session :', session);
      console.log('>>> next auth session callback token :', token);
*/
      if (token?.user) {
        session.user = token.user as any;
      } else {
        const errorMsg = (token as any)?.error || '토큰이 존재하지 않습니다';
        return {
          error: errorMsg,
        } as any;
      }
      return session;
      // if (token.user) {
      //   // 유효 토큰인지 체크
      //   const { data } = await publicApi.get<ApiResponseJwtAuthToken>('/auth/auth-token', {
      //     headers: {
      //       Authorization: `Bearer ${token.user.token.accessToken}`,
      //     },
      //   });
      //   const { resultCode, resultMessage } = data;
      //   if (resultCode !== 200) {
      //     session.error = resultMessage || '권한이 없거나 인증토큰이 만료 되었습니다.';
      //     return session;
      //   }
      //   session.user = token.user as any;
      //   return session;
      // }
      // session.error = '권한이 없거나 인증토큰이 만료 되었습니다. 다시 로그인해주세요.';
      // return session;
    },
  },
};

export default NextAuth(options);
