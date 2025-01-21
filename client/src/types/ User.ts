export interface Material {
    type: 'book' | 'video' | 'podcast';
    title: string;
    rating: number;
    dateAdded?: Date;
  }
  
  export interface User {
    firebaseUID: string;
    name: string;
    email: string;
    materials: Material[];
  }