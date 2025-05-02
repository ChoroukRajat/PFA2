"use client";
import React, { useState, useEffect } from "react";
import AnalystLayout from "@/components/Layouts/AnalystLayout";

interface AtlasEntity {
  guid: string;
  type: string;
  name: string;
  qualified_name: string;
  attributes?: any;
}

interface GlossaryTerm {
  glossary_id: string;
  glossary_name: string;
  terms: Array<{
    guid: string;
    name: string;
    description?: string;
  }>;
}

interface PendingAnnotation {
  id: number;
  entity: {
    guid: string;
    name: string;
    type: string;
  };
  category: string;
  comment: string;
  proposed_changes: Record<string, any>;
  status: string;
  date_created: string;
}

const DataAnnotationPage = () => {
  const [entities, setEntities] = useState<AtlasEntity[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<AtlasEntity | null>(
    null,
  );
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [comment, setComment] = useState("");
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [userAnnotations, setUserAnnotations] = useState<PendingAnnotation[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Hive databases on component mount
  useEffect(() => {
    fetchEntities("hive_db");
  }, []);

  const fetchEntities = async (entityType: string, name?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const url = name
        ? `/api/atlas/search/${entityType}?name=${encodeURIComponent(name)}`
        : `/api/atlas/search/${entityType}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch entities");

      const data = await response.json();
      setEntities(data.entities);
    } catch (err) {
      setError("err.message1");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlossary = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/glossary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch glossary");

      const data = await response.json();
      setGlossary(data.glossaries);
    } catch (err) {
      setError("err.message2");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntityDetails = async (guid: string) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/atlas/search/hive_table?guid=${guid}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch entity details");

      const data = await response.json();
      if (data.entities && data.entities.length > 0) {
        setSelectedEntity(data.entities[0]);
        setMetadata(data.entities[0].attributes || {});
      }
    } catch (err) {
      setError("err.message3");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserAnnotations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/user/annotations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user annotations");

      const data = await response.json();
      setUserAnnotations(data.annotations);
    } catch (err) {
      setError("err.message4");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnnotation = async () => {
    if (!selectedEntity || !selectedTerm) {
      setError("Please select both an entity and a glossary term");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          entity_guid: selectedEntity.guid,
          category_id: selectedTerm,
          comment,
          proposed_changes: metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit annotation");
      }

      const data = await response.json();
      setSuccess("Annotation submitted successfully!");
      setComment("");
      setSelectedTerm("");
      fetchUserAnnotations();
    } catch (err) {
      setError("err.message5");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <AnalystLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark dark:text-white">
            Data Annotation Tool
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Annotate and tag your data assets
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-400 bg-green-100 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Entity Selection Panel */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
            <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
              Hive Databases
            </h2>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
              ) : entities.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No entities found
                </p>
              ) : (
                entities.map((entity) => (
                  <div
                    key={entity.guid}
                    className={`cursor-pointer rounded p-3 transition-colors ${
                      selectedEntity?.guid === entity.guid
                        ? "border border-primary bg-primary/10"
                        : "border border-transparent hover:bg-gray-100 dark:hover:bg-dark-3"
                    }`}
                    onClick={() => {
                      setSelectedEntity(entity);
                      fetchEntityDetails(entity.guid);
                      fetchGlossary();
                    }}
                  >
                    <div className="font-medium text-dark dark:text-white">
                      {entity.name}
                    </div>
                    <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {entity.qualified_name}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Annotation Panel */}
          <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2 lg:col-span-2">
            {selectedEntity ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-dark dark:text-white">
                    Annotate:{" "}
                    <span className="text-primary">{selectedEntity.name}</span>
                  </h2>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-dark-3 dark:text-gray-200">
                    {selectedEntity.type}
                  </span>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 font-medium text-dark dark:text-white">
                    Metadata
                  </h3>
                  <div className="max-h-60 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-dark-3">
                    {Object.keys(metadata).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(metadata).map(([key, value]) => (
                          <div key={key} className="flex items-start">
                            <label className="w-1/3 font-medium text-dark dark:text-white">
                              {key}:
                            </label>
                            <input
                              type="text"
                              value={value as string}
                              onChange={(e) =>
                                handleMetadataChange(key, e.target.value)
                              }
                              className="w-2/3 border-b border-gray-300 bg-transparent px-2 py-1 text-dark focus:border-primary focus:outline-none dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">
                        No metadata available
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 font-medium text-dark dark:text-white">
                    Glossary Terms
                  </h3>
                  <select
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                  >
                    <option value="">Select a glossary term</option>
                    {glossary.map((glossary) => (
                      <optgroup
                        key={glossary.glossary_id}
                        label={glossary.glossary_name}
                      >
                        {glossary.terms.map((term) => (
                          <option key={term.guid} value={term.guid}>
                            {term.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <h3 className="mb-2 font-medium text-dark dark:text-white">
                    Annotation Comment
                  </h3>
                  <textarea
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 font-medium text-dark outline-none focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your annotation comment..."
                  />
                </div>

                <button
                  className="hover:bg-primary-dark w-full rounded-lg bg-primary px-4 py-2 font-medium text-white transition-colors disabled:opacity-50"
                  onClick={handleSubmitAnnotation}
                  disabled={isLoading || !selectedTerm}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
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
                    </span>
                  ) : (
                    "Submit Annotation"
                  )}
                </button>
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Select an entity to begin annotation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Annotations History */}
        <div className="rounded-lg bg-white p-6 shadow dark:bg-dark-2">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-dark dark:text-white">
              Your Annotations
            </h2>
            <button
              onClick={fetchUserAnnotations}
              className="hover:text-primary-dark flex items-center text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mr-1 h-5 w-5"
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

          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : userAnnotations.length === 0 ? (
            <p className="py-6 text-center text-gray-500 dark:text-gray-400">
              No annotations submitted yet
            </p>
          ) : (
            <div className="space-y-4">
              {userAnnotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    annotation.status === "APPROVED"
                      ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
                      : annotation.status === "REJECTED"
                        ? "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20"
                        : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-dark-3"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-dark dark:text-white">
                        {annotation.entity.name} ({annotation.entity.type})
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {annotation.category}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
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
                    <div className="mt-2 rounded bg-white p-3 text-dark dark:bg-dark-4 dark:text-gray-300">
                      {annotation.comment}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      {new Date(annotation.date_created).toLocaleString()}
                    </div>
                    <button
                      className="hover:text-primary-dark text-sm text-primary"
                      onClick={() => {
                        setSelectedEntity({
                          guid: annotation.entity.guid,
                          type: annotation.entity.type,
                          name: annotation.entity.name,
                          qualified_name: "",
                          attributes: annotation.proposed_changes,
                        });
                        setMetadata(annotation.proposed_changes);
                        setComment(annotation.comment);
                        setSelectedTerm(
                          glossary
                            .flatMap((g) => g.terms)
                            .find((t) => t.name === annotation.category)
                            ?.guid || "",
                        );
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AnalystLayout>
  );
};

export default DataAnnotationPage;
