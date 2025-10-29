export const ASSISTANT_MESSAGES: string[] = [
  "All systems synced — ready with the latest updates.",
  "Everything’s up to date — ready to dive into the news?",
  "All caught up with today’s updates. Ask me about anything specific.",
  "Latest stories loaded. What would you like to read about?",
  "Looking for something specific? I can search the news for you.",
  "Fresh batch of stories ready whenever you are.",
  "Ask me about anything happening right now.",
  "From sports to science — I’ll find what matters most to you.",
  "Tell me what you’re curious about, and I’ll handle the rest.",
  "Looking for something in the news? I’ll fetch it for you.",
  "Discover what’s trending — what topic do you want to explore?",
];

// Utility function to get a random message
export const getRandomAssistantMessage = (): string => {
  const randomIndex = Math.floor(Math.random() * ASSISTANT_MESSAGES.length);
  return ASSISTANT_MESSAGES[randomIndex];
};