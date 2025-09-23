import directionsService from '@/utils/DirectionsService';

export default async function directionsSkill(args: { from?: string; to?: string }) {
  const from = (args.from || '').trim();
  const to = (args.to || '').trim();
  if (!to && !from) {
    return { text: 'Where would you like to go?', shouldSpeak: true };
  }
  try {
    const res = await directionsService.getDirections(from || 'current location', to);
    const text = directionsService.generateDirectionsResponse(res);
    return { text, shouldSpeak: true };
  } catch (e) {
    return { text: "I couldn't get directions right now. Please try again later.", shouldSpeak: true };
  }
}


