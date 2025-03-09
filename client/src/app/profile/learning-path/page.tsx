'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useFirebase } from '@/app/firebase/FirebaseProvider';
import LearningPathFlow from '@/app/components/LearningPathFlow';
import { Node, Edge } from 'reactflow';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function LearningPathPage() {
  const { userData, saveLearningPath, getLearningPath } = useUserData();
  const { auth } = useFirebase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams ? searchParams.get('topicId') : null;
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [savedNodes, setSavedNodes] = useState<Node[]>([]);
  const [savedEdges, setSavedEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 獲取當前主題的材料
  useEffect(() => {
    if (userData && topicId) {
      const currentTopic = userData.topics?.find(t => t._id === topicId);
      
      if (currentTopic) {
        // 檢查是否使用新的數據結構
        if (currentTopic.materials) {
          setMaterials(currentTopic.materials.map((material, index) => ({
            ...material,
            index: index + 1
          })));
        } 
        // 使用舊的數據結構
        else if (currentTopic.categories) {
          const allMaterials = [
            ...(currentTopic.categories.webpage || []),
            ...(currentTopic.categories.video || []),
            ...(currentTopic.categories.podcast || []),
            ...(currentTopic.categories.book || [])
          ].map((material, index) => ({
            ...material,
            index: index + 1
          }));
          
          setMaterials(allMaterials);
        }
      }
    }
  }, [userData, topicId]);
  
  // 獲取保存的學習路徑
  useEffect(() => {
    let isMounted = true;
    let hasAttempted = false;
    
    const fetchLearningPath = async () => {
      if (!auth.currentUser || !topicId || hasAttempted) return;
      
      hasAttempted = true;
      setIsLoading(true);
      
      try {
        const learningPath = await getLearningPath(topicId);
        
        if (isMounted) {
          if (learningPath && learningPath.nodes && learningPath.nodes.length > 0) {
            setSavedNodes(learningPath.nodes);
            setSavedEdges(learningPath.edges);
          } else {
            // 如果沒有學習路徑或者節點為空，設置為空數組
            setSavedNodes([]);
            setSavedEdges([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch learning path:', error);
        if (isMounted) {
          toast.error('無法獲取學習路徑，請稍後再試');
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
  }, [auth.currentUser, topicId]);
  
  // 處理保存學習路徑
  const handleSavePath = async (nodes: Node[], edges: Edge[]) => {
    if (!topicId) return;
    
    try {
      const success = await saveLearningPath(topicId, nodes, edges);
      
      if (success) {
        toast.success('學習路徑已保存');
      } else {
        toast.error('保存學習路徑失敗');
      }
    } catch (error) {
      console.error('Failed to save learning path:', error);
      toast.error('保存學習路徑時出錯');
    }
  };
  
  // 返回主題頁面
  const handleBack = () => {
    if (topicId) {
      router.push(`/profile?tab=${topicId}`);
    } else {
      router.push('/profile');
    }
  };
  
  // 獲取當前主題名稱
  const getTopicName = () => {
    if (userData && topicId) {
      const currentTopic = userData.topics?.find(t => t._id === topicId);
      return currentTopic?.name || '學習路徑';
    }
    return '學習路徑';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">{getTopicName()} - 學習路徑</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <LearningPathFlow 
            materials={materials}
            onSavePath={handleSavePath}
            savedNodes={savedNodes.length > 0 ? savedNodes : undefined}
            savedEdges={savedEdges.length > 0 ? savedEdges : undefined}
          />
        )}
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>提示：</p>
        <ul className="list-disc pl-5 mt-2">
          <li>拖動節點可以調整位置</li>
          <li>連接節點：點擊節點底部的小圓點並拖動到另一個節點頂部的小圓點</li>
          <li>刪除連接：選中連接線並按 Delete 鍵</li>
          <li>自動佈局：點擊右上角的「自動佈局」按鈕</li>
          <li>完成後點擊「保存路徑」按鈕保存您的學習路徑</li>
        </ul>
      </div>
    </div>
  );
} 