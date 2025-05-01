"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import StewardLayout from "@/components/Layouts/StewardLayout";
import { useState, useEffect } from "react";
import Loader from "@/components/common/Loader";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

const CSVAnalysis = () => {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [normalizing, setNormalizing] = useState<Record<string, boolean>>({});
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState<
    "duplicates" | "missing" | "normalization" | null
  >(null);

  const [normalizedColumns, setNormalizedColumns] = useState<Set<string>>(
    new Set(),
  );

  const generatePDFReport = async () => {
    if (!metadata?.metadata) return;

    setLoading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let yPosition = 20;

      // Set default font
      pdf.setFont("helvetica", "normal");

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0); // Black
      pdf.text("CSV Analysis Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 15;

      // Add metadata
      pdf.setFontSize(12);
      pdf.text(
        `File: ${metadata.file?.file_name || "Untitled"}`,
        margin,
        yPosition,
      );
      yPosition += 10;
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 15;

      // Helper function to add section with page break check
      const addSection = (title: string, content: () => void) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 128); // Navy blue for headings
        pdf.text(title, margin, yPosition);
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0); // Black for content
        content();
        yPosition += 10;
      };

      // 1. Data Types Comparison
      addSection("Data Types Comparison", () => {
        if (
          metadata.metadata.data_types &&
          metadata.metadata.suggested_data_types
        ) {
          const columns = Object.keys(metadata.metadata.data_types);

          // Table headers
          pdf.setFont("helvetica", "bold");
          pdf.text("Column", margin, yPosition);
          pdf.text("Current Type", margin + 60, yPosition);
          pdf.text("Suggested Type", margin + 120, yPosition);
          yPosition += 7;
          pdf.setFont("helvetica", "normal");

          // Table rows
          columns.forEach((col) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(col, margin, yPosition);
            pdf.text(metadata.metadata.data_types[col], margin + 60, yPosition);
            pdf.text(
              metadata.metadata.suggested_data_types[col],
              margin + 120,
              yPosition,
            );
            yPosition += 7;
          });
        }
      });

      // 2. Normalization Suggestions
      addSection("Normalization Suggestions", () => {
        if (metadata.metadata.normalization_suggestions) {
          Object.entries(metadata.metadata.normalization_suggestions).forEach(
            ([col, suggestion]) => {
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(`${col}: ${suggestion}`, margin, yPosition);
              yPosition += 7;
            },
          );
        }
      });

      // 3. Pattern Detection
      addSection("Pattern Detection", () => {
        if (metadata.metadata.pattern_detection) {
          Object.entries(metadata.metadata.pattern_detection).forEach(
            ([col, patterns]) => {
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
              const patternsText = Array.isArray(patterns)
                ? patterns.join(", ")
                : "None";
              pdf.text(`${col}: ${patternsText}`, margin, yPosition);
              yPosition += 7;
            },
          );
        }
      });

      // 4. Semantic Clusters
      addSection("Semantic Column Clusters", () => {
        if (metadata.metadata.semantic_column_clusters) {
          const clusters: Record<string, string[]> = {};

          // Group columns by cluster
          Object.entries(metadata.metadata.semantic_column_clusters).forEach(
            ([col, cluster]) => {
              if (!clusters[cluster as string]) {
                clusters[cluster as string] = [];
              }
              clusters[cluster as string].push(col);
            },
          );

          // Display clusters
          Object.entries(clusters).forEach(([cluster, columns]) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.setFont("helvetica", "bold");
            pdf.text(`Cluster: ${cluster}`, margin, yPosition);
            yPosition += 7;
            pdf.setFont("helvetica", "normal");
            pdf.text(`Columns: ${columns.join(", ")}`, margin + 5, yPosition);
            yPosition += 10;
          });
        }
      });

      // 5. Outliers Count
      addSection("Outliers Count", () => {
        if (metadata.metadata.outliers) {
          const filteredData = Object.entries(metadata.metadata.outliers)
            .filter(([key]) => key !== "customer_id")
            .filter(([_, value]) => Number(value) > 0);

          filteredData.forEach(([col, count]) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(`${col}: ${count} outliers`, margin, yPosition);
            yPosition += 7;
          });
        }
      });

      // 6. Issues Summary
      addSection("Issues Summary", () => {
        pdf.text(
          `Total Duplicates: ${metadata.metadata.duplicates || 0}`,
          margin,
          yPosition,
        );
        yPosition += 7;
        const missingCols = Object.values(
          metadata.metadata.missing_values || {},
        ).filter((v) => Number(v) > 0).length;
        pdf.text(
          `Columns with Missing Values: ${missingCols}`,
          margin,
          yPosition,
        );
        yPosition += 7;
      });

      // Save PDF
      pdf.save(`csv-analysis-report-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report");
    } finally {
      setLoading(false);
    }
  };

  // Load filename from localStorage on component mount
  useEffect(() => {
    const savedFilename = localStorage.getItem("currentFilename");
    if (savedFilename) {
      setCurrentFileName(savedFilename);
      analyzeFile(savedFilename);
    }
  }, []);

  const analyzeFile = async (filename: string) => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/analyze/${filename}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to analyze file");

      const data = await response.json();
      setMetadata(data);
      localStorage.setItem("csvMetadata", JSON.stringify(data));

      const normState: Record<string, boolean> = {};
      if (data.metadata?.normalization_suggestions) {
        Object.keys(data.metadata.normalization_suggestions).forEach((col) => {
          normState[col] = false;
        });
      }
      setNormalizing(normState);
    } catch (error) {
      console.error("Error analyzing file:", error);
      alert("Error analyzing file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const token = localStorage.getItem("token");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/api/csvmetadata", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze CSV");

      const data = await response.json();
      setMetadata(data);
      setCurrentFileName(data.file.file_name);
      localStorage.setItem("csvMetadata", JSON.stringify(data));
      localStorage.setItem("currentFilename", data.file.file_name);

      const normState: Record<string, boolean> = {};
      if (data.metadata?.normalization_suggestions) {
        Object.keys(data.metadata.normalization_suggestions).forEach((col) => {
          normState[col] = false;
        });
      }
      setNormalizing(normState);
      setProcessingStep(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error analyzing CSV file");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!currentFileName) return;

    setProcessing(true);
    setProcessingStep("duplicates");
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8000/api/remove/duplicates",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: currentFileName,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to remove duplicates");

      const data = await response.json();
      setCurrentFileName(data.cleaned_file);
      localStorage.setItem("currentFilename", data.cleaned_file);
      setShowDuplicatesModal(false);

      // Re-analyze the cleaned file
      await analyzeFile(data.cleaned_file);
    } catch (error) {
      console.error("Error removing duplicates:", error);
      alert("Error removing duplicates");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMissing = async () => {
    if (!currentFileName) return;

    setProcessing(true);
    setProcessingStep("missing");
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:8000/api/remove/missingvalues",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            file_name: currentFileName,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to remove missing values");

      const data = await response.json();
      setCurrentFileName(data.cleaned_file);
      localStorage.setItem("currentFilename", data.cleaned_file);
      setShowMissingModal(false);

      // Re-analyze the cleaned file
      await analyzeFile(data.cleaned_file);
    } catch (error) {
      console.error("Error removing missing values:", error);
      alert("Error removing missing values");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadCurrentFile = async () => {
    if (!currentFileName) return;

    try {
      const token = localStorage.getItem("token");
      let endpoint = "http://localhost:8000/api/download/original";

      if (processingStep === "duplicates") {
        endpoint = "http://localhost:8000/api/download/duplicates";
      } else if (processingStep === "missing") {
        endpoint = "http://localhost:8000/api/download/missingvalues";
      } else if (processingStep === "normalization") {
        endpoint = "http://localhost:8000/api/download/normalized";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file_name: currentFileName,
        }),
      });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error downloading file");
    }
  };

  const handleNormalizeColumn = async (columnName: string) => {
    if (normalizedColumns.has(columnName)) return;
    if (!currentFileName) return;

    setNormalizing((prev) => ({ ...prev, [columnName]: true }));
    setProcessingStep("normalization");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:8000/api/normalize/${columnName}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: currentFileName,
          }),
        },
      );

      if (!response.ok) throw new Error(`Failed to normalize ${columnName}`);
      setNormalizedColumns((prev) => new Set(prev).add(columnName));

      const data = await response.json();
      setCurrentFileName(data.cleaned_file);
      localStorage.setItem("currentFilename", data.cleaned_file);

      // Re-analyze the normalized file
      await analyzeFile(data.cleaned_file);
      alert(`${columnName} normalized successfully`);
    } catch (error) {
      console.error(`Error normalizing ${columnName}:`, error);
      alert(`Error normalizing ${columnName}`);
    } finally {
      setNormalizing((prev) => ({ ...prev, [columnName]: false }));
    }
  };

  const renderDataTypesComparison = () => {
    if (
      !metadata?.metadata?.data_types ||
      !metadata?.metadata?.suggested_data_types
    )
      return null;

    const columns = Object.keys(metadata.metadata.data_types);

    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Data Types Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Current Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Suggested Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {columns.map((col) => (
                <tr key={col}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {col}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {metadata.metadata.data_types[col]}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {metadata.metadata.suggested_data_types[col]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNormalizationSuggestions = () => {
    if (!metadata?.metadata?.normalization_suggestions) return null;

    const columns = Object.keys(metadata.metadata.normalization_suggestions);

    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">
          Normalization Suggestions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Suggestion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {columns.map((col) => (
                <tr key={col}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {col}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {metadata.metadata.normalization_suggestions[col]}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {metadata.metadata.normalization_suggestions[col]?.includes(
                      "suggested",
                    ) && (
                      <button
                        onClick={() => handleNormalizeColumn(col)}
                        disabled={
                          normalizedColumns.has(col) || normalizing[col]
                        }
                        className={`rounded px-3 py-1 text-xs font-medium text-white ${
                          normalizedColumns.has(col)
                            ? "cursor-not-allowed bg-gray-400"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {normalizedColumns.has(col)
                          ? "Normalized"
                          : normalizing[col]
                            ? "Normalizing..."
                            : "Normalize"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPatternDetection = () => {
    if (!metadata?.metadata?.pattern_detection) return null;

    const columns = Object.keys(metadata.metadata.pattern_detection);

    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Pattern Detection</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Column
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Detected Patterns
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {columns.map((col) => (
                <tr key={col}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {col}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {metadata.metadata.pattern_detection[col]?.join(", ") ||
                      "None"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSemanticClusters = () => {
    if (!metadata?.metadata?.semantic_column_clusters) return null;

    const clusters: Record<string, string[]> = {};

    Object.entries(metadata.metadata.semantic_column_clusters).forEach(
      ([col, cluster]) => {
        if (!clusters[cluster as string]) {
          clusters[cluster as string] = [];
        }
        clusters[cluster as string].push(col);
      },
    );

    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Semantic Column Clusters</h3>
        <div className="space-y-4">
          {Object.entries(clusters).map(([clusterName, columns]) => (
            <div
              key={clusterName}
              className="rounded-lg border border-gray-200 p-3"
            >
              <h4 className="mb-2 font-medium text-gray-700">
                Cluster: <span className="text-blue-600">{clusterName}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {columns.map((col) => (
                  <span
                    key={col}
                    className="rounded bg-gray-100 px-2 py-1 text-sm"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderOutliersChart = () => {
    if (!metadata?.metadata?.outliers) return null;

    const outliers = metadata.metadata.outliers;
    const filteredData = Object.entries(outliers)
      .filter(([key]) => key !== "customer_id")
      .filter(([_, value]) => Number(value) > 0);

    const data = {
      labels: filteredData.map(([key]) => key),
      datasets: [
        {
          label: "Outliers Count",
          data: filteredData.map(([_, value]) => value),
          backgroundColor: "#3C50E0",
          borderRadius: 4,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      maintainAspectRatio: false,
    };

    return (
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-4 text-lg font-semibold">Outliers Count</h3>
        <div className="h-64">
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  };

  const json = metadata ? JSON.stringify(metadata, null, 2) : "";
  const lines = json ? json.split("\n") : [];
  const display = showMore ? lines : lines.slice(0, 6);

  return (
    <StewardLayout>
      <div className="mx-auto w-full max-w-[970px]">
        <Breadcrumb pageName="CSV Analysis" />

        <div className=" mb-6 rounded-lg bg-white p-6 shadow">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hover:file:bg-primary-dark block w-full text-sm
                text-gray-500 file:mr-4 file:rounded-md
                file:border-0 file:bg-primary
                file:px-4 file:py-2
                file:text-sm file:font-semibold
                file:text-white"
            />
          </div>
          <button
            onClick={handleFileUpload}
            disabled={!file || loading}
            className="hover:bg-primary-dark mr-4 rounded bg-primary px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze CSV"}
          </button>

          <button
            onClick={generatePDFReport}
            disabled={!metadata || loading}
            className="rounded bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        </div>

        {loading && <Loader />}
        <div id="report-container" className="p-4">
          {metadata && metadata.metadata && (
            <div className="space-y-6">
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">Metadata Summary</h2>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded bg-gray-50 p-4">
                    <h3 className="mb-2 font-medium">Columns</h3>
                    <ul className="list-disc pl-5">
                      {metadata.metadata.columns?.map((col: string) => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded bg-gray-50 p-4">
                    <h3 className="mb-2 font-medium">Issues</h3>
                    <p>Duplicates: {metadata.metadata.duplicates || 0}</p>
                    <p>
                      Missing values:{" "}
                      {
                        Object.values(
                          metadata.metadata.missing_values || {},
                        ).filter((v) => (v as number) > 0).length
                      }{" "}
                      columns
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleDownloadCurrentFile}
                    className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600"
                  >
                    Download {processingStep ? "Processed" : "Original"} File
                  </button>

                  {(metadata.metadata.duplicates || 0) > 0 && (
                    <button
                      onClick={() => setShowDuplicatesModal(true)}
                      className="rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
                    >
                      Remove Duplicates
                    </button>
                  )}

                  {Object.values(metadata.metadata.missing_values || {}).some(
                    (v) => (v as number) > 0,
                  ) && (
                    <button
                      onClick={() => setShowMissingModal(true)}
                      className="rounded bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600"
                    >
                      Remove Missing Values
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {renderDataTypesComparison()}
                {renderNormalizationSuggestions()}
                {renderPatternDetection()}
                {renderSemanticClusters()}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderOutliersChart()}
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold">Full Metadata</h2>
                <pre className="overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-4 text-sm">
                  {display.join("\n")}
                </pre>
                {lines.length > 6 && (
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    {showMore ? "Show less " : "Show more "}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Remove Duplicates Confirmation Modal */}
        {showDuplicatesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">
                Confirm Remove Duplicates
              </h3>
              <p className="mb-6">
                Are you sure you want to remove{" "}
                {metadata?.metadata?.duplicates || 0} duplicate records?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDuplicatesModal(false)}
                  className="rounded bg-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveDuplicates}
                  disabled={processing}
                  className="rounded bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Missing Values Confirmation Modal */}
        {showMissingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">
                Confirm Remove Missing Values
              </h3>
              <p className="mb-6">
                Are you sure you want to remove records with missing values?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowMissingModal(false)}
                  className="rounded bg-gray-300 px-4 py-2 font-medium text-gray-800 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMissing}
                  disabled={processing}
                  className="rounded bg-yellow-500 px-4 py-2 font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StewardLayout>
  );
};
export default CSVAnalysis;
