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

interface PersonalGlossary {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

interface PersonalGlossaryTerm {
  id: number;
  name: string;
  description: string;
  glossary_id: number;
  created_at: string;
}

interface PersonalAnnotation {
  id: number;
  entity_name: string;
  entity_type: string;
  term: { name: string; glossary_name: string; id: number };
  comment: string;
  proposed_changes: Record<string, any>;
  status: string;
  created_at: string;
}

interface Term {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

const DataAnnotationPage = () => {
  // State for data hierarchy
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // State for standard annotations
  const [glossaryTerms, setGlossaryTerms] = useState<GlossaryTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // State for personal annotations
  const [personalGlossaries, setPersonalGlossaries] = useState<
    PersonalGlossary[]
  >([]);
  const [personalTerms, setPersonalTerms] = useState<PersonalGlossaryTerm[]>(
    [],
  );

  // ----------------
  const [visibleTermsGlossaryId, setVisibleTermsGlossaryId] = useState<
    number | null
  >(null);

  const [personalAnnotations, setPersonalAnnotations] = useState<
    PersonalAnnotation[]
  >([]);
  const [selectedPersonalTerm, setSelectedPersonalTerm] = useState<string>("");

  // Shared state
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState({
    databases: false,
    tables: false,
    columns: false,
    glossary: false,
    personalGlossaries: false,
    personalTerms: false,
    annotations: false,
    personalAnnotations: false,
    submitting: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState<"standard" | "personal">(
    "standard",
  );

  // Fetch initial data
  useEffect(() => {
    fetchDatabases();
    fetchGlossaryTerms();
    fetchUserAnnotations();
    fetchPersonalGlossaries();
    fetchPersonalAnnotations();
  }, []);

  // Data hierarchy fetch functions
  const fetchDatabases = async () => {
    setIsLoading((prev) => ({ ...prev, databases: true }));
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/hive/databases1/",
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
        `http://localhost:8000/api/hive/databases1/${encodeURIComponent(dbName)}/tables/`,
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
        `http://localhost:8000/api/hive/tables1/${encodeURIComponent(tableName)}/columns/`,
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

  // Standard annotation functions
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
      setAnnotations(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch annotations",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, annotations: false }));
    }
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

  // Personal annotation functions
  const fetchPersonalGlossaries = async () => {
    setIsLoading((prev) => ({ ...prev, personalGlossaries: true }));
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-glossaries/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch personal glossaries");
      const data = await response.json();
      setPersonalGlossaries(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch personal glossaries",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, personalGlossaries: false }));
    }
  };

  const fetchPersonalTerms = async (glossaryId: number) => {
    setIsLoading((prev) => ({ ...prev, personalTerms: true }));
    setError("");
    try {
      const response = await fetch(
        `http://localhost:8000/api/personal-glossaries/${glossaryId}/terms/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch personal terms");
      const data = await response.json();
      setPersonalTerms(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch personal terms",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, personalTerms: false }));
    }
  };

  const fetchPersonalAnnotations = async () => {
    setIsLoading((prev) => ({ ...prev, personalAnnotations: true }));
    setError("");
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-annotations/",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch personal annotations");
      const data = await response.json();
      setPersonalAnnotations(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch personal annotations",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, personalAnnotations: false }));
    }
  };

  const handleCreateGlossary = async () => {
    setIsLoading((prev) => ({ ...prev, submitting: true }));
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-glossaries/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            name: newGlossary.name,
            description: newGlossary.description,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create glossary");
      setSuccess("Personal glossary created successfully!");
      setNewGlossary({ name: "", description: "" });
      fetchPersonalGlossaries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create glossary",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleCreateTerm = async () => {
    setIsLoading((prev) => ({ ...prev, submitting: true }));
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-glossary-terms/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            glossary_id: newTerm.glossary_id,
            name: newTerm.name,
            description: newTerm.description,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to create term");
      setSuccess("Personal term created successfully!");
      setNewTerm({ glossary_id: 0, name: "", description: "" });
      fetchPersonalTerms(newTerm.glossary_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create term");
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleSubmitPersonalAnnotation = async () => {
    if (!selectedColumn || !selectedPersonalTerm) {
      setError("Please select both a column and a personal glossary term");
      return;
    }

    setIsLoading((prev) => ({ ...prev, submitting: true }));
    setError("");
    try {
      const column = columns.find((c) => c.name === selectedColumn);
      if (!column) throw new Error("Selected column not found");

      const response = await fetch(
        "http://localhost:8000/api/personal-annotations/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            entity_name: selectedColumn,
            entity_type: "hive_column",
            term_id: parseInt(selectedPersonalTerm),
            comment,
            proposed_changes: column.metadata || {},
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit personal annotation",
        );
      }

      setSuccess("Personal annotation submitted successfully!");
      setComment("");
      setSelectedPersonalTerm("");
      fetchPersonalAnnotations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit personal annotation",
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, submitting: false }));
    }
  };

  // UI handlers
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

  const handleSelectAnnotation = (annotation: Annotation) => {
    setSelectedColumn(annotation.entity_name);
    setSelectedTerm(annotation.term_name);
    setComment(annotation.comment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectPersonalAnnotation = (annotation: PersonalAnnotation) => {
    setSelectedColumn(annotation.entity_name);
    setSelectedPersonalTerm(annotation.term.id.toString());
    setComment(annotation.comment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Form state for new glossary/term
  const [newGlossary, setNewGlossary] = useState({
    name: "",
    description: "",
  });

  const [newTerm, setNewTerm] = useState({
    glossary_id: 0,
    name: "",
    description: "",
  });

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

        {/* Tab selection for annotation type */}
        {selectedColumn && currentColumn && (
          <div className="rounded-lg bg-white shadow dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("standard")}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === "standard"
                      ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  Standard Annotation
                </button>
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === "personal"
                      ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  Personal Annotation
                </button>
              </nav>
            </div>

            <div className="px-6 py-5">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {activeTab === "standard" ? "Standard" : "Personal"} Annotation:{" "}
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

              {activeTab === "standard" ? (
                <>
                  {/* Standard Annotation Form */}
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
                </>
              ) : (
                <>
                  {/* Personal Annotation Form */}
                  <div>
                    <label
                      htmlFor="personal-term"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Personal Glossary Term
                    </label>
                    <select
                      id="personal-term"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      value={selectedPersonalTerm}
                      onChange={(e) => setSelectedPersonalTerm(e.target.value)}
                    >
                      <option value="">Select a personal term</option>
                      {personalTerms.map((term) => (
                        <option key={term.id} value={term.id}>
                          {term.name} (
                          {personalGlossaries.find(
                            (g) => g.id === term.glossary_id,
                          )?.name || "Unknown"}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Annotation Comment (shared between both types) */}
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
                  onClick={
                    activeTab === "standard"
                      ? handleSubmitAnnotation
                      : handleSubmitPersonalAnnotation
                  }
                  disabled={
                    isLoading.submitting ||
                    (activeTab === "standard"
                      ? !selectedTerm
                      : !selectedPersonalTerm)
                  }
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
                  ) : activeTab === "standard" ? (
                    "Submit Standard Annotation"
                  ) : (
                    "Submit Personal Annotation"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Personal Glossaries Section */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Personal Glossaries
              </h2>
              <button
                onClick={fetchPersonalGlossaries}
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
            {/* Create new glossary */}
            <div className="mb-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Create New Glossary
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    value={newGlossary.name}
                    onChange={(e) =>
                      setNewGlossary({ ...newGlossary, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                    value={newGlossary.description}
                    onChange={(e) =>
                      setNewGlossary({
                        ...newGlossary,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <button
                onClick={handleCreateGlossary}
                disabled={isLoading.submitting || !newGlossary.name}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Create Glossary
              </button>
            </div>

            {/* List of glossaries */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Your Glossaries
              </h3>
              {personalGlossaries.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No glossaries found
                </p>
              ) : (
                <div className="space-y-2">
                  {personalGlossaries.map((glossary) => (
                    <div
                      key={glossary.id}
                      className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {glossary.name}
                        </h4>
                        <button
                          onClick={() => {
                            if (visibleTermsGlossaryId === glossary.id) {
                              setVisibleTermsGlossaryId(null); // Hide terms
                            } else {
                              fetchPersonalTerms(glossary.id); // Fetch and show terms
                              setVisibleTermsGlossaryId(glossary.id);
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {visibleTermsGlossaryId === glossary.id
                            ? "Hide Terms"
                            : "View Terms"}
                        </button>
                      </div>
                      {glossary.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {glossary.description}
                        </p>
                      )}

                      {/* Terms for this glossary */}
                      {visibleTermsGlossaryId === glossary.id &&
                        personalTerms.some(
                          (t) => t.glossary_id === glossary.id,
                        ) && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Terms
                            </h5>
                            <ul className="mt-2 space-y-2">
                              {personalTerms
                                .filter((t) => t.glossary_id === glossary.id)
                                .map((term) => (
                                  <li
                                    key={term.id}
                                    className="rounded bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {term.name}
                                      </span>
                                    </div>
                                    {term.description && (
                                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        {term.description}
                                      </p>
                                    )}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      {/* Add term form */}
                      <div className="mt-4 space-y-2">
                        <h5 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Add New Term
                        </h5>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Term Name
                            </label>
                            <input
                              type="text"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs"
                              value={
                                newTerm.glossary_id === glossary.id
                                  ? newTerm.name
                                  : ""
                              }
                              onChange={(e) =>
                                setNewTerm({
                                  ...newTerm,
                                  glossary_id: glossary.id,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                              Description
                            </label>
                            <input
                              type="text"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-xs"
                              value={
                                newTerm.glossary_id === glossary.id
                                  ? newTerm.description
                                  : ""
                              }
                              onChange={(e) =>
                                setNewTerm({
                                  ...newTerm,
                                  glossary_id: glossary.id,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleCreateTerm}
                          disabled={
                            isLoading.submitting ||
                            newTerm.glossary_id !== glossary.id ||
                            !newTerm.name
                          }
                          className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          Add Term
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Annotations List with Tabs */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("standard")}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === "standard"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
              >
                Standard Annotations
              </button>
              <button
                onClick={() => setActiveTab("personal")}
                className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                  activeTab === "personal"
                    ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
                }`}
              >
                Personal Annotations
              </button>
            </nav>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {activeTab === "standard" ? "Standard" : "Personal"} Annotations
              </h2>
              <button
                onClick={
                  activeTab === "standard"
                    ? fetchUserAnnotations
                    : fetchPersonalAnnotations
                }
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
            {activeTab === "standard" ? (
              isLoading.annotations ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
                </div>
              ) : !annotations || annotations.length === 0 ? (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No standard annotations submitted yet
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
                              {annotation.entity_name} ({annotation.entity_type}
                              )
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
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : isLoading.personalAnnotations ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
              </div>
            ) : personalAnnotations.length === 0 ? (
              <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                No personal annotations submitted yet
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {personalAnnotations.map((annotation) => (
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
                            {annotation.term ? (
                              <>
                                Term: {annotation.term.name} (Glossary:{" "}
                                {annotation.term.glossary_name})
                              </>
                            ) : (
                              "No term associated"
                            )}
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
                            onClick={() =>
                              handleSelectPersonalAnnotation(annotation)
                            }
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
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
