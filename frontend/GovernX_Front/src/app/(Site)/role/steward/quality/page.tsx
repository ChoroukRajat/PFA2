"use client";
import React, { useState, useEffect } from "react";
import StewardLayout from "@/components/Layouts/StewardLayout";

interface Database {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  owner: string;
  location: string;
  created_by: string;
  updated_by: string;
  create_time: string;
  update_time: string;
  metadata: {
    classifications: string[] | null;
    full_json: any;
  };
}

interface Table {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  table_type: string;
  owner: string;
  temporary: boolean;
  db_guid: string;
  db_name: string;
  created_by: string;
  updated_by: string;
  create_time: string;
  retention_period: number;
  metadata: {
    classifications: string[] | null;
    full_json: any;
  };
}

interface Column {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  type: string;
  position: number;
  owner: string;
}

interface Recommendation {
  id: number;
  field: string;
  suggested_value: string;
  confidence?: number;
  status: string;
  created_at: string;
}

const MetadataQualityPage = () => {
  // State for data hierarchy
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // State for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState({
    databases: false,
    tables: false,
    columns: false,
    recommendations: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Data hierarchy fetch functions
  const fetchDatabases = async () => {
    setIsLoading((prev) => ({ ...prev, databases: true }));
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/hive/databases/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch databases");
      const data = await response.json();
      setDatabases(data.databases);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch databases",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, databases: false }));
    }
  };

  const fetchDatabaseDetails = async (dbGuid: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/databases/${dbGuid}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch database details");
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch database details",
      );
      return null;
    }
  };

  const fetchTables = async (dbGuid: string) => {
    setIsLoading((prev) => ({ ...prev, tables: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/databases/${dbGuid}/tables/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch tables");
      const data = await response.json();
      setTables(data.tables);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tables");
    } finally {
      setIsLoading((prev) => ({ ...prev, tables: false }));
    }
  };

  const fetchTableDetails = async (tableGuid: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/tables/${tableGuid}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch table details");
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch table details",
      );
      return null;
    }
  };

  const fetchColumns = async (tableGuid: string) => {
    setIsLoading((prev) => ({ ...prev, columns: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/tables/${tableGuid}/columns/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch columns");
      const data = await response.json();
      setColumns(data.columns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch columns");
    } finally {
      setIsLoading((prev) => ({ ...prev, columns: false }));
    }
  };

  const fetchRecommendations = async (guid: string) => {
    setLoadingRecommendations(true);
    setError("");
    try {
      // First call the complete metadata endpoint to generate recommendations
      const completeResponse = await fetch(
        `http://localhost:8000/api/metadata/complete/${guid}/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!completeResponse.ok) {
        throw new Error("Failed to generate metadata recommendations");
      }

      // Then fetch the recommendations
      const response = await fetch(
        `http://localhost:8000/api/metadata/recommendations/?guid=${guid}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch recommendations");
      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch recommendations",
      );
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const updateRecommendationStatus = async (recId: number, status: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/recommendation/${recId}/status/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update recommendation status");
      }

      // Update the local state to reflect the change
      setRecommendations((prev) =>
        prev.map((rec) => (rec.id === recId ? { ...rec, status } : rec)),
      );

      setSuccess("Recommendation status updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update recommendation status",
      );
    }
  };

  // UI handlers
  const handleDatabaseSelect = async (dbGuid: string) => {
    setSelectedDatabase(dbGuid);
    setSelectedTable(null);
    setSelectedColumn(null);
    setTables([]);
    setColumns([]);
    setRecommendations([]);
    await fetchTables(dbGuid);
    // Fetch and update the database details
    const dbDetails = await fetchDatabaseDetails(dbGuid);
    if (dbDetails) {
      setDatabases((prev) =>
        prev.map((db) => (db.guid === dbGuid ? { ...db, ...dbDetails } : db)),
      );
    }
  };

  const handleTableSelect = async (tableGuid: string) => {
    setSelectedTable(tableGuid);
    setSelectedColumn(null);
    setColumns([]);
    setRecommendations([]);
    await fetchColumns(tableGuid);
    // Fetch and update the table details
    const tableDetails = await fetchTableDetails(tableGuid);
    if (tableDetails) {
      setTables((prev) =>
        prev.map((t) => (t.guid === tableGuid ? { ...t, ...tableDetails } : t)),
      );
    }
  };

  const handleColumnSelect = (columnGuid: string) => {
    setSelectedColumn(columnGuid);
    fetchRecommendations(columnGuid);
  };

  // Get current selected item details
  const currentDatabase = selectedDatabase
    ? databases.find((db) => db.guid === selectedDatabase)
    : null;
  const currentTable = selectedTable
    ? tables.find((t) => t.guid === selectedTable)
    : null;
  const currentColumn = selectedColumn
    ? columns.find((c) => c.guid === selectedColumn)
    : null;

  const renderMetadataSection = (metadata: any) => {
    if (!metadata) return null;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Metadata
        </h3>
        <div className="mt-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
          {metadata.classifications && metadata.classifications.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Classifications
              </h4>
              <div className="mt-1 flex flex-wrap gap-2">
                {metadata.classifications.map((classification: string) => (
                  <span
                    key={classification}
                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {classification}
                  </span>
                ))}
              </div>
            </div>
          )}

          {metadata.full_json && Object.keys(metadata.full_json).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Full Metadata
              </h4>
              <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {JSON.stringify(metadata.full_json, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <StewardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Metadata Quality Assistant
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and improve your metadata quality with AI-powered
            recommendations
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Selection */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-6 py-5">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Databases
            </h2>
          </div>
          <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
            {isLoading.databases ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              </div>
            ) : databases.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">
                No databases found
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {databases.map((db) => (
                  <button
                    key={db.guid}
                    type="button"
                    onClick={() => handleDatabaseSelect(db.guid)}
                    className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selectedDatabase === db.guid
                        ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                        : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                    }`}
                  >
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {db.name}
                    </h3>
                    <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                      {db.qualified_name}
                    </p>
                    {db.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {db.description}
                      </p>
                    )}
                    {selectedDatabase === db.guid && (
                      <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Database Details (shown when database is selected) */}
        {selectedDatabase && currentDatabase && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Database: {currentDatabase.name}
              </h2>
            </div>
            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qualified Name
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.qualified_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Location
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.location || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Owner
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.owner || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created By
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.created_by || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated By
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.updated_by || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created At
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.create_time || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated At
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentDatabase.update_time || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Description
                  </h3>
                  <p className="mt-2 text-sm text-gray-900 dark:text-white">
                    {currentDatabase.description || "No description available"}
                  </p>
                  {renderMetadataSection(currentDatabase.metadata)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tables Selection (only shown when database is selected) */}
        {selectedDatabase && currentDatabase && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Tables in{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {currentDatabase.name}
                </span>
              </h2>
            </div>
            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              {isLoading.tables ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                </div>
              ) : tables.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No tables found
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tables.map((table) => (
                    <button
                      key={table.guid}
                      type="button"
                      onClick={() => handleTableSelect(table.guid)}
                      className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedTable === table.guid
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {table.name}
                          </h3>
                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {table.qualified_name}
                          </p>
                          {table.description && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {table.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchRecommendations(table.guid);
                          }}
                          className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
                          title="Get recommendations"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </button>
                      </div>
                      {selectedTable === table.guid && (
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Details (shown when table is selected) */}
        {selectedTable && currentTable && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Table: {currentTable.name}
              </h2>
            </div>
            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Basic Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Qualified Name
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.qualified_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Type
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.table_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Owner
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.owner || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created By
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.created_by || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Updated By
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.updated_by || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created At
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.create_time || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Retention Period
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.retention_period !== undefined
                          ? currentTable.retention_period
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Temporary
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {currentTable.temporary ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Description
                  </h3>
                  <p className="mt-2 text-sm text-gray-900 dark:text-white">
                    {currentTable.description || "No description available"}
                  </p>
                  {renderMetadataSection(currentTable.metadata)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Columns Selection (only shown when table is selected) */}
        {selectedTable && currentTable && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Columns in{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {currentTable.name}
                </span>
              </h2>
            </div>
            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              {isLoading.columns ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                </div>
              ) : columns.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No columns found
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {columns.map((column) => (
                    <button
                      key={column.guid}
                      type="button"
                      onClick={() => handleColumnSelect(column.guid)}
                      className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedColumn === column.guid
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {column.name}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Type: {column.type}
                          </p>
                          {column.description && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {column.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchRecommendations(column.guid);
                          }}
                          className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-800/30"
                          title="Get recommendations"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </button>
                      </div>
                      {selectedColumn === column.guid && (
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Section (shown when a column is selected) */}
        {selectedColumn && currentColumn && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Recommendations for{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentColumn.name}
                  </span>
                </h2>
                <button
                  onClick={() => fetchRecommendations(selectedColumn)}
                  disabled={loadingRecommendations}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  {loadingRecommendations ? (
                    <>
                      <svg
                        className="-ml-1 mr-1 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="-ml-1 mr-1 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              {/* Column Details */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Column Details
                </h3>
                <div className="overflow-hidden rounded-lg bg-gray-50 shadow dark:bg-gray-700">
                  <div className="px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.name}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.type}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Position
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.position}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Owner
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.owner || "Not specified"}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.description || "No description"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  AI Recommendations
                </h3>
                {loadingRecommendations ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-600">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <h4 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No recommendations yet
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Click the lamp icon to generate AI recommendations for
                      this column
                    </p>
                    <button
                      onClick={() => fetchRecommendations(selectedColumn)}
                      className="mt-4 inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg
                        className="-ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Generate Recommendations
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg shadow">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recommendations.map((rec) => (
                        <li key={rec.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {rec.field.replace(/_/g, " ")}
                              </p>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {rec.suggested_value}
                              </p>
                              {rec.confidence && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Confidence: {Math.round(rec.confidence * 100)}
                                  %
                                </p>
                              )}
                            </div>
                            <div className="ml-2 flex flex-shrink-0">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  rec.status === "accepted"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : rec.status === "rejected"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }`}
                              >
                                {rec.status || "pending"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end space-x-2">
                            <button
                              onClick={() =>
                                updateRecommendationStatus(rec.id, "accepted")
                              }
                              disabled={rec.status === "accepted"}
                              className={`inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                rec.status === "accepted"
                                  ? "cursor-not-allowed bg-green-300 dark:bg-green-800"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                updateRecommendationStatus(rec.id, "rejected")
                              }
                              disabled={rec.status === "rejected"}
                              className={`inline-flex items-center rounded-md border border-transparent px-2 py-1 text-xs font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                rec.status === "rejected"
                                  ? "cursor-not-allowed bg-red-300 dark:bg-red-800"
                                  : "bg-red-600 hover:bg-red-700"
                              }`}
                            >
                              Reject
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </StewardLayout>
  );
};

export default MetadataQualityPage;
