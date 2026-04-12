"use client";
import { useCallback, useEffect, useState } from "react";
import type { SensoryProfile, SensoryAdaptations, FunctioningLevel } from "./types";

const DEFAULT_PROFILE: SensoryProfile = {
  visual: "typical",
  auditory: "typical",
  tactile: "typical",
  vestibular: "typical",
  proprioceptive: "typical",
};

const DEFAULT_ADAPTATIONS: SensoryAdaptations = {
  colorSaturation: 100,
  animationSpeed: 1,
  volumeLevel: 0.7,
  maxOnScreenElements: 6,
  useSubtitles: false,
  hapticIntensity: "standard",
  motionReduced: false,
  contrastBoost: false,
  boldOutlines: false,
  pulseAttention: false,
};

function computeAdaptations(profile: SensoryProfile, level: FunctioningLevel): SensoryAdaptations {
  const a = { ...DEFAULT_ADAPTATIONS };

  if (profile.visual === "hyper") {
    a.colorSaturation = 70;
    a.maxOnScreenElements = 3;
    a.boldOutlines = false;
    a.contrastBoost = false;
  } else if (profile.visual === "hypo") {
    a.colorSaturation = 120;
    a.contrastBoost = true;
    a.boldOutlines = true;
    a.pulseAttention = true;
  }

  if (profile.auditory === "hyper") {
    a.volumeLevel = 0.4;
    a.useSubtitles = true;
  } else if (profile.auditory === "hypo") {
    a.volumeLevel = 1.0;
  }

  if (profile.vestibular === "hyper" || profile.proprioceptive === "hyper") {
    a.motionReduced = true;
    a.animationSpeed = 0.5;
  }

  if (profile.tactile === "hyper") {
    a.hapticIntensity = "light";
  } else if (profile.tactile === "hypo") {
    a.hapticIntensity = "standard";
  }

  if (level === "LOW_VERBAL" || level === "NON_VERBAL" || level === "PRE_SYMBOLIC") {
    a.maxOnScreenElements = Math.min(a.maxOnScreenElements, 3);
    a.useSubtitles = true;
    a.animationSpeed = Math.min(a.animationSpeed, 0.7);
  }

  if (level === "SUPPORTED") {
    a.maxOnScreenElements = Math.min(a.maxOnScreenElements, 4);
  }

  return a;
}

export function useSensoryAdapter(
  learnerId: string | null,
  accessToken: string | null,
  functioningLevel: FunctioningLevel = "STANDARD"
) {
  const [profile, setProfile] = useState<SensoryProfile>(DEFAULT_PROFILE);
  const [adaptations, setAdaptations] = useState<SensoryAdaptations>(DEFAULT_ADAPTATIONS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!learnerId || !accessToken) return;
    fetch(`/api/assessments/sensory-profile/${learnerId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.visual) {
          setProfile({
            visual: data.visual || "typical",
            auditory: data.auditory || "typical",
            tactile: data.tactile || "typical",
            vestibular: data.vestibular || "typical",
            proprioceptive: data.proprioceptive || "typical",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [learnerId, accessToken]);

  useEffect(() => {
    setAdaptations(computeAdaptations(profile, functioningLevel));
  }, [profile, functioningLevel]);

  const getCSSVars = useCallback((): React.CSSProperties => ({
    "--stage-saturation": `${adaptations.colorSaturation}%`,
    "--stage-animation-speed": `${adaptations.animationSpeed}`,
    "--stage-transition-duration": `${300 / adaptations.animationSpeed}ms`,
  } as React.CSSProperties), [adaptations]);

  return { profile, adaptations, loaded, getCSSVars };
}
