"use client";

import { FormEvent, useState } from "react";

type ApiResult = {
  mode: "binary" | "multiclass" | string;
  label: string;
  probabilities: Record<string, number>;
};

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modelType, setModelType] = useState<"binary" | "multiclass">(
    "binary",
  );
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) {
        throw new Error("API base URL is not configured.");
      }

      const endpoint =
        modelType === "binary" ? "/predict" : "/predict-multiclass";

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error ${res.status}: ${text}`);
      }

      const data: ApiResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError("");

    if (selected) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl border border-slate-200 p-6 md:p-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Anemia Detection Demo
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Upload a fingernail photograph and choose which model to use:
            binary (Anemia vs Non-Anemia) or 4-class (Mild, Moderate, Severe,
            Normal).
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-[1.4fr_minmax(0,1fr)] items-start"
        >
          <section className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Choose model
              </label>
              <select
                value={modelType}
                onChange={(e) =>
                  setModelType(e.target.value as "binary" | "multiclass")
                }
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="binary">Binary (Anemia vs Non-Anemia)</option>
                <option value="multiclass">
                  4-Class (Mild / Moderate / Severe / Normal)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Fingernail image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-500">
                JPEG or PNG, ideally close-up of the fingernail.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                Error: {error}
              </p>
            )}
          </section>

          <section className="space-y-4">
            {previewUrl && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}

            {result && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Result ({result.mode})
                </h2>
                <p className="text-sm text-slate-800">
                  <span className="font-medium">Prediction:</span> {" "}
                  {result.label}
                </p>

                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-slate-800">
                    Probabilities
                  </h3>
                  <ul className="space-y-1 text-sm text-slate-700">
                    {Object.entries(result.probabilities).map(
                      ([label, p]) => (
                        <li key={label} className="flex justify-between">
                          <span>{label}</span>
                          <span className="font-mono">
                            {(p * 100).toFixed(1)}%
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}