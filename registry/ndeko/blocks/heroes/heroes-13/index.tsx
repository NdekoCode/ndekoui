import { Abilities } from './abilities';
import { Chat } from './chat';
import { Hero } from './hero';
import { PointBackdrop } from './point-backdrop';
import { POINT_STOPS } from './point-stops';

export default function Heroes13() {
  return (
    <div className='relative isolate flex min-h-screen flex-col'>
      <PointBackdrop stops={POINT_STOPS} />
      <main className='relative z-10 flex-1'>
        <Hero />
        <Chat />
        <Abilities />
      </main>
    </div>
  );
}
