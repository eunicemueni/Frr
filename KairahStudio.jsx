import React, { useState } from "react";
import axios from "axios";
import PricingUpgrade from "./PricingUpgrade";

const PLANS = [
  { key: "entry", label: "Entry", maxDuration: 6 },
  { key: "pro", label: "Pro", maxDuration: 60 },
  { key: "diamond", label: "Diamond", maxDuration: 180 },
  { key: "lifetime", label: "Lifetime", maxDuration: 180 },
];

export default function KairahStudio({ userId, email }) {
  const [plan, setPlan] = useState("entry");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(6);
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const currentPlan = PLANS.find((p) => p.key === plan);

  const generateVideo = async () => {
    if (!prompt) return;
    setLoading(true);
    setVideoUrl("");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/generate`, {
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
      setStatus("Error generating video");
      setLoading(false);
    }
  };

  const pollStatus = async (orderId) => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/status/${orderId}`);
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
        setStatus("Error fetching status");
        setLoading(false);
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <div className="p-6">
      {/* Pricing & Upgrade Section */}
      <PricingUpgrade currentPlan={plan} setPlan={setPlan} />

      {/* Video Generator Section */}
      <div className="max-w-3xl mx-auto p-6 bg-midnight-plum rounded shadow-lg">
        <h2 className="text-2xl font-bold text-gold mb-4">Generate Your Video</h2>

        {/* Prompt Input */}
        <textarea
          className="w-full p-3 mb-4 rounded border resize-none"
          rows={4}
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        {/* Duration Input */}
        <div className="flex items-center mb-4 gap-2">
          <label className="font-semibold text-soft-blush">Duration (seconds):</label>
          <input
            type="number"
            value={duration}
            min={1}
            max={currentPlan.maxDuration}
            onChange={(e) =>
              setDuration(Math.min(Number(e.target.value), currentPlan.maxDuration))
            }
            className="w-20 p-1 border rounded"
            disabled={loading}
          />
          {currentPlan.key === "entry" && (
            <span className="text-red-400 ml-2">(Watermarked)</span>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateVideo}
          disabled={loading || !prompt}
          className={`px-6 py-2 rounded font-semibold mb-4 ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-gold text-white hover:opacity-90"
          }`}
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>

        {/* Status */}
        {status && <p className="mb-2 font-semibold text-soft-blush">Status: {status}</p>}

        {/* Video Display */}
        {videoUrl && (
          <video className="w-full rounded shadow-lg mt-4" controls>
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
