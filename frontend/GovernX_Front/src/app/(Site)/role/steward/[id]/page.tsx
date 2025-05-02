import { Metadata } from "next";
import StewardLayout from "@/components/Layouts/StewardLayout";

export const metadata: Metadata = {
  title: "GovernX",
  description: "",
  // other metadata
};

const StewardPage = () => {
  return (
    <StewardLayout>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-gray-7"> WELCOME BACK </h1>
        <h3>How could we assist you today ?</h3>
      </div>
    </StewardLayout>
  );
};

export default StewardPage;
