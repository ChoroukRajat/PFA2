"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import AnalystLayout from "@/components/Layouts/AnalystLayout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import { format } from "date-fns";
import { FiFile, FiTag, FiUser, FiClock, FiFilter } from "react-icons/fi";

// Initialize QueryClient
const queryClient = new QueryClient();

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
);

interface FileAction {
  id: string;
  source_file: {
    id: string;
    name: string;
  };
  new_file: {
    id: string | null;
    name: string | null;
  };
  date: string;
  description: string;
}

interface Annotation {
  id: string;
  entity: {
    guid: string;
    type: string;
    name: string;
  };
  term: {
    guid: string;
    name: string;
  };
  comment: string;
  proposed_changes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PersonalAnnotation {
  id: string;
  entity: {
    guid: string;
    type: string;
    name: string;
  };
  term: {
    id: string;
    name: string;
  };
  comment: string;
  proposed_changes: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  file_actions: {
    total: number;
    pending: number;
    completed: number;
  };
  annotations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  personal_annotations: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

const API_BASE_URL = "http://localhost:8000/api";

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch data");
  }

  return response.json();
};

// Fetch functions for all endpoints
const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return fetchWithAuth("/dashboard/");
};

const fetchFileActions = async (params?: {
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<FileAction[]> => {
  const queryParams = new URLSearchParams();
  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.search) queryParams.append("search", params.search);

  return fetchWithAuth(`/dashboard/file-actions/?${queryParams.toString()}`);
};

const fetchAnnotations = async (params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<Annotation[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.search) queryParams.append("search", params.search);

  return fetchWithAuth(`/dashboard/annotations/?${queryParams.toString()}`);
};

const fetchPersonalAnnotations = async (params?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<PersonalAnnotation[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.date_from) queryParams.append("date_from", params.date_from);
  if (params?.date_to) queryParams.append("date_to", params.date_to);
  if (params?.search) queryParams.append("search", params.search);

  return fetchWithAuth(
    `/dashboard/personal-annotations/?${queryParams.toString()}`,
  );
};

const DashboardStatsCard = ({
  icon,
  title,
  value,
  trend,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: string;
}) => (
  <div className="flex items-start rounded-lg bg-white p-6 shadow">
    <div className="mr-4 rounded-full bg-blue-50 p-3 text-blue-600">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {trend && (
        <span
          className={`mt-1 text-xs ${
            trend.startsWith("+") ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend}
        </span>
      )}
    </div>
  </div>
);

const ActivityItemComponent = ({
  item,
}: {
  item: FileAction | Annotation | PersonalAnnotation;
}) => {
  const getIcon = () => {
    if ("source_file" in item) {
      return <FiFile className="text-blue-500" />;
    } else if ("term" in item && "guid" in item.term) {
      return <FiTag className="text-green-500" />;
    } else {
      return <FiUser className="text-purple-500" />;
    }
  };

  const getDescription = () => {
    if ("source_file" in item) {
      // File Action
      return (
        <>
          <span className="font-medium">File action:</span> {item.description}
          <div className="mt-1 text-sm text-gray-500">
            {item.source_file.name} → {item.new_file?.name || "No target file"}
          </div>
        </>
      );
    } else if ("term" in item && "guid" in item.term) {
      // Annotation
      return (
        <>
          <span className="font-medium">Annotation:</span> {item.entity.name}{" "}
          tagged with {item.term.name}
          <div className="mt-1 text-sm text-gray-500">
            Status:{" "}
            <span className="capitalize">{item.status.toLowerCase()}</span>
          </div>
        </>
      );
    } else {
      // Personal Annotation
      return (
        <>
          <span className="font-medium">Personal Annotation:</span>{" "}
          {item.entity.name} tagged with {item.term.name}
          <div className="mt-1 text-sm text-gray-500">
            Status:{" "}
            <span className="capitalize">{item.status.toLowerCase()}</span>
          </div>
        </>
      );
    }
  };

  const getDate = () => {
    if ("date" in item) {
      return item.date;
    } else {
      return item.created_at;
    }
  };

  return (
    <div className="flex items-start border-b border-gray-100 py-3 last:border-0">
      <div className="mr-3 rounded-full bg-gray-50 p-2">{getIcon()}</div>
      <div className="flex-1">
        <div className="text-sm">{getDescription()}</div>
        <div className="mt-1 text-xs text-gray-400">
          {format(new Date(getDate()), "MMM d, yyyy h:mm a")}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [activityLimit, setActivityLimit] = useState(5);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    search: "",
    status: "",
  });

  // Fetch all data
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const {
    data: fileActions,
    isLoading: fileActionsLoading,
    error: fileActionsError,
  } = useQuery<FileAction[]>({
    queryKey: ["file-actions", filters],
    queryFn: () =>
      fetchFileActions({
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        search: filters.search,
      }),
  });

  const {
    data: annotations,
    isLoading: annotationsLoading,
    error: annotationsError,
  } = useQuery<Annotation[]>({
    queryKey: ["annotations", filters],
    queryFn: () =>
      fetchAnnotations({
        status: filters.status,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        search: filters.search,
      }),
  });

  const {
    data: personalAnnotations,
    isLoading: personalAnnotationsLoading,
    error: personalAnnotationsError,
  } = useQuery<PersonalAnnotation[]>({
    queryKey: ["personal-annotations", filters],
    queryFn: () =>
      fetchPersonalAnnotations({
        status: filters.status,
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        search: filters.search,
      }),
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    // The queries will automatically refetch when filters change
  };

  const isLoading =
    statsLoading ||
    fileActionsLoading ||
    annotationsLoading ||
    personalAnnotationsLoading;
  const error =
    statsError ||
    fileActionsError ||
    annotationsError ||
    personalAnnotationsError;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <div className="p-4 text-center text-red-500">
          Error loading dashboard data: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="h-4 w-1/3 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-80 rounded bg-gray-200"></div>
            <div className="h-80 rounded bg-gray-200"></div>
          </div>
          <div className="h-96 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Combine all activities for the timeline
  const allActivities = [
    ...(fileActions?.map((action) => ({ ...action, type: "file_action" })) ||
      []),
    ...(annotations?.map((annotation) => ({
      ...annotation,
      type: "annotation",
    })) || []),
    ...(personalAnnotations?.map((annotation) => ({
      ...annotation,
      type: "personal_annotation",
    })) || []),
  ]
    .sort((a, b) => {
      const dateA = "date" in a ? new Date(a.date) : new Date(a.created_at);
      const dateB = "date" in b ? new Date(b.date) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, activityLimit);

  // Prepare chart data
  const annotationStatusData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Annotations",
        data: [
          stats?.annotations.pending || 0,
          stats?.annotations.approved || 0,
          stats?.annotations.rejected || 0,
        ],
        backgroundColor: [
          "rgba(255, 159, 64, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ],
        borderColor: [
          "rgba(255, 159, 64, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const personalAnnotationStatusData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Personal Annotations",
        data: [
          stats?.personal_annotations.pending || 0,
          stats?.personal_annotations.approved || 0,
          stats?.personal_annotations.rejected || 0,
        ],
        backgroundColor: [
          "rgba(153, 102, 255, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
        ],
        borderColor: [
          "rgba(153, 102, 255, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Prepare activity over time data (example - you might want to aggregate by month)
  const activityOverTimeData = {
    labels: ["File Actions", "Annotations", "Personal Annotations"],
    datasets: [
      {
        label: "Count",
        data: [
          stats?.file_actions.total || 0,
          stats?.annotations.total || 0,
          stats?.personal_annotations.total || 0,
        ],
        backgroundColor: [
          "rgba(59, 130, 246, 0.5)",
          "rgba(16, 185, 129, 0.5)",
          "rgba(139, 92, 246, 0.5)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(16, 185, 129, 1)",
          "rgba(139, 92, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
        <p className="text-gray-600">How can we assist you today?</p>
      </div>

      {/* Filter Section */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Filters</h3>
        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date To
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 p-2"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search..."
              className="w-full rounded-md border border-gray-300 p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <FiFilter className="mr-2" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          icon={<FiFile size={20} />}
          title="File Actions"
          value={stats?.file_actions.total || 0}
          trend="+12%"
        />
        <DashboardStatsCard
          icon={<FiTag size={20} />}
          title="Total Annotations"
          value={stats?.annotations.total || 0}
          trend="+5%"
        />
        <DashboardStatsCard
          icon={<FiUser size={20} />}
          title="Personal Annotations"
          value={stats?.personal_annotations.total || 0}
          trend="+8%"
        />
        <DashboardStatsCard
          icon={<FiClock size={20} />}
          title="Pending Approvals"
          value={
            (stats?.annotations.pending || 0) +
            (stats?.personal_annotations.pending || 0)
          }
        />
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Annotation Status
          </h3>
          <div className="h-64">
            <Pie
              data={annotationStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Personal Annotation Status
          </h3>
          <div className="h-64">
            <Pie
              data={personalAnnotationStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Activity Over Time */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          Activity Overview
        </h3>
        <div className="h-80">
          <Bar
            data={activityOverTimeData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActivityLimit(5)}
              className={`rounded px-3 py-1 text-sm ${
                activityLimit === 5
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              5
            </button>
            <button
              onClick={() => setActivityLimit(10)}
              className={`rounded px-3 py-1 text-sm ${
                activityLimit === 10
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              10
            </button>
            <button
              onClick={() => setActivityLimit(20)}
              className={`rounded px-3 py-1 text-sm ${
                activityLimit === 20
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              20
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-gray-200"></div>
              ))}
            </div>
          ) : (
            allActivities.map((item, index) => (
              <ActivityItemComponent key={index} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AnalystDashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalystLayout>
        <DashboardPage />
      </AnalystLayout>
    </QueryClientProvider>
  );
};

export default AnalystDashboard;
