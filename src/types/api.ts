/** Shared API-level types used across services. */

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Opaque-cursor page shape used by the Career and Opportunity APIs. */
export interface CursorPage<T> {
  data: T[];
  meta: {
    page: {
      limit: number;
      nextCursor: string | null;
      hasMore: boolean;
    };
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}
