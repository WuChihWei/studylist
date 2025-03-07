export interface Material {
    _id?: string;
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url?: string;
    rating: number;
    dateAdded: Date;
    completed?: boolean;
    readingTime?: number;
    note?: string;
    completedUnits?: number;
    order: number;
    favicon?: string;
}

export interface Categories {
    webpage: Material[];
    video: Material[];
    book: Material[];
    podcast: Material[];
}

interface Participant {
    userId: string;
    name: string;
    photoURL: string;
}

export interface Contributor {
    id: string;
    name: string;
    photoURL?: string;
}

export interface Contributions {
    totalCount: number;
    lastUpdated: Date;
    byType: {
        webpage: number;
        video: number;
        book: number;
        podcast: number;
    };
}

export interface Topic {
    _id?: string;
    name: string;
    participants: Participant[];
    categories?: Categories;
    materials: Material[];
    createdAt?: Date;
    contributors?: Contributor[];
    contributions?: Contributions;
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
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url?: string;
    rating?: number;
    dateAdded?: Date;
    order?: number;
    favicon?: string;
}

export interface MaterialPayload {
    type: 'webpage' | 'book' | 'video' | 'podcast';
    title: string;
    url: string | null;
    rating: number;
    dateAdded: string;
    order: number;
    favicon?: string;
}