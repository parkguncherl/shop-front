import React, { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { Hydrate, QueryClientProvider, QueryClient, QueryCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../libs/lang/i18n';
import '../libs/agGridLicense';
import { SessionProvider, signOut } from 'next-auth/react';
import '../styles/global.scss';
import { ErrorMessage, Layout } from '../components';
import { AppProvider } from '../stores';
import { ConfigProvider } from 'antd';
import ko from 'antd/locale/ko_KR';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ErrorBoundary } from 'react-error-boundary';
import Error from 'next/error';
import 'ag-grid-community/styles/ag-grid.css'; // Mandatory CSS required by the Data Grid
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'react-datepicker/dist/react-datepicker.css';
import 'ag-grid-enterprise';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AllEnterpriseModule } from 'ag-grid-enterprise'; // Enterprise 사용 시

// dayjs 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ko');
dayjs.tz.setDefault('Asia/Seoul');

ModuleRegistry.registerModules([
  AllCommunityModule,
  AllEnterpriseModule, // Enterprise 라이선스가 있는 경우만
]);

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onSuccess: async (e: any) => {
            const resultCode = e?.data?.resultCode;
            if ([990, 991, 992, 993].includes(resultCode)) {
              signOut({ redirect: true, callbackUrl: '/login' });
              console.debug('====> 인증토큰 값이 유효하지 않음');
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
      }),
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const functionKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11'];
      if (functionKeys.includes(event.key)) {
        event.preventDefault();
        console.log('key press prevented==>', event.key);
      }

      if (event.ctrlKey && (event.key === 'a' || event.key === 'A')) {
        event.preventDefault();
        console.log('key press prevented==>', event.key);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  return (
    <ErrorBoundary fallback={<Error statusCode={500} />} onError={async (e) => await ErrorMessage(e.stack)}>
      <Head>
        <title>BINBLUR</title>
      </Head>
      <ConfigProvider
        locale={ko}
        theme={{
          hashed: false,
        }}
        componentSize={'middle'}
      >
        <QueryClientProvider client={queryClient}>
          {/* 추후  !==  로 변경 todo */}
          {process.env.NODE_ENV === 'production' ? <ReactQueryDevtools initialIsOpen={false} /> : ''}
          <Hydrate state={pageProps.dehydratedState}>
            <SessionProvider session={session} refetchOnWindowFocus={true} refetchInterval={60}>
              <AppProvider>
                {router.pathname === '/login' ? (
                  <Component {...pageProps} />
                ) : (
                  <Layout>
                    <Component {...pageProps} />
                  </Layout>
                )}
              </AppProvider>
            </SessionProvider>
          </Hydrate>
        </QueryClientProvider>
        <ToastContainer />
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
