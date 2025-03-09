import { useState, useCallback, useEffect } from 'react';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, addEdge, Connection, NodeChange, EdgeChange } from 'reactflow';
import { useUserData } from './useUserData';
import { Material } from '@/types/User';
import { toast } from 'sonner';

export function useLearningPath(topicId: string | null, materials: (Material & { index: number })[]) {
  const { getLearningPath, saveLearningPath } = useUserData();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch learning path data
  useEffect(() => {
    let isMounted = true;
    
    const fetchPath = async () => {
      if (!topicId) return;
      
      setIsLoading(true);
      
      try {
        const learningPath = await getLearningPath(topicId);
        
        if (isMounted && learningPath) {
          if (learningPath.nodes && learningPath.nodes.length > 0) {
            setNodes(learningPath.nodes);
            setEdges(learningPath.edges || []);
          } else {
            setNodes([]);
            setEdges([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch learning path:', error);
        if (isMounted) {
          toast.error('Failed to load learning path. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchPath();
    
    return () => {
      isMounted = false;
    };
  }, [topicId, getLearningPath]);

  // Handle node changes
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Handle connect nodes
  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  // Save learning path
  const handleSavePath = useCallback(async () => {
    if (!topicId) return false;
    
    try {
      const success = await saveLearningPath(topicId, nodes, edges);
      
      if (success) {
        toast.success('Learning path saved successfully');
        return true;
      } else {
        toast.error('Failed to save learning path');
        return false;
      }
    } catch (error) {
      console.error('Error saving learning path:', error);
      toast.error('Error occurred while saving learning path');
      return false;
    }
  }, [topicId, nodes, edges, saveLearningPath]);

  return {
    nodes,
    edges,
    isLoading,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
    handleSavePath
  };
} 