import { useState } from 'react';

function useActiveLink(initialLabel?: string) {
  const [activeLabel, setActiveLabel] = useState(initialLabel);

  function navigate(label: string) {
    setActiveLabel(label);
  }

  return { activeLabel, navigate };
}

export { useActiveLink };
