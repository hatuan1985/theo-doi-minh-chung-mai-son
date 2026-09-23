# Hệ thống Theo dõi Minh chứng - PTDTNT THCS & THPT Mai Sơn

Phiên bản này đã được chuyển sang kiến trúc:

- **GitHub Pages**: chạy giao diện React/Vite.
- **Google Apps Script**: xử lý dữ liệu và xác thực quản trị.
- **Google Drive**: lưu tệp minh chứng trực tiếp vào thư mục nhà trường.

## Cấu hình bắt buộc

Sau khi triển khai Google Apps Script dạng Web app, mở `public/config.js` và thay:

```js
API_URL: "PASTE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

bằng URL Web app kết thúc bằng `/exec`.

## GitHub Pages

Repository đã có workflow `.github/workflows/deploy-pages.yml` để tự động build và triển khai.

Trong GitHub vào **Settings → Pages → Build and deployment → Source → GitHub Actions**.

Mỗi lần push lên nhánh `main`, trang sẽ tự build và xuất bản.

## Lưu ý bảo mật

- Không đưa mã PIN quản trị vào mã nguồn GitHub.
- Mã PIN được lưu trong Script Properties của Google Apps Script bằng hàm `setAdminPin(...)`.
- Số điện thoại giáo viên không được trả về cho người dùng chưa đăng nhập quản trị.
