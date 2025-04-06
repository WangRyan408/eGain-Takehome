// Type definition for tracking information
// Schema for defining the structure of tracking information
export type TrackingInfo = {
    status: string;
    location?: string;
    eta?: string;
    lastUpdate?: string;
    reason?: string;
    lastSeen?: string;
    orderId?: string;
    trackingNumber?: string;
    items?: string[];
  }
  