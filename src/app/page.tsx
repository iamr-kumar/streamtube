"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");

  const router = useRouter();
  const handleUrlUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) return;
    router.push(`/studio?rtmpUrl=${url}`);
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
