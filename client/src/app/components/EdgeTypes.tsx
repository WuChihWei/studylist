import React from 'react';
import { EdgeProps } from 'reactflow';
import SimpleFloatingEdge from './SimpleFloatingEdge';

// Main Connection Edge - Thick solid blue line
export function MainEdge(props: EdgeProps) {
  return (
    <SimpleFloatingEdge
      {...props}
      data={{
        ...props.data,
        strokeWidth: 3,
        stroke: '#2563eb'
      }}
    />
  );
}

// Sub Connection Edge - Thick dashed gray line
export function SubEdge(props: EdgeProps) {
  return (
    <SimpleFloatingEdge
      {...props}
      data={{
        ...props.data,
        strokeWidth: 3,
        stroke: '#6b7280',
        strokeDasharray: '6, 3'
      }}
    />
  );
} 