/** Contratti condivisi: nessuna dipendenza da React, Fastify o storage. */
export type OutputProfile = 'main' | 'stage';
export interface Slide { id: string; text: string }
export interface SpeechToTextProvider {
  transcribe(audio: AsyncIterable<Uint8Array>, signal: AbortSignal): AsyncIterable<{ text: string; final: boolean }>;
}
export interface MediaStorage {
  read(key: string): Promise<Uint8Array>;
  write(key: string, data: Uint8Array): Promise<void>;
}
