# Sprint 4 — Adaptive Learning Path Wiring

> **Priority**: 🟡 MEDIUM — Core AI-driven differentiation is built but disconnected  
> **Estimated effort**: 4–5 days  
> **Scope**: Wire LLM-powered topic sequencing into the session flow, replace static topic lists, improve XP/quality metrics

---

## Prompt 4.1 — Wire Curriculum Engine into Learning Path Init

### Context

`services/learning-svc/src/routes/sessions.ts` (line 206, 227) calls `getDefaultTopics()`
which returns a **static hardcoded list** of topics per subject. Meanwhile, a full
LLM-powered curriculum engine exists at `services/brain-svc/src/brain_svc/services/
curriculum_engine.py` → `generate_topic_sequence_for_path()` that can produce personalized
topic sequences aligned to the learner's curriculum framework, grade level, mastery, and
functioning level. This engine is **never called** from the learning-svc session flow.

### Files to modify

- `services/learning-svc/src/routes/sessions.ts`
- `services/learning-svc/src/services/content-generator.ts`

### Task

1. In the `POST /api/learning/path/:learnerId/:subject/init` handler (line 216-239):
   - After creating the path with default topics, make an async call to brain-svc's
     curriculum engine endpoint to request personalized topics.
   - When the brain-svc response arrives, update the `topicSequence` on the learning path.
   - If brain-svc is unavailable, fall back silently to the existing `getDefaultTopics()`.

2. Add a new route `POST /api/learning/path/:learnerId/:subject/refresh-topics`:
   - Fetches current brain state (mastery, completed topics, functioning level).
   - Calls the curriculum engine to regenerate the next 10 topics.
   - Updates the learning path's `topicSequence`.
   - This allows re-sequencing after mastery changes.

3. In `content-generator.ts`, add a `fetchPersonalizedTopics()` function that calls:
   ```
   POST brain-svc/api/brain/curriculum/topic-sequence
   {
     framework, subject, grade_level, current_mastery,
     functioning_level, completed_topics
   }
   ```

### Acceptance criteria

- New learning paths attempt personalized topic generation before falling back to static.
- `refresh-topics` endpoint exists and returns updated topic sequence.
- Static fallback still works when brain-svc is down.
- No change to existing API contracts.

---

## Prompt 4.2 — Replace Simplistic XP & Quality Calculations

### Context

`services/tutor-svc/src/routes/chat.ts` line 127-130:
```typescript
xpEarned: xpEarned || Math.min(messages.length * 5, 50),
completionQuality: Math.min(1.0, messages.length / 10),
```
These are pure proxy metrics — XP is literally message count × 5, quality is
message count / 10. Neither reflects actual learning quality.

### Files to modify

- `services/tutor-svc/src/routes/chat.ts` (session complete handler, line 115-134)
- `services/learning-svc/src/routes/sessions.ts` (lesson session complete, line 87-131)

### Task

1. **Tutor session XP**: Replace with a formula that considers:
   - Number of correct answers (from interaction beats)
   - Session duration (diminishing returns after 20 min to discourage screen time)
   - Mastery improvement (delta between session start and end mastery)
   - Functioning level multiplier (PRE_SYMBOLIC sessions earn XP for engagement, not
     just correctness)
   ```
   base_xp = correct_answers * 10
   duration_bonus = min(duration_minutes * 2, 20)  // cap at 10 min worth
   mastery_bonus = mastery_delta * 50
   level_engagement_bonus = (functioning_level_weight) * engagement_beats
   total = min(base_xp + duration_bonus + mastery_bonus + level_engagement_bonus, 100)
   ```

