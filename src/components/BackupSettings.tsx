import React, { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Cloud, Database, Download, ExternalLink, Folder, RefreshCw, ShieldAlert, Upload } from "lucide-react";
import { apiCall, DRIVE_FOLDER_ID, DRIVE_FOLDER_URL } from "../services/appsScriptApi.js";

interface BackupSettingsProps {
  onResetDB: () => Promise<void>;
  loading: boolean;
}

export default function BackupSettings({ onResetDB }: BackupSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearMessages = () => { setSuccessMsg(""); setErrorMsg(""); };

  const handleExport = async () => {
    setLoading(true); clearMessages();
    try {
      const backup = await apiCall<any>("exportBackup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Backup_HeThongMinhChung_MaiSon_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccessMsg("Đã tải tệp sao lưu dữ liệu thành công. Tệp minh chứng vẫn được lưu an toàn trên Google Drive.");
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể xuất dữ liệu sao lưu.");
    } finally { setLoading(false); }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); clearMessages();
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiCall("importBackup", data, 120000);
      setSuccessMsg("Khôi phục dữ liệu thành công. Trang sẽ tải lại để cập nhật.");
      setTimeout(() => window.location.reload(), 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Tệp sao lưu không hợp lệ hoặc khôi phục thất bại.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = async () => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ đưa cơ sở dữ liệu về trạng thái ban đầu. Thầy/Cô có chắc chắn muốn tiếp tục?")) return;
    setLoading(true); clearMessages();
    try {
      await onResetDB();
      setSuccessMsg("Đã khôi phục dữ liệu mặc định thành công.");
    } catch (err: any) {
      setErrorMsg(err.message || "Khôi phục dữ liệu mặc định thất bại.");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="backup-settings-panel">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sao lưu dữ liệu & Cài đặt hệ thống</h2>
        <p className="text-xs text-gray-500 mt-1">Phiên bản GitHub Pages sử dụng Google Apps Script làm máy chủ dữ liệu và Google Drive làm nơi lưu minh chứng.</p>
      </div>

      {successMsg && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3 text-emerald-900 text-sm font-semibold"><CheckCircle2 className="h-5 w-5 shrink-0" />{successMsg}</div>}
      {errorMsg && <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 text-red-900 text-sm font-semibold"><AlertTriangle className="h-5 w-5 shrink-0" />{errorMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-5 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Cloud className="h-4 w-4 text-blue-600" />Google Drive</h3>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-500" />Tự động lưu qua Apps Script</span>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-700 space-y-2">
            <p><strong>Thư mục đích:</strong> <span className="font-mono">{DRIVE_FOLDER_ID}</span></p>
            <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline"><ExternalLink className="h-3 w-3" />{DRIVE_FOLDER_URL}</a>
          </div>
          <a href={DRIVE_FOLDER_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"><Folder className="h-4 w-4 text-amber-500" />Mở thư mục Google Drive</a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Database className="h-4 w-4 text-emerald-600" />Sao lưu & Khôi phục</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Tệp sao lưu chứa danh sách giáo viên, tổ chuyên môn, các đợt nộp và thông tin minh chứng. Tệp minh chứng thực tế tiếp tục nằm trên Google Drive.</p>
          <button onClick={handleExport} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Tải tệp sao lưu (.json)
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFileChange} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold"><Upload className="h-4 w-4" />Khôi phục từ tệp sao lưu</button>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-5">
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-600" />Vùng nguy hiểm</h3>
          <p className="text-xs text-gray-500 leading-relaxed">Khôi phục cơ sở dữ liệu về dữ liệu ban đầu được đóng gói cùng dự án. Các tệp Google Drive hiện có sẽ không tự động bị xóa hàng loạt.</p>
          <button onClick={handleReset} disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold"><RefreshCw className="h-4 w-4" />Khôi phục dữ liệu mặc định</button>
        </div>
      </div>
    </div>
  );
}
