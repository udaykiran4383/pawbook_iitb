'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

/**
 * Light/dark switch.
 *
 * The dark palette has existed in globals.css since the beginning and could
 * never appear: nothing mounted the provider, so `.dark` was never set on any
 * element. This is the control that makes it reachable.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // The server cannot know the visitor's theme, so render a stable placeholder
  // until we are on the client. Without this the icon mismatches on hydration.
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Switch colour theme'}
      title={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : undefined}
      className="fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-card border border-border shadow-sm hover:shadow-md active:scale-95 transition flex items-center justify-center text-foreground"
    >
      {/* Both icons are always in the DOM; only the visible one changes, so the
          server and client render the same tree. */}
      {mounted && isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