2. **Completion quality**: Replace with a multi-signal score:
   - Completion rate (beats completed / total beats)
   - Correctness rate (correct / attempted)
   - Engagement signals (didn't skip, used breaks appropriately)
   - Time-on-task ratio (not too fast = guessing, not too slow = disengaged)

3. For **lesson sessions**, apply similar quality-aware XP in the
   `POST /api/learning/sessions/:sessionId/complete` handler.

4. Document the formula in a code comment and in a new section in
   `docs/xp-quality-metrics.md`.

### Acceptance criteria

- XP calculation uses ≥3 signals beyond message count.
- CompletionQuality is a multi-dimensional score between 0.0 and 1.0.
- A session with 2 messages but 100% correctness earns more XP than a session
  with 10 messages and 0% correctness.
- PRE_SYMBOLIC sessions earn XP for engagement, not just correctness.

---

## Prompt 4.3 — Mastery-Based Progression Logic

### Context

The learning path has a `topicSequence` and `completedTopics` but there is no logic to
gate topic advancement on mastery. A learner could theoretically advance through all
topics without demonstrating understanding.

### Files to modify

- `services/learning-svc/src/routes/sessions.ts`

### Task

1. Add a `POST /api/learning/path/:learnerId/:subject/advance` endpoint:
   - Checks current topic's mastery score from gradebook.
   - If mastery ≥ threshold (configurable per functioning level: STANDARD=0.7,
     SUPPORTED=0.6, LOW_VERBAL=0.5, NON_VERBAL=0.4, PRE_SYMBOLIC=0.3):
     → Move topic to `completedTopics`, return next topic.
   - If below threshold: → Return current topic with a "needs more practice" flag
     and a suggested remediation approach.

2. Add mastery thresholds to a config object:
   ```typescript
   const MASTERY_THRESHOLDS: Record<string, number> = {
     STANDARD: 0.70,
     SUPPORTED: 0.60,
     LOW_VERBAL: 0.50,
     NON_VERBAL: 0.40,
     PRE_SYMBOLIC: 0.30,
   };
   ```

3. When a topic is completed, check if the learning path needs a topic refresh
   (trigger the `refresh-topics` call from Prompt 4.1).

### Acceptance criteria

- Learner at 0.3 mastery on STANDARD level cannot advance.
- Learner at 0.4 mastery on NON_VERBAL level can advance.
- Topic advancement triggers next-topic refresh.
- Endpoint returns clear status: `"advanced"`, `"needs_practice"`, or `"path_complete"`.

---

## Prompt 4.4 — Scaffolding & Remediation in AI Prompts

### Context

When a learner struggles with a topic (low mastery, multiple attempts), the tutor should
shift to scaffolding mode — breaking the concept down, providing more support, using
different modalities. The prompt builder should adapt based on attempt count and mastery
trend.

### Files to modify

- `services/ai-svc/src/ai_svc/services/prompt_builder.py`

### Task

1. Accept new parameters in `build_system_prompt()`:
   - `attempts_on_current_topic: int` — how many sessions on this topic
   - `mastery_trend: str` — "improving", "stable", "declining"

2. Add scaffolding instructions based on attempt count:
   - Attempts ≤ 2: Standard instruction
   - Attempts 3-4: "The learner has struggled with this topic. Break it into smaller
     steps. Use concrete examples before abstract concepts. Check understanding at
     each micro-step."
   - Attempts ≥ 5: "This topic requires significant scaffolding. Start with prerequisite
     skills. Use manipulatives and visual models. Celebrate small wins. Consider whether
     the learner needs a different approach entirely."

3. Add mastery trend modifiers:
   - Declining: "The learner's mastery is declining. This may indicate confusion,
     fatigue, or a gap in prerequisite knowledge. Gently assess what they remember
     from previous sessions before introducing new content."
   - Stable at low: "The learner is not making progress. Try a completely different
     teaching approach — if you used visual last time, try auditory or kinesthetic."

### Acceptance criteria

- Prompt for a learner on attempt 5 includes scaffolding language.
- Prompt for a declining mastery trend includes regression-aware language.
- Prompt for a first attempt has no scaffolding overhead.
- ≥10 new test cases in `test_prompt_builder.py`.

---

## Definition of Done for Sprint 4

- [ ] Curriculum engine wired into learning path init
- [ ] `refresh-topics` endpoint exists
- [ ] XP formula uses ≥3 signals
- [ ] CompletionQuality is multi-dimensional
- [ ] Mastery-gated topic advancement
- [ ] Scaffolding prompts for struggling learners
- [ ] `docs/xp-quality-metrics.md` documents formulas
