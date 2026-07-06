import type { MiddlewareHandler } from 'hono';
import { jwtVerify } from 'jose';
import type { AppBindings } from '../../../env';

// /api/auth is mounted before this middleware in the composition root, so login is
// already public by registration order — the skip here is defense in depth.
const PUBLIC_PATH_PREFIXES = ['/api/auth'];

export const jwtMiddleware: MiddlewareHandler<AppBindings> = async (c, next) => {
  const path = new URL(c.req.url).pathname;
  if (PUBLIC_PATH_PREFIXES.some((p) => path.startsWith(p))) {
    return next();
  }

  const header = c.req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const token = header.slice('Bearer '.length);
  const secret = new TextEncoder().encode(c.env.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    if (typeof sub !== 'string') {
      return c.json({ error: 'unauthorized' }, 401);
    }
    c.set('user', { id: sub });
  } catch {
    return c.json({ error: 'unauthorized' }, 401);
  }

  await next();
};
