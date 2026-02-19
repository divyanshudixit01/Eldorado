import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Upload({ onUploadSuccess, onNotify }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isValidCSV = (file) => {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".csv")) return true;
    const csvMimeTypes = [
      "text/csv",
      "application/csv",
      "text/plain",
      "application/vnd.ms-excel",
      "text/x-csv",
    ];
    return csvMimeTypes.includes(file.type);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!isValidCSV(selectedFile)) {
        setError("Please upload a CSV file (.csv extension required)");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
      if (onNotify) {
        onNotify({
          type: "success",
          message: "CSV uploaded and fraud graph successfully recomputed.",
        });
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        "Failed to upload file. Please check the CSV format.";
      setError(message);
      setSuccess(false);
      if (onNotify) {
        onNotify({ type: "error", message });
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-2">
          Required CSV columns:{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono">
            transaction_id
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono">
            sender_id
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono">
            receiver_id
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono">
            amount
          </code>
          ,{" "}
          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200 font-mono">
            timestamp
          </code>{" "}
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            (YYYY-MM-DD HH:MM:SS)
          </span>
        </p>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <label className="flex-1 cursor-pointer">
          <div className="group flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center transition-colors duration-300 hover:border-primary-500 hover:bg-primary-50/70 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-primary-400 dark:hover:bg-slate-900">
            <input
              type="file"
              accept=".csv,text/csv,application/csv,text/plain"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <div className="text-center">
              <svg
                className="mx-auto h-10 w-10 text-slate-400 group-hover:text-primary-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {file ? (
                  <span className="font-medium">{file.name}</span>
                ) : (
                  <>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      Click to browse
                    </span>{" "}
                    or drag and drop a CSV file
                  </>
                )}
              </p>
              {!file && (
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Maximum ~10,000 transactions per run recommended.
                </p>
              )}
            </div>
          </div>
        </label>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform duration-200 ease-in-out-soft hover:bg-primary-700 hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {uploading ? "Uploading..." : "Upload & Analyze"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-3 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-200">
          ✓ File uploaded and analyzed successfully.
        </div>
      )}
    </div>
  );
}

export default Upload;
