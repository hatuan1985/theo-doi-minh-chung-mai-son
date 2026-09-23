import React, { useState } from "react";
import { Users, FileCheck, FolderOpen, Percent, ChevronRight, Award, Clock } from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";

interface AnalyticsPanelProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
}

export default function AnalyticsPanel({
  campaigns,
  teachers,
  departments,
  submissions
}: AnalyticsPanelProps) {
  const [selectedCampId, setSelectedCampId] = useState(campaigns[0]?.id || "");

  // Statistics
  const totalTeachers = teachers.length;
  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const totalActiveCampaigns = activeCampaigns.length;
  const totalSubmissions = submissions.length;

  // Calculate overall completion rate across active campaigns
  let overallCompletionRate = 0;
  if (totalTeachers > 0 && totalActiveCampaigns > 0) {
    let totalExpectedSubmissions = 0;
    let submissionsInActiveCampaigns = 0;

    activeCampaigns.forEach(c => {
      const excludedIds = c.excludedTeacherIds || [];
      const campaignActiveTeachersCount = teachers.filter(t => !excludedIds.includes(t.id)).length;
      totalExpectedSubmissions += campaignActiveTeachersCount;
      submissionsInActiveCampaigns += submissions.filter(s => s.campaignId === c.id).length;
    });

    if (totalExpectedSubmissions > 0) {
      overallCompletionRate = Math.round((submissionsInActiveCampaigns / totalExpectedSubmissions) * 100);
    }
  }

  // Selected campaign statistics
  const selectedCampaign = campaigns.find(c => c.id === selectedCampId);
  const campaignExcludedIds = selectedCampaign?.excludedTeacherIds || [];
  const campaignActiveTeachers = teachers.filter(t => !campaignExcludedIds.includes(t.id));
  const campaignTotalTeachersCount = campaignActiveTeachers.length;

  const campaignSubmissions = submissions.filter(s => s.campaignId === selectedCampId);
  const campaignCompletedCount = campaignSubmissions.length;
  const campaignCompletionRate = campaignTotalTeachersCount > 0 ? Math.round((campaignCompletedCount / campaignTotalTeachersCount) * 100) : 0;

  // Selected campaign department progress breakdown
  const deptProgress = departments.map(dept => {
    // Teachers in this department who are active for this campaign
    const deptTeachers = campaignActiveTeachers.filter(t => t.departmentId === dept.id);
    const deptTeachersCount = deptTeachers.length;
    const deptTeachersIds = deptTeachers.map(t => t.id);

    // Submissions in this campaign from this department
    const deptSubmissionsCount = campaignSubmissions.filter(s => deptTeachersIds.includes(s.teacherId)).length;
    const rate = deptTeachersCount > 0 ? Math.round((deptSubmissionsCount / deptTeachersCount) * 100) : 0;

    return {
      id: dept.id,
      name: dept.name,
      total: deptTeachersCount,
      completed: deptSubmissionsCount,
      rate
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="analytics-panel">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tổng quan Tiến độ Hệ thống</h2>
        <p className="text-xs text-gray-500 mt-1">
          Dữ liệu thống kê thời gian thực về tình hình nộp minh chứng bồi dưỡng và khảo sát của toàn bộ giáo viên Trường PTDTNT THCS & THPT Mai Sơn.
        </p>
      </div>

      {/* Grid of Key Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Teachers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng số Giáo viên</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalTeachers}</h3>
          </div>
        </div>

        {/* Card 2: Active Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đợt đang hoạt động</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalActiveCampaigns}</h3>
          </div>
        </div>

        {/* Card 3: Total Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tổng minh chứng nộp</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{totalSubmissions}</h3>
          </div>
        </div>

        {/* Card 4: Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tỷ lệ hoàn thành chung</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{overallCompletionRate}%</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Campaign Selection & Progress Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Select Campaign & See Summary */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 flex items-center space-x-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>Theo dõi theo đợt nộp</span>
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500" htmlFor="analytic-campaign-select">Chọn đợt khảo sát / bồi dưỡng:</label>
              <select
                id="analytic-campaign-select"
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.status === "closed" ? "(Đã đóng)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedCampaign && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="text-sm font-semibold text-gray-900 leading-snug">
                  {selectedCampaign.title}
                </div>
                <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {selectedCampaign.description || "Không có mô tả chi tiết."}
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/30">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  <span>
                    Hạn chót: <strong className="text-emerald-900">{new Date(selectedCampaign.deadline).toLocaleDateString("vi-VN")}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ml-auto text-[10px] uppercase ${
                    selectedCampaign.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {selectedCampaign.status === "active" ? "Đang mở" : "Đã khóa"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {selectedCampaign && (
            <div className="pt-4 border-t border-gray-50 text-center space-y-2">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-800 font-mono">
                {campaignCompletionRate}%
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Tỷ lệ hoàn thành đợt này ({campaignCompletedCount} / {campaignTotalTeachersCount} giáo viên)
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/40">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${campaignCompletionRate}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Department Completion Breakdown Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2 mb-4">
            Chi tiết tỷ lệ nộp của các Tổ chuyên môn
          </h3>

          <div className="space-y-4 overflow-y-auto max-h-[360px] flex-1 pr-1">
            {deptProgress.map((dept) => {
              const isFull = dept.rate === 100;
              const isLow = dept.rate < 50;

              return (
                <div
                  key={dept.id}
                  className="group p-3 hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl transition-all duration-200"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-bold text-gray-800 flex items-center space-x-1.5">
                      <ChevronRight className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                      <span>{dept.name}</span>
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      <strong className="text-gray-900 font-mono">{dept.completed}</strong> / {dept.total} GV (
                      <span className={`font-bold font-mono ${
                        isFull ? "text-emerald-700" : isLow ? "text-red-600" : "text-amber-600"
                      }`}>
                        {dept.rate}%
                      </span>
                      )
                    </span>
                  </div>

                  {/* Progress Bar with dynamically matched background colours */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex border border-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? "bg-emerald-600" : isLow ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${dept.rate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
