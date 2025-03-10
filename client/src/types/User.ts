export interface Material {
    _id?: string;
    title: string;
    url?: string;
    type: 'webpage' | 'video' | 'book' | 'podcast';
    topicId?: string;
    dateAdded?: string;
    order?: number;
    progress?: {
        completed: number;
        total: number;
    };
    favicon?: string;
    readingTime?: number;
    completedUnits?: number;
    completed?: boolean;
    isCompleted?: boolean;
    note?: string;
    rating?: number;
    isMainResource?: boolean;
    index?: number;
}

// 學習路徑節點
export interface PathNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        type: string;
        favicon?: string;
        url?: string;
        completed?: boolean;
    };
}

// 學習路徑連接
export interface PathEdge {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
}

// 學習路徑
export interface LearningPath {
    nodes: PathNode[];
    edges: PathEdge[];
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
    order?: number;
    tags?: string[];
    deadline?: string;
    materials: Material[];
    createdAt?: string;
    updatedAt?: string;
    categories?: Categories;
    participants?: Participant[];
    contributors?: Contributor[];
    contributions?: Contributions;
    learningPath?: LearningPath;
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
    name: string;
    email: string;
    photoURL?: string;
    bio?: string;
    topics: Topic[];
    materials: Material[];
    createdAt?: Date;
    contributions?: ContributionData[];
    studyRecords?: StudyRecord[];
}

export interface EnhancedUser extends Omit<User, 'materials' | 'topics'> {
    materials: Material[];
    topics: Topic[];
}

export type MaterialType = 'webpage' | 'book' | 'video' | 'podcast';

export interface MaterialInput {
    title: string;
    type: 'webpage' | 'video' | 'book' | 'podcast';
    url?: string;
    rating?: number;
    dateAdded: string;
    order?: number;
    favicon?: string;
}

export interface MaterialPayload {
    title: string;
    type: 'webpage' | 'video' | 'book' | 'podcast';
    url?: string | null;
    rating?: number;
    dateAdded: string;
    order?: number;
    favicon?: string;
}