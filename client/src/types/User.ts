export interface Material {
    _id?: string;
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url?: string;
    rating: number;
    dateAdded: Date;
    completed?: boolean;
    readingTime?: number;
}

export interface Categories {
    webpage: Material[];
    video: Material[];
    book: Material[];
    podcast: Material[];
}

export interface Topic {
    _id?: string;
    name: string;
    categories: Categories;
    createdAt?: Date;
}

interface ContributionData {
    date: string;
    count: number;
}

interface StudyRecord {
    date: string;
    materialId: string;
    topicId: string;
}

export interface User {
    _id?: string;
    firebaseUID: string;
    name: string;
    email: string;
    bio?: string;
    isPremium: boolean;
    topics: Topic[];
    createdAt?: Date;
    photoURL?: string;
    contributions?: ContributionData[];
    studyRecords?: StudyRecord[];
}

export interface MaterialInput {
    type: string;
    title: string;
    url?: string;
    rating?: number;
    dateAdded?: Date;
}

export interface MaterialPayload {
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url: string | null;
    rating: number;
    dateAdded: string;
}