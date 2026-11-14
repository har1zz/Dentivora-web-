"use client";
import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    MyChatBot?: { mount: (selector: string, opts: Record<string, unknown>) => void };
  }
}

const SCRIPT = "https://storage.googleapis.com/mychatbot-widget-assets/v1/widget.js";
const STYLE = "https://storage.googleapis.com/mychatbot-widget-assets/v1/style.css";

/** Smile Assistant: the MyChatBot widget, themed to the clinic, loaded after the page is interactive. */
export function SmileAssistant() {
  const path = usePathname();
  const [ready, setReady] = useState(false);
  const accountId = process.env.NEXT_PUBLIC_MYCHATBOT_ACCOUNT_ID;
  const widgetId = process.env.NEXT_PUBLIC_MYCHATBOT_WIDGET_ID;
  const hidden = path.startsWith("/admin");

  useEffect(() => {
    if (!ready || hidden || !accountId || !widgetId || !window.MyChatBot) return;
    const el = document.getElementById("my-chat-widget-container");
    if (!el || el.childElementCount > 0) return;
    window.MyChatBot.mount("#my-chat-widget-container", {
      account_id: accountId,
      widget_id: widgetId,
      api_url: "https://api.mychatbot.app",
      assistant_name: "Smile Assistant",
      color: "#1d5a5c",
      lang: "en",
      ad_widget_title: "",
      ad_widget_description: "",
      ad_popup_messages: [],
    });
  }, [ready, hidden, accountId, widgetId]);

  if (hidden || !accountId || !widgetId) return null;
  return (
    <>
      <link rel="stylesheet" href={STYLE} />
      <Script src={SCRIPT} strategy="lazyOnload" onLoad={() => setReady(true)} onReady={() => setReady(true)} />
      <div id="my-chat-widget-container" />
    </>
  );
}
