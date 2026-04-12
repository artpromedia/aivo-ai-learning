"use client";
import type { Beat, SensoryAdaptations } from "./types";

interface StageContentProps {
  beat: Beat | null;
  adaptations: SensoryAdaptations;
  phase: string;
}

export function StageContent({ beat, adaptations, phase }: StageContentProps) {
  if (!beat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-white/30 text-lg font-body">Preparing the stage...</div>
      </div>
    );
  }

  const maxElements = adaptations.maxOnScreenElements;
  const visuals = beat.visuals.slice(0, maxElements);
  const speed = adaptations.animationSpeed;

  const getAnimClass = (anim?: string) => {
    if (adaptations.motionReduced) return "animate-fade-in";
    switch (anim) {
      case "bounce": return "animate-bounce-in";
      case "slide_in": return "animate-slide-up";
      case "pulse": return "animate-pulse-gentle";
      case "float": return "animate-float";
      case "glow": return "animate-glow";
      default: return "animate-fade-in";
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 relative"
      style={{ filter: `saturate(${adaptations.colorSaturation}%)` }}>

      {visuals.map((el, i) => (
        <div
          key={el.id}
          className={`${getAnimClass(el.animation)} transition-all`}
          style={{
            animationDelay: `${i * (200 / speed)}ms`,
            animationDuration: `${600 / speed}ms`,
          }}
        >
          {el.type === "card" && (
            <div
              className={`bg-white/15 backdrop-blur-md rounded-2xl border-2 border-white/20 px-6 py-5 max-w-md text-center shadow-xl
                ${adaptations.boldOutlines ? "border-3 border-white/40" : ""}
                ${adaptations.contrastBoost ? "bg-white/25" : ""}
                ${adaptations.pulseAttention ? "animate-pulse-gentle" : ""}
              `}
              style={el.color ? { borderColor: el.color } : undefined}
            >
              {el.emoji && <div className="text-5xl mb-3">{el.emoji}</div>}
              <p className={`text-white font-heading font-bold leading-relaxed ${
                adaptations.contrastBoost ? "text-xl" : "text-lg"
              }`}>
                {el.content}
              </p>
            </div>
          )}

          {el.type === "text" && (
            <p className={`text-white/90 font-body text-center max-w-lg leading-relaxed drop-shadow
              ${adaptations.contrastBoost ? "text-xl font-bold" : "text-lg"}
              ${adaptations.boldOutlines ? "text-shadow-strong" : ""}
            `}>
              {el.content}
            </p>
          )}

          {el.type === "shape" && (
            <div className="flex items-center justify-center">
              <div
                className={`w-24 h-24 rounded-2xl bg-white/15 backdrop-blur border-2 border-white/25 flex items-center justify-center text-4xl
                  ${adaptations.pulseAttention ? "animate-pulse-gentle" : ""}
                `}
                style={el.color ? { backgroundColor: `${el.color}30`, borderColor: el.color } : undefined}
              >
                {el.emoji || el.content}
              </div>
            </div>
          )}

          {el.type === "manipulative" && (
            <div className="flex gap-3 flex-wrap justify-center">
              {el.content.split(",").map((part, j) => (
                <div
                  key={j}
                  className={`w-16 h-16 rounded-xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-2xl cursor-pointer hover:scale-110 active:scale-95 transition-transform
                    ${adaptations.pulseAttention ? "animate-pulse-gentle" : ""}
                  `}
                  style={el.color ? { borderColor: el.color } : undefined}
                >
                  {part.trim()}
                </div>
              ))}
            </div>
          )}

          {el.type === "diagram" && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 p-6 max-w-sm">
              {el.emoji && <div className="text-4xl text-center mb-2">{el.emoji}</div>}
              <p className="text-white font-body text-center">{el.content}</p>
            </div>
          )}

          {el.type === "image" && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 max-w-sm">
              {el.emoji && <div className="text-6xl text-center py-6">{el.emoji}</div>}
              {el.content && <p className="text-white font-body text-center px-4 pb-3">{el.content}</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
