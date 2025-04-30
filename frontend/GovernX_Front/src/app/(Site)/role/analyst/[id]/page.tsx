import { Metadata } from "next";
import AnalystLayout from "@/components/Layouts/AnalystLayout";

export const metadata: Metadata = {
  title: "GovernX",
  description: "",
  // other metadata
};

const AdminPage = () => {
  return (
    <AnalystLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-gray-7"> WELCOME BACK </h1>
        <h3>How could we assist you today ?</h3>
      </div>
    </AnalystLayout>
  );
};

export default AdminPage;
