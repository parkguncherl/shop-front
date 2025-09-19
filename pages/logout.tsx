import { useEffect } from 'react';
import { authApi } from '../libs';

const Logout = (p: string | undefined) => {
  useEffect(() => {
    const logout = async () => {
      try {
        await authApi.get('/auth/logoutAuto');
        location.href = '/login';
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };

    logout();
  }, []);
};

export default Logout;
