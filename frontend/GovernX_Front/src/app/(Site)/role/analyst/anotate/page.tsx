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

const DataAnnotationPage = () => {
  // Existing state
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

  // New state for personal glossaries
  const [personalGlossaries, setPersonalGlossaries] = useState<
    PersonalGlossary[]
  >([]);
  const [personalTerms, setPersonalTerms] = useState<PersonalGlossaryTerm[]>(
    [],
  );
  const [personalAnnotations, setPersonalAnnotations] = useState<
    PersonalAnnotation[]
  >([]);
  const [showPersonalGlossaries, setShowPersonalGlossaries] = useState(false);
  const [newGlossary, setNewGlossary] = useState({
    name: "",
    description: "",
  });
  const [newTerm, setNewTerm] = useState({
    glossary_id: 0,
    name: "",
    description: "",
  });
  const [selectedPersonalTerm, setSelectedPersonalTerm] = useState<string>("");
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

  // Existing fetch methods...

  // New fetch methods for personal glossaries
  const fetchPersonalGlossaries = async () => {
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
    }
  };

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

  const fetchPersonalTerms = async (glossaryId: number) => {
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
    }
  };

  const fetchPersonalAnnotations = async () => {
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
    }
  };

  // Personal glossary handlers
  const handleCreateGlossary = async () => {
    setIsLoading({ ...isLoading, submitting: true });
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-glossaries/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newGlossary),
        },
      );
      if (!response.ok) throw new Error("Failed to create glossary");
      setSuccess("Glossary created successfully!");
      setNewGlossary({ name: "", description: "" });
      fetchPersonalGlossaries();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create glossary",
      );
    } finally {
      setIsLoading({ ...isLoading, submitting: false });
    }
  };

  const handleCreateTerm = async () => {
    setIsLoading({ ...isLoading, submitting: true });
    try {
      const response = await fetch(
        "http://localhost:8000/api/personal-glossary-terms/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(newTerm),
        },
      );
      if (!response.ok) throw new Error("Failed to create term");
      setSuccess("Term created successfully!");
      setNewTerm({ glossary_id: 0, name: "", description: "" });
      fetchPersonalTerms(newTerm.glossary_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create term");
    } finally {
      setIsLoading({ ...isLoading, submitting: false });
    }
  };

  const handleSubmitPersonalAnnotation = async () => {
    if (!selectedColumn || !selectedPersonalTerm) {
      setError("Please select both a column and a personal glossary term");
      return;
    }

    setIsLoading({ ...isLoading, submitting: true });
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
            term_id: selectedPersonalTerm,
            comment,
            proposed_changes: column.metadata || {},
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit annotation");
      }

      setSuccess("Personal annotation submitted successfully!");
      setComment("");
      setSelectedPersonalTerm("");
      fetchPersonalAnnotations();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit annotation",
      );
    } finally {
      setIsLoading({ ...isLoading, submitting: false });
    }
  };

  // Rest of your existing handlers...

  // Get current column details
  const currentColumn = selectedColumn
    ? columns.find((c) => c.name === selectedColumn)
    : null;

  return (
    <AnalystLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Existing header and status messages... */}

        {/* Add tabs for standard/personal annotations */}
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

        {activeTab === "standard" ? (
          <>
            {/* Your existing standard annotation UI... */}
            {/* Database, Table, Column selection */}
            {/* Standard annotation form */}
          </>
        ) : (
          <>
            {/* Personal glossaries section */}
            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Personal Glossaries
                  </h2>
                  <button
                    onClick={() =>
                      setShowPersonalGlossaries(!showPersonalGlossaries)
                    }
                    className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    {showPersonalGlossaries ? "Hide" : "Show"} Glossaries
                  </button>
                </div>
              </div>

              {showPersonalGlossaries && (
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
                            setNewGlossary({
                              ...newGlossary,
                              name: e.target.value,
                            })
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
                                onClick={() => fetchPersonalTerms(glossary.id)}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                View Terms
                              </button>
                            </div>
                            {glossary.description && (
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {glossary.description}
                              </p>
                            )}

                            {/* Terms for this glossary */}
                            {personalTerms.some(
                              (t) => t.glossary_id === glossary.id,
                            ) && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                  Terms
                                </h5>
                                <ul className="mt-2 space-y-2">
                                  {personalTerms
                                    .filter(
                                      (t) => t.glossary_id === glossary.id,
                                    )
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
              )}
            </div>

            {/* Personal annotation form (only shown when column is selected) */}
            {selectedColumn && currentColumn && (
              <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                <div className="px-6 py-5">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Personal Annotation:{" "}
                    <span className="text-blue-600 dark:text-blue-400">
                      {selectedColumn}
                    </span>
                  </h2>
                </div>
                <div className="space-y-6 border-t border-gray-200 px-6 py-5 dark:border-gray-700">
                  {/* Column Metadata (same as standard) */}
                  {/* Term Selection */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personal Glossary Term
                    </label>
                    <select
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

                  {/* Comment and Submit (similar to standard) */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Annotation Comment
                    </label>
                    <textarea
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your annotation comment..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitPersonalAnnotation}
                      disabled={isLoading.submitting || !selectedPersonalTerm}
                      className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Personal Annotation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Annotations List */}
            <div className="rounded-lg bg-white shadow dark:bg-gray-800">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Your Personal Annotations
                  </h2>
                  <button
                    onClick={fetchPersonalAnnotations}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              <div className="border-t border-gray-200 px-6 py-5 dark:border-gray-700">
                {personalAnnotations.length === 0 ? (
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
                                {annotation.entity_name} (
                                {annotation.entity_type})
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Term: {annotation.term.name} (Glossary:{" "}
                                {annotation.term.glossary_name})
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
                                onClick={() => {
                                  setSelectedColumn(annotation.entity_name);
                                  setSelectedPersonalTerm(
                                    annotation.term.id.toString(),
                                  );
                                  setComment(annotation.comment);
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  // Implement update for personal annotations
                                }}
                                disabled={annotation.status !== "PENDING"}
                                className="text-green-600 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Update
                              </button>
                              <button
                                onClick={() => {
                                  // Implement delete for personal annotations
                                }}
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
          </>
        )}
      </div>
    </AnalystLayout>
  );
};

export default DataAnnotationPage;
