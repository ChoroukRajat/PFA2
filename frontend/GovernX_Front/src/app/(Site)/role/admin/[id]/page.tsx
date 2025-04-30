import { Metadata } from "next";
import AdminLayout from "@/components/Layouts/AdminLayout";

export const metadata: Metadata = {
  title: "GovernX",
  description: "",
  // other metadata
};

const AdminPage = () => {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-gray-7"> WELCOME BACK </h1>
        <h3>How could we assist you today ?</h3>
      </div>
    </AdminLayout>
  );
};

export default AdminPage;
