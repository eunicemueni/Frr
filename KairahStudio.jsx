import React, { useState } from "react";
import axios from "axios";

// ---- CONFIG ----
const BACKEND_URL = "https://your-backend-render-url.onrender.com"; // <-- Replace with your Render URL

const PLANS = [
  { key: "entry", label: "Entry", maxDuration: 6, watermark: true },
  { key: "pro", label: "Pro", maxDuration: 60, watermark: false },
  { key: "diamond", label: "Diamond", maxDuration: 180, watermark: false },
  { key: "lifetime", label: "Lifetime", maxDuration: 180, watermark: false },
];

export default function KairahStudio({ userId = "testUser", email = "test@example.com" }) {
  const [plan, setPlan] = useState("entry");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(6);
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPlan = PLANS.find((p) => p.key === plan);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl("");
    try {
      const res = await axios.post(`${BACKEND_URL}/generate`, {
        userId,
        email,
        plan,
        prompt,
        duration,
      });
      setOrderId(res.data.orderId);
      setStatus(res.data.status);
      pollStatus(res.data.orderId);
    } catch (err) {
      console.error(err);
      setStatus("Error connecting to backend");
      setLoading(false);
    }
  };

  const pollStatus = (orderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/status/${orderId}`);
        setStatus(res.data.status);

        if (res.data.status === "completed") {
          setVideoUrl(res.data.resultUrl);
          setLoading(false);
          clearInterval(interval);
        }

        if (res.data.status === "failed") {
          setStatus("Failed to generate video");
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
        setStatus("Backend error");
        setLoading(false);
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <div className="p-6 font-sans bg-midnight-plum min-h-screen">
      {/* --- Plan Selection --- */}
      <div className="mb-6 flex gap-4">
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setPlan(p.key);
              setDuration(p.maxDuration);
            }}
            className={`px-4 py-2 rounded font-bold ${
              plan === p.key ? "bg-gold text-white" : "bg-gray-700 text-soft-blush"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* --- Video Generator --- */}
      <div className="bg-gray-900 p-6 rounded shadow-lg max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gold mb-4">Generate Your Video</h2>

        <textarea
          className="w-full p-3 mb-4 rounded border resize-none bg-gray-800 text-white"
          rows={4}
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex items-center gap-2 mb-4">
          <label className="font-semibold text-soft-blush">Duration (seconds):</label>
          <input
            type="number"
            value={duration}
            min={1}
            max={currentPlan.maxDuration}
            onChange={(e) =>
              setDuration(Math.min(Number(e.target.value), currentPlan.maxDuration))
            }
            className="w-20 p-1 border rounded text-black"
            disabled={loading}
          />
          {currentPlan.watermark && <span className="text-red-400 ml-2">(Watermarked)</span>}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt}
          className={`px-6 py-2 rounded font-semibold mb-4 ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-gold text-white hover:opacity-90"
          }`}
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>

        {status && <p className="mb-2 font-semibold text-soft-blush">Status: {status}</p>}

        {videoUrl && (
          <video className="w-full rounded shadow-lg mt-4" controls>
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
