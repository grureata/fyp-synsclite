"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { apiRequest } from "../../lib/api";

type Summary = {
  kpis: {
    avgConfidence: number;
    signsDetected: number;
    avgLatencyMs: number | null;
    cameraFps: number | null;
    translationsCount: number;
    contextModesCount: number;
  };
  confidenceTrend: { day: string; avgConfidence: number }[];
  contextUsage: { preset: string; count: number }[];
};

type RecordRow = {
  id: string;
  sentence: string;
  gloss: string;
  confidence: number;
  ctx: string;
  time: string;
};

type Health = { name: string; status: string; detail: string }[];

function isSummary(value: unknown): value is Summary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Summary>;
  return !!candidate.kpis
    && typeof candidate.kpis.avgConfidence === "number"
    && typeof candidate.kpis.signsDetected === "number"
    && typeof candidate.kpis.translationsCount === "number"
    && Array.isArray(candidate.confidenceTrend)
    && Array.isArray(candidate.contextUsage);
}

function isRecordList(value: unknown): value is RecordRow[] {
  return Array.isArray(value) && value.every((record) =>
    record && typeof record.id === "string"
    && typeof record.sentence === "string"
    && typeof record.gloss === "string"
    && typeof record.confidence === "number"
    && typeof record.ctx === "string"
    && typeof record.time === "string"
  );
}

function isHealth(value: unknown): value is Health {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.name === "string" && typeof item.status === "string"
    && typeof item.detail === "string"
  );
}

function Kpi({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--t1)" }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [health, setHealth] = useState<Health>([]);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<unknown>("/dashboard/summary"),
      apiRequest<unknown>("/dashboard/records"),
      apiRequest<unknown>("/dashboard/system-health"),
    ]).then(([summaryData, recordsData, healthData]) => {
      if (!isSummary(summaryData) || !isRecordList(recordsData) || !isHealth(healthData)) {
        throw new Error("The backend returned dashboard data in an unexpected format.");
      }
      if (active) {
        setSummary(summaryData);
        setRecords(recordsData);
        setHealth(healthData);
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load your dashboard.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const shown = useMemo(
    () => filter === "All" ? records : records.filter((record) => record.ctx === filter),
    [filter, records],
  );

  function exportRecords() {
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = [
      ["ID", "Sentence", "Gloss", "Confidence", "Mode", "Time"].map(quote).join(","),
      ...shown.map((record) => [
        record.id,
        record.sentence,
        record.gloss,
        record.confidence,
        record.ctx,
        record.time,
      ].map(quote).join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "signsync_records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "36px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--t1)" }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: "var(--t4)", marginTop: 4 }}>Your saved translation sessions and system status.</p>
          </div>
          <Link href="/translate" className="btn btn-v" style={{ fontSize: 13, padding: "9px 18px" }}>Open Translator</Link>
        </div>

        {loading ? <p role="status" className="body">Loading dashboard…</p> : null}
        {error && (
          <div role="alert" className="card" style={{ padding: 20, marginBottom: 20 }}>
            <p style={{ color: "var(--rose)", marginBottom: 10 }}>{error}</p>
            {error.includes("Authentication") && <Link className="btn btn-v" href="/login">Sign in</Link>}
          </div>
        )}

        {summary && !error && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 18 }}>
              <Kpi value={`${summary.kpis.avgConfidence.toFixed(1)}%`} label="Average confidence" color="var(--green)" />
              <Kpi value={summary.kpis.signsDetected.toLocaleString()} label="Signs detected" color="var(--v2)" />
              <Kpi value={summary.kpis.translationsCount.toLocaleString()} label="Translations saved" color="var(--teal)" />
              <Kpi value={summary.kpis.contextModesCount.toLocaleString()} label="Context modes used" color="var(--t3)" />
              <Kpi value={summary.kpis.avgLatencyMs === null ? "Not measured" : `${summary.kpis.avgLatencyMs} ms`} label="Average latency" color="var(--amber)" />
              <Kpi value={summary.kpis.cameraFps === null ? "Not measured" : `${summary.kpis.cameraFps} fps`} label="Camera rate" color="var(--v2)" />
            </div>

            <section className="card" style={{ padding: 20, marginBottom: 14 }}>
              <h2 style={{ fontWeight: 700, fontSize: 14, color: "var(--t1)", marginBottom: 14 }}>System status</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                {health.map((item) => (
                  <div key={item.name} style={{ padding: 14, background: "var(--bg-2)", borderRadius: "var(--r2)", border: "1px solid var(--b)" }}>
                    <strong style={{ color: item.status === "operational" ? "var(--green)" : "var(--amber)" }}>{item.name}: {item.status}</strong>
                    <p style={{ fontSize: 12, color: "var(--t4)", marginTop: 5 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--b)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <h2 style={{ fontWeight: 700, fontSize: 14, color: "var(--t1)" }}>Translation records</h2>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["All", ...new Set(records.map((record) => record.ctx))].map((mode) => (
                    <button key={mode} onClick={() => setFilter(mode)} aria-pressed={filter === mode} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 11 }}>{mode}</button>
                  ))}
                  <button type="button" onClick={exportRecords} disabled={shown.length === 0} className="btn btn-outline" style={{ padding: "4px 10px", fontSize: 11 }}>Export CSV</button>
                </div>
              </div>
              {shown.length === 0 ? (
                <p className="body" style={{ padding: 24 }}>{records.length === 0 ? "No translations have been saved yet." : "No records match this filter."}</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Sentence", "Gloss", "Confidence", "Mode", "Time"].map((heading) => <th key={heading} style={{ padding: 12, textAlign: "left", color: "var(--t4)", fontSize: 11 }}>{heading}</th>)}</tr></thead>
                    <tbody>
                      {shown.map((record) => (
                        <tr key={record.id}>
                          <td style={{ padding: 12, color: "var(--t2)" }}>{record.sentence}</td>
                          <td style={{ padding: 12, color: "var(--t4)" }}>{record.gloss}</td>
                          <td style={{ padding: 12, color: "var(--t2)" }}>{(record.confidence * 100).toFixed(0)}%</td>
                          <td style={{ padding: 12, color: "var(--t2)" }}>{record.ctx}</td>
                          <td style={{ padding: 12, color: "var(--t4)" }}>{new Date(record.time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
