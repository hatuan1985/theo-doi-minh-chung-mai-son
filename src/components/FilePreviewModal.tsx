import React from "react";
import { X, FileText, FileSpreadsheet, File, ExternalLink } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: string;
  fileId: string;
  fileSize: number;
  fileUrl?: string;
}

export default function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileType,
  fileSize,
  fileUrl
}: FilePreviewModalProps) {
  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 Bytes";
    const units = ["Bytes", "KB", "MB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
  };

  const icon = fileType.includes("word") || /\.docx?$/i.test(fileName)
    ? <FileText className="h-16 w-16 text-blue-500" />
    : fileType.includes("sheet") || fileType.includes("excel") || /\.(xlsx?|csv)$/i.test(fileName)
      ? <FileSpreadsheet className="h-16 w-16 text-emerald-600" />
      : <File className="h-16 w-16 text-gray-400" />;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate" title={fileName}>{fileName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Dung lượng: {formatSize(fileSize)} • {fileType || "Không rõ"}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Mở trên Drive</span>
              </a>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 text-gray-500 rounded-lg" aria-label="Đóng"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100 p-4 min-h-0">
          {fileUrl ? (
            <iframe src={fileUrl} title={fileName} className="w-full h-full border-0 rounded-xl bg-white shadow-sm" allow="autoplay" />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-center mb-4">{icon}</div>
                <h4 className="font-bold text-gray-800 break-all">{fileName}</h4>
                <p className="mt-2 text-sm text-gray-500">Minh chứng cũ chưa có liên kết Google Drive nên không thể xem trực tiếp trên bản GitHub Pages.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
