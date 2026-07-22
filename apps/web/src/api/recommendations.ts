import { apiRequest } from "./client";
import type { EventItem } from "./events";
import type { PublicUserSummary, ServiceItem } from "./services";

export type RecommendationSource = "graph" | "fallback";
export type RecommendedItem<T> = T & {
  recommendationReason: string;
  recommendationReasons: string[];
};
export type RecommendationResponse<T> = {
  source: RecommendationSource;
  items: Array<RecommendedItem<T>>;
};

function queryString(options: { limit?: number; category?: string }) {
  const query = new URLSearchParams();
  if (options.limit) query.set("limit", String(options.limit));
  if (options.category) query.set("category", options.category);
  const value = query.toString();
  return value ? `?${value}` : "";
}

export function getRecommendedServices(
  options: { limit?: number; category?: string } = {},
) {
  return apiRequest<RecommendationResponse<ServiceItem>>(
    `/api/recommendations/services${queryString(options)}`,
  );
}

export function getRecommendedEvents(
  options: { limit?: number; category?: string } = {},
) {
  return apiRequest<RecommendationResponse<EventItem>>(
    `/api/recommendations/events${queryString(options)}`,
  );
}

export function getRecommendedNeighbors(options: { limit?: number } = {}) {
  return apiRequest<RecommendationResponse<PublicUserSummary>>(
    `/api/recommendations/neighbors${queryString(options)}`,
  );
}
