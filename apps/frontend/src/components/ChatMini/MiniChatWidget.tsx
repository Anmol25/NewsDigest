import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ChatMessages from "../ChatComponents/ChatMessages";
import { useNavigate } from "react-router-dom";
import ChatHistory from "../ChatComponents/ChatHistory";

/**
 * MiniChatWidget
 * - Renders a floating chat launcher and mini chat panel using a React Portal.
 */
const MiniChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState<boolean>(false);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [pendingAnalyze, setPendingAnalyze] = useState<{
    articleId: number;
    articleMeta?: any;
  } | null>(null);

  // local session list holder for ChatMessages' setSessionList prop
  const [sessionList, setSessionList] = useState<
    Array<{ sessionId: string; sessionName: string | null }>
  >([]);

  // RFC4122 v4-ish generator with crypto.randomUUID fallback
  const generateUUID = useCallback(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return (crypto as any).randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }, []);

  // Initialize portal root
  useEffect(() => {
    const el = document.getElementById("portal-root");
    setPortalEl(el);
  }, []);

  

  // Initialize a fresh session id WHEN the widget opens for the first time
  useEffect(() => {
    if (!isOpen) return;
    if (sessionId) return; // already initialized
    const id = generateUUID();
    setSessionId(id);
    setNewSession(true);
  }, [generateUUID, isOpen, sessionId]);

  const toggle = useCallback(() => setIsOpen((s) => !s), []);

  const startNewChat = useCallback(() => {
    // Start new chat only if current is not a fresh newSession
    if (newSession) return; // already a fresh chat
    const id = generateUUID();
    setSessionId(id);
    setNewSession(true);
    setView("chat");
  }, [generateUUID, newSession]);

  // Listen for global event to open mini chat and trigger analyze-once
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const detail = ce.detail || {};
      if (detail.action === "analyze" && detail.payload) {
        setIsOpen(true);
        // Always ensure a fresh session for analyze
        if (!newSession) {
          startNewChat();
        }
        setView("chat");
        setPendingAnalyze(detail.payload);
      }
    };
    window.addEventListener("newsdigest:open-mini-chat", handler as EventListener);
    return () => window.removeEventListener("newsdigest:open-mini-chat", handler as EventListener);
  }, [newSession, startNewChat]);

  // If portal root missing, render nothing to avoid layout side-effects
  if (!portalEl) return null;

  return createPortal(
    <div className="mini-chat fixed z-50 bottom-5 right-5">
      {/* Launcher button */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Open assistant chat"
          className="rounded-full shadow-lg bg-brandColor text-white p-4 hover:scale-110 transition-transform duration-150 focus:outline-none cursor-pointer"
        >
          <i className="ri-chat-ai-fill text-3xl"></i>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="w-[450px] h-[550px] max-w-[92vw] max-h-[82vh] rounded-2xl shadow-xl border border-[#E5E5E5] bg-white overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#ECECEC] bg-[#FAFAFA]">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-brandColor text-white"><i className="ri-robot-line text-sm" /></span>
              <span className="text-sm font-semibold text-textPrimary">{view === "history" ? "History" : "Assistant"}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Open in full page */}
              <button
                type="button"
                className="px-2 py-1 text-textSecondary hover:bg-[#F2F2F2] rounded-md transform scale-x-[-1] cursor-pointer transition-colors"
                onClick={() => {
                  if (newSession || !sessionId) navigate(`/chat`);
                  else navigate(`/chat/${sessionId}`);
                }}
                aria-label="Open full chat"
                title="Open full chat"
              >
                <i className="ri-external-link-line" />
              </button>
              {/* New chat */}
              <button
                type="button"
                className={`px-2 py-1 text-textSecondary rounded-md transition-colors ${newSession ? "opacity-50 cursor-not-allowed" : "hover:bg-[#F2F2F2] cursor-pointer"}`}
                onClick={startNewChat}
                aria-label="New chat"
                title="New chat"
                disabled={newSession}
              >
                <i className="ri-add-line" />
              </button>
              {/* History toggle */}
              <button
                type="button"
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  view === "history"
                    ? "bg-[#E4E4E4] text-textPrimary"
                    : "text-textSecondary hover:bg-[#F2F2F2]"
                }`}
                onClick={() => setView((v) => (v === "history" ? "chat" : "history"))}
                aria-label="Toggle history"
                aria-pressed={view === "history"}
                title={view === "history" ? "Close history" : "Open history"}
              >
                <i className="ri-time-line" />
              </button>
              {/* Open in full page */}
              <button
                type="button"
                className="px-2 py-1 text-textSecondary hover:bg-[#F2F2F2] rounded-md cursor-pointer transition-colors"
                onClick={toggle}
                aria-label="Minimize"
                title="Minimize"
              >
                <i className="ri-subtract-line" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 bg-[#F0F0F0]">
            {view === "history" ? (
              <div className="h-full w-full bg-white">
                <ChatHistory
                  sessionList={sessionList}
                  setChatList={setSessionList}
                  miniMode
                  activeSessionId={sessionId ?? undefined}
                  onSelectSession={(sid: string) => {
                    setSessionId(sid);
                    setNewSession(false);
                    setView("chat");
                  }}
                />
              </div>
            ) : (
              sessionId && (
                <ChatMessages
                  key={sessionId}
                  sessionId={sessionId}
                  setSessionList={setSessionList}
                  newSession={newSession}
                  setNewSession={setNewSession}
                  isMini
                  initialAnalyze={pendingAnalyze}
                />
              )
            )}
          </div>
        </div>
      )}
    </div>,
    portalEl
  );
};

export default MiniChatWidget;
