export interface Material {
    _id?: string;
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url?: string | null;
    rating: number;
    dateAdded?: Date;
}
  
export interface User {
    firebaseUID: string;
    name: string;
    email: string;
    materials: Material[];
}

export interface Topic {
    _id?: string;
    id: string;
    title: string;
    materials: Material[];
}