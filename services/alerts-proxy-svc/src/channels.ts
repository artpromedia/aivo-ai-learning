export type ChannelId = "slack" | "pagerduty" | "opsgenie";

export interface ChannelConfig {
  id: ChannelId;
  configured: boolean;
  /** Source of the configured value, for ops debugging — never the secret itself. */
  via: string | null;
}

interface RawEnv {
  [k: string]: string | undefined;
}

const SLACK_KEYS = ["OPS_ALERTS_SLACK_WEBHOOK_URL", "ALERTS_SLACK_WEBHOOK_URL"];
const PD_KEYS = ["OPS_ALERTS_PAGERDUTY_ROUTING_KEY", "ALERTS_PAGERDUTY_ROUTING_KEY"];
const OPSGENIE_KEYS = ["OPS_ALERTS_OPSGENIE_API_KEY", "ALERTS_OPSGENIE_API_KEY"];

function pickKey(env: RawEnv, keys: string[]): string | null {
  for (const k of keys) {
    const v = env[k];
    if (typeof v === "string" && v.length > 0) return k;
  }
  return null;
}

export function loadChannels(env: RawEnv = process.env): ChannelConfig[] {
  return [
    { id: "slack", configured: false, via: null, ...resolved("slack", pickKey(env, SLACK_KEYS)) },
    { id: "pagerduty", configured: false, via: null, ...resolved("pagerduty", pickKey(env, PD_KEYS)) },
    { id: "opsgenie", configured: false, via: null, ...resolved("opsgenie", pickKey(env, OPSGENIE_KEYS)) },
  ];
}

function resolved(_id: ChannelId, via: string | null): { configured: boolean; via: string | null } {
  return { configured: via !== null, via };
}

export const REQUIRED_CHANNELS_IN_PROD: ChannelId[] = ["slack", "pagerduty", "opsgenie"];
