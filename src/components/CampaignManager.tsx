import React, { useState } from "react";
import { FolderPlus, Pencil, Trash2, Calendar, AlertTriangle, Eye, ToggleLeft, ToggleRight, X } from "lucide-react";
import { Campaign } from "../types.js";

interface CampaignManagerProps {
  campaigns: Campaign[];
  onAddCampaign: (campaign: { title: string; description: string; deadline: string }) => Promise<void>;
  onUpdateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  onDeleteCampaign: (id: string) => Promise<void>;
}

export default function CampaignManager({
  campaigns,
  onAddCampaign,
  onUpdateCampaign,
  onDeleteCampaign
}: CampaignManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCampId, setEditingCampId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setErrorMsg("");
    setEditingCampId(null);
    setShowAddForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline) {
      setErrorMsg("Vui lòng điền đủ Tiêu đề và Hạn chót nộp bài.");
      return;
    }

    setSaving(true);
    try {
      await onAddCampaign({ title, description, deadline });
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể tạo đợt nộp.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (camp: Campaign) => {
    setEditingCampId(camp.id);
    setTitle(camp.title);
    setDescription(camp.description);
    setDeadline(camp.deadline.split("T")[0]); // Keep only date portion
    setShowAddForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampId) return;

    if (!title || !deadline) {
      setErrorMsg("Vui lòng điền đủ Tiêu đề và Hạn chót.");
      return;
    }

    setSaving(true);
    try {
      await onUpdateCampaign(editingCampId, { title, description, deadline });
      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể cập nhật.");
    } finally {
      setSaving(false);
    }
  };

  const toggleCampaignStatus = async (camp: Campaign) => {
    const newStatus = camp.status === "active" ? "closed" : "active";
    try {
      await onUpdateCampaign(camp.id, { status: newStatus });
    } catch (err: any) {
      alert(`Lỗi khi chuyển trạng thái: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`⚠️ CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nXóa đợt nộp chuyên môn "${name}" sẽ xóa VĨNH VIỄN toàn bộ minh chứng tệp tin mà các giáo viên đã tải lên cho đợt này.\n\nThầy/Cô có thực sự muốn xóa?`)) {
      try {
        await onDeleteCampaign(id);
      } catch (err: any) {
        alert(`Không thể xóa đợt nộp: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="campaign-manager">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý Đợt Khảo sát / Bồi dưỡng</h2>
          <p className="text-xs text-gray-500 mt-1">
            Tạo lập mới, biên tập thông tin chuyên đề bồi dưỡng thường xuyên, khóa tập huấn hoặc khóa khảo sát CNTT định kỳ.
          </p>
        </div>
        {!showAddForm && !editingCampId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all duration-150 hover:-translate-y-0.5"
            id="btn-create-campaign"
          >
            <FolderPlus className="h-4 w-4" />
            <span>Thêm đợt nộp mới</span>
          </button>
        )}
      </div>

      {/* Create / Edit Form Card */}
      {(showAddForm || editingCampId) && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-6 max-w-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <h3 className="text-base font-bold text-gray-900">
              {editingCampId ? "Chỉnh sửa Đợt Khảo sát/Bồi dưỡng" : "Tạo Đợt Khảo sát/Bồi dưỡng mới"}
            </h3>
            <button
              onClick={resetForm}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={editingCampId ? handleUpdate : handleCreate} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-700 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700" htmlFor="camp-title">Tiêu đề đợt nộp <span className="text-red-500">*</span></label>
              <input
                id="camp-title"
                type="text"
                placeholder="Ví dụ: Bồi dưỡng thường xuyên học kỳ II (2025-2026)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700" htmlFor="camp-desc">Mô tả mục đích nộp bài</label>
              <textarea
                id="camp-desc"
                rows={3}
                placeholder="Mô tả cụ thể danh mục các tệp cần nộp, chứng chỉ bồi dưỡng của các mô-đun để giáo viên đối chiếu..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700" htmlFor="camp-deadline">Hạn chót thu bài <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  id="camp-deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/10 transition-all"
              >
                {saving ? "Đang lưu..." : editingCampId ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns list Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Đợt nộp & Mô tả</th>
                <th className="px-6 py-4">Thời gian tạo</th>
                <th className="px-6 py-4">Hạn nộp</th>
                <th className="px-6 py-4 text-center">Nhận bài</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
              {campaigns.length > 0 ? (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 max-w-sm">
                      <div className="font-bold text-gray-900 line-clamp-1">{camp.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {camp.description || "Không có mô tả chi tiết."}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {new Date(camp.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-950">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span>{new Date(camp.deadline).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleCampaignStatus(camp)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                          camp.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100"
                            : "bg-red-50 text-red-800 border border-red-100 hover:bg-red-100"
                        }`}
                        title={camp.status === "active" ? "Nhấp để Khóa lại" : "Nhấp để Mở lại"}
                      >
                        {camp.status === "active" ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-emerald-600" />
                            <span>Đang Mở</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-red-500" />
                            <span>Đã Khóa</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => startEdit(camp)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 rounded-lg transition-colors"
                          title="Chỉnh sửa đợt"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(camp.id, camp.title)}
                          className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                          title="Xóa vĩnh viễn đợt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-xs font-semibold text-gray-400">
                    Chưa có đợt khảo sát hay bồi dưỡng nào được khởi tạo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
