import React, { useState, useRef } from "react";
import { UserPlus, Trash2, HelpCircle, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, ChevronRight, Hash, Pencil } from "lucide-react";
import { Teacher, Department } from "../types.js";

interface TeacherManagerProps {
  teachers: Teacher[];
  departments: Department[];
  onAddTeacher: (teacher: { name: string; departmentId: string; phone?: string }) => Promise<void>;
  onAddDepartment: (name: string) => Promise<void>;
  onImportTeachers: (csvContent: string) => Promise<{ count: number; errors: string[] }>;
  onDeleteTeacher: (id: string) => Promise<void>;
  onUpdateTeacher: (id: string, teacher: { name: string; departmentId: string; phone?: string }) => Promise<void>;
}

export default function TeacherManager({
  teachers,
  departments,
  onAddTeacher,
  onAddDepartment,
  onImportTeachers,
  onDeleteTeacher,
  onUpdateTeacher
}: TeacherManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);

  // Single teacher form state
  const [teacherName, setTeacherName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");

  // New Department form state
  const [newDeptName, setNewDeptName] = useState("");
  const [showDeptForm, setShowDeptForm] = useState(false);

  // CSV import states
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<{ count: number; errors: string[] } | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Edit teacher form states
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Delete teacher states
  const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!editName || !editDeptId) {
      setErrorMsg("Vui lòng nhập Họ tên giáo viên và chọn Tổ chuyên môn.");
      return;
    }

    setSaving(true);
    try {
      await onUpdateTeacher(editingTeacher.id, {
        name: editName,
        departmentId: editDeptId,
        phone: editPhone
      });
      setEditingTeacher(null);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi cập nhật thông tin giáo viên.");
    } finally {
      setSaving(false);
    }
  };

  // Group teachers by department for beautiful display
  const teachersByDept = departments.map(dept => {
    return {
      deptId: dept.id,
      deptName: dept.name,
      deptTeachers: teachers.filter(t => t.departmentId === dept.id)
    };
  });

  const handleAddTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !selectedDeptId) {
      setErrorMsg("Vui lòng nhập Họ tên giáo viên và chọn Tổ chuyên môn.");
      return;
    }

    setSaving(true);
    try {
      await onAddTeacher({ name: teacherName, departmentId: selectedDeptId, phone: teacherPhone });
      setTeacherName("");
      setTeacherPhone("");
      setErrorMsg("");
      setShowAddForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi thêm giáo viên.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;

    setSaving(true);
    try {
      await onAddDepartment(newDeptName);
      setSelectedDeptId(departments[departments.length - 1]?.id || ""); // pick last
      setNewDeptName("");
      setShowDeptForm(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi thêm tổ chuyên môn.");
    } finally {
      setSaving(false);
    }
  };

  // CSV Parsing and import
  const handleCsvTextImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setErrorMsg("Vui lòng dán dữ liệu danh sách giáo viên.");
      return;
    }

    setSaving(true);
    try {
      const result = await onImportTeachers(csvText);
      setImportResult(result);
      setCsvText("");
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi nhập danh sách giáo viên.");
    } finally {
      setSaving(false);
    }
  };

  // File drop/upload parsing for CSV
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSaving(true);
        try {
          const result = await onImportTeachers(content);
          setImportResult(result);
          setErrorMsg("");
        } catch (err: any) {
          setErrorMsg(err.message || "Lỗi khi xử lý tệp CSV.");
        } finally {
          setSaving(false);
        }
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleDeleteTeacherClick = (t: Teacher) => {
    setDeletingTeacher(t);
  };

  const confirmDeleteTeacher = async () => {
    if (!deletingTeacher) return;
    setSaving(true);
    try {
      await onDeleteTeacher(deletingTeacher.id);
      setDeletingTeacher(null);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi khi xóa giáo viên.");
    } finally {
      setSaving(false);
    }
  };

  const resetImport = () => {
    setImportResult(null);
    setShowImportForm(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="teacher-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý Giáo viên & Tổ Chuyên môn</h2>
          <p className="text-xs text-gray-500 mt-1">
            Biên soạn danh mục nhân sự nội bộ theo từng Tổ chuyên môn, hoặc nhập dữ liệu hàng loạt từ tệp Excel/CSV cực kỳ nhanh chóng.
          </p>
        </div>
        <div className="flex space-x-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => {
              setShowImportForm(true);
              setShowAddForm(false);
              setImportResult(null);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-sm font-semibold transition-all duration-150"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Nhập từ CSV/Excel</span>
          </button>
          <button
            onClick={() => {
              setShowAddForm(true);
              setShowImportForm(false);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/10 transition-all duration-150"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm Giáo viên</span>
          </button>
        </div>
      </div>

      {/* ERROR MESSAGE BAR */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-red-700 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SINGLE TEACHER ADD FORM */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-6 max-w-xl animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-50">Thêm Giáo viên Mới</h3>
          
          <form onSubmit={handleAddTeacherSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700" htmlFor="teacher-name">Họ và tên Giáo viên <span className="text-red-500">*</span></label>
              <input
                id="teacher-name"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700" htmlFor="teacher-dept-select">Chọn Tổ chuyên môn <span className="text-red-500">*</span></label>
                <div className="flex space-x-2">
                  <select
                    id="teacher-dept-select"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    disabled={saving}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
                  >
                    <option value="">-- Chọn tổ chuyên môn --</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {!showDeptForm && (
                    <button
                      type="button"
                      onClick={() => setShowDeptForm(true)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-xs font-bold shrink-0 transition-colors"
                      title="Thêm tổ mới"
                    >
                      + Tổ mới
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700" htmlFor="teacher-phone">Số điện thoại <span className="text-gray-400">(Tùy chọn)</span></label>
                <input
                  id="teacher-phone"
                  type="text"
                  placeholder="Ví dụ: 0912345678"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Inlined Add Department Panel */}
            {showDeptForm && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tạo Tổ chuyên môn mới</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: Tổ Ngoại Ngữ"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeptSubmit}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Tạo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeptForm(false)}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-50 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/10"
              >
                {saving ? "Đang lưu..." : "Xác nhận Thêm"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV BATCH IMPORT FORM */}
      {showImportForm && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-6 max-w-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3 mb-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              <span>Nhập hàng loạt Giáo viên bằng danh sách CSV</span>
            </h3>
            <button onClick={resetImport} className="text-gray-400 hover:text-gray-600 text-xs font-bold">
              Đóng
            </button>
          </div>

          {importResult ? (
            <div className="space-y-4 animate-in scale-in duration-200">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3 text-emerald-900">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold">Nhập danh sách thành công!</h4>
                  <p className="text-sm mt-0.5">Hệ thống đã thêm mới thành công <strong>{importResult.count} giáo viên</strong> vào danh sách của trường.</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <h5 className="text-xs font-bold text-amber-900 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>Lưu ý / Lỗi xử lý ({importResult.errors.length}):</span>
                  </h5>
                  <div className="max-h-[120px] overflow-y-auto divide-y divide-amber-100 text-xs text-amber-800 pr-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="py-1">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetImport}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CSV Template Explainer */}
              <div className="p-4 bg-gray-50 border border-gray-200/60 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
                  <HelpCircle className="h-4 w-4 text-emerald-600" />
                  <span>Hướng dẫn cấu trúc dữ liệu:</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Thầy/Cô có thể dán trực tiếp dòng dữ liệu từ Excel, cách nhau bằng dấu phẩy (<code>,</code>) hoặc dấu chấm phẩy (<code>;</code>) theo cấu trúc dưới đây. Hệ thống sẽ tự kiểm tra và khởi tạo Tổ chuyên môn tương ứng nếu chưa tồn tại.
                </p>
                <div className="p-3 bg-emerald-950 text-emerald-50 rounded-lg font-mono text-[10px] space-y-1 select-all">
                  <div>Họ và Tên, Tổ chuyên môn, Số điện thoại</div>
                  <div>Nguyễn Văn A, Tổ Toán - Tin, 0912345678</div>
                  <div>Trần Thị B, Tổ Ngữ Văn, 0987654321</div>
                  <div>Lò Văn C, Tổ Khoa học Tự nhiên, 0901112222</div>
                </div>
              </div>

              {/* Direct File Selector Trigger */}
              <div className="flex justify-between items-center bg-emerald-50/50 p-3.5 border border-emerald-100 rounded-xl">
                <div>
                  <h5 className="text-xs font-bold text-emerald-900">Tải lên tệp danh sách (.csv)</h5>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5">Hỗ trợ tệp tin CSV lưu chuẩn mã hóa UTF-8 tiếng Việt.</p>
                </div>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => csvFileInputRef.current?.click()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  <Upload className="h-3.5 w-3.5 inline mr-1.5" />
                  Chọn file
                </button>
              </div>

              <div className="text-center font-bold text-xs text-gray-400 my-2">— HOẶC DÁN TRỰC TIẾP —</div>

              <form onSubmit={handleCsvTextImport} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700" htmlFor="csv-data-textarea">Dán văn bản danh sách giáo viên:</label>
                  <textarea
                    id="csv-data-textarea"
                    rows={6}
                    placeholder="Dán các dòng dữ liệu vào đây..."
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={resetImport}
                    className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !csvText.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md"
                  >
                    {saving ? "Đang xử lý..." : "Bắt đầu Nhập dữ liệu"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* CHANNELS / GROUP LISTING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachersByDept.map(group => (
          <div key={group.deptId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[320px]">
            {/* Dept Header */}
            <div className="bg-gray-50 border-b border-gray-100 px-5 py-4 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800 truncate" title={group.deptName}>
                {group.deptName}
              </span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                <Hash className="h-2.5 w-2.5" />
                <span>{group.deptTeachers.length} GV</span>
              </span>
            </div>

            {/* Teachers List scrollable container */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50/60 p-2">
              {group.deptTeachers.length > 0 ? (
                group.deptTeachers.map((t) => (
                  <div key={t.id} className="group px-3 py-2.5 flex justify-between items-center hover:bg-gray-50/50 rounded-xl transition-all duration-150">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-gray-800 truncate">{t.name}</div>
                      {t.phone && (
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{t.phone}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTeacher(t);
                          setEditName(t.name);
                          setEditDeptId(t.departmentId);
                          setEditPhone(t.phone || "");
                        }}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacherClick(t)}
                        className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Xóa giáo viên"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] font-medium text-gray-400 py-12">
                  Tổ chuyên môn này trống.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* EDIT TEACHER MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center space-x-2">
              <Pencil className="h-5 w-5 text-emerald-600" />
              <span>Chỉnh sửa thông tin Giáo viên</span>
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700" htmlFor="edit-teacher-name">
                  Họ và tên Giáo viên <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-teacher-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700" htmlFor="edit-teacher-dept">
                  Tổ chuyên môn <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-teacher-dept"
                  required
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
                >
                  <option value="">-- Chọn tổ chuyên môn --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700" htmlFor="edit-teacher-phone">
                  Số điện thoại <span className="text-gray-400">(Tùy chọn)</span>
                </label>
                <input
                  id="edit-teacher-phone"
                  type="text"
                  placeholder="Ví dụ: 0912345678"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEACHER CONFIRMATION MODAL */}
      {deletingTeacher && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-red-100 shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-gray-900 mb-2 pb-2 border-b border-gray-100 flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Xác nhận xóa Giáo viên</span>
            </h3>

            <div className="py-2 text-sm text-gray-600 space-y-3">
              <p>
                Thầy/Cô có chắc chắn muốn xóa giáo viên <strong className="text-gray-900 font-bold">"{deletingTeacher.name}"</strong> khỏi danh sách?
              </p>
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 font-medium flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Hành động này cũng sẽ xóa vĩnh viễn toàn bộ các minh chứng đã nộp trước đó của giáo viên này và không thể hoàn tác.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
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
                {saving ? "Đang xóa..." : "Đồng ý xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
