
CREATE INDEX idx_deliveries_pending
ON deliveries (next_attempt_at)
WHERE status = 'pending';

CREATE INDEX idx_deliveries_event_id
ON deliveries (event_id);

CREATE INDEX idx_delivery_attempts_delivery_id
ON delivery_attempts (delivery_id);
