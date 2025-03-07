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
import { Material, Categories } from '@/types/User';
import styles from './DraggableList.module.css';

interface DraggableListProps {
  items: (Material & { type: keyof Categories; index: number })[];
  onReorder: (reorderedItems: (Material & { type: keyof Categories; index: number })[]) => void;
  renderItem: (item: Material & { type: keyof Categories; index: number }, index: number) => React.ReactNode;
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
  // 添加一個 ref 來追踪最新的 localItems
  const localItemsRef = useRef(items);
  // 添加一個標誌來控制是否應該從外部 items 更新本地狀態
  const shouldUpdateFromProps = useRef(true);
  // 添加一個標誌來追踪是否正在進行拖拽操作
  const isDraggingRef = useRef(false);
  
  // 保存原始順序的參考
  const originalOrderRef = useRef<Map<string, number>>(new Map());
  
  // 當外部項目變化時更新本地狀態和原始順序參考
  useEffect(() => {
    console.log('🔍 DraggableList - items 變化', items.map(item => `${item._id}:${item.index}`));
    
    // 只有當應該從 props 更新時才更新本地狀態
    if (shouldUpdateFromProps.current && !isDraggingRef.current) {
      console.log('🔍 DraggableList - 從 props 更新本地狀態');
      setLocalItems(items);
      localItemsRef.current = items;
    } else {
      console.log('🔍 DraggableList - 跳過從 props 更新本地狀態，因為剛完成拖拽或正在拖拽中');
      // 重置標誌，下次可以從 props 更新
      shouldUpdateFromProps.current = true;
    }
    
    // 更新原始順序參考
    const orderMap = new Map<string, number>();
    items.forEach((item, index) => {
      if (item._id) {
        orderMap.set(item._id, index);
      }
    });
    originalOrderRef.current = orderMap;
    console.log('🔍 DraggableList - 更新原始順序參考', Array.from(orderMap.entries()));
    
    // 將原始順序保存到 localStorage，以便在頁面刷新後恢復
    if (items.length > 0) {
      try {
        const topicId = localStorage.getItem('activeTopicId');
        if (topicId) {
          localStorage.setItem(`original_order_${topicId}`, JSON.stringify(Array.from(orderMap.entries())));
          console.log('🔍 DraggableList - 保存原始順序到 localStorage', topicId);
        }
      } catch (error) {
        console.error('保存原始順序到 localStorage 失敗:', error);
      }
    }
  }, [items]);
  
