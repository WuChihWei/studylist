export interface Material {
    _id: string;
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url?: string;
    rating: number;
    dateAdded: Date;
    completed?: boolean;
}

export interface Categories {
    webpage: Material[];
    video: Material[];
    book: Material[];
    podcast: Material[];
}