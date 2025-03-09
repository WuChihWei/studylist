import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Material } from '@/types/User';
import { FiBook, FiVideo } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { Button } from '@/app/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import PathNode from './PathNode';
import { useLearningPath } from '@/hooks/useLearningPath';

// Register custom node types
const nodeTypes = {
  materialNode: PathNode,
};

interface LearningPathFlowProps {
  materials: (Material & { index: number })[];
  topicId: string | null;
}

function LearningPathFlowContent({ materials, topicId }: LearningPathFlowProps) {
  const {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    handleSavePath
  } = useLearningPath(topicId, materials);
  
  const { fitView } = useReactFlow();
  const [isAutoLayoutRunning, setIsAutoLayoutRunning] = useState(false);

  // Auto-arrange nodes in a hierarchical layout
  const handleAutoLayout = useCallback(() => {
    if (nodes.length < 2) return;
    
    setIsAutoLayoutRunning(true);
    
    const newNodes = [...nodes];
    const ranks = computeNodeRanks(newNodes, edges);
    
    // Arrange nodes based on their ranks
    const levelWidth = 250;
    const levelHeight = 150;
    const nodesPerLevel: { [key: number]: number } = {};
    
    Object.entries(ranks).forEach(([nodeId, rank]) => {
      nodesPerLevel[rank] = (nodesPerLevel[rank] || 0) + 1;
    });
    
    newNodes.forEach((node) => {
      const nodeId = node.id;
      const rank = ranks[nodeId] || 0;
      const nodesOnThisLevel = nodesPerLevel[rank];
      const index = newNodes.filter(n => ranks[n.id] === rank).findIndex(n => n.id === nodeId);
      
      const levelWidthTotal = nodesOnThisLevel * 200;
      const startX = -(levelWidthTotal / 2) + 100;
      
      node.position = {
        x: startX + (index * 200),
        y: rank * levelHeight
      };
    });
    
    setNodes(newNodes);
    setTimeout(() => {
      fitView({ padding: 0.2 });
      setIsAutoLayoutRunning(false);
    }, 50);
  }, [nodes, edges, setNodes, fitView]);

  // Compute node ranks for hierarchical layout
  const computeNodeRanks = (nodes: any[], edges: any[]) => {
    const nodeRanks: { [key: string]: number } = {};
    const nodeIds = nodes.map(node => node.id);
    
    // Initialize all nodes with rank 0
    nodeIds.forEach(id => {
      nodeRanks[id] = 0;
    });
    
    // Build adjacency list
    const outgoingEdges: { [key: string]: string[] } = {};
    nodeIds.forEach(id => {
      outgoingEdges[id] = [];
    });
    
    edges.forEach(edge => {
      if (outgoingEdges[edge.source]) {
        outgoingEdges[edge.source].push(edge.target);
      }
    });
    
    // Compute ranks using topological sorting
    let changed = true;
    while (changed) {
      changed = false;
      
      edges.forEach(edge => {
        const sourceRank = nodeRanks[edge.source];
        const targetRank = nodeRanks[edge.target];
        
        if (targetRank <= sourceRank) {
          nodeRanks[edge.target] = sourceRank + 1;
          changed = true;
        }
      });
    }
    
    return nodeRanks;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
        
        <Panel position="top-right">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={isAutoLayoutRunning}
                    onClick={handleAutoLayout}
                  >
                    Auto Layout
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Automatically arrange nodes in a hierarchical layout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              size="sm" 
              onClick={handleSavePath}
            >
              Save Path
            </Button>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function LearningPathFlow(props: LearningPathFlowProps) {
  return (
    <ReactFlowProvider>
      <LearningPathFlowContent {...props} />
    </ReactFlowProvider>
  );
} 