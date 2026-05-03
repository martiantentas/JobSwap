import React, { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { JobSwapProfile, Conversation, Message } from "../types";
import { useAuth } from "./AuthContext";

export function MessagesView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, JobSwapProfile>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then(r => r.json())
      .then(async (convs: Conversation[]) => {
        setConversations(convs);
        const otherIds = convs
          .map(c => c.participantIds.find(id => id !== user?.id))
          .filter(Boolean) as string[];
        const map: Record<string, JobSwapProfile> = {};
        await Promise.all(
          otherIds.map(async id => {
            const p = await fetch(`/api/users/${id}`).then(r => r.json());
            if (!p.error) map[id] = p;
          })
        );
        setProfiles(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const getOtherId = (conv: Conversation) =>
    conv.participantIds.find(id => id !== user?.id) as string;

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null;

  const handleNewMessage = (convId: string, msg: Message) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, msg] } : c)
    );
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 w-full">
      {/* ── Conversation list ── */}
      <div className={`${showChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 lg:w-80 border-r border-gray-100 bg-white min-h-0 shrink-0`}>
        <div className="shrink-0 px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 gap-2">
              <MessageSquare className="w-10 h-10 text-gray-200" />
              <p className="text-gray-500 font-medium text-sm">No messages yet</p>
              <p className="text-xs text-gray-400">Swap some jobs to start chatting!</p>
            </div>
          ) : (
            conversations.map(conv => {
              const otherId = getOtherId(conv);
              const other = profiles[otherId];
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isSelected = selectedId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedId(conv.id); setShowChat(true); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  <img
                    src={other?.picture ?? ""}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{other?.name ?? "…"}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.text : <span className="italic">Say hello!</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      {selectedConv ? (
        <ChatPanel
          key={selectedId!}
          conversation={selectedConv}
          currentUserId={user!.id}
          otherUser={profiles[getOtherId(selectedConv)]}
          onBack={() => setShowChat(false)}
          onNewMessage={msg => handleNewMessage(selectedConv.id, msg)}
        />
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-gray-300">
          <MessageSquare className="w-14 h-14" />
          <p className="text-sm text-gray-400">Select a conversation</p>
        </div>
      )}
    </div>
  );
}

interface ChatPanelProps {
  conversation: Conversation;
  currentUserId: string;
  otherUser: JobSwapProfile | undefined;
  onBack: () => void;
  onNewMessage: (msg: Message) => void;
}

function ChatPanel({ conversation, currentUserId, otherUser, onBack, onNewMessage }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const msg: Message = await res.json();
      onNewMessage(msg);
      setText("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <button onClick={onBack} className="md:hidden p-1 text-gray-400 hover:text-gray-600 mr-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={otherUser?.picture ?? ""} alt="" className="w-9 h-9 rounded-full border border-gray-100 object-cover" />
        <div>
          <div className="font-semibold text-gray-900 text-sm leading-tight">{otherUser?.name ?? "…"}</div>
          <div className="text-xs text-gray-400 leading-tight mt-0.5">{otherUser?.role ?? ""}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {conversation.messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10">
            Say hello to {otherUser?.name ?? "your match"}! 👋
          </div>
        )}
        {conversation.messages.map(msg => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <img src={otherUser?.picture ?? ""} alt="" className="w-6 h-6 rounded-full shrink-0 object-cover" />
              )}
              <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full border border-gray-200 px-4 py-2.5">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
            placeholder={`Message ${otherUser?.name ?? ""}…`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="text-indigo-600 hover:text-indigo-700 disabled:opacity-30 transition-opacity shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
