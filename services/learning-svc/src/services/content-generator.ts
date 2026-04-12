import { TUTORS } from "@aivo/brand";

const AI_SVC_URL = process.env.AI_SVC_URL || "http://localhost:3004";

export async function generateLessonContent(params: {
  subject: string;
  topic: string;
  gradeTarget: string;
  deliveryLevel: string;
  functioningLevel: string;
  brainContext: Record<string, unknown>;
  contentType?: string;
}): Promise<{
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  qualityScore: number;
  qualityGatePassed: boolean;
  qualityGateLog: Record<string, unknown>;
}> {
  const res = await fetch(`${AI_SVC_URL}/api/ai/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject: params.subject,
      topic: params.topic,
      grade_target: params.gradeTarget,
      delivery_level: params.deliveryLevel,
      functioning_level: params.functioningLevel,
      brain_context: params.brainContext,
      content_type: params.contentType || "LESSON",
    }),
  });

  if (!res.ok) {
    throw new Error(`ai-svc returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    content: data.content,
    model: data.model,
    promptTokens: data.prompt_tokens,
    completionTokens: data.completion_tokens,
    qualityScore: data.quality_score,
    qualityGatePassed: data.quality_gate_passed,
    qualityGateLog: data.quality_gate_log,
  };
}

export async function chatWithTutor(params: {
  tutorSku: string;
  learnerId: string;
  functioningLevel: string;
  brainContext: Record<string, unknown>;
  messages: Array<{ role: string; content: string }>;
}): Promise<{
  response: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}> {
  const res = await fetch(`${AI_SVC_URL}/api/ai/tutor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tutor_sku: params.tutorSku,
      learner_id: params.learnerId,
      functioning_level: params.functioningLevel,
      brain_context: params.brainContext,
      messages: params.messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`ai-svc tutor chat returned ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  return {
    response: data.response,
    model: data.model,
    promptTokens: data.prompt_tokens,
    completionTokens: data.completion_tokens,
  };
}

const SKU_TO_KEY: Record<string, string> = {
  ADDON_TUTOR_MATH: "nova",
  ADDON_TUTOR_ELA: "sage",
  ADDON_TUTOR_SCIENCE: "spark",
  ADDON_TUTOR_HISTORY: "chrono",
  ADDON_TUTOR_CODING: "pixel",
  ADDON_TUTOR_SPEECH: "echo",
  ADDON_TUTOR_SEL: "harmony",
  ADDON_TUTOR_SOCIAL_STUDIES: "atlas",
  ADDON_TUTOR_ARTS: "cadence",
  ADDON_TUTOR_PE_HEALTH: "vigor",
  ADDON_TUTOR_LANGUAGES: "lingua",
  ADDON_TUTOR_STEM_DESIGN: "forge",
  ADDON_TUTOR_LIFE_SKILLS: "compass",
  ADDON_TUTOR_CREATIVE_WRITING: "muse",
};

export function getSubjectForTutor(tutorSku: string): string {
  const key = SKU_TO_KEY[tutorSku];
  if (key) {
    const tutor = TUTORS[key as keyof typeof TUTORS];
    if (tutor) return tutor.domain;
  }
  return "General";
}
