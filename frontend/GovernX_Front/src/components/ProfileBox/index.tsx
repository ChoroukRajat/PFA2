"use client";
import React from "react";
import Image from "next/image";

interface ProfileBoxProps {
  role: "user" | "admin";
  fullName: string;
  email: string;
}

const ProfileBox: React.FC<ProfileBoxProps> = ({ role, fullName, email }) => {
  if (role === "admin") {
    return (
      <div className="rounded-[10px] bg-white p-4 shadow-md dark:bg-gray-dark dark:text-white">
        <h2 className="text-xl font-semibold">{fullName}</h2>
        <p className="text-body-color dark:text-body-dark mt-1 text-sm">
          {email}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
      <div className="relative z-20 h-20 bg-gray-200 dark:bg-gray-700">
        <div className="absolute bottom-1 right-1 z-10 xsm:bottom-4 xsm:right-4">
          <label
            htmlFor="cover"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-[3px] bg-primary px-[15px] py-[5px] text-body-sm font-medium text-white hover:bg-opacity-90"
          >
            <input
              type="file"
              name="coverPhoto"
              id="coverPhoto"
              className="sr-only"
              accept="image/png, image/jpg, image/jpeg"
            />
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.69882 3.365C5.89894 2.38259 6.77316 1.6875 7.77475 1.6875H10.2252C11.2268 1.6875 12.1011 2.38259 12.3012 3.36499..."
                fill=""
              />
            </svg>
            <span>Edit</span>
          </label>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
        <h3 className="text-xl font-semibold text-black dark:text-white">
          {fullName}
        </h3>
        <p className="text-body-color dark:text-body-dark mt-2 text-sm">
          {email}
        </p>
      </div>
    </div>
  );
};

export default ProfileBox;
