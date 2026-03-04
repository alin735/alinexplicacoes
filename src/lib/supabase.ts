import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your_supabase_url_here') {
    // Return a mock client for build time
    const noop = () => ({ data: null, error: null });
    const mockAuth = {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: noop,
      signInWithPassword: noop,
      signOut: noop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      exchangeCodeForSession: noop,
    };
    const mockQuery = () => {
      const chain: any = {
        select: () => chain,
        insert: () => chain,
        update: () => chain,
        delete: () => chain,
        eq: () => chain,
        gte: () => chain,
        lte: () => chain,
        order: () => chain,
        single: () => Promise.resolve({ data: null, error: null }),
        then: (fn: any) => Promise.resolve({ data: null, error: null }).then(fn),
      };
      return chain;
    };
    return {
      auth: mockAuth,
      from: mockQuery,
      storage: { from: () => ({ upload: noop, getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
    } as any;
  }

  return createBrowserClient(url, key);
}

