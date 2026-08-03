import { isPortalAdmin } from '@/lib/portal';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';

export const dynamic = 'force-dynamic';

export default async function PortalAdminPage() {
  const admin = await isPortalAdmin();
  if (!admin) return <AdminLogin />;
  return <AdminDashboard />;
}
