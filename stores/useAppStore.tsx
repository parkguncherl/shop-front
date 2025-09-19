import React, { useEffect } from 'react';
import { createStore, useStore } from 'zustand';

import { Session } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { ISessionUser } from '../types/next-auth';
import { toastError } from '../components';
import Loading from '../components/Loading';

interface IProps {
  children: React.ReactNode;
}

interface IContext {
  session?: (Session & { user: ISessionUser }) | null;
}

export const appStoreContext = createStore<IContext>((set, get) => {
  return {
    session: null,
  };
});

export const AppProvider = ({ children }: IProps) => {
  const session = useSession();
  useEffect(() => {
    if (session.status === 'loading') return;
    if (session.data?.error) {
      toastError(session.data.error); // 토큰 재발급 실패
      signOut({ redirect: true, callbackUrl: process.env.NEXT_BASE_URL });
    }
    appStoreContext.setState({
      session: session.data as any,
    });
  }, [session]);

  if (session.status === 'loading') {
    return <Loading />;
  }

  return <>{children}</>;
};

const useAppStore = () => useStore(appStoreContext);

export default useAppStore;
