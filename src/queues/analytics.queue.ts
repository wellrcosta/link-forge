export const ANALYTICS_QUEUE = 'analytics';

export const ANALYTICS_JOBS = {
  RECORD_CLICK: 'record-click',
} as const;

export interface ClickEventPayload {
  linkId: string;
  userId: string;
  clickedAt: string;
  referer?: string;
  userAgent?: string;
  ipHash?: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
}
