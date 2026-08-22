import { next, rewrite } from '@vercel/functions';

export const config = {
  matcher: '/',
};

export default function middleware(request) {
  const url = new URL(request.url);
  const hostname = (request.headers.get('host') || '').split(':')[0].toLowerCase();

  if (hostname !== 'codigoemsala.com.br') {
    return next();
  }

  return rewrite(new URL('/demos/codigo-em-sala/index.html', url));
}
