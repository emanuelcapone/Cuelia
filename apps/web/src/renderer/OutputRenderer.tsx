import type { OutputProfile, Slide } from '../../../../packages/contracts/src/index';
/** Pure rendering boundary; live state and reconnection belong to the realtime adapter. */
export function OutputRenderer({ profile, slide, waitingLabel }: { profile: OutputProfile; slide: Slide | null; waitingLabel: string }) {
  return <main data-profile={profile} className="flex min-h-screen items-center justify-center bg-black p-12 text-center text-4xl whitespace-pre-line text-white">{slide?.text ?? waitingLabel}</main>;
}
