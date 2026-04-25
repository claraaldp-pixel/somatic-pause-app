export const CATEGORIES = [
  {
    id: "physical",
    label: "Physical",
    emoji: "🫀",
    description: "What's happening in your body right now?",
    symptoms: [
      { text: "Heat, tightness or clenching in jaw, fists or chest", scores: { fight: 3, flight: 0, freeze: 0, fawn: 0 } },
      { text: "Shallow, high or tight breath", scores: { fight: 2, flight: 1, freeze: 0, fawn: 1 } },
      { text: "Body feels charged, tense or ready to push back", scores: { fight: 3, flight: 0, freeze: 0, fawn: 0 } },
      { text: "Restless legs, rushed movements or can't sit still", scores: { fight: 0, flight: 3, freeze: 0, fawn: 0 } },
      { text: "Racing heart", scores: { fight: 1, flight: 3, freeze: 1, fawn: 0 } },
      { text: "Holding breath or bracing the body", scores: { fight: 0, flight: 0, freeze: 3, fawn: 1 } },
      { text: "High tension but no movement – rigid or frozen", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
      { text: "Chronic tension, wired and tired", scores: { fight: 0, flight: 1, freeze: 0, fawn: 3 } },
      { text: "Hard to feel internal sensations", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Tight throat or tight chest when speaking", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Heavy, slow movements, low energy or feeling cold/numb", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
    ],
  },
  {
    id: "emotional",
    label: "Emotional",
    emoji: "💛",
    description: "What emotions or feelings are present?",
    symptoms: [
      { text: "Irritable, angry or easily triggered", scores: { fight: 3, flight: 0, freeze: 0, fawn: 0 } },
      { text: "Impatient", scores: { fight: 2, flight: 1, freeze: 0, fawn: 0 } },
      { text: "Anxious, on edge or panicky", scores: { fight: 0, flight: 3, freeze: 1, fawn: 1 } },
      { text: "A sense of urgency", scores: { fight: 1, flight: 3, freeze: 0, fawn: 0 } },
      { text: "Overwhelmed and fearful but frozen", scores: { fight: 0, flight: 0, freeze: 3, fawn: 1 } },
      { text: "Powerless", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
      { text: "Flat, disconnected or emotionally exhausted", scores: { fight: 0, flight: 0, freeze: 1, fawn: 3 } },
      { text: "Guilt when prioritising yourself", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Fear of disappointing or anxiety around conflict", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Hopeless, flat or like disappearing would be easier", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
    ],
  },
  {
    id: "thoughts",
    label: "Thoughts",
    emoji: "🧠",
    description: "What kind of thoughts are running through your mind?",
    symptoms: [
      { text: "\"This shouldn't be happening\" or \"They're wrong\"", scores: { fight: 3, flight: 0, freeze: 0, fawn: 0 } },
      { text: "\"I need to fix this\" – sharp, definitive thinking", scores: { fight: 3, flight: 1, freeze: 0, fawn: 0 } },
      { text: "Racing thoughts or catastrophising", scores: { fight: 0, flight: 3, freeze: 1, fawn: 0 } },
      { text: "\"If I stop, everything will fall apart\"", scores: { fight: 0, flight: 3, freeze: 0, fawn: 0 } },
      { text: "Excessive planning or over-analysing", scores: { fight: 0, flight: 3, freeze: 0, fawn: 0 } },
      { text: "\"I want to act but I can't\" – looping without resolution", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
      { text: "Difficulty deciding", scores: { fight: 0, flight: 0, freeze: 3, fawn: 1 } },
      { text: "\"I'm doing everything\" but it doesn't feel good – self-critical", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "\"It's safer to keep them okay\" or \"My needs can wait\"", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "\"What's the point?\" or \"I can't\" – foggy, losing track of time", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
    ],
  },
  {
    id: "patterns",
    label: "Patterns",
    emoji: "🔄",
    description: "What patterns have you been noticing in your behaviour?",
    symptoms: [
      { text: "Picking fights, snapping at people or feeling combative", scores: { fight: 3, flight: 0, freeze: 0, fawn: 0 } },
      { text: "Hyper-independent or overworking to prove something", scores: { fight: 2, flight: 1, freeze: 0, fawn: 0 } },
      { text: "Overworking, overtraining or constant productivity", scores: { fight: 0, flight: 3, freeze: 0, fawn: 1 } },
      { text: "Difficulty resting – anxiety that feels like forward motion", scores: { fight: 0, flight: 3, freeze: 0, fawn: 0 } },
      { text: "Procrastinating with anxiety – overthinking but not acting", scores: { fight: 0, flight: 1, freeze: 3, fawn: 0 } },
      { text: "Going quiet or shutting down in conflict", scores: { fight: 0, flight: 0, freeze: 2, fawn: 2 } },
      { text: "High output, low fulfilment – burnout masked as competence", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Over-giving, saying yes when you mean no, undercharging", scores: { fight: 0, flight: 0, freeze: 0, fawn: 3 } },
      { text: "Avoiding tasks entirely or withdrawing socially", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
      { text: "Waiting for the \"right moment\" – letting things deteriorate", scores: { fight: 0, flight: 0, freeze: 3, fawn: 0 } },
    ],
  },
];

// Build a lookup: symptom text → dominant state
export const SYMPTOM_STATE_MAP = {};
CATEGORIES.forEach((cat) => {
  cat.symptoms.forEach((s) => {
    const dominant = Object.entries(s.scores).sort((a, b) => b[1] - a[1])[0];
    if (dominant[1] > 0) SYMPTOM_STATE_MAP[s.text] = dominant[0];
  });
});
