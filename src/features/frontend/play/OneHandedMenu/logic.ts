export type HandPreference = 'left' | 'right' | 'center';

export const getLayout = (hand: HandPreference) => {
  const isLeft = hand === 'left';
  const isRight = hand === 'right';
  const isCenter = hand === 'center';

  // Button dimensions
  const SMALL_BUTTON = 70;
  const LARGE_BUTTON = 110;

  return {
    // Anchor positioning - using exact values from inline code
    anchor: isLeft 
      ? { bottom: '20px', left: '20px' } 
      : isRight 
      ? { bottom: '20px', right: '20px' } 
      : { bottom: '20px', left: '50%' },
    
    // Alignment class determines internal positioning
    alignment: isCenter ? 'centerAlign' : isLeft ? 'leftAlign' : 'rightAlign',

    // QR/Scan button positioning - exact values from inline code
    qr: {
      x: isCenter 
        ? 0                // Center: 0 (CSS centerAlign with -55px handles positioning)
        : isLeft 
          ? 20             // Left mode - don't change
          : -20,           // Right mode - don't change
      y: isCenter ? -20 : -20
    },
    
    // Menu items positioning - center uses raw positions (CSS centerAlign handles centering)
    items: [
      { 
        iconName: 'Settings' as const, 
        x: isCenter 
          ? -110           // Center: raw position (centerAlign CSS centers it)
          : isLeft 
            ? 40           // Left mode - don't change
            : -40,         // Right mode - don't change
        y: isCenter ? -130 : -200, 
        path: "/settings" 
      },
      { 
        iconName: 'Gift' as const, 
        x: isCenter 
          ? 0              // Center: raw position (centerAlign CSS centers it)
          : isLeft 
            ? 140          // Left mode - don't change
            : -140,        // Right mode - don't change
        y: isCenter ? -180 : -160, 
        path: "/eventsmaker" 
      },
      { 
        iconName: 'Home' as const, 
        x: isCenter 
          ? 110            // Center: raw position (centerAlign CSS centers it)
          : isLeft 
            ? 210          // Left mode - don't change
            : -210,        // Right mode - don't change
        y: isCenter ? -130 : -60, 
        path: "/" 
      },
    ]
  };
};