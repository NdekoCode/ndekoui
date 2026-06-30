'use client';

import { useEffect, useState } from 'react';

import { loadSearchIndex } from './search-index-store';
import { SearchPalette } from './search-palette';
import {
  isSlashShortcut,
  isToggleShortcut,
  useShortcutLabel,
} from './search-shortcuts';
import { SearchField, SearchIconButton } from './search-trigger';

export function SiteSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcutLabel = useShortcutLabel();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return;
      }
      if (isToggleShortcut(event)) {
        event.preventDefault();
        loadSearchIndex();
        setIsOpen((wasOpen) => !wasOpen);
        return;
      }
      if (isSlashShortcut(event)) {
        event.preventDefault();
        loadSearchIndex();
        setIsOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function openSearch() {
    loadSearchIndex();
    setIsOpen(true);
  }

  return (
    <>
      <SearchField shortcutLabel={shortcutLabel} onOpen={openSearch} />
      <SearchIconButton onOpen={openSearch} />
      <SearchPalette open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
