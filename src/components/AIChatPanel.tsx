import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  Paperclip,
  Send,
  Copy,
  FileText,
  Square,
  Plus,
  Maximize2,
  Minimize2,
  Code2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotesStore } from "../store/useNotesStore";
import AISavePreview, { type AISavePreviewData } from "./AISavePreview";
import { getOpenRouterApiKey, getOpenRouterModel } from "../lib/ai-settings";
import { buildNoteContext, streamChatCompletion } from "../lib/openrouter";
import {
  appendAiContentToNote,
  markdownToChatHtml,
  prepareAiNoteFromOutput,
} from "../lib/ai-output";
import { notify } from "../lib/toast";
import AITypingIndicator from "./AITypingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help summarize notes, draft outlines, and brainstorm ideas. Ask me anything about your notes.",
};

function makeWelcome(): Message {
  return { ...WELCOME, id: `welcome-${Date.now()}` };
}

type NotePreviewState = AISavePreviewData;

export default function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const {
    notes,
    selectedNoteId,
    createNote,
    updateNote,
    openNote,
    isAIPanelExpanded,
    toggleAIPanelExpanded,
  } = useNotesStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([makeWelcome()]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [notePreview, setNotePreview] = useState<NotePreviewState | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingStreamRef = useRef<{ id: string; content: string } | null>(null);

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  const scrollChatToBottom = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const viewport = chatScrollRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      );
      if (!(viewport instanceof HTMLElement)) return;
      viewport.scrollTo({ top: viewport.scrollHeight, behavior });
    },
    [],
  );

  const cancelStreamRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingStreamRef.current = null;
  }, []);

  useEffect(() => {
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(
      () => scrollChatToBottom(isLoading ? "auto" : "smooth"),
      isLoading ? 120 : 0,
    );
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [messages, isLoading, scrollChatToBottom]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      cancelStreamRaf();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [cancelStreamRaf]);

  useEffect(() => {
    streamingIdRef.current = streamingId;
  }, [streamingId]);

  const stopGeneration = useCallback(() => {
    cancelStreamRaf();
    abortRef.current?.abort();
    setIsLoading(false);
    setStreamingId(null);
    streamingIdRef.current = null;
  }, [cancelStreamRaf]);

  const resetChat = useCallback(
    (notifyUser?: boolean) => {
      stopGeneration();
      setInput("");
      setMessages([makeWelcome()]);
      if (notifyUser) notify.success("New chat started");
    },
    [stopGeneration],
  );

  const handleStop = () => {
    const currentStreamId = streamingIdRef.current;
    generationRef.current += 1;
    cancelStreamRaf();
    abortRef.current?.abort();
    setIsLoading(false);
    setStreamingId(null);
    streamingIdRef.current = null;

    if (currentStreamId) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === currentStreamId && !msg.content.trim()
            ? { ...msg, content: "Stopped." }
            : msg,
        ),
      );
    }
  };

  const handleClear = () => resetChat(false);

  const handleNewChat = () => resetChat(true);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const apiKey = getOpenRouterApiKey();
    if (!apiKey) {
      notify.error("Add your OpenRouter API key in Settings → AI");
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now()}`;
    const noteContext = activeNote
      ? buildNoteContext(activeNote.title, activeNote.content)
      : null;

    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);
    setStreamingId(assistantId);
    streamingIdRef.current = assistantId;

    const controller = new AbortController();
    abortRef.current = controller;
    const generation = ++generationRef.current;
    cancelStreamRaf();

    const systemParts = [
      "You are a helpful writing assistant inside NotesZen, a note-taking app.",
      'Answer the user directly. Start with the substance — never open with meta commentary about the app, copy/paste, or "here is a breakdown you can paste".',
      "Write polished, note-ready markdown with clear headings and compact paragraphs.",
      "Do not use markdown tables. Use comparison lists with bold labels instead, because the editor is optimized for headings, paragraphs, lists, quotes, and code blocks.",
      "Never output malformed table fragments like \"Feature: ...\" bullets, raw separator rows, or decorative dashes.",
      "Prefer this structure for explanations: short intro, ## Key Points, ## Comparison or Details, ## Takeaway.",
      "Be concise, practical, and friendly. Use markdown headings, lists, bold, and code spans when helpful.",
      "Do not mention that you are formatting for notes unless the user explicitly asks.",
    ];
    if (noteContext) {
      systemParts.push(`The user has this note open:\n\n${noteContext}`);
    }

    const history = messages
      .filter((m) => !m.id.startsWith("welcome"))
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    try {
      await streamChatCompletion({
        apiKey,
        model: getOpenRouterModel(),
        messages: [
          { role: "system", content: systemParts.join("\n\n") },
          ...history,
          { role: "user", content: text },
        ],
        signal: controller.signal,
        onDelta: (content) => {
          if (generation !== generationRef.current) return;
          if (controller.signal.aborted) return;
          pendingStreamRef.current = { id: assistantId, content };
          if (rafRef.current != null) return;
          rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            const pending = pendingStreamRef.current;
            if (!pending || generation !== generationRef.current) return;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === pending.id
                  ? { ...msg, content: pending.content }
                  : msg,
              ),
            );
          });
        },
      });
    } catch (err) {
      if (generation !== generationRef.current) return;
      if ((err as Error).name === "AbortError") {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId && !msg.content.trim()
              ? { ...msg, content: "Stopped." }
              : msg,
          ),
        );
        return;
      }
      const errMsg = (err as Error).message || "AI request failed";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: `Sorry, something went wrong: ${errMsg}` }
            : msg,
        ),
      );
    } finally {
      const pending = pendingStreamRef.current;
      if (pending && generation === generationRef.current) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === pending.id ? { ...msg, content: pending.content } : msg,
          ),
        );
      }
      cancelStreamRaf();
      if (generation === generationRef.current) {
        setIsLoading(false);
        setStreamingId(null);
        streamingIdRef.current = null;
        abortRef.current = null;
      }
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    notify.success("Copied to clipboard");
  };

  const openNotePreview = (content: string) => {
    const prepared = prepareAiNoteFromOutput(content);
    setNotePreview({
      title: prepared.title,
      contentHtml: prepared.contentHtml,
      previewHtml: prepared.previewHtml,
      tags: prepared.tags,
    });
  };

  const handleCreateNoteFromPreview = () => {
    if (!notePreview) return;
    const title = notePreview.title.trim() || "AI Draft";
    setNotePreview(null);
    createNote({
      title,
      content: notePreview.contentHtml,
      status: "draft",
      icon: "✨",
      tags: notePreview.tags,
      editorMode: "wysiwyg",
    });
    notify.success("Note created");
  };

  const handleAppendToOpenNote = () => {
    if (!notePreview) return;
    const { notes: storeNotes, selectedNoteId: openId } =
      useNotesStore.getState();
    const target = storeNotes.find((n) => n.id === openId);
    if (!target) {
      notify.error("No open note to append to");
      return;
    }
    const merged = appendAiContentToNote(
      target.content,
      notePreview.contentHtml,
    );
    const tags = [...new Set([...(target.tags || []), ...notePreview.tags])];
    setNotePreview(null);
    updateNote(target.id, { content: merged, tags });
    openNote(target.id);
    notify.success("Added to your note");
  };

  return (
    <div className="flex h-full min-h-0 flex-col min-w-0">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
          <Code2Icon className="size-3.5 text-primary shrink-0" />
          <span className="truncate">Chat</span>
          {/*<span className="text-[10px] font-normal text-muted-foreground truncate hidden sm:inline">
            · {activeModel}
          </span>*/}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleNewChat}
            title="New chat"
          >
            <Plus className="size-3.5" />
          </Button>
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-[10px] text-destructive gap-1 h-7"
              onClick={handleStop}
            >
              <Square className="size-3 fill-current" />
              Stop
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              className="text-[10px] text-muted-foreground h-7"
              onClick={handleClear}
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleAIPanelExpanded}
            title={isAIPanelExpanded ? "Shrink panel" : "Expand panel"}
          >
            {isAIPanelExpanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon-xs" onClick={onClose}>
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div ref={chatScrollRef} className="min-h-0 flex-1">
        <ScrollArea className="h-full px-4 py-4">
          <div className="flex flex-col gap-3 min-w-0">
            {messages.map((msg) => {
              const isActiveStream = isLoading && msg.id === streamingId;
              const isWaitingForTokens = isActiveStream && !msg.content.trim();
              const isWelcome = msg.id.startsWith("welcome");
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-xs leading-relaxed max-w-full min-w-0",
                    msg.role === "user"
                      ? "ml-auto max-w-[92%] bg-primary text-primary-foreground"
                      : "bg-muted text-foreground border border-border",
                  )}
                >
                  {isWaitingForTokens ? (
                    <AITypingIndicator />
                  ) : msg.role === "assistant" &&
                    !isWelcome &&
                    isActiveStream ? (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  ) : msg.role === "assistant" && !isWelcome ? (
                    <div
                      className="prose-editor ai-chat-prose break-words [&_pre]:my-2 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:bg-black/20 [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_h2]:text-sm [&_h3]:text-xs [&_p]:my-1"
                      dangerouslySetInnerHTML={{
                        __html: markdownToChatHtml(msg.content),
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}
                  {msg.role === "assistant" &&
                    !isWelcome &&
                    msg.content.trim() &&
                    !isActiveStream && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-7 text-[10px]"
                          onClick={() => openNotePreview(msg.content)}
                        >
                          <FileText className="size-3" />
                          Save to note
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-[10px]"
                          onClick={() => copyMessage(msg.content)}
                        >
                          <Copy className="size-3" />
                          Copy
                        </Button>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {activeNote && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground border border-border">
            <Paperclip className="size-3" />
            {activeNote.title || "Untitled"}.md
          </span>
        </div>
      )}

      <AISavePreview
        open={Boolean(notePreview)}
        preview={notePreview}
        openNoteTitle={activeNote?.title || undefined}
        onTitleChange={(title) =>
          setNotePreview((prev) => (prev ? { ...prev, title } : prev))
        }
        onClose={() => setNotePreview(null)}
        onCreate={handleCreateNoteFromPreview}
        onAppend={handleAppendToOpenNote}
      />

      <div className="shrink-0 border-t border-border p-4">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (isLoading) handleStop();
                else handleSend();
              }
            }}
            placeholder={
              isLoading
                ? "Press Stop or Enter to cancel..."
                : "Ask AI about your notes..."
            }
            className={cn(
              "min-h-[72px] pr-12 resize-none rounded-xl text-xs bg-muted border-border",
              isLoading && "opacity-80",
            )}
          />
          <Button
            type="button"
            size="icon-xs"
            className="absolute bottom-2 right-2"
            onClick={isLoading ? handleStop : handleSend}
            disabled={!isLoading && !input.trim()}
            variant={isLoading ? "destructive" : "default"}
          >
            {isLoading ? (
              <Square className="size-3 fill-current" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
