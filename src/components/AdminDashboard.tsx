import React, { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardCheck,
  BellRing,
  Database,
  Menu,
  X
} from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";
import { apiCall, hasAdminSessionToken, setAdminSessionToken } from "../services/appsScriptApi.js";
import AnalyticsPanel from "./AnalyticsPanel.js";
import CampaignManager from "./CampaignManager.js";
import TeacherManager from "./TeacherManager.js";
import SubmissionsTable from "./SubmissionsTable.js";
import ReminderTool from "./ReminderTool.js";
import BackupSettings from "./BackupSettings.js";

interface AdminDashboardProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
  onAddCampaign: (campaign: { title: string; description: string; deadline: string }) => Promise<void>;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
  onAddTeacher: (teacher: { name: string; departmentId: string; phone?: string }) => Promise<void>;
  onAddDepartment: (name: string) => Promise<void>;
  onImportTeachers: (csvContent: string) => Promise<{ count: number; errors: string[] }>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onUpdateTeacher: (id: string, teacher: { name: string; departmentId: string; phone?: string }) => Promise<void>;
  onDeleteSubmission: (id: string) => Promise<void>;
  onResetDB: () => Promise<void>;
  loading: boolean;
}

type TabType = "analytics" | "submissions" | "campaigns" | "teachers" | "reminders" | "backups";

export default function AdminDashboard({
  campaigns,
  teachers,
  departments,
  submissions,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign,
  onAddTeacher,
  onAddDepartment,
  onImportTeachers,
  onDeleteTeacher,
  onUpdateTeacher,
  onDeleteSubmission,
  onResetDB,
  loading
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("analytics");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(() => hasAdminSessionToken());
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    try {
      const result = await apiCall<{ token: string }>("verifyAdmin", { pin: pinInput.trim() });
      setAdminSessionToken(result.token);
      setIsAdminUnlocked(true);
      window.location.reload();
    } catch (err: any) {
      setPinError(err.message || "Mã PIN không chính xác.");
    }
  };

  const navItems = [
    { id: "analytics", label: "Tổng quan tiến độ", icon: LayoutDashboard },
    { id: "submissions", label: "Danh sách nộp bài", icon: ClipboardCheck },
    { id: "campaigns", label: "Đợt khảo sát/Bồi dưỡng", icon: FolderKanban },
    { id: "teachers", label: "Giáo viên & Tổ chuyên môn", icon: Users },
    { id: "reminders", label: "Đôn đốc & Nhắc nhở", icon: BellRing },
    { id: "backups", label: "Hệ thống & Sao lưu", icon: Database }
  ];

  const renderActivePanel = () => {
    switch (activeTab) {
      case "analytics":
        return (
          <AnalyticsPanel
            campaigns={campaigns}
            teachers={teachers}
            departments={departments}
            submissions={submissions}
          />
        );
      case "campaigns":
        return (
          <CampaignManager
            campaigns={campaigns}
            onAddCampaign={onAddCampaign}
            onUpdateCampaign={onUpdateCampaign}
            onDeleteCampaign={onDeleteCampaign}
          />
        );
      case "teachers":
        return (
          <TeacherManager
            teachers={teachers}
            departments={departments}
            onAddTeacher={onAddTeacher}
            onAddDepartment={onAddDepartment}
            onImportTeachers={onImportTeachers}
            onDeleteTeacher={onDeleteTeacher}
            onUpdateTeacher={onUpdateTeacher}
          />
        );
      case "submissions":
        return (
          <SubmissionsTable
            campaigns={campaigns}
            teachers={teachers}
            departments={departments}
            submissions={submissions}
            onDeleteSubmission={onDeleteSubmission}
            onDeleteTeacher={onDeleteTeacher}
            onUpdateCampaign={onUpdateCampaign}
          />
        );
      case "reminders":
        return (
          <ReminderTool
            campaigns={campaigns}
            teachers={teachers}
            departments={departments}
            submissions={submissions}
          />
        );
      case "backups":
        return (
          <BackupSettings
            onResetDB={onResetDB}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 px-4" id="admin-pin-lock-screen">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-emerald-50 text-emerald-700 mb-6 border border-emerald-100">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-950">Xác minh Quyền Quản trị</h2>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Vui lòng nhập mã PIN bảo mật để truy cập bảng điều khiển quản lý của Ban Giám hiệu & Tổ trưởng chuyên môn.
          </p>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                placeholder="Nhập mã PIN quản trị..."
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError("");
                }}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 rounded-xl text-center text-lg font-mono tracking-widest focus:outline-none transition-all"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-xs font-semibold text-red-600 animate-in fade-in duration-150">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/10 transition-colors"
            >
              Đăng nhập bảng quản trị
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard-view">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MOBILE NAVIGATION BUTTON BAR */}
        <div className="lg:hidden flex justify-between items-center bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục quản lý:</span>
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-100"
          >
            {showMobileSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>{navItems.find(item => item.id === activeTab)?.label}</span>
          </button>
        </div>

        {/* MOBILE NAVIGATION MENU (DROPDOWN DRAWER) */}
        {showMobileSidebar && (
          <div className="lg:hidden bg-white border border-gray-100 rounded-xl shadow-lg p-2 space-y-1 animate-in fade-in duration-150 z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setShowMobileSidebar(false);
                  }}
                  className={`w-full flex items-center space-x-2.5 px-4 py-2.5 rounded-lg text-xs font-bold text-left transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* DESKTOP SIDEBAR PANEL (4 cols) */}
        <div className="hidden lg:block lg:col-span-3 bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-1.5">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 mb-3">
            Bảng Điều khiển
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-left transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                    : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* WORKSPACE WORKSPACE AREA (9 cols) */}
        <div className="lg:col-span-9 bg-white border border-gray-100 rounded-2xl shadow-sm p-6 min-h-[550px]">
          {renderActivePanel()}
        </div>
      </div>
    </div>
  );
}
