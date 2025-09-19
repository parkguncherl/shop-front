import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import useAppStore, { appStoreContext } from './stores/useAppStore';

export async function middleware(req: NextRequest) {
  // const pathname = req.nextUrl.pathname;
  // const t = await getToken({
  //   req,
  //   secret: process.env.NEXT_AUTH_SECRET,
  // });
  // if (req?.nextUrl?.pathname?.startsWith('/login')) {
  // if (t) {
  //   return NextResponse.redirect(new URL(`/`, req.url));
  // }
  // }
}

export default withAuth({
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXT_AUTH_SECRET,
  callbacks: {
    async authorized({ token, req }) {
      const pathname = req.nextUrl.pathname;
      const t = await getToken({
        req,
        secret: process.env.NEXT_AUTH_SECRET,
      });
      if (t) {
        return true;
      } else {
        return false;
      }
    },
  },
});

export const config = {
  matcher: ['/:path*'],
};
