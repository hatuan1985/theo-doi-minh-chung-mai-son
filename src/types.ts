export interface Campaign {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'active' | 'closed';
  createdAt: string;
  excludedTeacherIds?: string[];
}

export interface Department {
  id: string;
  name: string;
}

export interface Teacher {
  id: string;
  name: string;
  departmentId: string;
  phone?: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  teacherId: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string; // mime type
  uploadedAt: string;
  fileId: string; // reference to the actual file content
  comment?: string;
  driveFileId?: string; // Google Drive file ID
  driveWebViewLink?: string; // Web view link on Google Drive
  driveFolderId?: string; // Google Drive folder ID
}

export interface DatabaseState {
  campaigns: Campaign[];
  departments: Department[];
  teachers: Teacher[];
  submissions: Submission[];
}
