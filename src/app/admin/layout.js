export const metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | FindBack",
  },
  description: "Manage the FindBack community and its lost and found reports.",
};

export default function AdminLayout({ children }) {
  return children;
}
