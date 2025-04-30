import { Metadata } from "next";
import UserLayout from "@/components/Layouts/UserLayout";

export const metadata: Metadata = {
  title: "GovernX",
  description: "",
  // other metadata
};

const UserPage = () => {
  return (
    <UserLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-gray-7"> WELCOME BACK </h1>
        <h3>How could we assist you today ?</h3>
      </div>
    </UserLayout>
  );
};

export default UserPage;
