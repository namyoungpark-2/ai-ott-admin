export type ContentUiStatus = "PROCESSING" | "READY" | "FAILED" | string;
export type VideoAssetStatus = "UPLOADED" | "TRANSCODING" | "READY" | "FAILED" | string;
export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | string;

export interface AdminContentSummaryDto {
  contentId: string;
  title: string;

  contentStatus: string;
  uiStatus: ContentUiStatus;

  videoAssetId: string | null;
  videoAssetStatus: VideoAssetStatus | null;

  attemptCount: number;
  latestJobStatus: JobStatus | null;
  latestErrorMessage: string | null;

  thumbnailUrl: string | null;
  streamUrl: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminContentDetailDto {
  contentId: string;
  title: string;

  contentStatus: string;
  uiStatus: ContentUiStatus;

  videoAssetId: string | null;
  videoAssetStatus: VideoAssetStatus | null;

  sourceKey: string | null;
  hlsMasterKey: string | null;
  videoAssetErrorMessage: string | null;

  attemptCount: number;
  latestJobStatus: JobStatus | null;
  latestErrorMessage: string | null;

  thumbnailUrl: string | null;
  streamUrl: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminVideoAssetSummaryDto {
  videoAssetId: string;
  contentId: string;
  status: VideoAssetStatus;

  sourceUrl: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;

  attemptCount: number;
  latestJobStatus: JobStatus | null;
  latestErrorMessage: string | null;

  createdAt: string | null;
  updatedAt: string | null;
}
