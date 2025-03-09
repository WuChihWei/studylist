'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Connection,
  EdgeChange,
  NodeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Material } from '@/types/User';
import { FiBook, FiVideo } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// 自定義節點類型
import MaterialNode from './MaterialNode';

// 註冊自定義節點類型
const nodeTypes = {
  materialNode: MaterialNode,
};

// 定義節點類型對應的圖標
const TYPE_ICONS = {
  video: FiVideo,
  book: FiBook,
  podcast: HiOutlineMicrophone,
  webpage: LuGlobe
};

interface LearningPathFlowProps {
  materials: (Material & { index: number })[];
  onSavePath: (nodes: Node[], edges: Edge[]) => void;
  savedNodes?: Node[];
  savedEdges?: Edge[];
}

function LearningPathFlowContent({
  materials,
  onSavePath,
  savedNodes,
  savedEdges
}: LearningPathFlowProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const { fitView } = useReactFlow();

  // 初始化節點和邊
  useEffect(() => {
    if (savedNodes && savedEdges) {
      // 如果有保存的節點和邊，則使用它們
      setNodes(savedNodes);
      setEdges(savedEdges);
    } else {
      // 否則，根據材料創建新的節點
      const initialNodes: Node[] = materials.map((material, index) => ({
        id: material._id || `node-${index}`,
        type: 'materialNode',
        position: { x: 100 + (index % 3) * 200, y: 100 + Math.floor(index / 3) * 150 },
        data: {
          label: material.title,
          type: material.type,
          favicon: material.favicon,
          url: material.url,
          completed: material.completed
        }
      }));

      setNodes(initialNodes);
      setEdges([]);
    }
  }, [materials, savedNodes, savedEdges]);

  // 自動調整視圖
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 100);
    }
  }, [nodes, fitView]);

  // 處理節點變化
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // 處理邊變化
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  // 處理連接
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)),
    []
  );

  // 自動佈局
  const handleAutoLayout = useCallback(() => {
    setIsLayouting(true);
    
    // 簡單的自動佈局算法
    const newNodes = [...nodes];
    const levels: { [key: string]: number } = {};
    
    // 計算每個節點的入度
    const inDegree: { [key: string]: number } = {};
    nodes.forEach(node => {
      inDegree[node.id] = 0;
    });
    
    edges.forEach(edge => {
      if (edge.target) {
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
    });
    
    // 找出入度為 0 的節點作為起始節點
    const queue = nodes
      .filter(node => inDegree[node.id] === 0)
      .map(node => node.id);
    
    // 如果沒有入度為 0 的節點，則選擇第一個節點
    if (queue.length === 0 && nodes.length > 0) {
      queue.push(nodes[0].id);
    }
    
    // 使用 BFS 計算每個節點的層級
    let level = 0;
    while (queue.length > 0) {
      const size = queue.length;
      for (let i = 0; i < size; i++) {
        const nodeId = queue.shift()!;
        levels[nodeId] = level;
        
        // 找出從該節點出發的所有邊
        const outEdges = edges.filter(edge => edge.source === nodeId);
        outEdges.forEach(edge => {
          if (edge.target) {
            queue.push(edge.target);
          }
        });
      }
      level++;
    }
    
    // 根據層級設置節點位置
    const levelCounts: { [key: number]: number } = {};
    newNodes.forEach(node => {
      const nodeLevel = levels[node.id] || 0;
      levelCounts[nodeLevel] = (levelCounts[nodeLevel] || 0) + 1;
      
      const position = {
        x: 100 + (levelCounts[nodeLevel] - 1) * 200,
        y: 100 + nodeLevel * 150
      };
      
      node.position = position;
    });
    
    setNodes(newNodes);
    
    setTimeout(() => {
      fitView({ padding: 0.2 });
      setIsLayouting(false);
    }, 500);
  }, [nodes, edges, fitView]);

  // 保存學習路徑
  const handleSavePath = useCallback(() => {
    onSavePath(nodes, edges);
  }, [nodes, edges, onSavePath]);

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
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={handleAutoLayout}
                    disabled={isLayouting}
                  >
                    自動佈局
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>自動排列節點位置</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    onClick={handleSavePath}
                  >
                    保存路徑
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>保存當前學習路徑</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// 包裝組件以提供 ReactFlow 上下文
export default function LearningPathFlow(props: LearningPathFlowProps) {
  return (
    <ReactFlowProvider>
      <LearningPathFlowContent {...props} />
    </ReactFlowProvider>
  );
} 