import persistentMemory from '@/utils/storage/PersistentMemory';

export default async function reminderSkill(args: { task?: string; amount?: string; unit?: string }) {
  const task = (args.task || '').trim();
  const amount = parseInt(args.amount || '0', 10);
  const unit = (args.unit || '').toLowerCase();

  if (!task) {
    return { text: 'What should I remind you about?', shouldSpeak: true };
  }

  let delayMs = 0;
  if (amount && unit) {
    const unitMap: Record<string, number> = {
      second: 1000,
      seconds: 1000,
      minute: 60_000,
      minutes: 60_000,
      hour: 3_600_000,
      hours: 3_600_000,
      day: 86_400_000,
      days: 86_400_000
    };
    delayMs = amount * (unitMap[unit] || 0);
  }

  const reminder = await persistentMemory.saveReminder({ task, dueAt: delayMs ? Date.now() + delayMs : 0 });

  if (delayMs > 0) {
    setTimeout(() => {
      // Fire-and-forget; a UI notification system could be hooked here
      console.log('Reminder:', task);
    }, delayMs);
    return { text: `Reminder set for ${task} in ${amount} ${unit}.`, shouldSpeak: true };
  }

  return { text: `I'll remember to ${task}.`, shouldSpeak: true };
}


