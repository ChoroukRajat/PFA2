"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import StewardLayout from "@/components/Layouts/StewardLayout";
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
import { Bar, Pie } from "react-chartjs-2";
import { format } from "date-fns";
import { FiFile, FiTag, FiUsers, FiClock, FiUpload, FiCheckCircle } from "react-icons/fi";

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

interface TeamDashboardData {
  annotations: {
    total: number;
    stats: Record<string, number>;
    pending: number;
  };
  personal_annotations: {
    total: number;
    stats: Record<string, number>;
  };
  metadata_recommendations: {
    total: number;
    stats: Record<string, number>;
  };
  file_uploads: {
    total: number;
  };
}

interface ActivityItem {
  type: string;
  user: string;
  entity_name?: string;
  term_name?: string;
  status?: string;
  created_at?: string;
  date_uploaded?: string;
  file_name?: string;
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

const fetchTeamDashboard = async (): Promise<TeamDashboardData> => {
  return fetchWithAuth("/team/dashboard/");
};

const fetchActivityTimeline = async (): Promise<ActivityItem[]> => {
  return fetchWithAuth("/team/activity/timeline/");
};

const DashboardStatsCard = ({
  icon,
  title,
  value,
  trend,
  trendPositive = true,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
}) => (
  <div className="flex items-start rounded-lg bg-white p-6 shadow">
    <div className="mr-4 rounded-full bg-blue-50 p-3 text-blue-600">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {trend && (
        <span
          className={`mt-1 text-xs ${
            trendPositive ? "text-green-500" : "text-red-500"
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
  item: ActivityItem;
}) => {
  const getIcon = () => {
    if (item.type === 'file_upload') {
      return <FiUpload className="text-blue-500" />;
    } else if (item.type === 'annotation') {
      return <FiTag className="text-green-500" />;
    } else if (item.type === 'personal_annotation') {
      return <FiUsers className="text-purple-500" />;
    }
    return <FiFile className="text-gray-500" />;
  };

  const getDescription = () => {
    if (item.type === 'file_upload') {
      return (
        <>
          <span className="font-medium">File Upload:</span> {item.user} uploaded {item.file_name}
        </>
      );
    } else if (item.type === 'annotation') {
      return (
        <>
          <span className="font-medium">Annotation:</span> {item.user} tagged {item.entity_name} with {item.term_name}
          <div className="mt-1 text-sm text-gray-500">
            Status: <span className="capitalize">{item.status?.toLowerCase()}</span>
          </div>
        </>
      );
    } else if (item.type === 'personal_annotation') {
      return (
        <>
          <span className="font-medium">Personal Annotation:</span> {item.user} tagged {item.entity_name} with {item.term_name}
          <div className="mt-1 text-sm text-gray-500">
            Status: <span className="capitalize">{item.status?.toLowerCase()}</span>
          </div>
        </>
      );
    }
    return null;
  };

  const getDate = () => {
    return item.created_at || item.date_uploaded || '';
  };

  return (
    <div className="flex items-start border-b border-gray-100 py-3 last:border-0">
      <div className="mr-3 rounded-full bg-gray-50 p-2">{getIcon()}</div>
      <div className="flex-1">
        <div className="text-sm">{getDescription()}</div>
        <div className="mt-1 text-xs text-gray-400">
          {getDate() && format(new Date(getDate()), "MMM d, yyyy h:mm a")}
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [activityLimit, setActivityLimit] = useState(5);

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useQuery<TeamDashboardData>({
    queryKey: ["team-dashboard"],
    queryFn: fetchTeamDashboard,
  });

  const {
    data: activityTimeline,
    isLoading: activityTimelineLoading,
    error: activityTimelineError,
  } = useQuery<ActivityItem[]>({
    queryKey: ["activity-timeline"],
    queryFn: fetchActivityTimeline,
  });

  const isLoading = dashboardLoading || activityTimelineLoading;
  const error = dashboardError || activityTimelineError;

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

  // Prepare chart data
  const annotationStatusData = {
    labels: Object.keys(dashboardData?.annotations.stats || {}).map(k => k.toUpperCase()),
    datasets: [{
      label: 'Annotations',
      data: Object.values(dashboardData?.annotations.stats || {}),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1
    }]
  };

  const personalAnnotationStatusData = {
    labels: Object.keys(dashboardData?.personal_annotations.stats || {}).map(k => k.toUpperCase()),
    datasets: [{
      label: 'Personal Annotations',
      data: Object.values(dashboardData?.personal_annotations.stats || {}),
      backgroundColor: [
        'rgba(153, 102, 255, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 159, 64, 0.7)',
      ],
      borderColor: [
        'rgba(153, 102, 255, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(255, 159, 64, 1)',
      ],
      borderWidth: 1
    }]
  };

  const recommendationStatusData = {
    labels: Object.keys(dashboardData?.metadata_recommendations.stats || {}).map(k => k.toUpperCase()),
    datasets: [{
      label: 'Recommendations',
      data: Object.values(dashboardData?.metadata_recommendations.stats || {}),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Team Dashboard</h1>
        <p className="text-gray-600">Overview of your team's activities</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          icon={<FiTag size={20} />}
          title="Standard Annotations"
          value={dashboardData?.annotations.total || 0}
          trend="+5%"
        />
        <DashboardStatsCard
          icon={<FiUsers size={20} />}
          title="Personal Annotations"
          value={dashboardData?.personal_annotations.total || 0}
          trend="+8%"
        />
        <DashboardStatsCard
          icon={<FiCheckCircle size={20} />}
          title="Metadata Recommendations"
          value={dashboardData?.metadata_recommendations.total || 0}
          trend="+3%"
        />
        <DashboardStatsCard
          icon={<FiUpload size={20} />}
          title="File Uploads"
          value={dashboardData?.file_uploads.total || 0}
          trend="+12%"
        />
      </div>

      {/* Status Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Annotation Status</h3>
          <div className="h-64">
            <Pie
              data={annotationStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            Total: {dashboardData?.annotations.total || 0} annotations
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Personal Annotation Status</h3>
          <div className="h-64">
            <Pie
              data={personalAnnotationStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            Total: {dashboardData?.personal_annotations.total || 0} personal annotations
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Recommendation Status</h3>
          <div className="h-64">
            <Pie
              data={recommendationStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                  },
                },
              }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-500">
            Total: {dashboardData?.metadata_recommendations.total || 0} recommendations
          </div>
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
          {activityTimelineLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded bg-gray-200"></div>
              ))}
            </div>
          ) : (
            activityTimeline?.slice(0, activityLimit).map((item, index) => (
              <ActivityItemComponent key={index} item={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const TeamDashboard = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <StewardLayout>
        <DashboardPage />
      </StewardLayout>
    </QueryClientProvider>
  );
};

export default TeamDashboard;