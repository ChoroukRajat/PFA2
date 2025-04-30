"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import UserLayout from "@/components/Layouts/UserLayout";
import ProfileBox from "@/components/ProfileBox";
import { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";

const Profile = () => {
  const [userData, setUserData] = useState<{
    fullName: string;
    email: string;
    role: "user" | "admin";
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const res = await fetch("http://localhost:8000/api/user", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch user data");

        const data = await res.json();
        setUserData({
          fullName: data.first_name + " " + data.last_name,
          email: data.email,
          role: data.role,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserLayout>
      <div className="mx-auto w-full max-w-[970px]">
        <Breadcrumb pageName="Profile" />
        {loading ? (
          <Loader></Loader>
        ) : userData ? (
          <ProfileBox
            fullName={userData.fullName}
            email={userData.email}
            role={userData.role}
          />
        ) : (
          <p className="text-center text-red-500">Failed to load user data.</p>
        )}
      </div>
    </UserLayout>
  );
};

export default Profile;
