import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  RefreshCw,
  Search,
  Upload,
  User,
  X
} from "lucide-react";
import { Campaign, Department, Teacher, Submission } from "../types.js";
import FilePreviewModal from "./FilePreviewModal.js";
import { DRIVE_FOLDER_URL } from "../services/appsScriptApi.js";

interface TeacherPortalProps {
  campaigns: Campaign[];
  teachers: Teacher[];
  departments: Department[];
  submissions: Submission[];
  onNewSubmission: (submission: any) => Promise<void>;
  loading: boolean;
}

export default function TeacherPortal({
  campaigns,
  teachers,
  departments,
  submissions,
  onNewSubmission
}: TeacherPortalProps) {
  const activeCampaigns = campaigns.filter(c => c.status === "active");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [searchTeacher, setSearchTeacher] = useState("");
  const [showTeachers, setShowTeachers] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successSubmission, setSuccessSubmission] = useState<Submission | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Submission | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const teacherBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCampaignId && activeCampaigns.length) {
      setSelectedCampaignId(activeCampaigns[0].id);
    }
  }, [selectedCampaignId, activeCampaigns]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (teacherBoxRef.current && !teacherBoxRef.current.contains(e.target as Node)) {
        setShowTeachers(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const currentCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const currentTeacher = teachers.find(t => t.id === selectedTeacherId);
  const currentDepartment = currentTeacher
    ? departments.find(d => d.id === currentTeacher.departmentId)?.name || ""
    : "";
  const existingSubmission = submissions.find(
    s => s.campaignId === selectedCampaignId && s.teacherId === selectedTeacherId
  );

  useEffect(() => {
    setFile(null);
    setComment(existingSubmission?.comment || "");
    setAgreementAccepted(false);
    setErrorMessage("");
    setSuccessSubmission(null);
  }, [selectedCampaignId, selectedTeacherId, existingSubmission?.id]);

  const filteredTeachers = useMemo(() => {
    const excluded = new Set(currentCampaign?.excludedTeacherIds || []);
    const q = searchTeacher.trim().toLowerCase();
    return teachers.filter(t => {
      if (excluded.has(t.id)) return false;
      if (selectedDeptId !== "all" && t.departmentId !== selectedDeptId) return false;
      return !q || t.name.toLowerCase().includes(q);
    });
  }, [teachers, currentCampaign, selectedDeptId, searchTeacher]);

  const submittedCount = submissions.filter(s => s.campaignId === selectedCampaignId).length;

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const validateFile = (candidate: File) => {
    setErrorMessage("");
    if (candidate.size > 3 * 1024 * 1024) {
      setErrorMessage("Tệp vượt quá giới hạn 3MB. Vui lòng nén hoặc chọn tệp nhỏ hơn.");
      return;
    }
    const ext = "." + (candidate.name.split(".").pop() || "").toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv"];
    if (!allowed.includes(ext)) {
      setErrorMessage("Chỉ chấp nhận ảnh, PDF, Word, Excel hoặc CSV.");
      return;
    }
    setFile(candidate);
  };

  const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const handleSubmit = async () => {
    if (!selectedCampaignId || !selectedTeacherId) {
      setErrorMessage("Vui lòng chọn đợt nộp và giáo viên.");
      return;
    }
    if (!file) {
      if (existingSubmission) {
        setErrorMessage("Nếu muốn thay minh chứng cũ, vui lòng chọn một tệp mới.");
      } else {
        setErrorMessage("Vui lòng chọn tệp minh chứng.");
      }
      return;
    }
    if (!agreementAccepted) {
      setErrorMessage("Vui lòng xác nhận nội dung cam kết trước khi gửi.");
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setErrorMessage("");
    try {
      setStatusText("Đang đọc tệp minh chứng...");
      const fileData = await fileToBase64(file);
      setUploadProgress(45);

      const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const standardizedName = `${currentTeacher?.name || "GiaoVien"}${ext}`;
      setStatusText("Đang lưu tệp vào Google Drive nhà trường...");
      setUploadProgress(70);

      await onNewSubmission({
        campaignId: selectedCampaignId,
        teacherId: selectedTeacherId,
        fileName: standardizedName,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileData,
        comment
      });

      setUploadProgress(100);
      setStatusText("Đã lưu thành công.");
      setFile(null);
      setTimeout(() => {
        const newest = submissions.find(
          s => s.campaignId === selectedCampaignId && s.teacherId === selectedTeacherId
        );
        if (newest) setSuccessSubmission(newest);
        setUploading(false);
      }, 300);
    } catch (err: any) {
      setUploading(false);
      setUploadProgress(0);
      setStatusText("");
      setErrorMessage(err.message || "Không thể gửi minh chứng.");
    }
  };

  useEffect(() => {
    if (uploadProgress === 100 && !uploading) {
      const newest = submissions.find(
        s => s.campaignId === selectedCampaignId && s.teacherId === selectedTeacherId
      );
      if (newest) setSuccessSubmission(newest);
    }
  }, [submissions, selectedCampaignId, selectedTeacherId, uploadProgress, uploading]);

  const openPreview = (sub: Submission) => {
    setPreviewData(sub);
    setPreviewOpen(true);
  };

  if (successSubmission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-emerald-100 rounded-3xl shadow-xl p-8 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h2 className="mt-5 text-2xl font-black text-gray-950">Nộp Minh Chứng Thành Công!</h2>
          <p className="mt-2 text-sm text-gray-500">Tệp đã được lưu vào Google Drive của nhà trường và ghi nhận trên hệ thống.</p>

          <div className="mt-6 bg-emerald-50/60 border border-emerald-100 rounded-2xl p-5 text-left text-sm space-y-2">
            <div className="flex justify-between gap-4"><span className="text-gray-500">Giáo viên</span><strong>{currentTeacher?.name}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Tổ</span><strong>{currentDepartment}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Tệp</span><strong className="truncate">{successSubmission.fileName}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Dung lượng</span><strong>{formatSize(successSubmission.fileSize)}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Google Drive</span><strong className="text-emerald-700">Đã lưu</strong></div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {successSubmission.driveWebViewLink && (
              <a href={successSubmission.driveWebViewLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
                <ExternalLink className="h-4 w-4" /> Xem trên Drive
              </a>
            )}
            <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-800">
              <Folder className="h-4 w-4 text-amber-600" /> Mở thư mục Drive
            </a>
            <button onClick={() => openPreview(successSubmission)} className="px-5 py-3 border border-emerald-200 hover:bg-emerald-50 rounded-xl text-sm font-bold text-emerald-700">
              Xem minh chứng
            </button>
            <button onClick={() => { setSelectedTeacherId(""); setSearchTeacher(""); setSuccessSubmission(null); setUploadProgress(0); }} className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 rounded-xl text-sm font-bold text-white">
              Nộp cho giáo viên khác
            </button>
          </div>
        </div>

        {previewData && (
          <FilePreviewModal
            isOpen={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fileName={previewData.fileName}
            fileType={previewData.fileType}
            fileId={previewData.fileId}
            fileSize={previewData.fileSize}
            fileUrl={previewData.driveWebViewLink}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-visible">
        <div className="bg-[#007A48] text-white p-6 sm:p-8 rounded-t-3xl">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-100 text-[10px] font-black tracking-wider">CỔNG THÔNG TIN GIÁO VIÊN</span>
              <h1 className="mt-3 text-xl sm:text-2xl font-black uppercase">Nộp minh chứng khảo sát / bồi dưỡng</h1>
              <div className="relative mt-4 max-w-xl">
                <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} className="w-full appearance-none bg-[#005c36] border border-emerald-500/30 rounded-xl px-4 py-3 pr-9 text-sm font-bold text-white outline-none">
                  {activeCampaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-emerald-100 pointer-events-none" />
              </div>
              {currentCampaign && <p className="mt-3 text-xs sm:text-sm text-emerald-50 italic">{currentCampaign.description}</p>}
            </div>
            <div className="bg-[#005c36] rounded-2xl px-5 py-4 text-center shrink-0">
              <div className="text-3xl font-black text-yellow-300">{submittedCount}/{teachers.length}</div>
              <div className="text-[10px] font-black tracking-wider mt-1">ĐÃ HOÀN THÀNH</div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> <span>{errorMessage}</span>
            </div>
          )}

          <section className="relative z-50">
            <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider">Bước 1: Chọn giáo viên nộp minh chứng</h3>
            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 overflow-visible">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-3">
                <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className="px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold outline-none">
                  <option value="all">Tất cả tổ</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <div className="relative z-50" ref={teacherBoxRef}>
                  <button type="button" onClick={() => setShowTeachers(v => !v)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-left">
                    <span className={currentTeacher ? "font-bold text-slate-900" : "text-slate-400"}>{currentTeacher?.name || "Chọn tên của bạn"}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                  {showTeachers && (
                    <div className="absolute left-0 right-0 top-full z-[9999] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                      <div className="p-3 border-b border-slate-100 flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input autoFocus value={searchTeacher} onChange={e => setSearchTeacher(e.target.value)} placeholder="Tìm tên giáo viên..." className="w-full outline-none text-sm" />
                        {searchTeacher && <button onClick={() => setSearchTeacher("")}><X className="h-4 w-4 text-slate-400" /></button>}
                      </div>
                      <div className="max-h-72 overflow-auto p-2">
                        {filteredTeachers.map(t => (
                          <button key={t.id} type="button" onClick={() => { setSelectedTeacherId(t.id); setShowTeachers(false); setSearchTeacher(""); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-left">
                            <span className={`h-5 w-5 rounded border flex items-center justify-center ${selectedTeacherId === t.id ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300"}`}>
                              {selectedTeacherId === t.id && <Check className="h-3.5 w-3.5" />}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-slate-800">{t.name}</span>
                            <span className="text-[10px] text-slate-400">{departments.find(d => d.id === t.departmentId)?.name}</span>
                          </button>
                        ))}
                        {!filteredTeachers.length && <p className="p-4 text-center text-xs text-slate-400">Không tìm thấy giáo viên.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {selectedTeacherId && (
            <section className="space-y-4">
              {existingSubmission && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Giáo viên này đã có minh chứng.</p>
                    <p className="text-xs text-amber-800 mt-1">Chọn tệp mới để thay thế minh chứng hiện tại.</p>
                  </div>
                  <div className="flex gap-2">
                    {existingSubmission.driveWebViewLink && <a href={existingSubmission.driveWebViewLink} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700">Xem trên Drive</a>}
                    <button type="button" onClick={() => openPreview(existingSubmission)} className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-800">Xem tệp cũ</button>
                  </div>
                </div>
              )}

              <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-wider">Bước 2: Tải tệp minh chứng</h3>
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Folder className="h-5 w-5 text-amber-600" />
                  <div><strong className="text-emerald-950">Đích lưu trữ: Google Drive nhà trường</strong><p className="text-emerald-700 mt-0.5">Không cần đăng nhập Google.</p></div>
                </div>
                <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer" className="font-bold text-emerald-800 hover:underline">Mở thư mục Drive</a>
              </div>

              <div onClick={() => fileInputRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]); }} className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50">
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv" onChange={e => e.target.files?.[0] && validateFile(e.target.files[0])} />
                {file ? (
                  <div className="space-y-3">
                    <div className="mx-auto h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      {file.name.toLowerCase().endsWith(".pdf") ? <FileText className="h-6 w-6 text-emerald-700" /> : /\.(xls|xlsx|csv)$/i.test(file.name) ? <FileSpreadsheet className="h-6 w-6 text-emerald-700" /> : <File className="h-6 w-6 text-emerald-700" />}
                    </div>
                    <p className="text-sm font-bold text-emerald-800">{currentTeacher?.name}{file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ""}</p>
                    <p className="text-xs text-slate-500">Tệp gốc: {file.name} • {formatSize(file.size)}</p>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold">Bỏ tệp</button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-7 w-7 mx-auto text-slate-400" />
                    <p className="mt-3 text-sm font-bold text-slate-800">Bấm để chọn tệp hoặc kéo thả vào đây</p>
                    <p className="mt-1 text-xs text-slate-400">Ảnh, PDF, Word, Excel, CSV • tối đa 3MB</p>
                  </>
                )}
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Ghi chú (không bắt buộc)" className="w-full min-h-24 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />

              <label className="flex gap-3 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                <input type="checkbox" checked={agreementAccepted} onChange={e => setAgreementAccepted(e.target.checked)} className="mt-1 h-4 w-4" />
                <span className="text-xs sm:text-sm font-semibold text-slate-700">Tôi xác nhận minh chứng gửi kèm là chính xác và chịu trách nhiệm về nội dung đã nộp.</span>
              </label>

              {uploading && (
                <div>
                  <div className="flex justify-between text-xs font-bold text-emerald-800"><span className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 animate-spin" />{statusText}</span><span>{uploadProgress}%</span></div>
                  <div className="mt-2 h-2 bg-emerald-50 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}

              <button type="button" onClick={handleSubmit} disabled={uploading || !file || !agreementAccepted} className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-sm flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" /> Xác nhận & Gửi minh chứng
              </button>
            </section>
          )}
        </div>
      </div>

      {previewData && (
        <FilePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          fileName={previewData.fileName}
          fileType={previewData.fileType}
          fileId={previewData.fileId}
          fileSize={previewData.fileSize}
          fileUrl={previewData.driveWebViewLink}
        />
      )}
    </div>
  );
}
