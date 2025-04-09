import { Element } from "@/interfaces/element";

export const defaultElement: Element[] = [
  {
    emoji: "🌱",
    text: "grass",
    discovered: true,
  },
  {
    emoji: "☀️",
    text: "sun",
    discovered: true,
  },
];

export const gameInstructions = `
Welcome to "Create Trump in 100 Steps"!

Game Rules:
1. Drag and drop emojis from the sidebar to the canvas
2. Combine two emojis by dragging one onto another
3. Each combination counts as one step
4. Try to create Trump (👨‍💼) within 100 steps
5. If you fail to create Trump in 100 steps, game over!

Hint: Try combining elements in different ways to discover new combinations!
`;
