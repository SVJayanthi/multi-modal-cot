import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      scope: 'openid profile email',
    },
    returnTo: '/profile',
  }),
  logout: handleLogout({
    returnTo: '/',
  }),
});

export const dynamic = 'force-dynamic';