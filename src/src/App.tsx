import React, { useState, useEffect } from "react";
import Header from "./components/Header.js";
import TeacherPortal from "./components/TeacherPortal.js";
import AdminDashboard from "./components/AdminDashboard.js";
import { Campaign, Department, Teacher, Submission, DatabaseState } from "./types.js";
import { RefreshCw, AlertCircle } from "lucide-react";
import { apiCall, getDatabase } from "./services/appsScriptApi.js";

export default function App() {
  const [currentView, setCurrentView] = useState<"teacher" | "admin">("teacher");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyDatabaseState = (data: DatabaseState) => {
    setCampaigns(data.campaigns || []);
    setTeachers(data.teachers || []);
    setDepartments(data.departments || []);
    setSubmissions(data.submissions || []);
  };

  const loadDatabaseState = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDatabase<DatabaseState>();
      applyDatabaseState(data);
    } catch (err: any) {
      console.error("Error loading database state:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu từ Google Apps Script.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseState();
  }, []);

  const handleAddCampaign = async (newCamp: { title: string; description: string; deadline: string; excludedTeacherIds?: string[] }) => {
    const savedCamp = await apiCall<Campaign>("addCampaign", newCamp);
    setCampaigns(prev => [...prev, savedCamp]);
  };

  const handleUpdateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const updatedCamp = await apiCall<Campaign>("updateCampaign", { id, updates });
    setCampaigns(prev => prev.map(c => c.id === id ? updatedCamp : c));
  };

  const handleDeleteCampaign = async (id: string) => {
    await apiCall("deleteCampaign", { id });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    setSubmissions(prev => prev.filter(s => s.campaignId !== id));
  };

  const handleAddTeacher = async (newTeacher: { name: string; departmentId: string; phone?: string }) => {
    const savedTeacher = await apiCall<Teacher>("addTeacher", newTeacher);
    setTeachers(prev => [...prev, savedTeacher]);
  };

  const handleAddDepartment = async (name: string) => {
    const savedDept = await apiCall<Department>("addDepartment", { name });
    setDepartments(prev => [...prev, savedDept]);
  };

  const handleImportTeachers = async (csvContent: string) => {
    const data = await apiCall<any>("importTeachers", { csvContent });
    await loadDatabaseState();
    return data;
  };

  const handleDeleteTeacher = async (id: string) => {
    await apiCall("deleteTeacher", { id });
    setTeachers(prev => prev.filter(t => t.id !== id));
    setSubmissions(prev => prev.filter(s => s.teacherId !== id));
  };

  const handleUpdateTeacher = async (id: string, updates: { name: string; departmentId: string; phone?: string }) => {
    const updatedTeacher = await apiCall<Teacher>("updateTeacher", { id, updates });
    setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
  };

  const handleNewSubmission = async (submissionPayload: any) => {
    const savedSub = await apiCall<Submission>("submitEvidence", submissionPayload, 120000);
    setSubmissions(prev => {
      const filtered = prev.filter(
        s => !(s.campaignId === savedSub.campaignId && s.teacherId === savedSub.teacherId)
      );
      return [...filtered, savedSub];
    });
  };

  const handleDeleteSubmission = async (id: string) => {
    await apiCall("deleteSubmission", { id });
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  const handleResetDB = async () => {
    const data = await apiCall<DatabaseState>("resetDatabase");
    applyDatabaseState(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900" id="main-app-container">
        {/* Universal Header */}
        <Header currentView={currentView} onViewChange={setCurrentView} />

        {/* Main Content Area */}
        <main className="flex-grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
              <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
              <p className="text-sm font-semibold text-gray-500">Đang khởi tạo cơ sở dữ liệu nhà trường...</p>
            </div>
          ) : error ? (
            <div className="max-w-md mx-auto my-16 p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4 shadow-sm">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-red-950">Lỗi kết nối hệ thống</h2>
              <p className="text-sm text-red-700 leading-relaxed">
                {error}
              </p>
              <button
                onClick={loadDatabaseState}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Thử kết nối lại
              </button>
            </div>
          ) : (
            <>
              {currentView === "teacher" ? (
                <TeacherPortal
                  campaigns={campaigns}
                  teachers={teachers}
                  departments={departments}
                  submissions={submissions}
                  onNewSubmission={handleNewSubmission}
                  loading={loading}
                />
              ) : (
                <AdminDashboard
                  campaigns={campaigns}
                  teachers={teachers}
                  departments={departments}
                  submissions={submissions}
                  onAddCampaign={handleAddCampaign}
                  onUpdateCampaign={handleUpdateCampaign}
                  onDeleteCampaign={handleDeleteCampaign}
                  onAddTeacher={handleAddTeacher}
                  onAddDepartment={handleAddDepartment}
                  onImportTeachers={handleImportTeachers}
                  onDeleteTeacher={handleDeleteTeacher}
                  onUpdateTeacher={handleUpdateTeacher}
                  onDeleteSubmission={handleDeleteSubmission}
                  onResetDB={handleResetDB}
                  loading={loading}
                />
              )}
            </>
          )}
        </main>

        {/* Aesthetic Footer */}
        <footer className="bg-white border-t border-gray-100 py-6" id="app-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400 font-medium space-y-1">
            <p>© 2026 Trường Phổ thông Dân tộc Nội trú THCS & THPT Mai Sơn</p>
            <p className="font-mono text-[10px] text-gray-300">Hệ thống Thu thập & Theo dõi Minh chứng Chuyên môn nội bộ v1.0.0</p>
          </div>
        </footer>
    </div>
  );
}
