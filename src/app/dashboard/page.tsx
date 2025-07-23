'use client'

import { useEffect, useState } from "react";
import NavigationBar from "@/components/navigation-bar/navigation-bar";

export default function Home() {
  const [input, setInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [streamResponse, setStreamResponse] = useState("");
  // Example: replace with your actual SSE implementation

  useEffect(() => {
  if (!chatResponse) return;

  const eventSource = new EventSource('http://localhost:8081/v1/tools/observations/stream');
  let fullStream = `${chatResponse}\n`;

  const handleMessage = (event: MessageEvent) => {
      console.log('Before SSE message:', event);
    const data = JSON.parse(event.data);
   console.log('After SSE message:', data);
    if (data.done) {
      eventSource.close();
      return;
    }

    fullStream += `\n${data.description}`;
    setStreamResponse(fullStream);
  };

  const handleError = (err) => {
      console.log("Stream err is ", err);
    eventSource.close();
    setStreamResponse((prev) => prev + '\n[Stream error]');
  };

  eventSource.onmessage = handleMessage;
  eventSource.onerror = handleError;

  // Cleanup on unmount or re-trigger
  return () => {
    eventSource.close();
  };
}, [chatResponse]);


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setChatResponse('');
  setStreamResponse('');


  try {
    // 1. Call /api/chat?prompt=...
    const chatRes = await fetch(`http://localhost:8081/v1/same-to-same/chat?userPrompt=${encodeURIComponent(input)}`);
    console.log('Before Chat response:', chatRes);
    const data = await chatRes.json();
    console.log('After Chat response:', data);
    setChatResponse(data.text || 'No response from /chat');

    // 2. Start SSE from /api/observation/stream
    
  } catch (error) {
    console.error('Error:', error);
    setChatResponse('[Error calling API]');
  }
};

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-8 sm:p-20">
      {/* Top Navigation Bar */}
      <NavigationBar/>

      {/* Main Chat Area */}
      <main className="row-start-2 w-full max-w-2xl mx-auto flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="w-full h-32 p-4 rounded-md border border-gray-300 dark:border-gray-700 resize-none text-sm"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="self-end bg-foreground text-background px-6 py-2 rounded-full font-medium text-sm hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Send
          </button>
        </form>

        <div className="p-4 border rounded-md text-sm bg-gray-50 dark:bg-gray-800 whitespace-pre-wrap">
          {streamResponse || "Your response will appear here..."}
        </div>
      </main>

    </div>
  );
}