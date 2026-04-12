import json


SUBJECTS = [
    {"key": "math", "label": "Math", "emoji": "🔢", "color": "#7C3AED"},
    {"key": "ela", "label": "Reading", "emoji": "📖", "color": "#10B981"},
    {"key": "science", "label": "Science", "emoji": "🔬", "color": "#F59E0B"},
    {"key": "speech", "label": "Speech", "emoji": "🗣️", "color": "#EC4899"},
    {"key": "sel", "label": "SEL", "emoji": "💛", "color": "#F43F5E"},
    {"key": "life_skills", "label": "Life Skills", "emoji": "🏠", "color": "#14B8A6"},
    {"key": "executive_function", "label": "Executive Function", "emoji": "🧠", "color": "#6366F1"},
]


def build_baseline_generation_prompt(parent_assessment: dict) -> tuple[str, str]:
    responses = parent_assessment.get("responses", {})
    communication_mode = parent_assessment.get("communicationMode", "verbal")
    device_interaction = parent_assessment.get("deviceInteraction", "independent")
    functioning_level = parent_assessment.get("functioningLevel", "STANDARD")
    attention_span = parent_assessment.get("attentionSpan", "typical")
    diagnoses = parent_assessment.get("diagnoses", [])

    learning_style = responses.get("ls-1", "")
    strengths_raw = responses.get("str-1", [])
    strengths = strengths_raw if isinstance(strengths_raw, list) else []
    challenges_raw = responses.get("ch-1", [])
    challenges = challenges_raw if isinstance(challenges_raw, list) else []
    diagnosed = responses.get("ch-2", "")
    reading_level = responses.get("fl-5", "")
    dev_level = responses.get("fl-7", "")
    interests_raw = responses.get("pref-1", [])
    interests = interests_raw if isinstance(interests_raw, list) else []
    frustrations = responses.get("ch-5", "")
    engagement_type = responses.get("pref-3", "")
    focus_rating = responses.get("ls-3", 3)
    confidence = responses.get("se-1", 3)

    system_prompt = f"""You are AIVO's adaptive assessment generator. You create personalized baseline assessment questions for learners based on their parent's profile input.

## Learner Profile
- Communication Mode: {communication_mode}
- Device Interaction: {device_interaction}
- Functioning Level: {functioning_level}
- Attention Span: {attention_span}
- Diagnoses: {', '.join(diagnoses) if diagnoses else 'None reported'}
- Learning Style: {learning_style}
- Reading Level: {reading_level}
- Developmental Level: {dev_level}
- Strengths: {', '.join(strengths) if strengths else 'Not specified'}
- Challenges: {', '.join(challenges) if challenges else 'Not specified'}
- Diagnosed Conditions: {diagnosed}
- Interests: {', '.join(interests) if interests else 'Not specified'}
- What Frustrates Them: {frustrations or 'Not specified'}
- Engagement Preference: {engagement_type or 'Not specified'}
- Focus Rating (1-5): {focus_rating}
- Self-Confidence (1-5): {confidence}

## Rules
1. Generate EXACTLY 6 questions per subject for these 7 subjects: math, ela, science, speech, sel, life_skills, executive_function (42 questions total)
2. Each question MUST have exactly 4 answer options
3. Adapt difficulty based on the learner's functioning level and developmental level:
   - STANDARD: Age-appropriate grade-level questions
   - SUPPORTED: Slightly below grade level, clearer language
   - LOW_VERBAL: Simple vocabulary, concrete concepts, visual cues in text
   - NON_VERBAL: Picture-describable choices, very simple language
   - PRE_SYMBOLIC: Object-level choices, cause-and-effect, basic matching
4. Incorporate the learner's INTERESTS into question themes when possible (e.g., if they like animals, use animal-themed math problems)
5. Avoid content related to their CHALLENGES in early questions to build confidence first, then gently assess those areas
6. For learners with LOW confidence, start each subject with an easier question
7. For learners with SHORT attention span, keep questions concise (under 15 words)
8. Questions should feel fun and game-like, not test-like
9. Each question must have one clearly correct answer
10. Content must be safe, age-appropriate, and culturally neutral
11. For speech questions: test phonological awareness, vocabulary, grammar, pragmatic language, and comprehension
12. For SEL questions: test emotional recognition, regulation strategies, empathy, social skills, and conflict resolution
13. For life_skills questions: test safety awareness, daily routines, money concepts, hygiene, and self-care
14. For executive_function questions: test planning, organization, working memory, flexible thinking, impulse control, and task initiation"""

    user_prompt = f"""Generate 42 personalized baseline assessment questions (6 per subject) for this learner.

Return ONLY valid JSON in this exact format:
{{
  "questions": [
    {{
      "id": "m1",
      "subject": "math",
      "questionText": "...",
      "options": [
        {{"label": "...", "value": "a"}},
        {{"label": "...", "value": "b"}},
        {{"label": "...", "value": "c"}},
        {{"label": "...", "value": "d"}}
      ],
      "correctAnswer": "b",
      "difficulty": 1
    }}
  ]
}}

ID format: m1-m6 for math, e1-e6 for ela, s1-s6 for science, sp1-sp6 for speech, sel1-sel6 for sel, ls1-ls6 for life_skills, ef1-ef6 for executive_function.
difficulty: 1 (easy) or 2 (moderate) — start each subject with difficulty 1.
Personalize based on the learner's interests ({', '.join(interests) if interests else 'general'}), strengths, and challenges.
Return ONLY the JSON object, no markdown formatting or code blocks."""

    return system_prompt, user_prompt
