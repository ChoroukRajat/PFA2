import { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "GovernX",
  description: "",
};

export default function Home() {
  redirect("/auth/signup");
}
