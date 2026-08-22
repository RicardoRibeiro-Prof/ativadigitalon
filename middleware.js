import { next, rewrite } from '@vercel/functions';

export const config = {
  matcher: '/:path*',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();

  if (hostname !== 'codigoemsala.com.br') {
    return next();
  }

  if (url.pathname.startsWith('/demos/codigo-em-sala/')) {
    return next();
  }

  url.pathname = url.pathname === '/'
    ? '/demos/codigo-em-sala/index.html'
    : `/demos/codigo-em-sala${url.pathname}`;

  return rewrite(url);
}
