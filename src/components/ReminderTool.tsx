import React, { useState } from "react";
import { MessageSquare, Copy, ClipboardCheck, Users, HelpCircle, Send, Check } from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";

interface ReminderToolProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
}

export default function ReminderTool({
  campaigns,
  teachers,
  departments,
  submissions
}: ReminderToolProps) {
  const [selectedCampId, setSelectedCampId] = useState(campaigns[0]?.id || "");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGroupNews, setCopiedGroupNews] = useState(false);

  // Active campaigns
  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const selectedCampaign = campaigns.find(c => c.id === selectedCampId);

  // Get list of pending teachers (teachers who have NOT submitted for this campaign)
  const submittedTeacherIds = submissions
    .filter(s => s.campaignId === selectedCampId)
    .map(s => s.teacherId);

  const excludedIds = selectedCampaign?.excludedTeacherIds || [];

  const pendingTeachers = teachers
    .filter(t => !excludedIds.includes(t.id))
    .filter(t => !submittedTeacherIds.includes(t.id))
    .map(t => {
      const deptName = departments.find(d => d.id === t.departmentId)?.name || "Chưa phân tổ";
      return {
        ...t,
        deptName
      };
    });

  // Get direct link
  const submissionLink = window.location.origin;

  // Generate individual copy text
  const getIndividualMessage = (tName: string, deptName: string) => {
    const deadlineStr = selectedCampaign
      ? new Date(selectedCampaign.deadline).toLocaleDateString("vi-VN")
      : "";
    const campTitle = selectedCampaign ? selectedCampaign.title : "";
    
    return `Kính gửi Thầy/Cô ${tName} (${deptName}),\n\nNhà trường kính mong Thầy/Cô khẩn trương hoàn thành việc nộp minh chứng bồi dưỡng/khảo sát cho đợt "${campTitle}" trước ngày ${deadlineStr}.\n\n👉 Đường link nộp minh chứng trực tuyến của trường: ${submissionLink}\n\nTrân trọng cảm ơn Thầy/Cô!`;
  };

  const handleCopyIndividual = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Generate Group Newsletter
  const generateGroupNews = () => {
    if (!selectedCampaign) return "";

    const deadlineStr = new Date(selectedCampaign.deadline).toLocaleDateString("vi-VN");
    const campTitle = selectedCampaign.title;

    if (pendingTeachers.length === 0) {
      return `🌟 [THÔNG BÁO HOÀN THÀNH]\n\nKính gửi Ban Giám hiệu cùng toàn thể Thầy Cô Trường PTDTNT THCS & THPT Mai Sơn,\n\nChúc mừng toàn thể các Thầy Cô giáo đã HOÀN THÀNH 100% nộp minh chứng chuyên môn cho đợt "${campTitle}".\n\nTrân trọng cảm ơn sự hợp tác tích cực và đầy trách nhiệm của các Thầy Cô!`;
    }

    // Group pending teachers by department
    const groupedPending: { [deptName: string]: string[] } = {};
    pendingTeachers.forEach(t => {
      if (!groupedPending[t.deptName]) {
        groupedPending[t.deptName] = [];
      }
      groupedPending[t.deptName].push(t.name);
    });

    let listText = "";
    Object.keys(groupedPending).forEach((dept, index) => {
      listText += `\n📍 ${dept}:\n`;
      groupedPending[dept].forEach((name, i) => {
        listText += `  ${i + 1}. Thầy/Cô ${name}\n`;
      });
    });

    return `📢 [THÔNG BÁO ĐÔN ĐỐC NỘP MINH CHỨNG]\n\nKính gửi toàn thể các Thầy Cô giáo Trường PTDTNT THCS & THPT Mai Sơn,\n\nĐể đảm bảo tiến độ báo cáo và lưu trữ hồ sơ, Ban Giám hiệu rất mong các Thầy Cô có tên dưới đây hoàn thành nộp minh chứng cho đợt: "${campTitle}" trước ngày ${deadlineStr}.\n\nDanh sách các Thầy/Cô chưa hoàn thành:${listText}\n👇 Thầy/Cô vui lòng truy cập đường link dưới đây, tìm tên mình và tải tập tin lên:\n🔗 Liên kết nộp bài trực tuyến: ${submissionLink}\n\nXin trân trọng cảm ơn sự hợp tác của các Thầy Cô!`;
  };

  const handleCopyGroupNews = () => {
    const text = generateGroupNews();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedGroupNews(true);
      setTimeout(() => setCopiedGroupNews(false), 2000);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="reminder-tool-panel">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Công cụ Đôn đốc & Nhắc nhở thông minh</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hỗ trợ BGH và Tổ trưởng gửi tin nhắn nhắc nhở riêng, hoặc sao chép bản tin tổng hợp gửi lên nhóm chung Zalo/Messenger của nhà trường.
          </p>
        </div>

        {/* Campaign select tab */}
        <div className="shrink-0">
          <select
            value={selectedCampId}
            onChange={(e) => setSelectedCampId(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hand: Pending Teachers Table (8 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[550px]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2 flex items-center space-x-1.5">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Chưa hoàn thành nộp bài ({pendingTeachers.length})</span>
          </h3>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50/70 pr-1">
            {pendingTeachers.length > 0 ? (
              pendingTeachers.map((t) => {
                const message = getIndividualMessage(t.name, t.deptName);
                const isCopied = copiedId === t.id;

                return (
                  <div key={t.id} className="py-3 flex items-center justify-between group hover:bg-gray-50/40 rounded-xl px-2 transition-all">
                    <div className="min-w-0 pr-4">
                      <div className="text-sm font-bold text-gray-900">{t.name}</div>
                      <div className="text-[10px] font-semibold text-emerald-800 mt-0.5">{t.deptName}</div>
                      {t.phone && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">SĐT: {t.phone}</div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopyIndividual(t.id, message)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all duration-200 shrink-0 ${
                        isCopied
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-white border border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Nhắc nhở</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Check className="h-10 w-10 text-emerald-600 bg-emerald-50 p-2 rounded-full mb-3" />
                <h4 className="font-bold text-gray-800">Tuyệt vời!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Toàn bộ các thầy cô giáo trong trường đã hoàn thành nộp minh chứng cho đợt này.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: Group Chat Newsletter Generator (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col h-[550px]">
          <div className="flex justify-between items-center border-b border-gray-50 pb-2 mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>Bản tin tổng đôn đốc nhóm chung</span>
            </h3>
            {pendingTeachers.length > 0 && (
              <button
                onClick={handleCopyGroupNews}
                className={`inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow ${
                  copiedGroupNews ? "bg-emerald-800 hover:bg-emerald-800" : ""
                }`}
              >
                {copiedGroupNews ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Sao chép tin</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-[11px] text-gray-700 overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
            {generateGroupNews() || "Vui lòng thêm đợt khảo sát để tạo bản tin."}
          </div>

          <div className="mt-4 p-3 bg-emerald-50/40 border border-emerald-100/60 rounded-xl flex items-start space-x-2">
            <HelpCircle className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-950/80 leading-relaxed">
              <strong>Mẹo nhỏ:</strong> Nhấn nút "Sao chép tin" ở góc phải, sau đó mở nhóm liên lạc Zalo hoặc Messenger của trường/tổ để dán trực tiếp. Giáo viên chỉ cần nhấp vào link trong bản tin để nộp ngay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
