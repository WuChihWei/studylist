import { Node, Edge } from 'reactflow';
import { Material } from './User';

export interface LearningPath {
  nodes: Node[];
  edges: Edge[];
  topicId: string;
}

export interface PathNodeData {
  label: string;
  type: string;
  materialId: string;
  favicon?: string | null;
  url?: string | null;
  completed?: boolean;
}

export interface MaterialNodeProps {
  data: PathNodeData;
} 