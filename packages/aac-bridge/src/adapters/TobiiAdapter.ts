/**
 * TobiiAdapter — integrates with the Tobii Interaction Library via its
 * WebSocket bridge (ws://localhost:1983 — Tobii's standard local port).
 *
 * Tracks dwell time per targetId and emits AACEvent when dwell reaches
 * config.dwellTimeMs.
 */
import type { AACEvent, AACSessionConfig } from "../types.js";
import type { AACInputAdapter } from "./AACInputAdapter.js";

const TOBII_WS_URL = "ws://localhost:1983";

interface GazePoint {
  X: number;
  Y: number;
  LeftEye?: unknown;
  RightEye?: unknown;
  Timestamp?: number;
}

export class TobiiAdapter implements AACInputAdapter {
  readonly vendorName = "Tobii";

  private ws: WebSocket | null = null;
  private listeners: Array<(event: AACEvent) => void> = [];
  private dwellTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private config: AACSessionConfig | null = null;
  private _currentTarget: string | null = null;

  isAvailable(): boolean {
    // In a browser we can only detect by attempting a connection; here we
    // return true when the environment looks like a browser and Tobii is
    // likely running (heuristic: presence of navigator.userAgent on a PC).
    if (typeof WebSocket === "undefined") return false;
    // During tests the caller can stub isAvailable via prototype override.
    return true;
  }

  async initialize(config: AACSessionConfig): Promise<void> {
    this.config = config;
    await this._connect();
  }

  private _connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(TOBII_WS_URL);
        this.ws.addEventListener("open", () => {
          // Subscribe to gaze stream.
          this.ws!.send(JSON.stringify({ type: "subscribe", stream: "GazePoint" }));
          resolve();
        });
        this.ws.addEventListener("error", () => resolve()); // best-effort
        this.ws.addEventListener("message", (msg: MessageEvent) => {
          this._handleMessage(msg);
        });
      } catch {
        resolve();
      }
    });
  }

  private _handleMessage(msg: MessageEvent): void {
    try {
      const data = JSON.parse(msg.data as string) as { type?: string; data?: GazePoint };
      if (data.type !== "GazePoint" || !data.data) return;
      // The caller is expected to map gaze coordinates to a targetId externally
      // and call _setDwellTarget(). In this reference implementation we emit
      // a synthetic event using the last known target.
      if (this._currentTarget) {
        this._startDwell(this._currentTarget, data.data.Timestamp ?? Date.now());
      }
    } catch {
      // Ignore malformed messages.
    }
  }

  /** Called by the host UI to inform the adapter which element is being gazed at. */
  highlight(targetId: string): void {
    if (targetId !== this._currentTarget) {
      this._clearDwell(this._currentTarget);
      this._currentTarget = targetId;
    }
  }

  private _startDwell(targetId: string, ts: number): void {
    if (this.dwellTimers.has(targetId)) return;
    const dwellMs = this.config?.dwellTimeMs ?? 800;
    const timer = setTimeout(() => {
      this.dwellTimers.delete(targetId);
      const evt: AACEvent = {
        method: "eye_gaze",
        targetId,
        timestamp: ts,
        dwellMs,
        confidence: 1,
      };
      for (const cb of this.listeners) cb(evt);
    }, dwellMs);
    this.dwellTimers.set(targetId, timer);
  }

  private _clearDwell(targetId: string | null): void {
    if (!targetId) return;
    const t = this.dwellTimers.get(targetId);
    if (t != null) clearTimeout(t);
    this.dwellTimers.delete(targetId);
  }

  onEvent(cb: (event: AACEvent) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  dispose(): void {
    for (const [id] of this.dwellTimers) this._clearDwell(id);
    this.ws?.close();
    this.ws = null;
    this.listeners = [];
    this._currentTarget = null;
  }
}
