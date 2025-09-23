export type SkillResult = { text: string; shouldSpeak?: boolean };

export interface SkillHandler {
  (args: Record<string, any>): Promise<SkillResult>;
}

// Lazy-load skills to keep bundle smaller
export async function runSkill(intent: string, entities: Record<string, any>): Promise<SkillResult | null> {
  try {
    switch (intent) {
      case 'weather': {
        const mod = await import('./weather');
        return mod.default(entities);
      }
      case 'directions': {
        const mod = await import('./directions');
        return mod.default(entities);
      }
      case 'time': {
        const now = new Date();
        return { text: `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`, shouldSpeak: true };
      }
      case 'date': {
        const now = new Date();
        return { text: `Today is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`, shouldSpeak: true };
      }
      case 'joke': {
        const mod = await import('./joke');
        return mod.default(entities);
      }
      case 'reminder': {
        const mod = await import('./reminder');
        return mod.default(entities);
      }
      case 'capabilities': {
        return { text: "I can converse, remember preferences, fetch information, manage tasks, control apps, and more.", shouldSpeak: true };
      }
      case 'identity': {
        return { text: "I'm Jarvis, your intelligent assistant. Always here to serve you.", shouldSpeak: true };
      }
      default:
        return null;
    }
  } catch (e) {
    console.error('Skill error:', e);
    return { text: "I encountered an error executing that skill.", shouldSpeak: true };
  }
}


