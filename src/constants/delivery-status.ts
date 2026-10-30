
export const DELIVERY_STATUS = {
  PENDING: "pending",
  IN_FLIGHT: "in_flight",
  DELIVERED: "delivered",
  DEAD: "dead",
} as const;

export type DeliveryStatus =
  (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];
