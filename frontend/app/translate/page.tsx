"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { apiRequest, ApiRequestError } from "../../lib/api";

type Preset = { id: string; name: string; vocabularyDomainDescription: string };
type Calibration = {
  armLengthRatio: number;
  handScaleFactor: number;
  signingSpeedFps: number;
  calibratedAt: string;
};
type Session = { id: string; startTime: string; endTime: string | null };
type RecordRow = {
  id: string;
  sentence: string;
  gloss: string;
  confidence: number;
  ctx: string;
  time: string;
};
type RecognitionResult = {
  status: "recognized" | "uncertain" | "no_sign";
  prediction: string | null;
  candidate: string;
  confidence: number;
  minimumConfidence: number;
  topCandidates: { label: string; confidence: number }[];
  handDetected: boolean;
  modelVersion: string;
  handDetectorVersion: string;
  latencyMs: number;
  scope: string;
};

function isRecognitionResult(value: unknown): value is RecognitionResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<RecognitionResult>;
  return (result.status === "recognized" || result.status === "uncertain" || result.status === "no_sign")
    && (typeof result.prediction === "string" || result.prediction === null)
    && typeof result.candidate === "string"
    && typeof result.confidence === "number" && Number.isFinite(result.confidence)
    && result.confidence >= 0 && result.confidence <= 1
    && typeof result.minimumConfidence === "number" && Number.isFinite(result.minimumConfidence)
    && result.minimumConfidence >= 0 && result.minimumConfidence <= 1
    && Array.isArray(result.topCandidates)
    && result.topCandidates.length > 0 && result.topCandidates.length <= 3
    && result.topCandidates.every((item) =>
      item && typeof item.label === "string" && typeof item.confidence === "number"
      && Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1
    )
    && typeof result.handDetected === "boolean"
    && typeof result.modelVersion === "string"
    && typeof result.handDetectorVersion === "string"
    && typeof result.latencyMs === "number" && Number.isFinite(result.latencyMs) && result.latencyMs >= 0
    && typeof result.scope === "string"
    && (result.handDetected || result.status !== "recognized")
    && (result.status !== "recognized" || typeof result.prediction === "string")
    && (result.status !== "uncertain" || result.prediction === null)
    && (result.status !== "no_sign" || result.prediction === "NOTHING");
}

function isPresetList(value: unknown): value is Preset[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === "string" && typeof item.name === "string"
    && typeof item.vocabularyDomainDescription === "string"
  );
}

function isRecordList(value: unknown): value is RecordRow[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === "string" && typeof item.sentence === "string"
    && typeof item.gloss === "string" && typeof item.confidence === "number"
    && typeof item.ctx === "string" && typeof item.time === "string"
  );
}

function isSessionList(value: unknown): value is Session[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item.id === "string" && typeof item.startTime === "string"
    && (typeof item.endTime === "string" || item.endTime === null)
  );
}

