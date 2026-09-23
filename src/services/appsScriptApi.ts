declare global {
  interface Window {
    MAI_SON_CONFIG?: {
      API_URL?: string;
      DRIVE_FOLDER_URL?: string;
    };
  }
}

const DEFAULT_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1ZhplPmXeI4ujatTN4S91842kixupZUuu";

export const DRIVE_FOLDER_URL = window.MAI_SON_CONFIG?.DRIVE_FOLDER_URL || DEFAULT_DRIVE_FOLDER_URL;
export const DRIVE_FOLDER_ID = "1ZhplPmXeI4ujatTN4S91842kixupZUuu";

export function getApiUrl(): string {
  return (window.MAI_SON_CONFIG?.API_URL || "").trim();
}

export function isApiConfigured(): boolean {
  const url = getApiUrl();
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/i.test(url);
}

function makeId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Calls the Google Apps Script backend through a hidden HTML form + iframe.
 * This avoids browser CORS/preflight issues and supports the Base64 file payload.
 */
export function apiCall<T = any>(action: string, payload: any = {}, timeoutMs = 90000): Promise<T> {
  return new Promise((resolve, reject) => {
    const apiUrl = getApiUrl();
    if (!isApiConfigured()) {
      reject(new Error("Hệ thống chưa được cấu hình URL Google Apps Script. Vui lòng cập nhật tệp config.js trên GitHub."));
      return;
    }

    const requestId = makeId();
    const frameName = `mai_son_api_${requestId}`;
    const iframe = document.createElement("iframe");
    iframe.name = frameName;
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");

    const form = document.createElement("form");
    form.method = "POST";
    form.action = apiUrl;
    form.target = frameName;
    form.style.display = "none";
    form.acceptCharset = "UTF-8";

    const appendField = (name: string, value: string) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    appendField("requestId", requestId);
    appendField("action", action);
    appendField("adminToken", sessionStorage.getItem("mai_son_admin_token") || "");
    appendField("payload", JSON.stringify(payload ?? {}));

    let timeoutHandle: number | undefined;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (timeoutHandle) window.clearTimeout(timeoutHandle);
      form.remove();
      iframe.remove();
    };

    const onMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || msg.source !== "MAI_SON_APPS_SCRIPT" || msg.requestId !== requestId) return;
      cleanup();
      if (msg.ok) {
        resolve(msg.data as T);
      } else {
        reject(new Error(msg.error || "Google Apps Script trả về lỗi không xác định."));
      }
    };

    window.addEventListener("message", onMessage);
    document.body.appendChild(iframe);
    document.body.appendChild(form);

    timeoutHandle = window.setTimeout(() => {
      cleanup();
      reject(new Error("Máy chủ Google Apps Script phản hồi quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại."));
    }, timeoutMs);

    form.submit();
  });
}

export async function getDatabase<T = any>(): Promise<T> {
  return apiCall<T>("getDb");
}

export function setAdminSessionToken(token: string) {
  if (token) sessionStorage.setItem("mai_son_admin_token", token);
}

export function clearAdminSessionToken() {
  sessionStorage.removeItem("mai_son_admin_token");
}

export function hasAdminSessionToken(): boolean {
  return !!sessionStorage.getItem("mai_son_admin_token");
}
