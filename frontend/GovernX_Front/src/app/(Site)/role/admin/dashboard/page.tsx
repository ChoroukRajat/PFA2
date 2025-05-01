"use client";

import { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { useState, useEffect, useMemo } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  team: {
    id: number;
    name: string;
  };
}

interface FileAction {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
  };
  source_file: string;
  new_file: string;
  date: string;
  description: string;
  action_type: string;
}

interface UserStat {
  user__id: number;
  user__email: string;
  user__first_name: string;
  user__last_name: string;
  total_actions: number;
  uploads: number;
  normalizations: number;
  duplicates_removed: number;
  missing_values_removed: number;
}

interface ActionTypeStat {
  description: string;
  count: number;
}

const ITEMS_PER_PAGE = 10;

const AdminPage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fileActions, setFileActions] = useState<FileAction[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [actionTypes, setActionTypes] = useState<ActionTypeStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: "",
    time_range: "month",
    user_id: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [teamUsers, setTeamUsers] = useState<UserData[]>([]);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:8000/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        setUserData(data);
        return data.team?.id;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    };

    const fetchTeamUsers = async (teamId: number) => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/teams/${teamId}/users/`,
        );
        if (!response.ok) throw new Error("Failed to fetch team users");
        const data = await response.json();
        setTeamUsers(data.users);
      } catch (error) {
        console.error("Error fetching team users:", error);
      }
    };

    const fetchFileActions = async (teamId: number) => {
      try {
        const actionsUrl = new URL(
          `http://localhost:8000/api/teamfileactions/${teamId}/`,
        );
        Object.entries(filters).forEach(([key, value]) => {
          if (value) actionsUrl.searchParams.append(key, value);
        });

        const response = await fetch(actionsUrl.toString());
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setFileActions(data.actions);
      } catch (error) {
        console.error("Error fetching file actions:", error);
        setFileActions([]);
      }
    };

    const fetchActivityStats = async (teamId: number) => {
      try {
        const statsUrl = new URL(
          `http://localhost:8000/api/teamactivitystats/${teamId}/`,
        );
        statsUrl.searchParams.append("time_range", filters.time_range);

        const response = await fetch(statsUrl.toString());
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        setUserStats(data.user_stats || []);
        setActionTypes(data.action_types || []);
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        setUserStats([]);
        setActionTypes([]);
      }
    };

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const teamId = await fetchUserData();
        if (!teamId) return;

        await fetchTeamUsers(teamId);
        await fetchFileActions(teamId);
        await fetchActivityStats(teamId);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [filters]);

  const filteredFileActions = useMemo(() => {
    if (!filters.user_id) return fileActions;
    return fileActions.filter(
      (action) => action.user.id === parseInt(filters.user_id),
    );
  }, [fileActions, filters.user_id]);

  const filteredUserStats = useMemo(() => {
    if (!filters.user_id) return userStats;
    return userStats.filter(
      (stat) => stat.user__id === parseInt(filters.user_id),
    );
  }, [userStats, filters.user_id]);

  const userActivityData = useMemo(
    () => ({
      labels: filteredUserStats.map(
        (user) =>
          `${user.user__first_name} ${user.user__last_name}`.trim() ||
          user.user__email,
      ),
      datasets: [
        {
          label: "Uploads",
          data: filteredUserStats.map((user) => user.uploads),
          backgroundColor: "#3B82F6",
        },
        {
          label: "Normalizations",
          data: filteredUserStats.map((user) => user.normalizations),
          backgroundColor: "#10B981",
        },
        {
          label: "Duplicates Removed",
          data: filteredUserStats.map((user) => user.duplicates_removed),
          backgroundColor: "#F59E0B",
        },
        {
          label: "Missing Values Removed",
          data: filteredUserStats.map((user) => user.missing_values_removed),
          backgroundColor: "#EF4444",
        },
      ],
    }),
    [filteredUserStats],
  );

  const actionTypeData = useMemo(
    () => ({
      labels: actionTypes.map((action) => {
        const actionName = action.description.toLowerCase();
        if (actionName.includes("upload")) return "Upload";
        if (actionName.includes("normalize")) return "Normalize";
        if (actionName.includes("duplicate")) return "Duplicate";
        if (actionName.includes("missing")) return "Missing Values";
        return action.description.split(" ")[0];
      }),
      datasets: [
        {
          data: actionTypes.map((action) => action.count),
          backgroundColor: [
            "#3B82F6",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#EC4899",
            "#14B8A6",
            "#F97316",
            "#64748B",
            "#A855F7",
          ],
          borderWidth: 1,
        },
      ],
    }),
    [actionTypes],
  );

  const paginatedActions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFileActions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFileActions, currentPage]);

  const totalPages = Math.ceil(filteredFileActions.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getUserName = (user: {
    first_name?: string;
    last_name?: string;
    email: string;
  }) => {
    return (
      `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
    );
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(
      `team_activity_report_${new Date().toISOString().split("T")[0]}.pdf`,
    );
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl p-4">
        <h1 className="text-2xl font-bold text-gray-800">WELCOME BACK</h1>
        <h3 className="mb-8 text-gray-600">How could we assist you today?</h3>

        <div className="mb-4 flex justify-end">
          <button
            onClick={downloadPDF}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Download PDF Report
          </button>
        </div>

        <div ref={reportRef}>
          {/* Filters */}
          <div className="mb-6 rounded-lg bg-white p-4 shadow">
            <h2 className="mb-4 text-lg font-semibold">Filters</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Action Type
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
                  value={filters.action_type}
                  onChange={(e) =>
                    setFilters({ ...filters, action_type: e.target.value })
                  }
                >
                  <option value="">All Actions</option>
                  <option value="upload">Uploads</option>
                  <option value="normalize">Normalizations</option>
                  <option value="duplicate">Duplicates Removed</option>
                  <option value="missing">Missing Values Removed</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time Range
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
                  value={filters.time_range}
                  onChange={(e) =>
                    setFilters({ ...filters, time_range: e.target.value })
                  }
                >
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="this_week">This Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  User
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
                  value={filters.user_id}
                  onChange={(e) =>
                    setFilters({ ...filters, user_id: e.target.value })
                  }
                >
                  <option value="">All Users</option>
                  {teamUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {getUserName(user)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() =>
                    setFilters({
                      action_type: "",
                      time_range: "month",
                      user_id: "",
                    })
                  }
                  className="w-full rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Charts Section */}
              <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-white p-4 shadow">
                  <h2 className="mb-4 text-lg font-semibold">User Activity</h2>
                  <div className="h-80">
                    <Bar
                      data={userActivityData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top",
                          },
                          title: {
                            display: true,
                            text: filters.user_id
                              ? "User Activity Breakdown (Selected User)"
                              : "User Activity Breakdown (All Users)",
                          },
                        },
                        scales: {
                          x: {
                            stacked: true,
                          },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow">
                  <h2 className="mb-4 text-lg font-semibold">
                    Action Types Distribution
                  </h2>
                  <div className="h-80">
                    <Pie
                      data={actionTypeData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                          },
                          title: {
                            display: true,
                            text: "Action Types Distribution",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Actions Table */}
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <h2 className="border-b p-4 text-lg font-semibold">
                  Recent File Actions ({filteredFileActions.length} records)
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Source File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          New File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paginatedActions.length > 0 ? (
                        paginatedActions.map((action) => (
                          <tr key={action.id}>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {action.user.name || action.user.email}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                              <div className="text-sm capitalize text-gray-900">
                                {action.action_type.replace("_", " ")}
                              </div>
                              <div className="text-sm text-gray-500">
                                {action.description}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {action.source_file}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {action.new_file}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                              {new Date(action.date).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-center text-sm text-gray-500"
                          >
                            No file actions found for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredFileActions.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between border-t px-4 py-3 sm:px-6">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{" "}
                          <span className="font-medium">
                            {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {Math.min(
                              currentPage * ITEMS_PER_PAGE,
                              filteredFileActions.length,
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-medium">
                            {filteredFileActions.length}
                          </span>{" "}
                          results
                        </p>
                      </div>
                      <div>
                        <nav
                          className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                          aria-label="Pagination"
                        >
                          <button
                            onClick={() =>
                              handlePageChange(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1,
                          ).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === page ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"}`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              handlePageChange(
                                Math.min(totalPages, currentPage + 1),
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPage;
