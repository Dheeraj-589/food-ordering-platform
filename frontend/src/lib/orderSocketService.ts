import api from './api';
import { OrderStatus } from '@/types';

export type TimelineStage =
  | 'received'
  | 'preparing'
  | 'baking'
  | 'quality_check'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

type TrackingCallback = (stage: TimelineStage) => void;

class OrderSocketService {
  private listeners: Map<number, Set<TrackingCallback>> = new Map();
  private activeTimers: Map<number, NodeJS.Timeout> = new Map();
  private mockStages: TimelineStage[] = [
    'received',
    'preparing',
    'baking',
    'quality_check',
    'out_for_delivery',
    'delivered',
  ];

  // Subscribe to tracking updates for a specific order
  subscribe(orderId: number, callback: TrackingCallback) {
    if (!this.listeners.has(orderId)) {
      this.listeners.set(orderId, new Set());
    }
    this.listeners.get(orderId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const orderListeners = this.listeners.get(orderId);
      if (orderListeners) {
        orderListeners.delete(callback);
        if (orderListeners.size === 0) {
          this.listeners.delete(orderId);
          this.stopSimulation(orderId);
        }
      }
    };
  }

  // Start tracking simulation
  startTracking(orderId: number, currentBackendStatus: OrderStatus, createdAtStr: string) {
    this.stopSimulation(orderId);

    // Calculate current simulated stage based on elapsed time since order creation
    const createdAt = new Date(createdAtStr).getTime();
    const elapsedSeconds = Math.max(0, (Date.now() - createdAt) / 1000);

    // We progress stages every 30 seconds
    const intervalSeconds = 30;
    let currentStageIndex = Math.floor(elapsedSeconds / intervalSeconds);

    if (currentBackendStatus === 'cancelled') {
      this.notify(orderId, 'cancelled');
      return;
    }

    if (currentBackendStatus === 'delivered') {
      this.notify(orderId, 'delivered');
      return;
    }

    // Align with backend status
    if (currentBackendStatus === 'pending') {
      currentStageIndex = Math.min(currentStageIndex, 0); // Must be 'received'
    } else if (currentBackendStatus === 'preparing') {
      // Can be preparing, baking, or quality_check (index 1, 2, 3)
      currentStageIndex = Math.max(1, Math.min(currentStageIndex, 3));
    } else if (currentBackendStatus === 'out-for-delivery') {
      currentStageIndex = Math.max(4, Math.min(currentStageIndex, 4));
    }

    if (currentStageIndex >= this.mockStages.length) {
      currentStageIndex = this.mockStages.length - 1;
    }

    const currentStage = this.mockStages[currentStageIndex];
    this.notify(orderId, currentStage);

    // If already delivered, don't start timer
    if (currentStage === 'delivered') {
      return;
    }

    // Setup timer to progress every 30 seconds (or remaining time of the current 30s block)
    const timePassedInCurrentBlockMs = (elapsedSeconds % intervalSeconds) * 1000;
    const msToNextBlock = Math.max(500, intervalSeconds * 1000 - timePassedInCurrentBlockMs);

    const progressStage = async () => {
      currentStageIndex++;
      if (currentStageIndex >= this.mockStages.length) {
        this.stopSimulation(orderId);
        return;
      }

      const nextStage = this.mockStages[currentStageIndex];

      // Update backend status if mapping transitions to a new database status
      try {
        let backendStatusUpdate: OrderStatus | null = null;
        if (nextStage === 'preparing') {
          backendStatusUpdate = 'preparing';
        } else if (nextStage === 'out_for_delivery') {
          backendStatusUpdate = 'out-for-delivery';
        } else if (nextStage === 'delivered') {
          backendStatusUpdate = 'delivered';
        }

        if (backendStatusUpdate) {
          await api.patch(`/orders/${orderId}/simulate-status`, {
            status: backendStatusUpdate,
          });
        }
      } catch (err) {
        console.error('Failed to sync simulated status to backend:', err);
      }

      this.notify(orderId, nextStage);

      if (nextStage !== 'delivered') {
        // Schedule next progression
        const timer = setTimeout(progressStage, intervalSeconds * 1000);
        this.activeTimers.set(orderId, timer);
      } else {
        this.activeTimers.delete(orderId);
      }
    };

    const firstTimer = setTimeout(progressStage, msToNextBlock);
    this.activeTimers.set(orderId, firstTimer);
  }

  private stopSimulation(orderId: number) {
    const timer = this.activeTimers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(orderId);
    }
  }

  private notify(orderId: number, stage: TimelineStage) {
    const orderListeners = this.listeners.get(orderId);
    if (orderListeners) {
      orderListeners.forEach((callback) => callback(stage));
    }
  }
}

export const orderSocketService = new OrderSocketService();
