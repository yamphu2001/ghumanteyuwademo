export type HandPreference = 'left' | 'right' | 'center';

export const getLayout = (hand: HandPreference, eventId: string) => {
  const isLeft = hand === 'left';
  const isRight = hand === 'right';
  const isCenter = hand === 'center';

  return {
    anchor: isLeft 
      ? { bottom: '20px', left: '20px' } 
      : isRight 
      ? { bottom: '20px', right: '20px' } 
      : { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
    
    alignment: isCenter ? 'centerAlign' : isLeft ? 'leftAlign' : 'rightAlign',

    qr: {
      x: isCenter ? 0 : isLeft ? 20 : -20,
      y: -20
    },
    
    items: [
      { 
        iconName: 'Trophy' as const, 
        x: isCenter ? -110 : isLeft ? 40 : -40,
        y: isCenter ? -130 : -200, 
        path: `/eventsmaker/${eventId}/profile` 
      },
      { 
        iconName: 'User' as const, 
        x: isCenter ? 0 : isLeft ? 140 : -140,
        y: isCenter ? -180 : -160, 
        path: `/eventsmaker/${eventId}/profile` 
      },
      { 
        iconName: 'Home' as const, 
        x: isCenter ? 110 : isLeft ? 210 : -210,
        y: isCenter ? -130 : -60, 
        path: `/play` 
      },
    ]
  };
};