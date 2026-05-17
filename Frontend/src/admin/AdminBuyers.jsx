import AdminUserList from './AdminUserList';

export default function AdminBuyers() {
  return (
    <AdminUserList
      fixedRole="buyer"
      title="Buyers"
      description="Everyone using sBay to shop. Restrict accounts that violate the marketplace policy or remove fraudulent ones."
      showRoleFilter={false}
      allowDelete
    />
  );
}
