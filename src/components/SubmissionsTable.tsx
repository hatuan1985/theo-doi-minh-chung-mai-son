import React, { useState } from "react";
import { Search, Filter, Download, Eye, Trash2, Calendar, Clock, AlertCircle, CheckCircle, Image, FileText, ExternalLink, Folder, CloudUpload, RefreshCw } from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";
import FilePreviewModal from "./FilePreviewModal.js";
import JSZip from "jszip";

interface SubmissionsTableProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
  onDeleteSubmission: (id: string) => Promise<void>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
}

export default function SubmissionsTable({
  campaigns,
  teachers,
  departments,
  submissions,
  onDeleteSubmission,
  onDeleteTeacher,
  onUpdateCampaign
}: SubmissionsTableProps) {
  const [selectedCampId, setSelectedCampId] = useState(campaigns[0]?.id || "");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Delete Modals State
  const [deletingSubId, setDeletingSubId] = useState<string | null>(null);
  const [deletingSubTeacherName, setDeletingSubTeacherName] = useState<string | null>(null);
  
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [deletingTeacherName, setDeletingTeacherName] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ id: string; name: string; type: string; size: number; url?: string } | null>(null);

  const [isExportingImages, setIsExportingImages] = useState(false);
  const [exportProgress, setExportProgress] = useState("");

  // Google Drive Sync state
  const [syncingSubId, setSyncingSubId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string>("");

  const handleSyncSingle = async (_subId: string) => {
    setSyncNotice("Bản GitHub Pages lưu trực tiếp lên Google Drive khi giáo viên nộp tệp. Minh chứng cũ chưa có liên kết Drive cần được nộp lại để đồng bộ.");
  };

  const handleSyncAllToDrive = async () => {
    setSyncNotice("Các minh chứng mới đã được tự động lưu lên Google Drive. Các minh chứng cũ chưa có liên kết cần được nộp lại.");
  };

  // Find currently selected campaign and its excluded teachers
  const selectedCampaign = campaigns.find(c => c.id === selectedCampId);
  const excludedTeacherIds = selectedCampaign?.excludedTeacherIds || [];

  // Filter out teachers who are excluded from the currently selected campaign
  const activeTeachers = teachers.filter(t => !excludedTeacherIds.includes(t.id));

  // Calculate row list matching all filters
  // Since we want to display both Submitted and Pending, we can combine teachers list with submissions details for the selected campaign
  const rows = activeTeachers.map(teacher => {
    const dept = departments.find(d => d.id === teacher.departmentId);
    const submission = submissions.find(
      s => s.campaignId === selectedCampId && s.teacherId === teacher.id
    );

    return {
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherPhone: teacher.phone || "",
      deptId: dept?.id || "",
      deptName: dept?.name || "Chưa phân tổ",
      submissionId: submission?.id || "",
      fileName: submission?.fileName || "",
      fileSize: submission?.fileSize || 0,
      fileType: submission?.fileType || "",
      fileId: submission?.fileId || "",
      uploadedAt: submission?.uploadedAt || "",
      comment: submission?.comment || "",
      driveFileId: submission?.driveFileId || "",
      driveWebViewLink: submission?.driveWebViewLink || "",
      isSubmitted: !!submission
    };
  });

  // Apply filters to row list
  const unfilteredFilteredRows = rows.filter(row => {
    // 1. Filter by Department
    if (selectedDeptId && row.deptId !== selectedDeptId) return false;

    // 2. Filter by Submission Status
    if (statusFilter === "submitted" && !row.isSubmitted) return false;
    if (statusFilter === "pending" && row.isSubmitted) return false;

    // 3. Filter by Search Query (Teacher name, file name, comment)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = row.teacherName.toLowerCase().includes(q);
      const matchFile = row.fileName.toLowerCase().includes(q);
      const matchComment = row.comment.toLowerCase().includes(q);
      const matchDept = row.deptName.toLowerCase().includes(q);
      if (!matchName && !matchFile && !matchComment && !matchDept) return false;
    }

    return true;
  });

  // Sort: Put BGH at the top (positions 1, 2, 3...)
  const filteredRows = [...unfilteredFilteredRows].sort((a, b) => {
    const aIsBgh = a.deptId === "dept-bgh" || a.deptName === "BGH" || a.deptName.toUpperCase() === "BGH" || a.teacherName === "Trần Văn Phúc" || a.teacherName === "Hà Anh Tuấn" || a.teacherName === "Phạm Thị Hòa";
    const bIsBgh = b.deptId === "dept-bgh" || b.deptName === "BGH" || b.deptName.toUpperCase() === "BGH" || b.teacherName === "Trần Văn Phúc" || b.teacherName === "Hà Anh Tuấn" || b.teacherName === "Phạm Thị Hòa";
    
    if (aIsBgh && !bIsBgh) return -1;
    if (!aIsBgh && bIsBgh) return 1;
    
    // Within BGH, sort in specific order if possible: Trần Văn Phúc, Hà Anh Tuấn, Phạm Thị Hòa
    if (aIsBgh && bIsBgh) {
      const order = ["Trần Văn Phúc", "Hà Anh Tuấn", "Phạm Thị Hòa"];
      const idxA = order.indexOf(a.teacherName);
      const idxB = order.indexOf(b.teacherName);
      if (idxA !== -1 && idxB !== -1) {
        return idxA - idxB;
      }
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    
    return 0;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    const k = 1024;
    return parseFloat((bytes / k).toFixed(1)) + " KB";
  };

  const handleDelete = (subId: string, teacherName: string) => {
    setDeletingSubId(subId);
    setDeletingSubTeacherName(teacherName);
    setModalError("");
  };

  const handleDeleteTeacher = (teacherId: string, name: string) => {
    setDeletingTeacherId(teacherId);
    setDeletingTeacherName(name);
    setModalError("");
  };

  const confirmDeleteSubmission = async () => {
    if (!deletingSubId) return;
    setSaving(true);
    setModalError("");
    try {
      await onDeleteSubmission(deletingSubId);
      setDeletingSubId(null);
      setDeletingSubTeacherName(null);
    } catch (err: any) {
      setModalError(err.message || "Không thể xóa minh chứng.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTeacher = async () => {
    if (!deletingTeacherId) return;
    setSaving(true);
    setModalError("");
    try {
      if (!selectedCampId) {
        throw new Error("Không xác định được đợt nộp chuyên môn.");
      }
      
      const currentCampaign = campaigns.find(c => c.id === selectedCampId);
      if (!currentCampaign) {
        throw new Error("Không tìm thấy đợt nộp chuyên môn đang chọn.");
      }

      const currentExcluded = currentCampaign.excludedTeacherIds || [];
      if (!currentExcluded.includes(deletingTeacherId)) {
        const updatedExcluded = [...currentExcluded, deletingTeacherId];
        await onUpdateCampaign(selectedCampId, { excludedTeacherIds: updatedExcluded });
      }

      // Also clean up any active submission by this teacher for this campaign (if exists)
      const sub = submissions.find(s => s.campaignId === selectedCampId && s.teacherId === deletingTeacherId);
      if (sub) {
        await onDeleteSubmission(sub.id);
      }

      setDeletingTeacherId(null);
      setDeletingTeacherName(null);
    } catch (err: any) {
      setModalError(err.message || "Không thể xóa giáo viên khỏi đợt nộp chuyên môn này.");
    } finally {
      setSaving(false);
    }
  };

  // Export CSV with UTF-8 BOM
  const handleExportCSV = () => {
    const campTitle = campaigns.find(c => c.id === selectedCampId)?.title || "Bao_Cao";
    
    // Header information rows
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const csvContentRows: string[][] = [
      [
        "SỞ GIÁO DỤC VÀ ĐÀO TẠO SƠN LA",
        "",
        "",
        "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM"
      ],
      [
        "TRƯỜNG PTDTNT THCS-THPT MAI SƠN",
        "",
        "",
        "Độc lập - Tự do - Hạnh phúc"
      ],
      [
        "",
        "",
        "",
        `Mai Sơn, ngày ${day} tháng ${month} năm ${year}`
      ],
      ["", "", "", ""], // empty spacer
      [
        "",
        "DANH SÁCH",
        "",
        ""
      ],
      [
        "",
        `GIÁO VIÊN THAM GIA (${campTitle.toUpperCase()})`,
        "",
        ""
      ],
      ["", "", "", ""], // empty spacer
      [
        "TT",
        "Họ và tên",
        "Tổ",
        "Ghi chú"
      ]
    ];

    // Add data rows mapped from filtered teachers list
    filteredRows.forEach((row, idx) => {
      const noteStr = row.isSubmitted 
        ? "Đã hoàn thành" + (row.comment ? ` (${row.comment})` : "") 
        : "Chưa hoàn thành";

      csvContentRows.push([
        String(idx + 1),
        row.teacherName,
        row.deptName,
        noteStr
      ]);
    });

    // Spacer before signature block
    csvContentRows.push(["", "", "", ""]);
    csvContentRows.push(["", "", "", ""]);

    // Signature headers
    csvContentRows.push([
      "",
      "NGƯỜI LẬP DANH SÁCH",
      "",
      "THỦ TRƯỞNG ĐƠN VỊ"
    ]);

    // Signatures spacing (empty rows)
    csvContentRows.push(["", "", "", ""]);
    csvContentRows.push(["", "", "", ""]);
    csvContentRows.push(["", "", "", ""]);

    // Signers' names
    csvContentRows.push([
      "",
      "Hà Anh Tuấn",
      "",
      "Trần Văn Phúc"
    ]);

    // Create CSV content starting with the UTF-8 BOM byte order mark
    const UTF8_BOM = "\uFEFF";
    const csvContent = csvContentRows.map(row => row.map(val => {
      // Escape quotes and wrap cell in quotes if it has comma, newline, quote, or space
      let cleanVal = val ? String(val).replace(/"/g, '""') : "";
      if (cleanVal.includes(",") || cleanVal.includes("\n") || cleanVal.includes('"') || cleanVal.includes(" ")) {
        cleanVal = `"${cleanVal}"`;
      }
      return cleanVal;
    }).join(",")).join("\n");

    const blob = new Blob([UTF8_BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const cleanFileName = `DanhSachGiaoVien_${campTitle.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.csv`;
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Word Document (.doc but behaves as fully styled .docx in MS Word)
  const handleExportWord = () => {
    const campTitle = campaigns.find(c => c.id === selectedCampId)?.title || "Bao_Cao";
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    // Map rows to HTML table entries
    const tableRowsHtml = filteredRows.map((row, idx) => {
      let noteStr = "";
      if (row.isSubmitted) {
        noteStr = "Đã hoàn thành";
        if (row.comment) {
          noteStr += ` (${row.comment})`;
        }
      } else {
        noteStr = "Chưa hoàn thành";
      }

      return `
        <tr>
          <td style="text-align: center; border: 1px solid #000000; padding: 8px; font-family: 'Times New Roman'; font-size: 11pt; vertical-align: middle;">${idx + 1}.</td>
          <td style="border: 1px solid #000000; padding: 8px 12px; font-family: 'Times New Roman'; font-size: 11pt; vertical-align: middle;">${row.teacherName}</td>
          <td style="border: 1px solid #000000; padding: 8px 12px; font-family: 'Times New Roman'; font-size: 11pt; vertical-align: middle;">${row.deptName}</td>
          <td style="border: 1px solid #000000; padding: 8px 12px; font-family: 'Times New Roman'; font-size: 11pt; vertical-align: middle;">${noteStr}</td>
        </tr>
      `;
    }).join("");

    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Danh sách giáo viên tham gia</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: A4;
            margin-top: 1.8cm;
            margin-bottom: 1.8cm;
            margin-left: 3.0cm;
            margin-right: 1.5cm;
          }
          @page Section1 {
            size: 21cm 29.7cm;
            margin: 1.8cm 1.5cm 1.8cm 3.0cm; /* top, right, bottom, left */
            mso-header-margin: 36.0pt;
            mso-footer-margin: 36.0pt;
            mso-paper-source: 0;
          }
          div.Section1 {
            page: Section1;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 11pt;
            line-height: 1.35;
            color: #000000;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-bottom: 25px;
          }
          .header-table td {
            border: none;
            padding: 0;
            vertical-align: top;
          }
          .title-section {
            text-align: center;
            margin-top: 15px;
            margin-bottom: 25px;
          }
          .title-main {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 2px;
            font-family: "Times New Roman";
            text-transform: uppercase;
          }
          .title-sub {
            font-size: 12pt;
            font-weight: bold;
            font-family: "Times New Roman";
            text-transform: uppercase;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .data-table th {
            border: 1px solid #000000;
            padding: 10px 6px;
            font-size: 11pt;
            font-weight: bold;
            text-align: center;
            font-family: "Times New Roman";
            background-color: #f2f2f2;
          }
          .signature-table {
            width: 100%;
            border-collapse: collapse;
            border: none;
            margin-top: 35px;
          }
          .signature-table td {
            border: none;
            padding: 0;
            text-align: center;
            vertical-align: top;
            width: 50%;
            font-family: "Times New Roman";
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <table class="header-table">
            <tr>
              <td style="text-align: center; width: 45%; font-family: 'Times New Roman'; vertical-align: top;">
                <span style="font-size: 10pt;">SỞ GIÁO DỤC VÀ ĐÀO TẠO SƠN LA</span><br>
                <span style="font-size: 10pt; font-weight: bold; text-decoration: underline;">TRƯỜNG PTDTNT THCS-THPT MAI SƠN</span>
              </td>
              <td style="text-align: center; width: 55%; font-family: 'Times New Roman'; vertical-align: top;">
                <span style="font-size: 10pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br>
                <span style="font-size: 10pt; font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</span><br>
                <span style="font-size: 10.5pt; font-style: italic; display: block; margin-top: 8px;">Mai Sơn, ngày ${day} tháng ${month} năm ${year}</span>
              </td>
            </tr>
          </table>

          <div class="title-section">
            <div class="title-main">DANH SÁCH</div>
            <div class="title-sub">GIÁO VIÊN THAM GIA: ${campTitle}</div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 10%; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; border: 1px solid #000000; text-align: center; background-color: #f2f2f2; padding: 10px 6px;">TT</th>
                <th style="width: 42%; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; border: 1px solid #000000; text-align: center; background-color: #f2f2f2; padding: 10px 6px;">Họ và tên</th>
                <th style="width: 24%; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; border: 1px solid #000000; text-align: center; background-color: #f2f2f2; padding: 10px 6px;">Tổ</th>
                <th style="width: 24%; font-family: 'Times New Roman'; font-size: 11pt; font-weight: bold; border: 1px solid #000000; text-align: center; background-color: #f2f2f2; padding: 10px 6px;">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>

          <table class="signature-table">
            <tr>
              <td style="font-family: 'Times New Roman'; font-size: 11pt; text-align: center;">
                <span style="font-weight: bold;">NGƯỜI LẬP DANH SÁCH</span>
              </td>
              <td style="font-family: 'Times New Roman'; font-size: 11pt; text-align: center;">
                <span style="font-weight: bold;">THỦ TRƯỞNG ĐƠN VỊ</span>
              </td>
            </tr>
            <tr>
              <td style="height: 100px;"></td>
              <td style="height: 100px;"></td>
            </tr>
            <tr>
              <td style="font-family: 'Times New Roman'; font-size: 11pt; text-align: center;">
                <span style="font-weight: bold;">Hà Anh Tuấn</span>
              </td>
              <td style="font-family: 'Times New Roman'; font-size: 11pt; text-align: center;">
                <span style="font-weight: bold;">Trần Văn Phúc</span>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Convert the HTML to a Blob with word application type
    const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const cleanFileName = `DanhSachGiaoVien_${campTitle.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.doc`;
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", cleanFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export image submissions as a ZIP file
  const handleExportImagesZip = async () => {
    alert("Tính năng tải ZIP ảnh trực tiếp từ máy chủ cũ không dùng trên GitHub Pages. Thầy/Cô có thể mở thư mục Google Drive để tải nhiều tệp cùng lúc.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="submissions-table-panel">
      {/* Filters Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-50 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
              <span>Danh sách Theo dõi & Thu bài</span>
              {exportProgress && (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 animate-pulse">
                  {exportProgress}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Tra cứu, lọc trạng thái nộp, tải xuống báo cáo và xem trước minh chứng chuyên môn trực tuyến.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
            <a
              href="https://drive.google.com/drive/folders/1ZhplPmXeI4ujatTN4S91842kixupZUuu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold shadow-xs transition-all duration-150 shrink-0 cursor-pointer"
              title="Mở thư mục lưu trữ minh chứng trên Google Drive"
              id="btn-open-drive-folder"
            >
              <Folder className="h-4 w-4 text-amber-500" />
              <span>Thư mục Drive</span>
            </a>
            <button
              onClick={handleExportWord}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/10 transition-all duration-150 shrink-0 cursor-pointer"
              id="btn-export-word"
            >
              <FileText className="h-4 w-4" />
              <span>Xuất báo cáo Word (.doc)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all duration-150 shrink-0 cursor-pointer"
              id="btn-export-csv"
            >
              <Download className="h-4 w-4" />
              <span>Xuất báo cáo Excel (CSV)</span>
            </button>
            <button
              onClick={handleExportImagesZip}
              disabled={isExportingImages}
              className={`inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#00875a] hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all duration-150 shrink-0 cursor-pointer ${
                isExportingImages ? "opacity-75 cursor-not-allowed" : ""
              }`}
              id="btn-export-images"
            >
              <Image className="h-4 w-4" />
              <span>{isExportingImages ? "Đang xuất..." : "Xuất minh chứng (Ảnh)"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Campaign Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500" htmlFor="filter-campaign">Đợt nộp chuyên môn:</label>
            <select
              id="filter-campaign"
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          {/* Department Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500" htmlFor="filter-dept">Lọc Tổ chuyên môn:</label>
            <select
              id="filter-dept"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Tất cả tổ --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500" htmlFor="filter-status">Lọc trạng thái nộp:</label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả giáo viên</option>
              <option value="submitted">Chỉ người Đã nộp</option>
              <option value="pending">Chỉ người Chưa nộp</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500" htmlFor="filter-search">Tìm nhanh thông tin:</label>
            <div className="relative">
              <input
                id="filter-search"
                type="text"
                placeholder="Nhập tên giáo viên, tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Sync Notice */}
      {syncNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Unsynced Submissions Banner */}
      {rows.filter(r => r.isSubmitted && !r.driveWebViewLink).length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold text-amber-950">
                Phát hiện {rows.filter(r => r.isSubmitted && !r.driveWebViewLink).length} minh chứng đã nộp nhưng chưa có trong Google Drive.
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Nhấn vào nút bên cạnh để hệ thống tự động tải tất cả các tệp minh chứng này vào Thư mục Google Drive nhà trường.
              </p>
            </div>
          </div>
          <button
            onClick={handleSyncAllToDrive}
            disabled={syncingAll}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            {syncingAll ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <>
                <CloudUpload className="h-3.5 w-3.5" />
                <span>Đồng bộ tất cả lên Google Drive ngay</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Giáo viên / Tổ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Minh chứng</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4 text-right">Xem/Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.teacherId} className={`hover:bg-gray-50/40 transition-colors ${!row.isSubmitted ? "opacity-75" : ""}`}>
                    {/* Teacher Details */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{row.teacherName}</div>
                      <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">{row.deptName}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {row.isSubmitted ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full text-xs font-bold">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          <span>Đã nộp</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-800 border border-red-100 rounded-full text-xs font-bold">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span>Chưa nộp</span>
                        </span>
                      )}
                    </td>

                    {/* File Details (Minh chứng) */}
                    <td className="px-6 py-4 max-w-xs">
                      {row.isSubmitted ? (
                        <div>
                          <div className="font-semibold text-gray-800 truncate text-sm" title={row.fileName}>
                            {row.fileName}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
                            {formatSize(row.fileSize)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-450 italic text-xs">Chưa có minh chứng</span>
                      )}
                    </td>

                    {/* Time & optional comment (Thời gian) */}
                    <td className="px-6 py-4 max-w-xs">
                      {row.isSubmitted && row.uploadedAt ? (
                        <div>
                          <div className="font-bold text-gray-800 text-xs">
                            {new Date(row.uploadedAt).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric"
                            })}
                          </div>
                          {row.comment && (
                            <p className="text-[11px] text-gray-400 mt-1 line-clamp-1 leading-normal italic" title={row.comment}>
                              Ghi chú: {row.comment}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400/80 italic text-xs">—</span>
                      )}
                    </td>

                    {/* Operations */}
                    <td className="px-6 py-4 text-right">
                      {row.isSubmitted ? (
                        <div className="flex items-center justify-end space-x-2">
                          {row.driveWebViewLink ? (
                            <a
                              href={row.driveWebViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-colors cursor-pointer border border-blue-200"
                              title="Mở tệp trên Google Drive"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              onClick={() => handleSyncSingle(row.submissionId)}
                              disabled={syncingSubId === row.submissionId}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              title="Chuyển tệp này vào Thư mục Google Drive"
                            >
                              {syncingSubId === row.submissionId ? (
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-600" />
                              ) : (
                                <CloudUpload className="h-3.5 w-3.5 text-amber-600" />
                              )}
                              <span className="hidden sm:inline">Lên Drive</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setPreviewData({
                                id: row.fileId,
                                name: row.fileName,
                                type: row.fileType,
                                size: row.fileSize,
                                url: row.driveWebViewLink
                              });
                              setPreviewOpen(true);
                            }}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 rounded-lg transition-colors"
                            title="Xem minh chứng"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row.submissionId, row.teacherName)}
                            className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                            title="Xóa minh chứng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDeleteTeacher(row.teacherId, row.teacherName)}
                            className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                            title="Xóa giáo viên khỏi danh sách"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-xs font-semibold text-gray-400">
                    Không tìm thấy dữ liệu giáo viên hoặc minh chứng khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded File Preview Modal */}
      {previewData && (
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={previewData.name}
          fileType={previewData.type}
          fileId={previewData.id}
          fileSize={previewData.size}
          fileUrl={previewData.url}
        />
      )}

      {/* DELETE SUBMISSION CONFIRMATION MODAL */}
      {deletingSubId && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-red-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Xác nhận xóa Minh chứng</span>
            </h3>

            <div className="py-2 text-sm text-gray-600 space-y-3">
              <p>
                Thầy/Cô có thực sự muốn xóa minh chứng đã nộp của giáo viên <strong className="text-gray-900 font-bold">"{deletingSubTeacherName}"</strong>?
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-medium flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Tệp tin minh chứng tương ứng trên máy chủ cũng sẽ bị xóa vĩnh viễn và không thể hoàn tác.
                </span>
              </div>
              {modalError && (
                <p className="text-xs text-red-600 font-bold">{modalError}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => { setDeletingSubId(null); setDeletingSubTeacherName(null); }}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteSubmission}
                disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/10 cursor-pointer"
              >
                {saving ? "Đang xóa..." : "Đồng ý xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TEACHER CONFIRMATION MODAL */}
      {deletingTeacherId && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-red-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Xác nhận loại khỏi Đợt nộp này</span>
            </h3>

            <div className="py-2 text-sm text-gray-600 space-y-3">
              <p>
                Thầy/Cô có chắc chắn muốn loại giáo viên <strong className="text-gray-900 font-bold">"{deletingTeacherName}"</strong> khỏi đợt nộp chuyên môn <strong className="text-emerald-800 font-bold">"{selectedCampaign?.title}"</strong>?
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-medium flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Hành động này chỉ ẩn giáo viên này khỏi đợt nộp chuyên môn đang chọn (ví dụ: giáo viên không thuộc diện phải nộp minh chứng đợt này). Giáo viên vẫn tồn tại trong hệ thống nhà trường và các đợt nộp khác.
                </span>
              </div>
              {modalError && (
                <p className="text-xs text-red-600 font-bold">{modalError}</p>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => { setDeletingTeacherId(null); setDeletingTeacherName(null); }}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteTeacher}
                disabled={saving}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/10 cursor-pointer"
              >
                {saving ? "Đang xử lý..." : "Đồng ý xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
