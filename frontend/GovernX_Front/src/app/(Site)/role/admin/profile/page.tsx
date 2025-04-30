"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";

interface CredentialsData {
  atlas_username: string;
  atlas_password: string;
  ranger_username: string;
  ranger_password: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialsData>({
    atlas_username: "",
    atlas_password: "",
    ranger_username: "",
    ranger_password: "",
  });
  const [showAtlasPassword, setShowAtlasPassword] = useState(false);
  const [showRangerPassword, setShowRangerPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:8000/api/credentials", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCredentials({
          atlas_username: data.atlas_username || "",
          atlas_password: data.atlas_password || "",
          ranger_username: data.ranger_username || "",
          ranger_password: data.ranger_password || "",
        });
      } else {
        setErrorMessage(data.error || "Failed to fetch credentials");
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      setErrorMessage("An error occurred while fetching credentials");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("No authentication token found");
        setIsLoading(false);
        return;
      }

      // Validate pairs
      if (
        (credentials.atlas_username && !credentials.atlas_password) ||
        (!credentials.atlas_username && credentials.atlas_password)
      ) {
        setErrorMessage(
          "Both Atlas username and password must be provided together",
        );
        setIsLoading(false);
        return;
      }

      if (
        (credentials.ranger_username && !credentials.ranger_password) ||
        (!credentials.ranger_username && credentials.ranger_password)
      ) {
        setErrorMessage(
          "Both Ranger username and password must be provided together",
        );
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/credentials", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || "Credentials saved successfully");
        fetchCredentials(); // Refresh the data
      } else {
        setErrorMessage(data.error || "Failed to save credentials");
      }
    } catch (error) {
      console.error("Error saving credentials:", error);
      setErrorMessage("An error occurred while saving credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-6 shadow dark:bg-dark-2"
        >
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Manage Credentials
          </h2>

          {/* Atlas Credentials */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-medium text-dark dark:text-white">
              Atlas Credentials
            </h3>

            <div className="mb-4">
              <label
                htmlFor="atlas_username"
                className="mb-2.5 block font-medium text-dark dark:text-white"
              >
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="atlas_username"
                  name="atlas_username"
                  value={credentials.atlas_username}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="atlas_password"
                className="mb-2.5 block font-medium text-dark dark:text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showAtlasPassword ? "text" : "password"}
                  id="atlas_password"
                  name="atlas_password"
                  value={credentials.atlas_password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowAtlasPassword(!showAtlasPassword)}
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  {showAtlasPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Ranger Credentials */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-medium text-dark dark:text-white">
              Ranger Credentials
            </h3>

            <div className="mb-4">
              <label
                htmlFor="ranger_username"
                className="mb-2.5 block font-medium text-dark dark:text-white"
              >
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="ranger_username"
                  name="ranger_username"
                  value={credentials.ranger_username}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="ranger_password"
                className="mb-2.5 block font-medium text-dark dark:text-white"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showRangerPassword ? "text" : "password"}
                  id="ranger_password"
                  name="ranger_password"
                  value={credentials.ranger_password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowRangerPassword(!showRangerPassword)}
                  className="absolute right-4.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  {showRangerPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mb-4.5">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Credentials"}
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 text-center text-green-500 dark:text-green-400">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 text-center text-red-500 dark:text-red-400">
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </AdminLayout>
  );
}
