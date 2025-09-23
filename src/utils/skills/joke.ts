import randomConversation from '@/utils/RandomConversation';

export default async function jokeSkill() {
  const text = randomConversation.getHumorousResponse();
  return { text, shouldSpeak: true };
}


