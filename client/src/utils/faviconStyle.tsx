import React from 'react';
import { FAVICON_STYLES } from './favicon';

export const FaviconStyleProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.fallbackIcon }} />
      <style dangerouslySetInnerHTML={{ __html: FAVICON_STYLES.showFallback }} />
      {children}
    </>
  );
}; 