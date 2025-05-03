"use client";
import React, { useState, useEffect } from "react";
import AnalystLayout from "@/components/Layouts/AnalystLayout";

interface Database {
  name: string;
  qualified_name: string;
  metadata: Record<string, any>;
}

interface Table {
  name: string;
  qualified_name: string;
  metadata: Record<string, any>;
}

interface Column {
  name: string;
  qualified_name: string;
  metadata: Record<string, any>;
}

interface GlossaryTerm {
  name: string;
  relation_guid?: string;
}

interface Annotation {
  id: number;
  entity_name: string;
  entity_type: string;
  term_name: string;
  comment: string;
  proposed_changes: Record<string, any>;
  status: string;
  created_at: string;
}

const DataAnnotationPage = () => {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [comment, setComment] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isLoading, setIsLoading] = useState({
    databases: false,
    tables: false,
    columns: false,
    glossary: false,
    annotations: false,
    submitting: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchDatabases();
    fetchGlossaryTerms();
    fetchUserAnnotations();
  }, []);

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

  const fetchTables = async (dbName: string) => {
    setIsLoading((prev) => ({ ...prev, tables: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/databases/${encodeURIComponent(dbName)}/tables/`,
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

  const fetchColumns = async (tableName: string) => {
    setIsLoading((prev) => ({ ...prev, columns: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/hive/tables/${encodeURIComponent(tableName)}/columns/`,
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

  const fetchGlossaryTerms = async () => {
    setIsLoading((prev) => ({ ...prev, glossary: true }));
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/glossary/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch glossary terms");
      const data = await response.json();
      setGlossaryTerms(data.terms);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch glossary terms",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, glossary: false }));
    }
  };

  const fetchUserAnnotations = async () => {
    setIsLoading((prev) => ({ ...prev, annotations: true }));
    setError("");
    try {
      const response = await fetch("http://localhost:8000/api/annotations/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch annotations");
      const data = await response.json();
      setAnnotations(data.annotations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch annotations",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, annotations: false }));
    }
  };

  const handleDatabaseSelect = (dbName: string) => {
    setSelectedDatabase(dbName);
    setSelectedTable(null);
    setSelectedColumn(null);
    setTables([]);
    setColumns([]);
    fetchTables(dbName);
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setSelectedColumn(null);
    setColumns([]);
    fetchColumns(tableName);
  };

  const handleColumnSelect = (columnName: string) => {
    setSelectedColumn(columnName);
  };

  const handleSubmitAnnotation = async () => {
    if (!selectedColumn || !selectedTerm) {
      setError("Please select both a column and a glossary term");
      return;
    }

    setIsLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    try {
      const column = columns.find((c) => c.name === selectedColumn);
      if (!column) throw new Error("Selected column not found");

      const response = await fetch("http://localhost:8000/api/annotations/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          entity_name: selectedColumn,
          entity_type: "hive_column",
          term_name: selectedTerm,
          comment,
          proposed_changes: column.metadata || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit annotation");
      }

      setSuccess("Annotation submitted successfully!");
      setComment("");
      setSelectedTerm("");
      fetchUserAnnotations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit annotation",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleUpdateAnnotation = async (annotationId: number) => {
    setIsLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/annotations/${annotationId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            comment,
            proposed_changes:
              columns.find((c) => c.name === selectedColumn)?.metadata || {},
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update annotation");
      }

      setSuccess("Annotation updated successfully!");
      fetchUserAnnotations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update annotation",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDeleteAnnotation = async (annotationId: number) => {
    setIsLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/annotations/${annotationId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete annotation");
      }

      setSuccess("Annotation deleted successfully!");
      fetchUserAnnotations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete annotation",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleSelectAnnotation = (annotation: Annotation) => {
    // Find the column for this annotation
    setSelectedColumn(annotation.entity_name);
    setSelectedTerm(annotation.term_name);
    setComment(annotation.comment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get current column details
  const currentColumn = selectedColumn
    ? columns.find((c) => c.name === selectedColumn)
    : null;

  return (
    <AnalystLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Data Annotation Tool
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Annotate your data assets with business glossary terms
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
                    key={db.qualified_name}
                    type="button"
                    onClick={() => handleDatabaseSelect(db.name)}
                    className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      selectedDatabase === db.name
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
                    {selectedDatabase === db.name && (
                      <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tables Selection (only shown when database is selected) */}
        {selectedDatabase && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Tables in{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedDatabase}
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
                      key={table.qualified_name}
                      type="button"
                      onClick={() => handleTableSelect(table.name)}
                      className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedTable === table.name
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {table.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {table.qualified_name}
                      </p>
                      {selectedTable === table.name && (
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Columns Selection (only shown when table is selected) */}
        {selectedTable && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Columns in{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedTable}
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
                      key={column.qualified_name}
                      type="button"
                      onClick={() => handleColumnSelect(column.name)}
                      className={`relative rounded-lg border p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        selectedColumn === column.name
                          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                      }`}
                    >
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {column.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {column.qualified_name}
                      </p>
                      {selectedColumn === column.name && (
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Annotation Form (only shown when column is selected) */}
        {selectedColumn && currentColumn && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Annotate:{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  {selectedColumn}
                </span>
              </h2>
            </div>
            <div className="space-y-6 border-t border-gray-200 px-6 py-5 dark:border-gray-700">
              {/* Column Metadata */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Column Metadata
                </h3>
                <div className="overflow-hidden rounded-lg bg-gray-50 shadow dark:bg-gray-700">
                  <div className="px-4 py-5 sm:p-6">
                    {Object.entries(currentColumn.metadata).length > 0 ? (
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        {Object.entries(currentColumn.metadata).map(
                          ([key, value]) => (
                            <div key={key} className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {key}
                              </dt>
                              <dd className="mt-1 break-words text-sm text-gray-900 dark:text-white">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </dd>
                            </div>
                          ),
                        )}
                      </dl>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No metadata available
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Glossary Term Selection */}
              <div>
                <label
                  htmlFor="term"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Glossary Term
                </label>
                <select
                  id="term"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                >
                  <option value="">Select a glossary term</option>
                  {glossaryTerms.map((term) => (
                    <option key={term.name} value={term.name}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Annotation Comment */}
              <div>
                <label
                  htmlFor="comment"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Annotation Comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your annotation comment..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSubmitAnnotation}
                  disabled={isLoading.submitting || !selectedTerm}
                  className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading.submitting ? (
                    <>
                      <svg
                        className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
                      Submitting...
                    </>
                  ) : (
                    "Submit Annotation"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Annotations */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Your Annotations
              </h2>
              <button
                onClick={fetchUserAnnotations}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
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
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
            {isLoading.annotations ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              </div>
            ) : annotations.length === 0 ? (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                No annotations submitted yet
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {annotations.map((annotation) => (
                  <li key={annotation.id} className="py-4">
                    <div
                      className={`rounded-lg border p-4 ${
                        annotation.status === "APPROVED"
                          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                          : annotation.status === "REJECTED"
                            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                            : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {annotation.entity_name} ({annotation.entity_type})
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Term: {annotation.term_name}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            annotation.status === "APPROVED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : annotation.status === "REJECTED"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {annotation.status}
                        </span>
                      </div>
                      {annotation.comment && (
                        <div className="mt-2 rounded bg-white p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {annotation.comment}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {new Date(annotation.created_at).toLocaleString()}
                        </span>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleSelectAnnotation(annotation)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateAnnotation(annotation.id)
                            }
                            disabled={annotation.status !== "PENDING"}
                            className="text-green-600 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Update
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAnnotation(annotation.id)
                            }
                            disabled={annotation.status !== "PENDING"}
                            className="text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AnalystLayout>
  );
};

export default DataAnnotationPage;
