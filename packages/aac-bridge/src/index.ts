// Phase 1 — Core types and controllers
export type {
  AACInputMethod,
  AACEvent,
  AACSessionConfig,
  SymbolItem,
  SymbolBoard,
  HighlightStyle,
} from "./types.js";

export { SwitchScanController } from "./SwitchScanController.js";
export { useAACInput } from "./useAACInput.js";
export type { UseAACInputResult } from "./useAACInput.js";

// OBF / OBZ
export { parseOBF, parseOBZ, validateOBF } from "./obf/OBFImporter.js";
export { exportToOBF } from "./obf/OBFExporter.js";
export type { OBFBoard, OBFManifest, OBFButton, OBFImage } from "./obf/types.js";

// Phase 2 — Adapters
export type { AACInputAdapter } from "./adapters/AACInputAdapter.js";
export { PRCSaltilloAdapter } from "./adapters/PRCSaltilloAdapter.js";
export { TobiiAdapter } from "./adapters/TobiiAdapter.js";
export { AssistiveWareAdapter } from "./adapters/AssistiveWareAdapter.js";
export {
  detectAndCreateAdapter,
  listAvailableAdapters,
} from "./adapters/AdapterFactory.js";

// CoughDrop sync
export { CoughDropSync } from "./coughdrop/CoughDropSync.js";
export type { SyncStatus, SyncState } from "./coughdrop/CoughDropSync.js";
