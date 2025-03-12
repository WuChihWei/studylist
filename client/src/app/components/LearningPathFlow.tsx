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
  ReactFlowProvider,
  EdgeTypes,
  MarkerType,
  ConnectionMode
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Material } from '@/types/User';
import { FiBook, FiVideo } from "react-icons/fi";
import { HiOutlineMicrophone } from "react-icons/hi";
import { LuGlobe } from "react-icons/lu";
import { Button } from "@/app/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";

// 自定義節點類型
import MaterialNode from './MaterialNode';
import SimpleFloatingEdge from './SimpleFloatingEdge';
import { MainEdge, SubEdge } from './EdgeTypes';

// 註冊自定義節點類型
const nodeTypes = {
  materialNode: MaterialNode,
};

// 註冊自定義邊線類型
const edgeTypes: EdgeTypes = {
  mainEdge: MainEdge,
  subEdge: SubEdge,
  floating: SimpleFloatingEdge,
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
  const [nodeSize, setNodeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [edgeType, setEdgeType] = useState<'floating' | 'mainEdge' | 'subEdge'>('floating');
  const { fitView } = useReactFlow();

  // 初始化節點和邊
  useEffect(() => {
    if (savedNodes && savedEdges) {
      // 如果有保存的節點和邊，則使用它們
      // 更新節點大小
      const updatedNodes = savedNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          size: nodeSize
        }
      }));
      setNodes(updatedNodes);
      setEdges(savedEdges);
    } else {
      // 否則，根據材料創建新的節點 - 水平布局
      const initialNodes: Node[] = materials.map((material, index) => ({
        id: material._id || `node-${index}`,
        type: 'materialNode',
        position: { 
          // 排列成水平布局 (每行 3 個節點)
          x: 100 + Math.floor(index / 3) * 300, 
          y: 100 + (index % 3) * 150 
        },
        data: {
          label: material.title,
          type: material.type,
          favicon: material.favicon,
          url: material.url,
          completed: material.completed,
          size: nodeSize
        }
      }));

      setNodes(initialNodes);
      setEdges([]);
    }
  }, [materials, savedNodes, savedEdges, nodeSize]);

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
    (connection: Connection) => {
      // Create a unique id based on source and target
      const newEdge = {
        ...connection,
        animated: false,
        type: edgeType,
        id: `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        markerEnd: { type: MarkerType.ArrowClosed }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [edgeType]
  );

  // 更新節點大小
  const handleNodeSizeChange = (size: 'small' | 'medium' | 'large') => {
    setNodeSize(size);
    
    // 更新現有節點的大小
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        size
      }
    })));
  };

  // 更新邊線類型
  const handleEdgeTypeChange = (type: 'floating' | 'mainEdge' | 'subEdge') => {
    setEdgeType(type);
  };

  // 自動佈局
  const handleAutoLayout = useCallback(() => {
    setIsLayouting(true);
    
    // 可彈性布局算法 - 支持多方向連接
    const newNodes = [...nodes];
    
    // 計算每個節點的入度和出度
    const inDegree: { [key: string]: number } = {};
    const outDegree: { [key: string]: number } = {};
    
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      outDegree[node.id] = 0;
    });
    
    edges.forEach(edge => {
      if (edge.target) {
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
      if (edge.source) {
        outDegree[edge.source] = (outDegree[edge.source] || 0) + 1;
      }
    });
    
    // 找出入度為 0 的節點作為起始節點
    let rootNodes = nodes.filter(node => inDegree[node.id] === 0);
    
    // 如果沒有入度為 0 的節點，選擇出度最高的節點
    if (rootNodes.length === 0 && nodes.length > 0) {
      const maxOutDegree = Math.max(...Object.values(outDegree));
      rootNodes = nodes.filter(node => outDegree[node.id] === maxOutDegree);
    }
    
    // 使用更靈活的布局策略
    if (rootNodes.length > 0) {
      // 從根節點開始，使用力導向算法的簡化版
      const visited: { [key: string]: boolean } = {};
      const nodePositions: { [key: string]: { x: number, y: number } } = {};
      
      // 設置根節點位置
      rootNodes.forEach((node, index) => {
        nodePositions[node.id] = {
          x: 100,
          y: 100 + index * 150
        };
        visited[node.id] = true;
      });
      
      // 遞迴函數來布局其餘節點
      const layoutConnectedNodes = (nodeId: string, level: number, position: { x: number, y: number }) => {
        // 找出從該節點出發的所有邊
        const outEdges = edges.filter(edge => edge.source === nodeId);
        
        // 計算布局位置
        outEdges.forEach((edge, index) => {
          if (!edge.target || visited[edge.target]) return;
          
          // 根據連接的 handle 決定布局方向
          let nextPos = { ...position };
          
          // 檢查連接是從哪個 handle 來的，決定布局方向
          if (edge.sourceHandle?.includes('right')) {
            // 向右布局
            nextPos.x += 300;
            nextPos.y += (index - outEdges.length / 2) * 150;
          } else if (edge.sourceHandle?.includes('bottom')) {
            // 向下布局
            nextPos.y += 200;
            nextPos.x += (index - outEdges.length / 2) * 200;
          } else if (edge.sourceHandle?.includes('left')) {
            // 向左布局
            nextPos.x -= 300;
            nextPos.y += (index - outEdges.length / 2) * 150;
          } else {
            // 向上或默認布局，默認向右
            nextPos.x += 300;
            nextPos.y += (index - outEdges.length / 2) * 150;
          }
          
          nodePositions[edge.target] = nextPos;
          visited[edge.target] = true;
          
          // 繼續遞迴布局其連接的節點
          layoutConnectedNodes(edge.target, level + 1, nextPos);
        });
      };
      
      // 從每個根節點開始布局
      rootNodes.forEach(node => {
        layoutConnectedNodes(node.id, 0, nodePositions[node.id]);
      });
      
      // 布局沒有被訪問過的節點（孤立節點）
      let offsetX = 100;
      let offsetY = 100 + rootNodes.length * 200;
      
      nodes.forEach(node => {
        if (!visited[node.id]) {
          nodePositions[node.id] = {
            x: offsetX,
            y: offsetY
          };
          offsetX += 200;
          
          // 每行放置 3 個孤立節點
          if (offsetX > 700) {
            offsetX = 100;
            offsetY += 150;
          }
        }
      });
      
      // 應用新的節點位置
      newNodes.forEach(node => {
        if (nodePositions[node.id]) {
          node.position = nodePositions[node.id];
        }
      });
    } else {
      // 如果沒有任何節點，使用網格布局
      newNodes.forEach((node, index) => {
        node.position = {
          x: 100 + (index % 4) * 250,
          y: 100 + Math.floor(index / 4) * 150
        };
      });
    }
    
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

  const fitViewOptions = { padding: 4 };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'floating' }}
        fitView
        fitViewOptions={fitViewOptions}
        connectionMode={ConnectionMode.Loose}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <div className="flex flex-col gap-2 bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              <div className="text-sm mr-1">節點大小:</div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant={nodeSize === 'small' ? 'default' : 'outline'} 
                  onClick={() => handleNodeSizeChange('small')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  小
                </Button>
                <Button 
                  size="sm" 
                  variant={nodeSize === 'medium' ? 'default' : 'outline'} 
                  onClick={() => handleNodeSizeChange('medium')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  中
                </Button>
                <Button 
                  size="sm" 
                  variant={nodeSize === 'large' ? 'default' : 'outline'} 
                  onClick={() => handleNodeSizeChange('large')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  大
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm mr-1">連線類型:</div>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant={edgeType === 'floating' ? 'default' : 'outline'} 
                  onClick={() => handleEdgeTypeChange('floating')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  標準
                </Button>
                <Button 
                  size="sm" 
                  variant={edgeType === 'mainEdge' ? 'default' : 'outline'} 
                  onClick={() => handleEdgeTypeChange('mainEdge')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  主要連線
                </Button>
                <Button 
                  size="sm" 
                  variant={edgeType === 'subEdge' ? 'default' : 'outline'} 
                  onClick={() => handleEdgeTypeChange('subEdge')}
                  className="h-7 px-2 py-1 text-xs"
                >
                  次要連線
                </Button>
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={handleAutoLayout}
                      disabled={isLayouting}
                      className="h-8"
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
                      className="h-8"
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