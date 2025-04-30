"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { useReactToPrint } from "react-to-print";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface CreatedUser {
  email: string;
  role: string;
  team: string;
  generated_password: string;
}

interface ApiResponse {
  created_users: CreatedUser[];
}

export default function CreateUserForm() {
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "analyst",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const router = useRouter();
  const tableRef = React.useRef(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setApiResponse(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("No authentication token found");
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/admin/new", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([formData]), // Wrap in array to match bulk format
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("User created successfully!");
        setFormData({
          email: "",
          first_name: "",
          last_name: "",
          role: "analyst",
        });
        setApiResponse(data);
      } else {
        setErrorMessage(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setErrorMessage("An error occurred while creating the user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file first");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setApiResponse(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("No authentication token found");
        setIsLoading(false);
        return;
      }

      // Read the Excel file and convert to JSON
      const users = await readExcelFile(file);

      const response = await fetch("http://localhost:8000/api/admin/new", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(users),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          `${data.created_users.length} users created successfully!`,
        );
        setFile(null);
        setApiResponse(data);
        // Clear file input
        const fileInput = document.getElementById(
          "file-upload",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setErrorMessage(data.error || "Failed to create users");
      }
    } catch (error) {
      console.error("Error in bulk upload:", error);
      setErrorMessage("An error occurred during bulk upload");
    } finally {
      setIsLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split("\n");
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());

          const users = lines
            .slice(1)
            .map((line) => {
              if (!line.trim()) return null;
              const values = line.split(",");
              const user: any = {};
              headers.forEach((header, index) => {
                user[header] = values[index]?.trim();
              });
              return user;
            })
            .filter((user) => user !== null);

          resolve(users);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  };

  const downloadPDF = async () => {
    if (!apiResponse) return;

    const doc = new jsPDF();
    const table = tableRef.current;

    if (table) {
      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`created_users_${new Date().toISOString()}.pdf`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Single User Creation Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-white p-6 shadow dark:bg-dark-2"
        >
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Create Single User
          </h2>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2.5 block font-medium text-dark dark:text-white"
            >
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter user's email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="first_name"
              className="mb-2.5 block font-medium text-dark dark:text-white"
            >
              First Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter first name"
                name="first_name"
                id="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="last_name"
              className="mb-2.5 block font-medium text-dark dark:text-white"
            >
              Last Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter last name"
                name="last_name"
                id="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="role"
              className="mb-2.5 block font-medium text-dark dark:text-white"
            >
              Role
            </label>
            <div className="relative">
              <select
                name="role"
                id="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              >
                <option value="analyst">Data Analyst</option>
                <option value="steward">Data Steward</option>
              </select>
            </div>
          </div>

          <div className="mb-4.5">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create User"}
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

        {/* Bulk Upload Form */}
        <form
          onSubmit={handleBulkUpload}
          className="rounded-lg bg-white p-6 shadow dark:bg-dark-2"
        >
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Bulk Upload Users
          </h2>

          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="mb-2.5 block font-medium text-dark dark:text-white"
            >
              Excel File (CSV)
            </label>
            <div className="relative">
              <input
                type="file"
                id="file-upload"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Upload a CSV file with columns: email, first_name, last_name, role
            </p>
          </div>

          <div className="mb-4.5">
            <button
              type="submit"
              disabled={isLoading || !file}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Uploading..." : "Upload & Create Users"}
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

        {/* Results Table */}
        {apiResponse && apiResponse.created_users && (
          <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-dark dark:text-white">
                Created Users
              </h2>
              <button
                onClick={downloadPDF}
                className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-opacity-90"
              >
                Download as PDF
              </button>
            </div>
            <div className="overflow-x-auto" ref={tableRef}>
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Generated Password
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {apiResponse.created_users.map((user, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.role}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.team}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.generated_password}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
