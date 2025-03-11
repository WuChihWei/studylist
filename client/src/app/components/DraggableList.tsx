import React, { forwardRef, useImperativeHandle } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DroppableProvided,
  DraggableProvided,
  DropResult
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
  
  // 恢復原始順序的函數
  const restoreOriginalOrder = () => {
    try {
      const topicId = localStorage.getItem('activeTopicId');
      if (!topicId) return;
      
      const savedOrder = localStorage.getItem(`original_order_${topicId}`);
      if (!savedOrder) return;
      
      const orderMap = new Map(JSON.parse(savedOrder));
      const sortedItems = [...items].sort((a, b) => {
        const orderA = a._id ? (orderMap.get(a._id) ?? 0) : 0;
        const orderB = b._id ? (orderMap.get(b._id) ?? 0) : 0;
        return Number(orderA) - Number(orderB);
      });
      
      onReorder(sortedItems.map((item, index) => ({...item, index: index + 1})));
    } catch (error) {
      console.error('恢復原始順序失敗:', error);
    }
  };
  
  // 暴露方法給父組件
  useImperativeHandle(ref, () => ({
    restoreOriginalOrder
  }));
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    // Update indexes and save new order
    const itemsWithUpdatedIndexes = reorderedItems.map((item, index) => ({
      ...item,
      index: index + 1
    }));

    // Save order to localStorage
    try {
      const topicId = localStorage.getItem('activeTopicId');
      if (topicId) {
        const newOrderMap = new Map(itemsWithUpdatedIndexes.map((item, index) => 
          [item._id || '', index]
        ));
        localStorage.setItem(`temp_order_${topicId}`, 
          JSON.stringify(Array.from(newOrderMap.entries()))
        );
      }
    } catch (error) {
      console.error('保存臨時順序失敗:', error);
    }

    onReorder(itemsWithUpdatedIndexes);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided: DroppableProvided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={styles.droppableContainer}
          >
            {items.map((item, index) => (
              <Draggable 
                key={item._id || index} 
                draggableId={item._id || `item-${index}`} 
                index={index}
              >
                {(provided: DraggableProvided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={styles.draggableItem}
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