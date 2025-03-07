import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult,
  DraggableStateSnapshot
} from '@hello-pangea/dnd';
import { Material } from '@/types/User';
import styles from './DraggableList.module.css';

interface DraggableListProps {
  items: (Material & { index: number })[];
  onReorder: (reorderedItems: (Material & { index: number })[]) => void;
  renderItem: (item: Material & { index: number }, index: number) => React.ReactNode;
  droppableId: string;
}

// Export the handle type for TypeScript
export interface DraggableListHandle {
  restoreOriginalOrder: () => void;
}

const DraggableList = forwardRef<DraggableListHandle, DraggableListProps>(({ 
  items, 
  onReorder, 
  renderItem, 
  droppableId 
}, ref) => {
  // 使用本地狀態來跟踪拖拽後的項目順序
  const [localItems, setLocalItems] = useState(items);
  // 添加一個狀態來追踪重新排序的操作
  const [dragCompleted, setDragCompleted] = useState(false);
  // 添加一個狀態來強制重新渲染
  const [forceRender, setForceRender] = useState(0);
  // 使用 ref 來保存最新的 items 和控制是否從 props 更新
  const localItemsRef = useRef<(Material & { index: number })[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const shouldUpdateFromProps = useRef<boolean>(true);
  const originalOrderRef = useRef<Map<string, number>>(new Map());
  
  // 當 items 變化時，更新本地狀態
  useEffect(() => {
    // 只有在非拖拽狀態下，或者 shouldUpdateFromProps 為 true 時，才從 props 更新本地狀態
    if (!isDraggingRef.current || shouldUpdateFromProps.current) {
      setLocalItems(items);
      localItemsRef.current = items;
      
      // 更新原始順序參考
      try {
        const originalOrderMap = new Map<string, number>();
        items.forEach((item, index) => {
          if (item._id) {
            originalOrderMap.set(item._id, index);
          }
        });
        originalOrderRef.current = originalOrderMap;
        
        // 保存原始順序到 localStorage
        const topicId = localStorage.getItem('activeTopicId');
        if (topicId) {
          localStorage.setItem(`original_order_${topicId}`, JSON.stringify(Array.from(originalOrderMap.entries())));
        }
      } catch (error) {
        console.error('更新原始順序參考失敗:', error);
      }
    }
  }, [items]);
  
  // 添加一個效果來處理 droppableId 變化
  useEffect(() => {
    // 當 droppableId 變化時，強制從 props 更新本地狀態
    setLocalItems(items);
    localItemsRef.current = items;
    
    // 重置拖拽狀態
    setDragCompleted(false);
    isDraggingRef.current = false;
    shouldUpdateFromProps.current = true;
    
    // 強制重新渲染
    setForceRender(prev => prev + 1);
    
    // 延遲 50ms 後再次強制刷新，確保 UI 完全更新
    setTimeout(() => {
      setForceRender(prev => prev + 1);
      
      // 再次確保從 props 更新本地狀態
      setLocalItems(items);
      localItemsRef.current = items;
    }, 50);
    
    // 延遲 100ms 後第三次強制刷新
    setTimeout(() => {
      setForceRender(prev => prev + 1);
      
      // 再次確保從 props 更新本地狀態
      setLocalItems(items);
      localItemsRef.current = items;
    }, 100);
    
    // 延遲 150ms 後第四次強制刷新
    setTimeout(() => {
      setForceRender(prev => prev + 1);
      
      // 再次確保從 props 更新本地狀態
      setLocalItems(items);
      localItemsRef.current = items;
    }, 150);
  }, [droppableId, items]);
  
  // 添加一個效果來處理拖拽完成後的UI刷新
  useEffect(() => {
    if (dragCompleted) {
      // 重置狀態
      setDragCompleted(false);
      isDraggingRef.current = false;
      
      // 強制重新渲染
      setForceRender(prev => prev + 1);
      
      // 延遲 50ms 後再次強制刷新
      setTimeout(() => {
        setForceRender(prev => prev + 1);
      }, 50);
    }
  }, [dragCompleted, forceRender]);
  
  // 恢復原始順序的函數
  const restoreOriginalOrder = () => {
    if (originalOrderRef.current.size === 0) {
      // 嘗試從 localStorage 恢復
      try {
        const topicId = localStorage.getItem('activeTopicId');
        if (topicId) {
          const savedOrder = localStorage.getItem(`original_order_${topicId}`);
          if (savedOrder) {
            originalOrderRef.current = new Map(JSON.parse(savedOrder));
          }
        }
      } catch (error) {
        console.error('從 localStorage 恢復原始順序失敗:', error);
        return;
      }
    }
    
    if (originalOrderRef.current.size > 0) {
      // 根據原始順序排序項目
      const sortedItems = [...localItemsRef.current].sort((a, b) => {
        const orderA = a._id ? originalOrderRef.current.get(a._id) ?? 0 : 0;
        const orderB = b._id ? originalOrderRef.current.get(b._id) ?? 0 : 0;
        return Number(orderA) - Number(orderB);
      });
      
      setLocalItems(sortedItems);
      localItemsRef.current = sortedItems;
      
      // 設置標誌，防止下一次 props 更新覆蓋本地狀態
      shouldUpdateFromProps.current = false;
      
      onReorder(sortedItems.map((item, index) => ({...item, index: index + 1})));
      // 標記拖拽完成，觸發UI刷新
      setDragCompleted(true);
      // 強制重新渲染
      setForceRender(prev => prev + 1);
    }
  };
  
  // 暴露方法給父組件
  useImperativeHandle(ref, () => ({
    restoreOriginalOrder
  }));
  
  const handleDragStart = () => {
    isDraggingRef.current = true;
    shouldUpdateFromProps.current = false;
  };
  
  const handleDragEnd = (result: DropResult) => {
    // Dropped outside the list
    if (!result.destination) {
      isDraggingRef.current = false;
      return;
    }

    const reorderedItems = reorderList(
      localItems,
      result.source.index,
      result.destination.index
    );

    // 設置標誌，防止下一次 props 更新覆蓋本地狀態
    shouldUpdateFromProps.current = false;

    // 立即更新本地狀態，這樣UI會立即反映新的順序
    setLocalItems(reorderedItems);
    localItemsRef.current = reorderedItems;

    // Update indexes and order
    const itemsWithUpdatedIndexes = reorderedItems.map((item, index) => ({
      ...item,
      index: index + 1, // Keep the index property for display purposes
      order: index      // Add order property for database sorting
    }));
    
    // 更新本地存儲的順序
    try {
      const topicId = localStorage.getItem('activeTopicId');
      if (topicId) {
        const newOrderMap = new Map<string, number>();
        itemsWithUpdatedIndexes.forEach((item, index) => {
          if (item._id) {
            newOrderMap.set(item._id, index);
          }
        });
        localStorage.setItem(`temp_order_${topicId}`, JSON.stringify(Array.from(newOrderMap.entries())));
      }
    } catch (error) {
      console.error('保存臨時順序到 localStorage 失敗:', error);
    }

    // 通知父組件順序已更改
    onReorder(itemsWithUpdatedIndexes);
    
    // 標記拖拽完成，觸發UI刷新
    setDragCompleted(true);
    isDraggingRef.current = false;
  };

  const reorderList = (
    list: (Material & { index: number })[],
    startIndex: number,
    endIndex: number
  ) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <Droppable droppableId={droppableId}>
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={styles.droppableContainer}
          >
            {localItems.map((item, index) => (
              <Draggable key={item._id || index} draggableId={item._id || `item-${index}`} index={index}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`${styles.draggableItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                    style={{
                      ...provided.draggableProps.style,
                    }}
                  >
                    {renderItem(item, index)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
});

export default DraggableList; 