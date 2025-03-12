import React, { useState, useEffect } from 'react';
import { Material } from '@/types/User';
import LearningPathFlow from './LearningPathFlow';
import { Node, Edge } from 'reactflow';
import { useUserData } from '@/hooks/useUserData';
import { toast } from 'sonner';

interface LearningPathTabProps {
  materials: (Material & { index: number })[];
  topicId: string;
}

const LearningPathTab: React.FC<LearningPathTabProps> = ({
  materials,
  topicId
}) => {
  const { saveLearningPath, getLearningPath } = useUserData();
  const [savedNodes, setSavedNodes] = useState<Node[]>([]);
  const [savedEdges, setSavedEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取保存的学习路径
  useEffect(() => {
    let isMounted = true;
    
    const fetchLearningPath = async () => {
      if (!topicId) return;
      
      setIsLoading(true);
      
      try {
        const learningPath = await getLearningPath(topicId);
        
        if (isMounted) {
          if (learningPath && learningPath.nodes && learningPath.nodes.length > 0) {
            setSavedNodes(learningPath.nodes);
            setSavedEdges(learningPath.edges);
          } else {
            setSavedNodes([]);
            setSavedEdges([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch learning path:', error);
        if (isMounted) {
          toast.error('无法获取学习路径，请稍后再试');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchLearningPath();
    
    return () => {
      isMounted = false;
    };
  }, [topicId]);

  // 处理保存学习路径
  const handleSavePath = async (nodes: Node[], edges: Edge[]) => {
    if (!topicId) return;
    
    try {
      const success = await saveLearningPath(topicId, nodes, edges);
      
      if (success) {
        toast.success('学习路径已保存');
      } else {
        toast.error('保存学习路径失败');
      }
    } catch (error) {
      console.error('Failed to save learning path:', error);
      toast.error('保存学习路径时出错');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 transition-all">
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh] md:h-[60vh] lg:h-[70vh]">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-[50vh] md:h-[60vh] lg:h-[70vh] w-full">
            <LearningPathFlow 
              materials={materials}
              onSavePath={handleSavePath}
              savedNodes={savedNodes.length > 0 ? savedNodes : undefined}
              savedEdges={savedEdges.length > 0 ? savedEdges : undefined}
            />
          </div>
        )}
      </div>
      
      {/* <div className="text-sm text-gray-500 bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-100 transition-all">
        <p className="font-medium">提示：</p>
        <ul className="list-disc pl-4 md:pl-5 mt-2 space-y-1">
          <li>拖动节点可以调整位置</li>
          <li>连接节点：点击节点底部的小圆点并拖动到另一个节点顶部的小圆点</li>
          <li>删除连接：选中连接线并按 Delete 键</li>
          <li>自动布局：点击右上角的「自动布局」按钮</li>
          <li>完成后点击「保存路径」按钮保存您的学习路径</li>
        </ul>
      </div> */}
    </div>
  );
};

export default LearningPathTab; 