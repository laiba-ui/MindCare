// components/ui/AnimatedCounter.tsx
// Counts up from its previous value to `value` whenever it changes — used by
// StatCard and any other "analytics" style number that should feel alive.
// Implemented with a plain requestAnimationFrame loop (not native-thread
// reanimated text tricks) so it behaves identically and reliably on web,
// iOS, and Android.

import { useEffect, useRef, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

type Props = {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: TextStyle | TextStyle[];
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedCounter({
  value, duration = 800, decimals = 0, prefix = '', suffix = '', style,
}: Props) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    const start = Date.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <Text style={style}>{prefix}{display.toFixed(decimals)}{suffix}</Text>
  );
}
