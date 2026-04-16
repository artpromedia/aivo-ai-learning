"use client";
import { TUTORS } from "@aivo/brand";
import { useFlVariant, LearnerCard } from "@aivo/learner-ui";
import { SelCheckIn } from "./SelCheckIn";

interface SelExercise {
  title: string;
  steps: string[];
  durationMinutes: number;
}

interface DailyMission {
  id: string;
  title: string;
  tutorKey: string;
  progress: number;
  target: number;
  xpReward: number;
}

interface TodayTabProps {
  missions: DailyMission[];
  onSelCheckin: (emotion: string) => Promise<SelExercise | null>;
}

export function TodayTab({ missions, onSelCheckin }: TodayTabProps) {
  const { isLow } = useFlVariant();

  return (
    <div className="space-y-6">
      <SelCheckIn onCheckin={onSelCheckin} />

      {!isLow && missions.length > 0 && (
        <LearnerCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl" aria-hidden="true">🎯</span>
            <h3 className="font-heading font-bold text-amber-800">Daily Missions</h3>
          </div>
          <div className="space-y-3">
            {missions.map((mission) => {
              const tutor = TUTORS[mission.tutorKey as keyof typeof TUTORS];
              const percent = mission.target > 0 ? (mission.progress / mission.target) * 100 : 0;
              return (
                <div key={mission.id} className="flex items-center gap-3 bg-amber-50/50 rounded-xl px-4 py-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: tutor ? `${tutor.color}15` : "#f5f5f5" }}
                    aria-hidden="true"
                  >
                    {tutor?.icon || "🎯"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{mission.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-24 bg-amber-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs text-amber-500 font-bold">{mission.progress}/{mission.target}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-600 shrink-0">+{mission.xpReward} XP</span>
                </div>
              );
            })}
          </div>
        </LearnerCard>
      )}
    </div>
  );
}
