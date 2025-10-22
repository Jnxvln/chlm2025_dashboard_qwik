/**
 * Type definitions for notice board entities
 */

/**
 * Notice type options
 */
export type NoticeType = 'info' | 'warning' | 'alert' | 'promo';

/**
 * Notice entity for dashboard announcements
 */
export interface Notice {
  id: number;
  content: string;
  displayDate: Date;
  type: NoticeType;
  createdAt: Date;
  updatedAt: Date;
  /** URLs associated with this notice */
  urls?: NoticeUrl[];
}

/**
 * Notice URL entity for links within notices
 */
export interface NoticeUrl {
  id: number;
  noticeId: number;
  displayText: string;
  url: string;
  isExternal: boolean;
  createdAt: Date;
  /** Parent notice */
  notice?: Notice;
}
