export interface MaterialInput {
    title: string;
    type: CategoryType;
    url?: string;
    rating?: number;
    dateAdded: Date;
  }
  
  export type CategoryType = 'webpage' | 'video' | 'podcast' | 'book';