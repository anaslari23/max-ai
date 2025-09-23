import weatherService from '@/utils/WeatherService';

export default async function weatherSkill(args: { location?: string }) {
  const location = (args.location || '').trim();
  if (!location) {
    return { text: 'Which location should I check the weather for?', shouldSpeak: true };
  }
  try {
    const data = await weatherService.getWeather(location);
    const text = weatherService.generateWeatherResponse(data);
    return { text, shouldSpeak: true };
  } catch (e) {
    return { text: "I couldn't fetch weather right now. Please try again later.", shouldSpeak: true };
  }
}


