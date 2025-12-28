# 第三方登入憑證 (Client ID) 完整申請指南

本指南將引導您獲取 Google、Facebook 與 WalletConnect 的必要金鑰。申請完成後，請將 ID 填入 `frontend/.env` 檔案中。

---

## 1. Google OAuth 憑證 (最重要)

Google 需要針對 iOS、Android 和 Web 分別建立三個憑證。

### 第一步：建立專案
1.前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 左上角選擇「建立專案」，命名為 **"FoodPlatform"**。

### 第二步：設定 OAuth 同意畫面 (Consent Screen)
1. 左側選單進入 **「API 和服務」 > 「OAuth 同意畫面」**。
2. **User Type** 選擇 **「外部 (External)」**，點擊建立。
3. **應用程式名稱**：填寫 "FoodRescue"。
4. **使用者支援電子郵件**：選您的 Gmail。
5. 最下方的「開發人員聯絡資訊」也填您的 Gmail。
6. 點擊「儲存並繼續」，後續步驟直接預設帶過即可，最後按「返回資訊主頁」。

### 第三步：建立憑證 (Credentials)
進入 **「API 和服務」 > 「憑證」**，點擊上方 **「+ 建立憑證」 > 「OAuth 用戶端 ID」**。

#### A. 申請 iOS 憑證 (您截圖卡住的地方)
*   **應用程式類型**：選擇 **iOS**。
*   **名稱**：`iOS Client`。
*   **繫結編號 (Bundle ID)**：
    *   **開發測試用 (Expo Go)**：請填寫 `host.exp.exponent`
    *   *(註：這允許 Google 授權給 Expo Go App 使用)*
*   點擊「建立」。
*   👉 **複製「用戶端 ID (Client ID)」**，填入 `.env` 的 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`。

#### B. 申請 Android 憑證
*   再次點擊 **「+ 建立憑證」 > 「OAuth 用戶端 ID」**。
*   **應用程式類型**：選擇 **Android**。
*   **名稱**：`Android Client`。
*   **套件名稱 (Package Name)**：
    *   **開發測試用**：請填寫 `host.exp.exponent`
*   **SHA-1 憑證指紋**：
    *   若只是模擬器測試，此步通常可先略過，但若必須填寫，可隨意填寫開發機器的指紋。最簡單的方式是先用語 Web Client ID 測試。
*   點擊「建立」。
*   👉 **複製「用戶端 ID」**，填入 `.env` 的 `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`。

#### C. 申請 Web 憑證 (通用備援)
*   再次點擊 **「+ 建立憑證」 > 「OAuth 用戶端 ID」**。
*   **應用程式類型**：選擇 **Web 應用程式**。
*   **名稱**：`Web Client`。
*   **已授權的 JavaScript 來源**：填寫 `https://auth.expo.io` (Expo 代理驗證用)。
*   **已授權的重新導向 URI**：填寫 `https://auth.expo.io/@你的Expo帳號/frontend` (若不知道，可先留空)。
*   點擊「建立」。
*   👉 **複製「用戶端 ID」**，填入 `.env` 的 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`。

---

## 2. Facebook 登入設定

1. 前往 [Meta Developers](https://developers.facebook.com/apps/)。
2. 點擊 **"Create App"**。
3. 選擇 **"Authenticate and request data from users with Facebook Login"** (或 Consumer)。
4. 填寫 App Name (FoodRescue)，建立應用程式。
5. 在 Dashboard 左側，點擊 **"Use Case" > "Customize"** (或在產品頁新增 Facebook Login)。
6. 在 **Settings > Basic** 頁面：
    *   👉 **複製「App ID」**，填入 `.env` 的 `EXPO_PUBLIC_FACEBOOK_APP_ID`。

---

## 3. WalletConnect (加密錢包)

1. 前往 [WalletConnect Cloud](https://cloud.walletconnect.com/) 註冊/登入。
2. 點擊 **"New Project"**。
3. 輸入名稱 "FoodPlatform"，類型選 "App"。
4. 建立後，您會看到 **"Project ID"**。
5. 👉 **複製「Project ID」**，填入 `.env` 的 `EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID`。

---

## 4. 完成後的操作

當您填寫完 `frontend/.env` 檔案後，**請務必重啟專案**：

```bash
npx expo start --clear
```

這樣 APP 就能讀取到正確的 ID，並啟用真實登入功能了！
