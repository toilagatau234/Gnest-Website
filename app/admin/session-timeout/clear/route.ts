import { NextResponse } from 'next/server';

import {
  ADMIN_IDLE_COOKIE_NAME,
  getAdminActivityCookieOptions,
} from '@/lib/services/admin/auth-config';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL('/admin/login?reason=timeout', request.url));
  response.cookies.set(ADMIN_IDLE_COOKIE_NAME, '', {
    ...getAdminActivityCookieOptions(),
    maxAge: 0,
  });

  return response;
}
