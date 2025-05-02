"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/Layouts/AdminLayout";

interface DataDomain {
  id: number;
  name: string;
  description: string;
}

interface TeamUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  team_id: number;
  team_name: string;
  is_active: boolean;
  data_domains: DataDomain[];
}

interface UserData {
  id: number;
  email: string;
  team: {
    id: number;
    name: string;
  };
  is_active: boolean;
}

export default function TeamDataManagement() {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null);
  const [dataDomains, setDataDomains] = useState<DataDomain[]>([]);
  const [newDomain, setNewDomain] = useState({
    name: "",
    description: "",
  });
  const [editDomain, setEditDomain] = useState<DataDomain | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch the user's team on component mount
  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("No authentication token found");
          return;
        }

        const response = await fetch("http://localhost:8000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data: UserData = await response.json();
        if (!data.team) {
          throw new Error("User is not associated with any team");
        }

        setTeamId(data.team.id);
        setTeamName(data.team.name);
      } catch (error) {
        console.error("Error fetching user team:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An error occurred while fetching user team",
        );
      }
    };

    fetchUserTeam();
  }, []);

  // Fetch users and data domains when teamId changes
  useEffect(() => {
    if (teamId) {
      fetchTeamUsers(teamId);
      fetchDataDomains(teamId);
    }
  }, [teamId]);

  const fetchTeamUsers = async (id: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/teams/${id}/users/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch team users");
      }

      const data = await response.json();
      const formattedUsers = data.users.map((user: any) => ({
        ...user,
        data_domains: user.data_domains || [],
        is_active: user.is_active !== undefined ? user.is_active : true,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching team users:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching team users",
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDataDomains = async (teamId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/teams/${teamId}/datadomains/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data domains");
      }

      const data = await response.json();
      const domains = Array.isArray(data) ? data : data.domains || [];
      setDataDomains(domains);
    } catch (error) {
      console.error("Error fetching data domains:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching data domains",
      );
      setDataDomains([]);
    }
  };

  const handleCreateDomain = async () => {
    if (!newDomain.name) {
      setErrorMessage("Domain name is required");
      return;
    }

    if (!teamId) {
      setErrorMessage("No team selected");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/datadomains/create/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newDomain,
            team: teamId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create data domain");
      }

      setSuccessMessage("Data domain created successfully!");
      setNewDomain({ name: "", description: "" });
      fetchDataDomains(teamId);
    } catch (error) {
      console.error("Error creating data domain:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while creating data domain",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDomain = async () => {
    if (!editDomain) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/datadomains/update/${editDomain.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editDomain),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update data domain");
      }

      setSuccessMessage("Data domain updated successfully!");
      setEditDomain(null);
      if (teamId) fetchDataDomains(teamId);
    } catch (error) {
      console.error("Error updating data domain:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while updating data domain",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDomain = async (id: number) => {
    if (!confirm("Are you sure you want to delete this data domain?")) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/datadomains/delete/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete data domain");
      }

      setSuccessMessage("Data domain deleted successfully!");
      if (teamId) fetchDataDomains(teamId);
    } catch (error) {
      console.error("Error deleting data domain:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while deleting data domain",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAllUsersStatus = async (action: "activate" | "deactivate") => {
    if (!teamId) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/toggleactivate/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team_id: teamId,
            action: action,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle user status");
      }

      const data = await response.json();
      setSuccessMessage(data.message);
      fetchTeamUsers(teamId);
    } catch (error) {
      console.error("Error toggling user status:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while toggling user status",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSingleUserStatus = async (
    userId: number,
    currentStatus: boolean,
  ) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/toggle-status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !currentStatus,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle user status");
      }

      setSuccessMessage(
        `User ${!currentStatus ? "activated" : "deactivated"} successfully!`,
      );

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_active: !currentStatus } : user,
        ),
      );

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: !currentStatus });
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while toggling user status",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomainToUser = async (userId: number, domainId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/add-datadomain/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ domain_id: domainId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add data domain to user");
      }

      setSuccessMessage("Data domain added to user successfully!");
      if (teamId) fetchTeamUsers(teamId);
      if (selectedUser?.id === userId) {
        const domainToAdd = dataDomains.find((d) => d.id === domainId);
        if (domainToAdd) {
          setSelectedUser({
            ...selectedUser,
            data_domains: [...selectedUser.data_domains, domainToAdd],
          });
        }
      }
    } catch (error) {
      console.error("Error adding data domain to user:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while adding data domain to user",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDomainFromUser = async (
    userId: number,
    domainId: number,
  ) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/remove-datadomain/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ domain_id: domainId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to remove data domain from user",
        );
      }

      setSuccessMessage("Data domain removed from user successfully!");
      if (teamId) fetchTeamUsers(teamId);
      if (selectedUser?.id === userId) {
        setSelectedUser({
          ...selectedUser,
          data_domains: selectedUser.data_domains.filter(
            (d) => d.id !== domainId,
          ),
        });
      }
    } catch (error) {
      console.error("Error removing data domain from user:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while removing data domain from user",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceUserDomains = async (
    userId: number,
    domainIds: number[],
  ) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:8000/api/users/${userId}/update-datadomains/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ domain_ids: domainIds }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update user's data domains",
        );
      }

      setSuccessMessage("User's data domains updated successfully!");
      if (teamId) fetchTeamUsers(teamId);
      if (selectedUser?.id === userId && dataDomains) {
        setSelectedUser({
          ...selectedUser,
          data_domains: dataDomains.filter((d) => domainIds.includes(d.id)),
        });
      }
    } catch (error) {
      console.error("Error updating user's data domains:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while updating user's data domains",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Team Information */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Team Management
          </h2>

          <div className="mb-4">
            <label className="mb-2.5 block font-medium text-dark dark:text-white">
              Your Team
            </label>
            <div className="relative">
              <input
                type="text"
                value={teamName || "Loading..."}
                readOnly
                className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => toggleAllUsersStatus("activate")}
              disabled={isLoading || !teamId}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Activate All Users"}
            </button>
            <button
              onClick={() => toggleAllUsersStatus("deactivate")}
              disabled={isLoading || !teamId}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Deactivate All Users"}
            </button>
          </div>
        </div>

        {/* Data Domains Management */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Data Domains Management
          </h2>

          {/* Create Data Domain */}
          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
              Create New Data Domain
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="domain-name"
                  className="mb-2.5 block font-medium text-dark dark:text-white"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="domain-name"
                  placeholder="Enter domain name"
                  value={newDomain.name}
                  onChange={(e) =>
                    setNewDomain({ ...newDomain, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="domain-description"
                  className="mb-2.5 block font-medium text-dark dark:text-white"
                >
                  Description
                </label>
                <textarea
                  id="domain-description"
                  placeholder="Enter domain description"
                  value={newDomain.description}
                  onChange={(e) =>
                    setNewDomain({ ...newDomain, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                  rows={3}
                />
              </div>
              <button
                onClick={handleCreateDomain}
                disabled={isLoading}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Creating..." : "Create Data Domain"}
              </button>
            </div>
          </div>

          {/* Edit Data Domain Modal */}
          {editDomain && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md rounded-lg bg-white p-6 shadow dark:bg-dark-2">
                <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
                  Edit Data Domain
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-domain-name"
                      className="mb-2.5 block font-medium text-dark dark:text-white"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="edit-domain-name"
                      value={editDomain.name}
                      onChange={(e) =>
                        setEditDomain({ ...editDomain, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-domain-description"
                      className="mb-2.5 block font-medium text-dark dark:text-white"
                    >
                      Description
                    </label>
                    <textarea
                      id="edit-domain-description"
                      value={editDomain.description}
                      onChange={(e) =>
                        setEditDomain({
                          ...editDomain,
                          description: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-stroke bg-transparent py-[15px] pl-6 pr-11 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditDomain(null)}
                      className="rounded-lg border border-stroke px-4 py-2 font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateDomain}
                      disabled={isLoading}
                      className="rounded-lg bg-primary px-4 py-2 font-medium text-white transition hover:bg-opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? "Updating..." : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Domains List */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
              Existing Data Domains
            </h3>
            {isLoading ? (
              <p className="text-gray-500 dark:text-gray-400">
                Loading data domains...
              </p>
            ) : dataDomains.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No data domains found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {dataDomains.map((domain) => (
                      <tr key={domain.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {domain.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {domain.description}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <button
                            onClick={() => setEditDomain(domain)}
                            className="mr-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Team Users List */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
          <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
            Team Members
          </h2>

          {isLoading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No team members found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {user.role}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            user.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              toggleSingleUserStatus(user.id, user.is_active)
                            }
                            className={`rounded px-2 py-1 text-xs font-medium ${
                              user.is_active
                                ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                            }`}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="rounded px-2 py-1 text-xs font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Manage Domains
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Data Domains Management Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow dark:bg-dark-2">
              <div className="flex justify-between">
                <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
                  Manage Data Domains for {selectedUser.first_name}{" "}
                  {selectedUser.last_name}
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <h4 className="mb-2 font-medium text-dark dark:text-white">
                  Current Data Domains
                </h4>
                {selectedUser.data_domains.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.data_domains.map((domain) => (
                      <div
                        key={domain.id}
                        className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-dark-3"
                      >
                        <span className="text-dark dark:text-white">
                          {domain.name}
                        </span>
                        <button
                          onClick={() =>
                            handleRemoveDomainFromUser(
                              selectedUser.id,
                              domain.id,
                            )
                          }
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No data domains assigned
                  </p>
                )}
              </div>

              <div className="mb-4">
                <h4 className="mb-2 font-medium text-dark dark:text-white">
                  Available Data Domains
                </h4>
                {isLoading ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading available domains...
                  </p>
                ) : dataDomains.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No data domains available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dataDomains
                      .filter(
                        (domain) =>
                          !selectedUser.data_domains.some(
                            (d) => d.id === domain.id,
                          ),
                      )
                      .map((domain) => (
                        <div
                          key={domain.id}
                          className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-dark-3"
                        >
                          <span className="text-dark dark:text-white">
                            {domain.name}
                          </span>
                          <button
                            onClick={() =>
                              handleAddDomainToUser(selectedUser.id, domain.id)
                            }
                            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-2 font-medium text-dark dark:text-white">
                  Bulk Update
                </h4>
                {isLoading ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading domains...
                  </p>
                ) : dataDomains.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No domains available
                  </p>
                ) : (
                  <>
                    <select
                      multiple
                      className="h-40 w-full rounded-lg border border-stroke bg-transparent p-2 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                      value={selectedUser.data_domains.map((d) =>
                        d.id.toString(),
                      )}
                      onChange={(e) => {
                        const options = Array.from(
                          e.target.selectedOptions,
                          (option) => Number(option.value),
                        );
                        handleReplaceUserDomains(selectedUser.id, options);
                      }}
                    >
                      {dataDomains.map((domain) => (
                        <option key={domain.id} value={domain.id.toString()}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Hold Ctrl/Cmd to select multiple domains
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="rounded-lg bg-green-100 p-4 text-green-700 dark:bg-green-900 dark:text-green-200">
            {successMessage}
            <button
              onClick={() => setSuccessMessage("")}
              className="float-right text-green-800 dark:text-green-200"
            >
              ✕
            </button>
          </div>
        )}
        {errorMessage && (
          <div className="rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
            {errorMessage}
            <button
              onClick={() => setErrorMessage("")}
              className="float-right text-red-800 dark:text-red-200"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
