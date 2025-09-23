export type ParsedIntent = {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
};

/**
 * Lightweight NLU router.
 * Rules-first parser that extracts intents/entities before model fallback.
 */
export class NLURouter {
  public parse(input: string): ParsedIntent {
    const text = input.trim();
    const lower = text.toLowerCase();

    // Weather
    const weatherLoc = lower.match(/weather\s+(?:in|at|for)\s+([a-z\s]+)/i);
    if (/(weather|forecast|temperature)/i.test(lower)) {
      return {
        intent: 'weather',
        entities: {
          location: weatherLoc?.[1]?.trim() || ''
        },
        confidence: 0.9
      };
    }

    // Directions
    const dirRegex = /(?:directions|navigate|route)\s+(?:from\s+([a-z\s]+)\s+to\s+([a-z\s]+)|to\s+([a-z\s]+))/i;
    const dirMatch = lower.match(dirRegex);
    if (/(directions|navigate|route|how to get to)/i.test(lower)) {
      const from = (dirMatch?.[1] || '').trim();
      const to = (dirMatch?.[2] || dirMatch?.[3] || '').trim();
      return {
        intent: 'directions',
        entities: { from, to },
        confidence: 0.85
      };
    }

    // Time / Date
    if (/(what time|current time|time is it)/i.test(lower)) {
      return { intent: 'time', entities: {}, confidence: 0.95 };
    }
    if (/(what day|what is today|date)/i.test(lower)) {
      return { intent: 'date', entities: {}, confidence: 0.95 };
    }

    // Jokes
    if (/(joke|make me laugh|something funny)/i.test(lower)) {
      return { intent: 'joke', entities: {}, confidence: 0.9 };
    }

    // Reminders (simple)
    const remindMatch = lower.match(/remind\s+me\s+to\s+(.+?)(?:\s+in\s+(\d+)\s+(seconds?|minutes?|hours?|days?))?$/i);
    if (/\b(remind|reminder|set reminder|set alarm)\b/i.test(lower)) {
      return {
        intent: 'reminder',
        entities: {
          task: remindMatch?.[1]?.trim() || '',
          amount: remindMatch?.[2] || '',
          unit: remindMatch?.[3] || ''
        },
        confidence: 0.8
      };
    }

    // Identity / capabilities
    if (/(what can you do|capabilities|help)/i.test(lower)) {
      return { intent: 'capabilities', entities: {}, confidence: 0.8 };
    }
    if (/(who are you|your name|what are you)/i.test(lower)) {
      return { intent: 'identity', entities: {}, confidence: 0.8 };
    }

    // Default
    return { intent: 'unknown', entities: {}, confidence: 0.4 };
  }
}

const nluRouter = new NLURouter();
export default nluRouter;


