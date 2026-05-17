import { useSearchParams } from 'react-router-dom';
import AdminUserList from './AdminUserList';

/**
 * Seller verification queue — re-uses the user list with a fixed
 * filter that only shows sellers awaiting review. Admins approve or
 * reject from the inline action buttons.
 */
export default function AdminSellerVerification() {
  const [params] = useSearchParams();
  return (
    <AdminUserList
      fixedRole="seller"
      title="Seller verification"
      description="Sellers awaiting verification review. Approve to grant the verified badge across the marketplace; reject with a reason that's emailed to the applicant."
      showRoleFilter={false}
      rowLinkSeller
      initialQuery={params.get('q') || ''}
    />
  );
}