export default function TranslatePage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [calibration, setCalibration] = useState<Calibration | null>(null);
  const [calibrationValues, setCalibrationValues] = useState({
    armLengthRatio: "",
    handScaleFactor: "",
    signingSpeedFps: "",
  });
  const [showCalibration, setShowCalibration] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [modelStatus, setModelStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<unknown>("/context-presets"),
      apiRequest<unknown>("/dashboard/records"),
      apiRequest<unknown>("/sessions"),
    ]).then(([presetData, recordData, sessionData]) => {
      if (!isPresetList(presetData) || !isRecordList(recordData) || !isSessionList(sessionData)) {
        throw new Error("The backend returned translator data in an unexpected format.");
      }
      if (!active) return;
      setPresets(presetData);
      setSelectedPresetId(presetData[0]?.id || "");
      setRecords(recordData);
      setSession(sessionData.find((item) => item.endTime === null) || null);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load translator data.");
    }).finally(() => {
      if (active) setLoading(false);
    });

    apiRequest<Calibration>("/calibration/me").then((profile) => {
      if (!active) return;
      setCalibration(profile);
      setCalibrationValues({
        armLengthRatio: String(profile.armLengthRatio),
        handScaleFactor: String(profile.handScaleFactor),
        signingSpeedFps: String(profile.signingSpeedFps),
      });
    }).catch((cause: unknown) => {
      if (active && (!(cause instanceof ApiRequestError) || cause.status !== 404)) {
        setError(cause instanceof Error ? cause.message : "Unable to load calibration.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<unknown>("/dashboard/system-health")
      .then((value) => {
        if (!Array.isArray(value)) throw new Error("Unexpected health-check response.");
        const service = value.find((item) =>
          item && typeof item === "object" && "name" in item && item.name === "ML Service"
        );
        if (!service || !("status" in service)) throw new Error("Recognition service status is missing.");
        if (active) setModelStatus(service.status === "operational" ? "ready" : "unavailable");
      })
      .catch(() => { if (active) setModelStatus("unavailable"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  const toggleCamera = useCallback(async () => {
    setError("");
    setNotice("");
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported by this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
    } catch (cause) {
      setError(cause instanceof Error
        ? `Camera access failed: ${cause.message}`
        : "Camera access was denied.");
    }
  }, [cameraStream]);

  async function startSession() {
    if (!cameraStream || !selectedPresetId) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      const created = await apiRequest<Session>("/sessions", {
        method: "POST",
        body: JSON.stringify({ presetId: selectedPresetId }),
      });
      if (!created || typeof created.id !== "string") {
        throw new Error("The backend did not return a valid session.");
      }
      setSession(created);
      setRecognition(null);
      setNotice("Session started. Capture one held handshape at a time; this prototype does not interpret words or continuous signing.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start the session.");
    } finally {
      setSaving(false);
    }
  }

  async function recognizeFrame() {
      const video = videoRef.current;
      if (!session || !cameraStream || !video) return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
        setError("The camera is not ready yet. Wait for the preview, then try again.");
        return;
      }

      setError("");
      setNotice("");
      setRecognition(null);
      setRecognizing(true);
      try {
        const side = Math.min(video.videoWidth, video.videoHeight);
        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 224;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser could not prepare a camera image.");
        context.drawImage(
          video,
          (video.videoWidth - side) / 2,
          (video.videoHeight - side) / 2,
          side,
          side,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (image) => image ? resolve(image) : reject(new Error("The camera frame could not be encoded.")),
            "image/jpeg",
            0.85,
          );
        });
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("The captured image could not be read."));
          reader.onload = () => typeof reader.result === "string"
            ? resolve(reader.result)
            : reject(new Error("The captured image had an invalid format."));
          reader.readAsDataURL(blob);
        });
        const imageBase64 = imageDataUrl.split(",")[1];
        if (!imageBase64) throw new Error("The captured image had an invalid format.");

        const response = await apiRequest<unknown>("/recognition/predict", {
          method: "POST",
          body: JSON.stringify({ imageBase64 }),
        });
        if (!isRecognitionResult(response)) {
          throw new Error("The recognition service returned an unexpected response.");
        }
        setRecognition(response);
        if (response.status === "uncertain") {
          setNotice(response.handDetected
            ? `Uncertain result: ${response.candidate} scored ${(response.confidence * 100).toFixed(0)}%, `
              + `below the tested ${(response.minimumConfidence * 100).toFixed(0)}% threshold. Please retry.`
            : `Uncertain result: the hand detector could not confirm a hand. Candidate ${response.candidate} `
              + `scored ${(response.confidence * 100).toFixed(0)}% but was not accepted. Center your hand and retry.`);
        } else if (response.status === "no_sign") {
          setNotice("No supported handshape was confidently detected. Center one hand in the guide and try again.");
        } else if (response.prediction && session) {
          await apiRequest(`/sessions/${session.id}/records`, {
            method: "POST",
            body: JSON.stringify({
              rawGlossSequence: response.prediction,
              synthesizedSentence: response.prediction,
              confidenceScore: response.confidence,
            }),
          });
          const recordData = await apiRequest<unknown>("/dashboard/records");
          if (!isRecordList(recordData)) {
            throw new Error("The backend returned saved records in an unexpected format.");
          }
          setRecords(recordData);
          setNotice(
            `Detected ${response.prediction} · ${(response.confidence * 100).toFixed(0)}% `
            + `confidence · ${response.latencyMs.toFixed(0)} ms model time. Saved to this session.`,
          );
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Recognition failed. Please try again.");
      } finally {
        setRecognizing(false);
      }
  }

  async function endSession() {
    if (!session) return;
    setError("");
    setSaving(true);
    try {
      await apiRequest<Session>(`/sessions/${session.id}/end`, { method: "PATCH" });
      setSession(null);
      setNotice("Session ended and saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to end the session.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCalibration() {
    const values = {
      armLengthRatio: Number(calibrationValues.armLengthRatio),
      handScaleFactor: Number(calibrationValues.handScaleFactor),
      signingSpeedFps: Number(calibrationValues.signingSpeedFps),
    };
    if (Object.values(values).some((value) => !Number.isFinite(value))) {
      setError("Enter valid numbers for all calibration values.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      const saved = await apiRequest<Calibration>("/calibration", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setCalibration(saved);
      setShowCalibration(false);
      setNotice("Calibration values saved to your account.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save calibration.");
    } finally {
      setSaving(false);
    }
  }

  function exportRecords() {
    const quote = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = [
      ["ID", "Sentence", "Gloss", "Confidence", "Context", "Time"].map(quote).join(","),
      ...records.map((record) => [
        record.id,
        record.sentence,
        record.gloss,
        `${(record.confidence * 100).toFixed(0)}%`,
        record.ctx,
        record.time,
      ].map(quote).join(",")),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "signsync_session_records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const selectedPreset = presets.find((preset) => preset.id === selectedPresetId);

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <div className="wrap" style={{ maxWidth: 1180, paddingTop: 28, paddingBottom: 64 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--t1)" }}>ASL fingerspelling</h1>
            <p className="body" style={{ marginTop: 5 }}>
              A single camera frame is sent for recognition only when you press the capture button; the application does not save camera frames.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-outline">Session dashboard</Link>
        </header>

        {error && (
          <div role="alert" className="card" style={{ padding: 16, marginBottom: 14 }}>
            <p style={{ color: "var(--rose)" }}>{error}</p>
            {error.includes("Authentication") && <Link className="footer-link" href="/login">Sign in to continue</Link>}
          </div>
        )}
        {notice && <p role="status" className="card" style={{ padding: 16, color: "var(--t2)", marginBottom: 14 }}>{notice}</p>}
        {!loading && (
          <div role="status" className="card" style={{ padding: 16, borderColor: "rgba(201,122,10,0.35)", marginBottom: 14 }}>
            <strong style={{ color: modelStatus === "ready" ? "var(--teal)" : "var(--amber)" }}>
              {modelStatus === "checking" ? "Checking recognition service…" : modelStatus === "ready" ? "Static-letter model available" : "Recognition service unavailable"}
            </strong>
            <p className="body" style={{ marginTop: 5 }}>
              Supports one held static ASL fingerspelled handshape at a time: A–I, K–Y, plus the dataset&apos;s SPACE and NOTHING classes. J and Z require motion and are not supported. This does not recognize words, phrases, or continuous signing, and is not a sign-language interpreter.
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(280px,0.8fr)", gap: 16, alignItems: "start" }}>
          <section className="card" style={{ overflow: "hidden", padding: 0 }}>
            <div style={{ position: "relative", background: "#050608", aspectRatio: "16 / 9" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ display: cameraStream ? "block" : "none", width: "100%", height: "100%", objectFit: "cover" }} />
              {!cameraStream && <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--t4)" }}>Camera preview is off</p>}
              {cameraStream && <span className="badge bt" style={{ position: "absolute", top: 12, left: 12 }}>Local camera preview</span>}
              {cameraStream && (
                <div aria-hidden="true" style={{
                  position: "absolute", width: "min(55%, 42vh)", aspectRatio: "1",
                  left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                  border: "2px dashed rgba(255,255,255,0.75)", borderRadius: 12,
                  pointerEvents: "none",
                }} />
              )}
            </div>
            <div style={{ display: "flex", gap: 10, padding: 14, flexWrap: "wrap" }}>
              <button type="button" className="btn btn-outline" disabled={saving || recognizing} onClick={toggleCamera}>
                {cameraStream ? "Turn camera off" : "Enable camera"}
              </button>
              <button
                type="button"
                className="btn btn-v"
                disabled={saving || (!session && (!cameraStream || !selectedPresetId)) || loading}
                onClick={() => { void (session ? endSession() : startSession()); }}
              >
                {saving ? "Saving…" : session ? "End session" : "Start session"}
              </button>
              {session && (
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={recognizing || saving || modelStatus !== "ready"}
                  onClick={() => { void recognizeFrame(); }}
                >
                  {recognizing ? "Recognizing…" : "Capture and recognize one handshape"}
                </button>
              )}
            </div>
            {session && <p className="body" style={{ padding: "0 14px 14px" }}>
              Center one still handshape in the guide. The recognizer processes a single frame, not movement or a phrase.
            </p>}
          </section>

          {recognition && (
            <section className="card" role="status" style={{ padding: 18 }}>
              <h2 style={{ color: "var(--t1)", fontSize: 15, fontWeight: 700 }}>Latest model result</h2>
              {recognition.status === "recognized" && recognition.prediction
                ? <p style={{ color: "var(--teal)", fontSize: 30, fontWeight: 800, marginTop: 8 }}>{recognition.prediction}</p>
                : recognition.status === "no_sign"
                  ? <p className="body" style={{ marginTop: 8 }}>
                    {recognition.handDetected ? "No supported sign detected." : "No hand detected in the captured frame."}
                  </p>
                  : <p style={{ color: "var(--amber)", fontWeight: 700, marginTop: 8 }}>
                    {recognition.handDetected
                      ? "Uncertain — no label accepted"
                      : "Uncertain — hand not detected reliably; no label accepted"}
                  </p>}
              {recognition.status !== "no_sign"
                ? <p className="body" style={{ marginTop: 6 }}>
                  Candidate {recognition.candidate} · Confidence {(recognition.confidence * 100).toFixed(0)}%
                  {" "}· acceptance threshold {(recognition.minimumConfidence * 100).toFixed(0)}%
                  {" "}· {recognition.latencyMs.toFixed(0)} ms
                </p>
                : <p className="body" style={{ marginTop: 6 }}>
                  {recognition.handDetected && `Confidence ${(recognition.confidence * 100).toFixed(0)}% · `}
                  {recognition.latencyMs.toFixed(0)} ms
                </p>}
              <p className="body" style={{ fontSize: 11, marginTop: 6 }}>
                Model {recognition.modelVersion} · hand detector {recognition.handDetectorVersion}
              </p>
            </section>
          )}

          <div style={{ display: "grid", gap: 14 }}>
            <section className="card" style={{ padding: 18 }}>
              <label htmlFor="context-preset" style={{ display: "block", fontSize: 12, color: "var(--t4)", marginBottom: 8 }}>Context mode</label>
              <select
                id="context-preset"
                value={selectedPresetId}
                onChange={(event) => setSelectedPresetId(event.target.value)}
                disabled={!!session || presets.length === 0}
                style={{ width: "100%", padding: 10, background: "var(--bg-2)", border: "1px solid var(--b)", borderRadius: "var(--r)", color: "var(--t1)" }}
              >
                {presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
              </select>
              {selectedPreset && <p className="body" style={{ marginTop: 8 }}>{selectedPreset.vocabularyDomainDescription}</p>}
              {!loading && presets.length === 0 && <p role="alert" style={{ color: "var(--amber)", marginTop: 8, fontSize: 13 }}>No context modes are configured. Run the backend seed command.</p>}
            </section>

            <section className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <h2 style={{ color: "var(--t1)", fontSize: 15, fontWeight: 700 }}>Personal calibration</h2>
                  <p className="body" style={{ marginTop: 4 }}>{calibration ? `Saved ${new Date(calibration.calibratedAt).toLocaleDateString()}` : "No calibration profile saved."}</p>
                </div>
                <button type="button" className="btn btn-outline" onClick={() => setShowCalibration((open) => !open)}>
                  {showCalibration ? "Close" : calibration ? "Update" : "Set values"}
                </button>
              </div>
              {showCalibration && (
                <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                  {[
                    { key: "armLengthRatio" as const, label: "Arm length ratio (0.5–2)" },
                    { key: "handScaleFactor" as const, label: "Hand scale factor (0.5–2)" },
                    { key: "signingSpeedFps" as const, label: "Signing speed (5–60 fps)" },
                  ].map((field) => (
                    <label key={field.key} style={{ display: "grid", gap: 5, color: "var(--t4)", fontSize: 12 }}>
                      {field.label}
                      <input
                        type="number"
                        required
                        min={field.key === "signingSpeedFps" ? 5 : 0.5}
                        max={field.key === "signingSpeedFps" ? 60 : 2}
                        step="any"
                        value={calibrationValues[field.key]}
                        onChange={(event) => setCalibrationValues((values) => ({ ...values, [field.key]: event.target.value }))}
                        style={{ padding: 9, background: "var(--bg-2)", border: "1px solid var(--b)", borderRadius: "var(--r)", color: "var(--t1)" }}
                      />
                    </label>
                  ))}
                  <button type="button" className="btn btn-v" disabled={saving} onClick={() => { void saveCalibration(); }}>Save calibration</button>
                  <p className="body" style={{ fontSize: 11 }}>These values are stored as profile settings. They are not automatically measured by a recognition model.</p>
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="card" style={{ padding: 18, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <h2 style={{ color: "var(--t1)", fontSize: 15, fontWeight: 700 }}>Saved translation records</h2>
            <button type="button" className="btn btn-outline" disabled={records.length === 0} onClick={exportRecords}>Export CSV</button>
          </div>
          {loading ? <p className="body">Loading saved records…</p> : records.length === 0
            ? <p className="body">No accepted recognition results have been saved for your account yet.</p>
            : <div style={{ display: "grid", gap: 8 }}>
              {records.map((record) => (
                <article key={record.id} style={{ padding: 12, background: "var(--bg-2)", border: "1px solid var(--b)", borderRadius: "var(--r2)" }}>
                  <p style={{ color: "var(--t1)", fontWeight: 600 }}>{record.sentence}</p>
                  <p className="body" style={{ marginTop: 4 }}>{record.gloss}</p>
                  <p className="body" style={{ fontSize: 11, marginTop: 6 }}>
                    {record.ctx} · {(record.confidence * 100).toFixed(0)}% · {new Date(record.time).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>}
        </section>
      </div>
    </main>
  );
}
