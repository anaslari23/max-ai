Skills framework

Each skill exports a default async function:

  (args: Record<string, any>) => Promise<{ text: string; shouldSpeak?: boolean }>

And may export a descriptor with metadata:

  export const skill: { name: string; description: string; intents: string[] }


