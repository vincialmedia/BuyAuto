import { useState, useEffect } from 'react';

/**
 * Custom hook to check if the component has mounted on the client side.
 * This is useful for preventing hydration mismatches when rendering content
 * that should only appear after the initial client-side render.
 * 
 * @returns {boolean} - true if the component has mounted, false otherwise
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
}
