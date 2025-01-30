export interface Material {
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url: string;
    rating: number;
    dateAdded?: Date;
}
  
export interface User {
    firebaseUID: string;
    name: string;
    email: string;
    materials: Material[];
}