export interface Point { x: number; y: number; }
export interface Camera { x: number; y: number; scale: number; }

export function screenToWorld(screen: Point, camera: Camera): Point {
  return { 
    x: (screen.x - camera.x) / camera.scale, 
    y: (screen.y - camera.y) / camera.scale 
  };
}

export function worldToScreen(world: Point, camera: Camera): Point {
  return { 
    x: world.x * camera.scale + camera.x, 
    y: world.y * camera.scale + camera.y 
  };
}

export function zoomToward(camera: Camera, factor: number, screenPoint: Point): Camera {
  const worldPoint = screenToWorld(screenPoint, camera);
  const newScale = Math.max(0.1, Math.min(5, camera.scale * factor));
  return {
    x: screenPoint.x - worldPoint.x * newScale,
    y: screenPoint.y - worldPoint.y * newScale,
    scale: newScale,
  };
}
