'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface RoleGuardOptions {
  roles?: string[];
  redirectTo?: string;
}

export function useRoleGuard(options: RoleGuardOptions = {}) {
  const { roles = [], redirectTo = '/food' } = options;
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      const search = new URLSearchParams();
      search.set('callbackUrl', pathname);
      router.replace(`/login?${search.toString()}`);
      return;
    }

    if (roles.length > 0) {
      const userRole = session.user.role ?? 'CUSTOMER';
      if (!roles.includes(userRole)) {
        router.replace(redirectTo);
      }
    }
  }, [session, status, roles.join('|'), redirectTo, router, pathname]);

  return { session, status };
}
