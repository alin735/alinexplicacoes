import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getUserPurchasedLessonIds,
  userHasCompletePackage,
} from '@/lib/group-class-purchases';

function getUserClient(authHeader: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Configuração Supabase incompleta no servidor.');
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ lessonIds: [], hasComplete: false });
    }

    const userClient = getUserClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData.user) {
      return NextResponse.json({ lessonIds: [], hasComplete: false });
    }

    const [lessonIds, hasComplete] = await Promise.all([
      getUserPurchasedLessonIds(authData.user.id),
      userHasCompletePackage(authData.user.id),
    ]);

    return NextResponse.json({ lessonIds, hasComplete });
  } catch (err: any) {
    console.error('My lessons error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
