"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const handleUrlUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/stage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        console.log("Stream started");
      } else {
        console.error("Failed to start stream");
      }
    } catch (err) {
      console.error("Failed to start stream: ", err);
    }
  };

  return (
    <div className="p-12">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="RTMP URL"
          name="url"
          value={url}
          onChange={handleUrlUpdate}
        />
        <button type="submit">Start Stream</button>
      </form>
    </div>
  );
}
