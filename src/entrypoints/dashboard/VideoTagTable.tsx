import { Panel } from '@/components/Panel';
import { TextField } from '@/components/TextField';
import { FORMAT_SUGGESTIONS, HOOK_TYPE_SUGGESTIONS } from '@/config/constants';
import type { Enrichment, VideoTags } from '@/types/enrichment';
import type { VideoSummary } from '@/types/organized';
import { formatPercent } from '@/utils/stats';
import { truncate } from '@/utils/text';
import { formatDateTime } from '@/utils/time';

interface VideoTagTableProps {
  videos: VideoSummary[];
  enrichment: Enrichment;
  onTag: (videoId: string, tags: VideoTags) => void;
}

/** Optional per-video tags: format, hook type and hook text. Private videos are listed last and dimmed. */
export function VideoTagTable({ videos, enrichment, onTag }: VideoTagTableProps) {
  const ordered = [...videos.filter((v) => !v.isPrivate), ...videos.filter((v) => v.isPrivate)];
  return (
    <Panel title={`Video tags (optional) · ${videos.length} videos`}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Video</th>
              <th>Views</th>
              <th>3s hold</th>
              <th>Format</th>
              <th>Hook type</th>
              <th>Hook text (first words)</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((video) => {
              const tags = enrichment.videoTags[video.id] ?? {};
              return (
                <tr key={video.id} className={video.isPrivate ? 'dimmed' : undefined}>
                  <td>
                    <div>{truncate(video.caption, 60) || video.id}</div>
                    <div className="muted">
                      {formatDateTime(video.createdAt)}
                      {video.isPrivate && ' · private'}
                      {video.isPhoto && ' · photo'}
                    </div>
                  </td>
                  <td>{video.views ?? '—'}</td>
                  <td>{formatPercent(video.retention3s)}</td>
                  <td>
                    <TextField value={tags.format ?? ''} suggestions={FORMAT_SUGGESTIONS} onCommit={(format) => onTag(video.id, { format })} />
                  </td>
                  <td>
                    <TextField value={tags.hookType ?? ''} suggestions={HOOK_TYPE_SUGGESTIONS} onCommit={(hookType) => onTag(video.id, { hookType })} />
                  </td>
                  <td>
                    <TextField value={tags.hookText ?? ''} onCommit={(hookText) => onTag(video.id, { hookText })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
