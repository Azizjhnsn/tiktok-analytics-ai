import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { Collapsible } from '@/components/Collapsible';
import { TextField } from '@/components/TextField';
import { FORMAT_SUGGESTIONS, HOOK_TYPE_SUGGESTIONS } from '@/config/constants';
import { useAction } from '@/hooks/useAction';
import { autoTagMissing, autoTagVideos, pickReviewVideos } from '@/services/autoTag';
import { OPENAI_CONFIG } from '@/services/openai';
import type { Enrichment, VideoTags } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { formatPercent } from '@/utils/stats';
import { truncate } from '@/utils/text';
import { formatDateTime } from '@/utils/time';

interface VideoTagTableProps {
  videos: VideoSummary[];
  enrichment: Enrichment;
  onTag: (videoId: string, tags: VideoTags) => void;
  /** Reload after auto tags were saved. */
  onAutoTagged: () => unknown;
}

/**
 * Tags are filled in automatically by AI from each video's cover and caption.
 * The user only checks a few key videos; correcting any other video is optional.
 */
export function VideoTagTable({ videos, enrichment, onTag, onAutoTagged }: VideoTagTableProps) {
  const { busy, error, run } = useAction(onAutoTagged);
  const [progress, setProgress] = useState<string | null>(null);
  const started = useRef(false);

  const publicVideos = videos.filter((v) => !v.isPrivate);
  const tagged = publicVideos.filter((v) => enrichment.autoTags[v.id]).length;
  const review = pickReviewVideos(videos);
  const reviewIds = new Set(review.map((v) => v.id));
  const others = videos.filter((v) => !reviewIds.has(v.id));
  const onProgress = (done: number, total: number) => setProgress(`Auto-tagging ${done}/${total}…`);

  // Tag new videos automatically when the dashboard opens.
  useEffect(() => {
    if (started.current || !OPENAI_CONFIG.apiKey || tagged === publicVideos.length) return;
    started.current = true;
    void run(() => autoTagMissing(onProgress).finally(() => setProgress(null)));
  });

  const retagAll = () => run(() => autoTagVideos(publicVideos, onProgress).finally(() => setProgress(null)));

  return (
    <Collapsible
      title="Video tags"
      hint={`${progress ?? `AI tagged ${tagged}/${publicVideos.length} public videos`} · check ${review.length} key videos (optional).`}
    >
      <div className="stack">
        <div className="muted">
          Format, hook type and on-screen hook text are filled in by AI from each video's cover image and caption. Check the key
          videos below (your best and worst); type only where the AI is wrong. Grey text is the AI's tag.
        </div>
        <div className="row">
          <Button disabled={busy || !OPENAI_CONFIG.apiKey} onClick={() => void retagAll()}>
            Re-tag all with AI
          </Button>
        </div>
        {!OPENAI_CONFIG.apiKey && <div className="error">Set WXT_OPENAI_API_KEY in .env.local to enable auto-tagging.</div>}
        {error && <div className="error">{error}</div>}

        <TagRows videos={review} enrichment={enrichment} onTag={onTag} />

        <Collapsible title="Other videos" hint={`Optional: correct tags for any of the other ${others.length} videos.`}>
          <TagRows videos={others} enrichment={enrichment} onTag={onTag} />
        </Collapsible>
      </div>
    </Collapsible>
  );
}

interface TagRowsProps {
  videos: VideoSummary[];
  enrichment: Enrichment;
  onTag: (videoId: string, tags: VideoTags) => void;
}

function TagRows({ videos, enrichment, onTag }: TagRowsProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Video</th>
            <th>Views</th>
            <th>3s hold</th>
            <th>Format</th>
            <th>Hook type</th>
            <th>Hook text</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => {
            const user = enrichment.videoTags[video.id] ?? {};
            const auto = enrichment.autoTags[video.id];
            return (
              <tr key={video.id} className={video.isPrivate ? 'dimmed' : undefined}>
                <td>
                  <div>{truncate(video.caption, 60) || video.id}</div>
                  <div className="muted">
                    {formatDateTime(video.createdAt)}
                    {video.isPrivate && ' · private'}
                    {video.isPhoto && ' · photo'}
                    {auto && !auto.fromImage && ' · tagged from caption only'}
                  </div>
                </td>
                <td>{video.views ?? '—'}</td>
                <td>{formatPercent(video.retention3s)}</td>
                <td>
                  <TextField
                    value={user.format ?? ''}
                    placeholder={auto?.format}
                    suggestions={FORMAT_SUGGESTIONS}
                    onCommit={(format) => onTag(video.id, { format })}
                  />
                </td>
                <td>
                  <TextField
                    value={user.hookType ?? ''}
                    placeholder={auto?.hookType}
                    suggestions={HOOK_TYPE_SUGGESTIONS}
                    onCommit={(hookType) => onTag(video.id, { hookType })}
                  />
                </td>
                <td>
                  <TextField
                    value={user.hookText ?? ''}
                    placeholder={auto?.hookText}
                    onCommit={(hookText) => onTag(video.id, { hookText })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
