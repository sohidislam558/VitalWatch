/**
 * VitalWatch Real-Time Cross-Window & Local Telemetry Synchronization
 * Uses native BroadcastChannel for instant (<50ms) cross-tab events
 * and provides event emitters for telemetry mutations.
 */

const CHANNEL_NAME = 'vitalwatch_telemetry_sync';

// Native cross-tab broadcast channel
const channel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

/**
 * Broadcast an update event whenever a vital sign, admission, or clinical action occurs.
 */
export function broadcastTelemetryUpdate() {
  try {
    if (channel) {
      channel.postMessage({ type: 'TELEMETRY_UPDATED', timestamp: Date.now() });
    }
  } catch (err) {
    // Graceful fallback
  }

  // Same-window custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vitalwatch:telemetry_updated', { detail: { timestamp: Date.now() } }));
  }
}

/**
 * Subscribe to telemetry updates from any portal or tab.
 * Returns unsubscribe cleanup function.
 */
export function onTelemetryUpdate(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => callback();
  window.addEventListener('vitalwatch:telemetry_updated', handleCustomEvent);

  let handleChannelMessage = null;
  if (channel) {
    handleChannelMessage = (event) => {
      if (event.data?.type === 'TELEMETRY_UPDATED') {
        callback();
      }
    };
    channel.addEventListener('message', handleChannelMessage);
  }

  return () => {
    window.removeEventListener('vitalwatch:telemetry_updated', handleCustomEvent);
    if (channel && handleChannelMessage) {
      channel.removeEventListener('message', handleChannelMessage);
    }
  };
}

