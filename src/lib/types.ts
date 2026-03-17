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

export interface AdminCategoryResult {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AdminCreateContentCommand {
  mode: string;
  title: string;
  seriesId?: string;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface AdminUpdateMetadataCommand {
  lang: string;
  title: string;
  description?: string;
  runtimeSeconds?: number;
  releaseAt?: string;
  posterUrl?: string;
  bannerUrl?: string;
  ageRating?: string;
  featured?: boolean;
  status?: string;
}

export interface AdminUpdateTaxonomyCommand {
  categorySlugs: string[];
  tags: string[];
}

export interface OpsSummary {
  totalJobs: number;
  successCount: number;
  failedCount: number;
  runningCount: number;
  avgProcessingSeconds: number | null;
}

export interface OpsFailureTop {
  errorMessage: string;
  count: number;
}

export interface OpsRecentRow {
  jobId: string;
  videoAssetId: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
