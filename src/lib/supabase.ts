import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your_supabase_url_here') {
    const configError = new Error(
      'Configuração Supabase em falta. Define NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
    const authError = async () => ({ data: null, error: configError });
    const noop = () => ({ data: null, error: configError });
    const mockAuth = {
      getUser: async () => ({ data: { user: null }, error: configError }),
      getSession: async () => ({ data: { session: null }, error: configError }),
      signUp: async () => ({ data: { user: null, session: null }, error: configError }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: configError }),
      resetPasswordForEmail: authError,
      updateUser: async () => ({ data: { user: null }, error: configError }),
      signOut: async () => ({ error: configError }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: configError }),
    };
    const mockQuery = () => {
      const chain: any = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        upsert: () => chain,
        delete: () => chain,
        eq: () => chain,
        in: () => chain,
        limit: () => chain,
        gte: () => chain,
        lte: () => chain,
        order: () => chain,
        single: () => Promise.resolve({ data: null, error: configError }),
        maybeSingle: () => Promise.resolve({ data: null, error: configError }),
        then: (fn: any) => Promise.resolve({ data: null, error: configError }).then(fn),
      };
      return chain;
    };
    return {
      auth: mockAuth,
      from: mockQuery,
      rpc: async () => ({ data: null, error: configError }),
      storage: {
        from: () => ({
          upload: noop,
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          createSignedUrl: async () => ({ data: null, error: configError }),
          remove: noop,
        }),
      },
    } as any;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
}
