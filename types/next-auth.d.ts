import { JwtAuthToken, UserResponseSelectByLoginId } from '../generated';

interface ISessionUser extends UserResponseSelectByLoginId {
  token: JwtAuthToken;
}

declare module 'next-auth' {
  interface Session {
    user: UserResponseSelectByLoginId;
    token: JwtAuthToken;
    error?: string;
  }

  interface User extends ISessionUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: ISessionUser;
  }
}
