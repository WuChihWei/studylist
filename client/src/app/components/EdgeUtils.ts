import { Position } from 'reactflow';

// Returns the position (top, right, bottom or left) of a handle with the given id
function getHandlePosition(handleId: string | null): Position {
  // Direct position mapping based on handle ID
  if (handleId === 'top') return Position.Top;
  if (handleId === 'right') return Position.Right;
  if (handleId === 'bottom') return Position.Bottom;
  if (handleId === 'left') return Position.Left;

  // Default fallback for nodes with handles on all sides
  return Position.Top;
}

// This helper function returns the parameters for drawing a smooth edge
export function getEdgeParams(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceHandleId?: string | null,
  targetHandleId?: string | null
) {
  // Get the source and target positions based on the handle IDs
  const sourcePos = sourceHandleId ? getHandlePosition(sourceHandleId) : Position.Bottom;
  const targetPos = targetHandleId ? getHandlePosition(targetHandleId) : Position.Top;

  return {
    sx: sourceX,
    sy: sourceY,
    tx: targetX,
    ty: targetY,
    sourcePos,
    targetPos,
  };
} 