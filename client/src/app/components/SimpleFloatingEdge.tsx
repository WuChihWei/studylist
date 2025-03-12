import React, { CSSProperties } from 'react';
import { EdgeProps, getSmoothStepPath, BaseEdge } from 'reactflow';

import { getEdgeParams } from './EdgeUtils';

export default function SimpleFloatingEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  sourceHandleId,
  targetHandleId,
}: EdgeProps) {
  const edgeParams = getEdgeParams(sourceX, sourceY, targetX, targetY);
  const [edgePath] = getSmoothStepPath({
    sourceX: edgeParams.sx,
    sourceY: edgeParams.sy,
    sourcePosition: edgeParams.sourcePos,
    targetX: edgeParams.tx,
    targetY: edgeParams.ty,
    targetPosition: edgeParams.targetPos,
    borderRadius: 16,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: data?.strokeWidth || 2,
        stroke: data?.stroke || '#555',
        strokeDasharray: data?.strokeDasharray,
      }}
    />
  );
} 