// src/ai/flows/ai-enhanced-assassin-target.ts
'use server';

/**
 * @fileOverview An AI-enhanced assassin target selection agent.
 *
 * - aiEnhancedAssassinTarget - A function that determines the most influential player for the assassin to target.
 * - AiEnhancedAssassinTargetInput - The input type for the aiEnhancedAssassinTarget function.
 * - AiEnhancedAssassinTargetOutput - The return type for the aiEnhancedAssassinTarget function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiEnhancedAssassinTargetInputSchema = z.object({
  players: z
    .array(z.string())
    .describe('An array of player names in the game.'),
  pastGameData: z.string().describe('Game transcript from chat of what happened in the game.'),
});
export type AiEnhancedAssassinTargetInput = z.infer<typeof AiEnhancedAssassinTargetInputSchema>;

const AiEnhancedAssassinTargetOutputSchema = z.object({
  target: z
    .string()
    .describe('The name of the player the assassin should target.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind choosing this player as the target.'),
});
export type AiEnhancedAssassinTargetOutput = z.infer<typeof AiEnhancedAssassinTargetOutputSchema>;

export async function aiEnhancedAssassinTarget(
  input: AiEnhancedAssassinTargetInput
): Promise<AiEnhancedAssassinTargetOutput> {
  return aiEnhancedAssassinTargetFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiEnhancedAssassinTargetPrompt',
  input: {schema: AiEnhancedAssassinTargetInputSchema},
  output: {schema: AiEnhancedAssassinTargetOutputSchema},
  prompt: `You are the game master for Avalon. Based on the game transcript and player list, determine who is the most influential player for the assassin to target. Influential players could be those who lead successful quests, influenced decisions, or are suspected of being Merlin.

Players: {{players}}
Game Transcript: {{pastGameData}}

Target the player that is most likely Merlin or has had the most impact on the game.

Return your answer in JSON format.
`,
});

const aiEnhancedAssassinTargetFlow = ai.defineFlow(
  {
    name: 'aiEnhancedAssassinTargetFlow',
    inputSchema: AiEnhancedAssassinTargetInputSchema,
    outputSchema: AiEnhancedAssassinTargetOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
