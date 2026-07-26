'use client';

import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider, signOut } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../libs/agGridLicense';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AxiosResponse } from 'axios';
import { ApiResponse } from '@/generated';

// dayjs 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko');
dayjs.tz.setDefault('Asia/Seoul');

ModuleRegistry.registerModules([AllCommunityModule]);

export default function RootProvider({ children }: { children: ReactNode }) {
  console.log('ToastContainer ==>', ToastContainer);
  const queryClient = new QueryClient({
    /**
     * 백앤드의 aop 구조에 대응하여 전역 핸들러 정의, 리다이렉트
     * 역시 요청 시점에 전역적인 검증 영역을 추가함
     * */
    queryCache: new QueryCache({
      onSuccess: async (data, query) => {
        if (typeof data == 'object') {
          const catchedResponse = data as AxiosResponse<ApiResponse>;
          if (catchedResponse.data) {
            const resultCode = catchedResponse.data.resultCode;
            if (resultCode) {
              if ([990, 991, 992, 993].includes(resultCode)) {
                signOut({ redirect: true, callbackUrl: '/login' });
                console.debug('====> 인증토큰 값이 유효하지 않음');
              }
            } else {
              console.error('결과코드(resultCode) 를 찾을 수 없음');
            }
          }
        }
      },
    }),
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: 'always',
      },
    },
  });


  return (
    <QueryClientProvider client={queryClient}>
      {/* 추후  !==  로 변경 todo */}
      {process.env.NODE_ENV === 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : ''}
      <SessionProvider refetchOnWindowFocus={true} refetchInterval={60}>
        <ToastContainer />
        {/*<AppProvider>{children}</AppProvider>*/}
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
