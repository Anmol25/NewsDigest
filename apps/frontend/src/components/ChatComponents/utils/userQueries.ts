// userQueries.ts

export const USER_QUERIES: string[] = [
  "What’s trending in the world today?",
  "Show me the biggest stories of the day.",
  "What’s new in AI and machine learning?",
  "Any updates in space exploration?",
  "What’s trending in the tech industry?",
  "What’s new in business and finance?",
  "Any stock market updates today?",
  "Any sports highlights today?",
  "What’s new in football and cricket?",
  "What’s happening in world politics?",
  "Show me the latest science discoveries.",
  "Any new discoveries in medical research?",
  "What are today’s top stories?",
];

// Utility function to get 5 random unique user query recommendations
export const getUserQueryRecommendations = (count: number = 5): string[] => {
  const shuffled = [...USER_QUERIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};