  // 添加一個效果來處理 droppableId 變化
  useEffect(() => {
    console.log('🔍 DraggableList - droppableId 變化', droppableId);
    
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
      console.log('🔍 DraggableList - droppableId 變化後的延遲強制刷新');
      setForceRender(prev => prev + 1);
      
      // 再次確保從 props 更新本地狀態
      setLocalItems(items);
      localItemsRef.current = items;
    }, 50);
  }, [droppableId, items]);
  
  // 添加一個效果來處理拖拽完成後的UI刷新
  useEffect(() => {
    if (dragCompleted) {
      console.log('🔍 DraggableList - 拖拽完成，重置狀態');
      // 重置狀態
      setDragCompleted(false);
      isDraggingRef.current = false;
      
      // 強制重新渲染
      setForceRender(prev => prev + 1);
      console.log('🔍 DraggableList - 強制重新渲染', forceRender + 1);
      
      // 延遲 50ms 後再次強制刷新
      setTimeout(() => {
        console.log('🔍 DraggableList - 延遲強制刷新');
        setForceRender(prev => prev + 1);
        console.log('🔍 DraggableList - 再次強制重新渲染', forceRender + 2);
      }, 50);
    }
  }, [dragCompleted, forceRender]);
  
  // 恢復原始順序的函數
  const restoreOriginalOrder = () => {
    console.log('🔍 DraggableList - 開始恢復原始順序');
    if (originalOrderRef.current.size === 0) {
      // 嘗試從 localStorage 恢復
      try {
        const topicId = localStorage.getItem('activeTopicId');
        if (topicId) {
          const savedOrder = localStorage.getItem(`original_order_${topicId}`);
          if (savedOrder) {
            originalOrderRef.current = new Map(JSON.parse(savedOrder));
            console.log('🔍 DraggableList - 從 localStorage 恢復原始順序', Array.from(originalOrderRef.current.entries()));
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
      
      console.log('🔍 DraggableList - 恢復後的順序', sortedItems.map(item => `${item._id}:${item.index}`));
      setLocalItems(sortedItems);
      localItemsRef.current = sortedItems;
      console.log('🔍 DraggableList - 更新本地狀態完成，調用父組件的 onReorder');
      
      // 設置標誌，防止下一次 props 更新覆蓋本地狀態
      shouldUpdateFromProps.current = false;
      
      onReorder(sortedItems.map((item, index) => ({...item, index: index + 1})));
      // 標記拖拽完成，觸發UI刷新
      setDragCompleted(true);
      // 強制重新渲染
      setForceRender(prev => prev + 1);
      console.log('🔍 DraggableList - 強制重新渲染', forceRender + 1);
    }
  };
  
  // 暴露方法給父組件
  useImperativeHandle(ref, () => ({
    restoreOriginalOrder
  }));
  
  const handleDragStart = () => {
    console.log('🔍 DraggableList - 開始拖拽');
    isDraggingRef.current = true;
    shouldUpdateFromProps.current = false;
  };
  
  const handleDragEnd = (result: DropResult) => {
    console.log('🔍 DraggableList - 拖拽結束', result);
    
    // Dropped outside the list
    if (!result.destination) {
      console.log('🔍 DraggableList - 拖拽到列表外，不處理');
      isDraggingRef.current = false;
      return;
    }

    console.log('🔍 DraggableList - 拖拽前的順序', localItems.map(item => `${item._id}:${item.index}`));
    const reorderedItems = reorderList(
      localItems,
      result.source.index,
      result.destination.index
    );
    console.log('🔍 DraggableList - 拖拽後的順序', reorderedItems.map(item => `${item._id}:${item.index}`));

    // 設置標誌，防止下一次 props 更新覆蓋本地狀態
    shouldUpdateFromProps.current = false;

    // 立即更新本地狀態，這樣UI會立即反映新的順序
    console.log('🔍 DraggableList - 開始更新本地狀態');
    setLocalItems(reorderedItems);
    localItemsRef.current = reorderedItems;
    console.log('🔍 DraggableList - 本地狀態更新完成');

    // Update indexes
    const itemsWithUpdatedIndexes = reorderedItems.map((item, index) => ({
      ...item,
      index: index + 1,
      order: index // Add order property to ensure proper sorting
    }));
    console.log('🔍 DraggableList - 更新索引後的順序', itemsWithUpdatedIndexes.map(item => `${item._id}:${item.index}`));
    
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
        console.log('🔍 DraggableList - 保存臨時順序到 localStorage', topicId, Array.from(newOrderMap.entries()));
      }
    } catch (error) {
      console.error('保存臨時順序到 localStorage 失敗:', error);
    }

    // 調用父組件的重排序函數
    console.log('🔍 DraggableList - 調用父組件的 onReorder 函數');
    onReorder(itemsWithUpdatedIndexes);
    console.log('🔍 DraggableList - onReorder 調用完成');
    
    // 標記拖拽完成，觸發UI刷新
    console.log('🔍 DraggableList - 設置 dragCompleted 為 true');
    setDragCompleted(true);
    
    // 強制重新渲染
    setForceRender(prev => prev + 1);
    console.log('🔍 DraggableList - 強制重新渲染', forceRender + 1);
    
    // 延遲 50ms 後再次強制刷新
    setTimeout(() => {
      console.log('🔍 DraggableList - 延遲強制刷新');
      setForceRender(prev => prev + 1);
      console.log('🔍 DraggableList - 再次強制重新渲染', forceRender + 2);
    }, 50);
  };

  // Helper function to reorder the list
  const reorderList = (
    list: (Material & { type: keyof Categories; index: number })[],
    startIndex: number,
    endIndex: number
  ) => {
    console.log(`🔍 DraggableList - reorderList: 從 ${startIndex} 移動到 ${endIndex}`);
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  console.log('🔍 DraggableList - 渲染組件', localItems.map(item => `${item._id}:${item.index}`), '強制渲染計數:', forceRender);
  return (
    <div key={`draggable-list-${forceRender}`} data-force-render={forceRender}>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Droppable droppableId={droppableId}>
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={styles.droppableContainer}
              data-force-render={forceRender} // 添加一個屬性來強制重新渲染
            >
              {localItems.map((item, index) => (
                <Draggable 
                  key={item._id || `item-${index}`} 
                  draggableId={item._id || `item-${index}`} 
                  index={index}
                >
                  {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${styles.draggableItem} ${snapshot.isDragging ? styles.dragging : ''}`}
                      data-id={item._id}
                      data-index={index}
                      data-force-render={forceRender}
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
    </div>
  );
});

DraggableList.displayName = 'DraggableList';

export default DraggableList; 