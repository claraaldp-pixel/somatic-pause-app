export const CATEGORIES = [
  {
    id: "physical",
    label: "Physical",
    emoji: "🫀",
    description: "What's happening in your body right now?",
    symptoms: [
      { text: "My jaw is tight or clenched", scores: { fight: 1, flight: 1, freeze: 1, fawn: 0 } },
      { text: "My shoulders are up around my ears", scores: { fight: 1, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I feel hot in my face or chest", scores: { fight: 1, flight: 0, freeze: 0, fawn: 0 } },
      { text: "My hands or feet feel cold", scores: { fight: 0, flight: 1, freeze: 1, fawn: 0 } },
      { text: "I feel restless or like I can't keep still", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "My body feels locked or braced, like it's waiting for something", scores: { fight: 0, flight: 1, freeze: 1, fawn: 0 } },
      { text: "I feel wired but exhausted at the same time", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "My body feels heavy or hard to move", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "I'm slumped or sunken — there's no energy to sit up", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "My breath feels caught or held — like I'm suspended", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "My breath is rapid or irregular — like I can't quite catch it", scores: { fight: 1, flight: 1, freeze: 0, fawn: 0 } },
    ],
  },
  {
    id: "emotional",
    label: "Emotional",
    emoji: "💛",
    description: "What emotions or feelings are present?",
    symptoms: [
      { text: "I feel angry, irritated, or like I've been wronged", scores: { fight: 1, flight: 0, freeze: 0, fawn: 0 } },
      { text: "I feel morally certain — I know exactly who or what is the problem", scores: { fight: 1, flight: 0, freeze: 0, fawn: 0 } },
      { text: "I feel anxious or like something bad is about to happen", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "There's a background dread I can't shake", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I feel overwhelmed but I'm still trying to keep going", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "I'm achieving things but it doesn't feel satisfying", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "I feel flat, empty, or like nothing really matters right now", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
      { text: "I feel a deep hopelessness — like things can't or won't change", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
      { text: "I feel disconnected — like I'm watching my life from a distance", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "I feel numb — I know I should feel something but I don't", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
    ],
  },
  {
    id: "thoughts",
    label: "Thoughts",
    emoji: "🧠",
    description: "What kind of thoughts are running through your mind?",
    symptoms: [
      { text: "I keep replaying what happened and what I should have said or done", scores: { fight: 1, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I'm convinced I need to fix this right now", scores: { fight: 1, flight: 1, freeze: 0, fawn: 0 } },
      { text: "My mind is jumping between worst-case scenarios", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I can't slow my thoughts down", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I know what I want to do but I can't seem to start", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "My mind goes blank when I need to think clearly", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "I feel confused even about simple things", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "My thoughts feel slow, foggy, or far away", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
      { text: "I keep thinking 'what's the point'", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
    ],
  },
  {
    id: "behavioural",
    label: "Behavioural / Relational",
    emoji: "🔄",
    description: "What's been showing up in how you act or relate to others?",
    symptoms: [
      { text: "I've been pushing back, correcting people, or getting into arguments", scores: { fight: 1, flight: 0, freeze: 0, fawn: 0 } },
      { text: "I feel like I have to do everything myself — I can't trust anyone else to", scores: { fight: 1, flight: 0, freeze: 0, fawn: 0 } },
      { text: "I've been cancelling plans or finding reasons to stay busy and avoid things", scores: { fight: 0, flight: 1, freeze: 1, fawn: 0 } },
      { text: "I start things but don't finish them — I've moved on before I'm done", scores: { fight: 0, flight: 1, freeze: 0, fawn: 0 } },
      { text: "I've been saying yes when I meant no — just to keep things smooth", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "I'm functioning — getting things done — but I'm not really present while I do it", scores: { fight: 0, flight: 0, freeze: 1, fawn: 0 } },
      { text: "I've been pulling back from people — conversations feel like too much effort", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
      { text: "I want to disappear — not go anywhere, just not have to show up", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
      { text: "I've been hard to reach — physically present but emotionally elsewhere", scores: { fight: 0, flight: 0, freeze: 1, fawn: 1 } },
      { text: "I've stopped doing things I normally enjoy — it just doesn't appeal", scores: { fight: 0, flight: 0, freeze: 0, fawn: 1 } },
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
