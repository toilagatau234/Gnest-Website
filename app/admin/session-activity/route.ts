import { NextResponse } from 'next/server';

import { ADMIN_IDLE_COOKIE_NAME, getAdminActivityCookieOptions } from '@/lib/services/admin/auth-config';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(null, { status: 401 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(
    ADMIN_IDLE_COOKIE_NAME,
    String(Date.now()),
    getAdminActivityCookieOptions()
  );

  return response;
}
