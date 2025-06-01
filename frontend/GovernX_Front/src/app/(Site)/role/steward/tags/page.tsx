"use client";
import React, { useState, useEffect } from "react";
import { FaLightbulb, FaCheck, FaTimes, FaSpinner, FaUserEdit } from "react-icons/fa";
import StewardLayout from "@/components/Layouts/StewardLayout";

interface Database {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  owner: string;
}

interface Table {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  table_type: string;
  owner: string;
}

interface Column {
  guid: string;
  name: string;
  qualified_name: string;
  description: string;
  type: string;
  position: number;
  owner: string;
  metadata: {
    classifications?: string[];
    full_json?: any;
  };
}

interface Recommendation {
  id: number;
  field: string;
  suggested_value: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

interface GlossaryTerm {
  term_guid: string;
  display_text: string;
}

interface Annotation {
  id: number;
  entity_name: string;
  entity_type: string;
  term_name: string;
  comment: string;
  proposed_changes: string;
  status: string;
  created_at: string;
  user_name: string;
}

interface PersonalAnnotation {
  id: number;
  entity_name: string;
  entity_type: string;
  term_id: string;
  term_name: string;
  glossary_name: string;
  comment: string;
  proposed_changes: string;
  status: string;
  created_at: string;
  user_name: string;
}

const MetadataGovernancePage = () => {
  // State for data hierarchy
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // State for recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // State for annotations
  const [annotations, setAnnotations] = useState<{
    team_id: number;
    team_name: string;
    annotations: Annotation[];
    personal_annotations: PersonalAnnotation[];
  }>({
    team_id: 0,
    team_name: "",
    annotations: [],
    personal_annotations: []
  });
  const [showAnnotations, setShowAnnotations] = useState(false);

  // State for term assignment
  const [showTermAssignmentModal, setShowTermAssignmentModal] = useState(false);
  const [currentRecommendation, setCurrentRecommendation] = useState<Recommendation | null>(null);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | PersonalAnnotation | null>(null);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [termSyncStatus, setTermSyncStatus] = useState("");
  const [selectedTermGuid, setSelectedTermGuid] = useState("");
  const [isCreatingTerm, setIsCreatingTerm] = useState(false);
  const [termCreationStatus, setTermCreationStatus] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState({
    databases: false,
    tables: false,
    columns: false,
    recommendations: false,
    annotations: false
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchDatabases();
    fetchAnnotations();
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
    setIsLoading((prev) => ({ ...prev, recommendations: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/metadata/recommendations/${guid}/`,
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
      setIsLoading((prev) => ({ ...prev, recommendations: false }));
    }
  };

  const fetchAnnotations = async () => {
    setIsLoading((prev) => ({ ...prev, annotations: true }));
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/steward/annotations/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch annotations");
      const data = await response.json();
      setAnnotations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch annotations",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, annotations: false }));
    }
  };

  // Generate recommendations
  const generateTagsRecommendations = async () => {
    if (!selectedColumn) return;

    setIsGenerating(true);
    setError("");
    try {
      const column = columns.find((c) => c.guid === selectedColumn);
      if (!column) throw new Error("Column not found");

      const response = await fetch(
        "http://localhost:8000/api/llm/suggestions/terms",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            qualified_names: [column.qualified_name],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate recommendations",
        );
      }

      const data = await response.json();
      setSuccess("Recommendations generated successfully!");
      fetchRecommendations(selectedColumn);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClassificationRecommendations = async () => {
    if (!selectedColumn) return;

    setIsGenerating(true);
    setError("");
    try {
      const column = columns.find((c) => c.guid === selectedColumn);
      if (!column) throw new Error("Column not found");

      const response = await fetch(
        "http://localhost:8000/api/llm/suggestions/classification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            qualified_names: [column.qualified_name],
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to generate recommendations",
        );
      }

      const data = await response.json();
      setSuccess("Recommendations generated successfully!");
      fetchRecommendations(selectedColumn);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate recommendations",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch team terms
  const fetchTeamTerms = async () => {
    setIsLoadingTerms(true);
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/teams/terms/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch team terms");
      const data = await response.json();
      setTerms(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch team terms",
      );
    } finally {
      setIsLoadingTerms(false);
    }
  };

  // Sync terms from Atlas
  const syncTerms = async () => {
    setTermSyncStatus("Syncing...");
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/sync-terms/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error("Failed to sync terms");
      const data = await response.json();
      setTermSyncStatus("Terms synchronized successfully!");
      fetchTeamTerms();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sync terms",
      );
      setTermSyncStatus("");
    }
  };

  // Create new term
  const createTerm = async (termName: string) => {
    setIsCreatingTerm(true);
    setTermCreationStatus("Creating term...");
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/create-term/",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: termName,
            team_id: annotations.team_id
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create term");
      const data = await response.json();
      setTermCreationStatus("Term created successfully!");
      fetchTeamTerms();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create term",
      );
      setTermCreationStatus("");
      return false;
    } finally {
      setIsCreatingTerm(false);
    }
  };

  // Update annotation status
  const updateAnnotationStatus = async (
    annotationType: 'personal' | 'atlas',
    annotationId: number,
    action: 'approve' | 'reject'
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/annotations/${annotationType}/${annotationId}/${action}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update annotation");
      }

      setSuccess(`Annotation has been ${action}d successfully!`);
      fetchAnnotations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update annotation",
      );
    }
  };

  // Handle recommendation acceptance
  const handleAcceptRecommendation = (rec: Recommendation) => {
    setCurrentRecommendation(rec);
    setCurrentAnnotation(null);
    setShowTermAssignmentModal(true);
    fetchTeamTerms();
  };

  // Handle annotation approval
  const handleApproveAnnotation = (annotation: Annotation | PersonalAnnotation, isPersonal: boolean) => {
    setCurrentAnnotation(annotation);
    setCurrentRecommendation(null);
    
    if (isPersonal) {
      setShowTermAssignmentModal(true);
      fetchTeamTerms();
    } else {
      if (confirm(`Are you sure you want to approve this annotation for ${annotation.entity_name}?`)) {
        updateAnnotationStatus('atlas', annotation.id, 'approve');
      }
    }
  };

  // Handle term selection and assignment
  const handleTermAssignment = async () => {
    if (currentRecommendation && selectedTermGuid) {
      // Handle recommendation term assignment
      await updateRecommendationStatus(currentRecommendation.id, "accepted");
    } else if (currentAnnotation) {
      // Handle personal annotation approval
      await updateAnnotationStatus('personal', currentAnnotation.id, 'approve');
    }
    
    setShowTermAssignmentModal(false);
    setSelectedTermGuid("");
  };

  // Update recommendation status
  const updateRecommendationStatus = async (
    recId: number,
    status: "accepted" | "rejected",
  ) => {
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update recommendation");
      }

      setSuccess("Recommendation updated successfully!");
      if (selectedColumn) fetchRecommendations(selectedColumn);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update recommendation",
      );
    }
  };

  // UI handlers
  const handleDatabaseSelect = (dbGuid: string) => {
    setSelectedDatabase(dbGuid);
    setSelectedTable(null);
    setSelectedColumn(null);
    setTables([]);
    setColumns([]);
    fetchTables(dbGuid);
  };

  const handleTableSelect = (tableGuid: string) => {
    setSelectedTable(tableGuid);
    setSelectedColumn(null);
    setColumns([]);
    fetchColumns(tableGuid);
  };

  const handleColumnSelect = (columnGuid: string) => {
    setSelectedColumn(columnGuid);
    setShowRecommendations(false);
    fetchRecommendations(columnGuid);
  };

  const toggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  const toggleAnnotations = () => {
    setShowAnnotations(!showAnnotations);
  };

  // Get current entity details
  const currentDatabase = selectedDatabase
    ? databases.find((db) => db.guid === selectedDatabase)
    : null;

  const currentTable = selectedTable
    ? tables.find((table) => table.guid === selectedTable)
    : null;

  const currentColumn = selectedColumn
    ? columns.find((col) => col.guid === selectedColumn)
    : null;

  return (
    <StewardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Metadata Governance
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and review metadata recommendations and annotations for your data assets
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

        {/* Data Hierarchy */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Databases Panel */}
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Databases
              </h2>
            </div>
            <div className="p-4">
              {isLoading.databases ? (
                <div className="flex justify-center py-8">
                  <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : databases.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No databases found
                </p>
              ) : (
                <ul className="space-y-2">
                  {databases.map((db) => (
                    <li key={db.guid}>
                      <button
                        onClick={() => handleDatabaseSelect(db.guid)}
                        className={`w-full rounded-md p-3 text-left transition-colors ${
                          selectedDatabase === db.guid
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        <h3 className="font-medium dark:text-white">
                          {db.name}
                        </h3>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {db.qualified_name}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tables Panel (only shown when database is selected) */}
          {selectedDatabase && (
            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tables in{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentDatabase?.name}
                  </span>
                </h2>
              </div>
              <div className="p-4">
                {isLoading.tables ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : tables.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No tables found
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {tables.map((table) => (
                      <li key={table.guid}>
                        <button
                          onClick={() => handleTableSelect(table.guid)}
                          className={`w-full rounded-md p-3 text-left transition-colors ${
                            selectedTable === table.guid
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <h3 className="font-medium dark:text-white">
                            {table.name}
                          </h3>
                          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {table.qualified_name}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Columns Panel (only shown when table is selected) */}
          {selectedTable && (
            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Columns in{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentTable?.name}
                  </span>
                </h2>
              </div>
              <div className="p-4">
                {isLoading.columns ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : columns.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">
                    No columns found
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {columns.map((column) => (
                      <li key={column.guid}>
                        <button
                          onClick={() => handleColumnSelect(column.guid)}
                          className={`w-full rounded-md p-3 text-left transition-colors ${
                            selectedColumn === column.guid
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium dark:text-white">
                                {column.name}
                              </h3>
                              <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                {column.type}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleColumnSelect(column.guid);
                                toggleRecommendations();
                              }}
                              className={`rounded-full p-2 ${
                                selectedColumn === column.guid &&
                                showRecommendations
                                  ? "text-yellow-500"
                                  : "text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                              }`}
                              title="View recommendations"
                            >
                              <FaLightbulb />
                            </button>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Entity Details and Recommendations */}
        {selectedColumn && currentColumn && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Column Details */}
            <div className="rounded-lg bg-white shadow dark:bg-gray-800 lg:col-span-2">
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Column Details:{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {currentColumn.name}
                  </span>
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Basic Information
                    </h3>
                    <dl className="mt-2 space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Type
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.type}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Position
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.position}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Owner
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.owner || "Not specified"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Metadata
                    </h3>
                    <div className="mt-2 space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentColumn.description ||
                            "No description available"}
                        </dd>
                      </div>
                      {currentColumn.metadata?.classifications && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Classifications
                          </dt>
                          <dd className="mt-1">
                            <div className="flex flex-wrap gap-1">
                              {currentColumn.metadata.classifications.map(
                                (cls) => (
                                  <span
                                    key={cls}
                                    className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  >
                                    {cls}
                                  </span>
                                ),
                              )}
                            </div>
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Recommendations Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={generateTagsRecommendations}
                    disabled={isGenerating}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Suggest Tags"
                    )}
                  </button>
                  <button
                    onClick={generateClassificationRecommendations}
                    disabled={isGenerating}
                    className="inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-purple-500 dark:hover:bg-purple-600"
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Suggest Classifications"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Recommendations Panel */}
            <div
              className={`rounded-lg bg-white shadow dark:bg-gray-800 ${
                showRecommendations ? "block" : "hidden lg:block"
              }`}
            >
              <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Recommendations
                  </h2>
                  <button onClick={toggleRecommendations} className="lg:hidden">
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                {isLoading.recommendations ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : recommendations.length === 0 ? (
                  <div className="py-8 text-center">
                    <FaLightbulb className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No recommendations
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Click &quot;Suggest Tags&quot; or &quot;Suggest
                      Classifications&quot; to generate recommendations.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {recommendations.map((rec) => (
                      <li
                        key={rec.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                              {rec.field}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                              {rec.suggested_value}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {new Date(rec.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {rec.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleAcceptRecommendation(rec)}
                                  className="rounded-full bg-green-100 p-1.5 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30"
                                  title="Accept"
                                >
                                  <FaCheck className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    updateRecommendationStatus(
                                      rec.id,
                                      "rejected",
                                    )
                                  }
                                  className="rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/30"
                                  title="Reject"
                                >
                                  <FaTimes className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {rec.status === "accepted" && (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                Accepted
                              </span>
                            )}
                            {rec.status === "rejected" && (
                              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                Rejected
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Annotations Section */}
        <div className="mt-8">
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Team Annotations ({annotations.team_name})
                </h2>
                <button 
                  onClick={toggleAnnotations}
                  className="rounded-md p-1 text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showAnnotations ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            {showAnnotations && (
              <div className="p-4">
                {isLoading.annotations ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Atlas Annotations */}
                    <div>
                      <h3 className="mb-4 text-md font-medium text-gray-900 dark:text-white">
                        Atlas Annotations
                      </h3>
                      {annotations.annotations.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          No Atlas annotations found
                        </p>
                      ) : (
                        <ul className="space-y-4">
                          {annotations.annotations.map((annotation) => (
                            <li
                              key={`atlas-${annotation.id}`}
                              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {annotation.entity_name}
                                    </h3>
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      {annotation.entity_type}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold">Term:</span> {annotation.term_name}
                                  </p>
                                  {annotation.comment && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-semibold">Comment:</span> {annotation.comment}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    By: {annotation.user_name} • {new Date(annotation.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {annotation.status === "PENDING" ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveAnnotation(annotation, false)}
                                        className="rounded-full bg-green-100 p-1.5 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30"
                                        title="Approve"
                                      >
                                        <FaCheck className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => updateAnnotationStatus('atlas', annotation.id, 'reject')}
                                        className="rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/30"
                                        title="Reject"
                                      >
                                        <FaTimes className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : annotation.status === "APPROVED" ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                      Rejected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Personal Annotations */}
                    <div>
                      <h3 className="mb-4 text-md font-medium text-gray-900 dark:text-white">
                        Personal Annotations
                      </h3>
                      {annotations.personal_annotations.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">
                          No personal annotations found
                        </p>
                      ) : (
                        <ul className="space-y-4">
                          {annotations.personal_annotations.map((annotation) => (
                            <li
                              key={`personal-${annotation.id}`}
                              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                      {annotation.entity_name}
                                    </h3>
                                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                      {annotation.entity_type}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-semibold">Term:</span> {annotation.term_name} ({annotation.glossary_name})
                                  </p>
                                  {annotation.comment && (
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                      <span className="font-semibold">Comment:</span> {annotation.comment}
                                    </p>
                                  )}
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    By: {annotation.user_name} • {new Date(annotation.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  {annotation.status === "PENDING" ? (
                                    <>
                                      <button
                                        onClick={() => handleApproveAnnotation(annotation, true)}
                                        className="rounded-full bg-green-100 p-1.5 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30"
                                        title="Approve"
                                      >
                                        <FaCheck className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => updateAnnotationStatus('personal', annotation.id, 'reject')}
                                        className="rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/30"
                                        title="Reject"
                                      >
                                        <FaTimes className="h-4 w-4" />
                                      </button>
                                    </>
                                  ) : annotation.status === "APPROVED" ? (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-200">
                                      Rejected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Term Assignment Modal */}
        {(showTermAssignmentModal && (currentRecommendation || currentAnnotation)) && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 transition-opacity"
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span
                className="hidden sm:inline-block sm:h-screen sm:align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {currentRecommendation ? 'Assign this term to the selected column' : 'Approve personal annotation'}
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Term: <strong>{currentRecommendation ? currentRecommendation.suggested_value : currentAnnotation?.term_name}</strong>
                        </p>
                        {currentRecommendation && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Column: <strong>{currentColumn?.name}</strong>
                          </p>
                        )}
                        {currentAnnotation && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Entity: <strong>{currentAnnotation.entity_name}</strong>
                          </p>
                        )}

                        {/* Always show both options */}
                        <div className="mt-6 space-y-4">
                          {/* Option 1: Select existing term */}
                          <div>
                            <label htmlFor="term-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Select an existing term:
                            </label>
                            <div className="mt-1 flex space-x-2">
                              <select
                                id="term-select"
                                value={selectedTermGuid}
                                onChange={(e) => setSelectedTermGuid(e.target.value)}
                                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              >
                                <option value="">Select a term</option>
                                {terms.map((term) => (
                                  <option key={term.term_guid} value={term.term_guid}>
                                    {term.display_text}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={syncTerms}
                                disabled={isLoadingTerms}
                                className="whitespace-nowrap rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                              >
                                {isLoadingTerms ? (
                                  <>
                                    <FaSpinner className="mr-2 inline animate-spin" />
                                    Sync Terms
                                  </>
                                ) : (
                                  "Sync Terms"
                                )}
                              </button>
                            </div>
                            {termSyncStatus && (
                              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                {termSyncStatus}
                              </p>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center">
                              <span className="bg-white px-2 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                OR
                              </span>
                            </div>
                          </div>

                          {/* Option 2: Create new term */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Create new term:
                            </label>
                            <div className="mt-1 flex space-x-2">
                              <input
                                type="text"
                                value={currentRecommendation ? currentRecommendation.suggested_value : currentAnnotation?.term_name || ''}
                                readOnly
                                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                              <button
                                onClick={async () => {
                                  const termName = currentRecommendation 
                                    ? currentRecommendation.suggested_value 
                                    : currentAnnotation?.term_name || '';
                                  const created = await createTerm(termName);
                                  if (created) {
                                    setShowTermAssignmentModal(false);
                                  }
                                }}
                                disabled={isCreatingTerm}
                                className="whitespace-nowrap rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                              >
                                {isCreatingTerm ? (
                                  <>
                                    <FaSpinner className="mr-2 inline animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  "Create Term"
                                )}
                              </button>
                            </div>
                            {termCreationStatus && (
                              <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                                {termCreationStatus}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Assign button when term is selected */}
                        {selectedTermGuid && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={handleTermAssignment}
                              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                              {currentRecommendation ? 'Assign Term' : 'Approve Annotation'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTermAssignmentModal(false);
                      setSelectedTermGuid("");
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StewardLayout>
  );
};

export default MetadataGovernancePage;