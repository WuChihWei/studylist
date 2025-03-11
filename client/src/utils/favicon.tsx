import { Material } from '../types/User';
import { FiBook, FiVideo } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { RiEarthFill } from "react-icons/ri";
import React from 'react';

// TYPE_ICONS mapping - constants
export const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

/**
 * Get favicon URL from material URL
 * @param url Material URL
 * @returns Favicon URL
 */
export const getFavicon = (url: string): string => {
  try {
    // Simple URL validation
    if (!url || !url.includes('.')) {
      return '';
    }
    
    // Domain-specific handling for common sites
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'https://www.youtube.com/favicon.ico';
    }
    
    if (url.includes('github.com')) {
      return 'https://github.com/favicon.ico';
    }
    
    if (url.includes('notion.so')) {
      return 'https://www.notion.so/favicon.ico';
    }
    
    if (url.includes('wikipedia.org')) {
      return 'https://wikipedia.org/favicon.ico';
    }
    
    try {
      // Try proper URL parsing first
      const domain = new URL(url).hostname;
      
      // Return Google's favicon service URL
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      // If URL parsing fails, try to extract domain with regex
      const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im);
      const domain = match ? match[1] : url;
      
      // Return Google's favicon service URL
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    }
  } catch (err) {
    return '';
  }
};

/**
 * Helper to get the appropriate type-based icon component
 * @param material Material object
 * @returns Icon component
 */
export const getIconComponent = (material: Material) => {
  const materialType = material.type || 'webpage';
  
  // Map material types to icon components, with fallbacks
  switch (materialType) {
    case 'video':
      return FiVideo;
    case 'book':
      return FiBook;
    case 'podcast':
      return HiOutlineMicrophone;
    case 'webpage':
      return LuGlobe;
    default:
      return RiEarthFill;
  }
};

/**
 * Render material favicon with fallback to type icon
 * @param material Material object
 * @returns JSX element
 */
export const renderFavicon = (material: Material) => {
  // Get the appropriate icon component based on material type for fallback
  const IconComponent = getIconComponent(material);
  
  // Determine favicon source
  let faviconSrc = '';
  if (material.favicon) {
    // Use favicon from material if available
    faviconSrc = material.favicon;
  } else if (material.url) {
    // Generate favicon from URL
    faviconSrc = getFavicon(material.url);
  }
  
  return (
    <div className="mr-2 flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-50 rounded-full relative">
      {/* Fallback icon will be shown if the image fails to load */}
      <IconComponent className="absolute w-4 h-4 text-gray-600 opacity-0 fallback-icon" />
      
      {faviconSrc ? (
        // Try to load the favicon with error handling
        <img 
          src={faviconSrc} 
          alt={`${material.title} favicon`} 
          className="w-4 h-4 object-contain z-10"
          onError={(e) => {
            // Hide the failed image
            e.currentTarget.style.display = 'none';
            
            // Show the fallback icon
            const parent = e.currentTarget.parentElement;
            if (parent) {
              const fallbackIcon = parent.querySelector('.fallback-icon');
              if (fallbackIcon instanceof HTMLElement) {
                fallbackIcon.style.opacity = '1';
              }
            }
          }}
        />
      ) : (
        // No favicon source, show the type icon directly
        <IconComponent className="w-4 h-4 text-gray-600" />
      )}
    </div>
  );
};

// CSS styles for favicons
export const FAVICON_STYLES = {
  fallbackIcon: `
    .mr-2 {
      position: relative;
    }
    img.object-contain:not([src]), 
    img.object-contain[src=""], 
    img.object-contain[src="undefined"], 
    img.object-contain[src="null"] {
      display: none !important;
    }
    img.object-contain:not([src]) ~ .fallback-icon, 
    img.object-contain[src=""] ~ .fallback-icon, 
    img.object-contain[src="undefined"] ~ .fallback-icon, 
    img.object-contain[src="null"] ~ .fallback-icon, 
    img.object-contain.error ~ .fallback-icon {
      opacity: 1 !important;
    }
  `,
  showFallback: `
    .show-fallback .fallback-icon {
      display: block !important;
    }
  `
}; 