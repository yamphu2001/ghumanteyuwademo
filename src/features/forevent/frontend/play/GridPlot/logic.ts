const GRID_SIZE = 0.0002; 

export const getCellId = (lng: number, lat: number): string => {
  const x = Math.floor(lng / GRID_SIZE);
  const y = Math.floor(lat / GRID_SIZE);
  return `${x}_${y}`;
};

export const generateCellPolygon = (lng: number, lat: number): number[][][] => {
  const x = Math.floor(lng / GRID_SIZE) * GRID_SIZE;
  const y = Math.floor(lat / GRID_SIZE) * GRID_SIZE;

  return [[
    [x, y],
    [x + GRID_SIZE, y],
    [x + GRID_SIZE, y + GRID_SIZE],
    [x, y + GRID_SIZE],
    [x, y]
  ]];
};

export const simulateMovement = (lng: number, lat: number) => {
  const step = 0.00005; 
  return {
    lng: lng + (Math.random() - 0.5) * step,
    lat: lat + (Math.random() - 0.5) * step
  };
};