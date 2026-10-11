import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Markdown } from '@/components/Markdown';
import { Panel } from '@/components/Panel';
import { TextArea } from '@/components/TextArea';
import { useAction } from '@/hooks/useAction';
import { clearChat, getChat, sendChatMessage } from '@/services/chat';
import type { ChatTurn } from '@/types/chat';

interface ChatPanelProps {
  /** Changes when a new diagnosis runs, which starts a new conversation. */
  diagnosisId: string;
}

/** Ask the AI follow-up questions about the diagnosis. */
export function ChatPanel({ diagnosisId }: ChatPanelProps) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const { busy, error, run } = useAction();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void getChat().then(setTurns);
  }, [diagnosisId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [turns, pending]);

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    setPending(text);
    void run(async () => {
      try {
        setTurns(await sendChatMessage(text));
      } catch (err) {
        setDraft(text);
        throw err;
      } finally {
        setPending(null);
      }
    });
  };

  return (
    <Panel title="Ask about your diagnosis">
      <div className="stack">
        {turns.length === 0 && !pending && (
          <div className="muted">
            Ask anything to clarify the diagnosis, e.g. "Why is my 3-second hold the main problem?" or "Which of my videos had
            the best hook and why?"
          </div>
        )}
        <div className="chat">
          {turns.map((turn, i) => (
            <div key={i} className={`chat-turn chat-${turn.role}`}>
              {turn.role === 'assistant' ? <Markdown text={turn.content} /> : turn.content}
            </div>
          ))}
          {pending && (
            <>
              <div className="chat-turn chat-user">{pending}</div>
              <div className="chat-turn chat-assistant muted">Thinking…</div>
            </>
          )}
          <div ref={endRef} />
        </div>
        <TextArea
          value={draft}
          onChange={setDraft}
          onSubmit={send}
          placeholder="Type a question… (Enter to send, Shift+Enter for a new line)"
          disabled={busy}
        />
        <div className="row">
          <Button variant="primary" disabled={busy || !draft.trim()} onClick={send}>
            Send
          </Button>
          <Button disabled={busy || turns.length === 0} onClick={() => void run(async () => setTurns(await clearChat()))}>
            Clear chat
          </Button>
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </Panel>
  );
}
