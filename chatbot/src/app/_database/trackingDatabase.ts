import { TrackingInfo } from '../_types/TrackingInfo';

// Mock database for our tracking information
const trackingDatabase: { [key: string]: TrackingInfo } = {
  'TRK123456789': {
    status: "in_transit",
    location: "Chicago Distribution Center",
    eta: "2 days",
    lastUpdate: "2025-04-02T14:30:00Z",
  },
  'TRK987654321': {
    status: "delayed",
    location: "Denver Sorting Facility",
    reason: "Weather conditions",
    eta: "4 days",
    lastUpdate: "2025-04-01T09:15:00Z",
  },
  'TRK555555555': {
    status: "lost",
    lastSeen: "Atlanta Hub",
    eta: "Unknown",
    reason: "Unknown",
    lastUpdate: "2025-03-22T2:30:00Z",
  },
  'TRK473902030': {
    status: "delivered",
    lastSeen: "On Delivery Vehicle",
    lastUpdate: "2025-03-25T6:45:00Z",
  }
}

export { trackingDatabase };