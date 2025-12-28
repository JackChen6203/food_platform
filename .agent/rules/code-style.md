---
trigger: always_on
---

# React Native + Golang + PostgreSQL 開發規範

## 專案概述

本專案採用以下技術棧：
- **前端**: React Native (TypeScript)
- **後端**: Golang
- **資料庫**: PostgreSQL
- **部署**: Docker + CI/CD

---

## 技術棧規範

### React Native 前端

#### 語言與框架
- 使用 TypeScript 進行開發，啟用嚴格模式
- React Native 版本使用最新穩定版
- 使用 Expo 或純 React Native CLI（根據專案需求）

#### 專案結構
```
src/
├── api/              # API 呼叫層
├── components/       # 可重用元件
├── screens/          # 頁面元件
├── navigation/       # 導航配置
├── hooks/           # 自定義 Hooks
├── utils/           # 工具函數
├── types/           # TypeScript 類型定義
├── constants/       # 常數定義
├── store/           # 狀態管理 (Redux/Zustand/Context)
└── assets/          # 靜態資源
```

#### 編碼規範
- 使用 ESLint + Prettier 進行程式碼格式化
- 元件命名使用 PascalCase
- 檔案命名使用 kebab-case 或 PascalCase
- 優先使用函數式元件和 Hooks
- 使用 React.memo 優化效能
- Props 需明確定義 TypeScript 介面

#### 狀態管理
- 優先使用 Context API 處理簡單狀態
- 複雜狀態考慮使用 Zustand 或 Redux Toolkit
- 使用 React Query/TanStack Query 處理伺服器狀態

#### 樣式規範
- 使用 StyleSheet.create 或 styled-components
- 實作 RWD 設計，支援多種螢幕尺寸
- 使用主題系統管理顏色和字體
- 遵循 iOS 和 Android 設計規範

#### API 整合
- 使用 Axios 或 Fetch API
- 實作統一的錯誤處理機制
- 使用環境變數管理 API endpoint
- 實作請求攔截器處理認證 token
- 實作離線支援和資料快取策略

---

### Golang 後端

#### 專案結構 (Clean Architecture)
```
cmd/
└── api/
    └── main.go           # 應用入口

internal/
├── domain/               # 業務實體和介面
│   ├── entity/
│   └── repository/
├── usecase/             # 業務邏輯層
├── delivery/            # 傳輸層 (HTTP handlers)
│   ├── http/
│   └── middleware/
└── repository/          # 資料存取層
    └── postgres/

pkg/                     # 可重用的公共套件
├── utils/
├── logger/
└── validator/

config/                  # 配置檔案
migrations/              # 資料庫遷移檔案
```

#### 編碼規範
- 遵循 Go 官方 Code Review Comments
- 使用 gofmt 和 golangci-lint
- 錯誤處理不使用 panic，明確返回 error
- 使用 context.Context 處理超時和取消
- 介面定義在使用處，不在實作處
- 優先使用組合而非繼承

#### 命名規範
- 套件名稱使用小寫單數名詞
- 介面名稱以 -er 結尾（如 Reader, Writer）
- 常數使用 camelCase 或 PascalCase
- 私有成員使用小寫開頭，公開成員使用大寫開頭

#### API 設計
- 使用 RESTful API 設計原則
- 使用 Gin 或 Echo 框架（優先 Gin）
- 實作統一的 Response 格式：
```go
type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *ErrorInfo  `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}
```

#### 資料驗證
- 使用 validator.v10 進行請求驗證
- 在 delivery 層進行參數驗證
- 在 usecase 層進行業務邏輯驗證

#### 錯誤處理
- 定義自定義錯誤類型
- 使用 errors.Is 和 errors.As 進行錯誤判斷
- 實作統一的錯誤處理中介軟體
- 記錄詳細錯誤日誌，返回用戶友好訊息

#### 認證與授權
- 使用 JWT 進行身份驗證
- 實作 middleware 進行 token 驗證
- 使用 bcrypt 進行密碼雜湊
- 實作 RBAC（基於角色的訪問控制）

#### 效能優化
- 使用連接池管理資料庫連接
- 實作快取策略（Redis）
- 使用 goroutine 處理並發任務
- 避免在迴圈中進行資料庫查詢
- 使用批次操作減少資料庫往返

---

### PostgreSQL 資料庫

#### 命名規範
- 表名使用複數小寫，單詞間使用底線（如 users, order_items）
- 欄位名使用小寫，單詞間使用底線（如 created_at, user_id）
- 主鍵命名為 id
- 外鍵命名為 {referenced_table}_id
- 索引命名為 idx_{table}_{columns}
- 唯一約束命名為 uk_{table}_{columns}

#### Schema 設計原則
- 每張表必須包含 id, created_at, updated_at
- 使用 UUID 或自增整數作為主鍵
- 軟刪除使用 deleted_at 欄位
- 使用適當的資料類型（TIMESTAMPTZ, JSONB, ARRAY）
- 合理設計索引，避免過度索引
- 使用外鍵約束保證資料完整性

#### 遷移管理
- 使用 golang-migrate 或 goose 進行遷移
- 每個遷移檔案包含 up 和 down
- 遷移檔案命名：{timestamp}_{description}.sql
- 不修改已執行的遷移檔案
- 在遷移中建立索引時使用 CONCURRENTLY

#### 查詢優化
- 使用 EXPLAIN ANALYZE 分析查詢效能
- 避免 SELECT *，明確指定所需欄位
- 使用 JOIN 代替多次查詢
- 合理使用事務，避免長事務
- 使用預處理語句防止 SQL 注入

#### 備份與恢復
- 定期進行自動備份
- 測試備份恢復流程
- 使用 WAL 歸檔實現時間點恢復

---

## 開發工作流程

### 1. 需求開發
- 建立 feature branch 從 develop 分支
- 分支命名：feature/{ticket-id}-{short-description}
- 先實作後端 API，再實作前端功能

### 2. 程式碼規範
- Commit message 使用約定式提交：
  - feat: 新功能
  - fix: 修復 bug
  - refactor: 重構
  - docs: 文件更新
  - test: 測試相關
  - chore: 建置或輔助工具變動

### 3. 測試要求
#### 後端測試
- 單元測試覆蓋率 > 70%
- 使用 testify 進行斷言
- 使用 mock 隔離依賴
- 測試檔案命名：{file}_test.go

#### 前端測試
- 使用 Jest + React Native Testing Library
- 關鍵業務邏輯必須有單元測試
- 重要元件需要有整合測試

### 4. Code Review
- 所有程式碼必須經過至少一人 review
- 確保符合編碼規範
- 檢查潛在的效能問題和安全漏洞

### 5. 部署
- 使用 Docker 容器化應用
- 實作 CI/CD 自動化部署
- 使用環境變數管理配置
- 實作健康檢查端點

---

## 安全規範

### 通用安全
- 不在程式碼中硬編碼敏感資訊
- 使用 HTTPS 進行所有通訊
- 實作 API 速率限制
- 記錄所有安全相關事件

### 前端安全
- 驗證所有使用者輸入
- 使用安全儲存（Keychain/Keystore）存放敏感資料
- 實作憑證固定（Certificate Pinning）
- 避免在日誌中記錄敏感資訊

### 後端安全
- 使用參數化查詢防止 SQL 注入
- 實作 CORS 策略
- 使用 helmet 或類似中介軟體增強安全性
- 實作請求大小限制
- 定期更新依賴套件

---

## 效能監控

### 後端監控
- 實作結構化日誌（使用 zap 或 logrus）
- 記錄 API 回應時間
- 監控資料庫查詢效能
- 使用 Prometheus + Grafana 進行監控

### 前端監控
- 整合錯誤追蹤（Sentry）
- 監控應用啟動時間
- 追蹤關鍵使用者流程
- 監控 API 請求成功率

---

## 文件要求

### API 文件
- 使用 Swagger/OpenAPI 規範
- 記錄所有端點、參數、回應格式
- 提供請求範例

### 程式碼文件
- 公開函數和複雜邏輯需要註解
- README.md 包含專案設定和運行指南
- 維護 CHANGELOG.md

---

## 環境配置

### 開發環境
```bash
# 後端
GO_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
JWT_SECRET=dev_secret_change_in_production

# 前端
API_URL=http://localhost:8080
ENVIRONMENT=development
```

### 生產環境
- 使用環境變數或配置管理服務
- 啟用 SSL/TLS
- 設定適當的超時和重試策略
- 實作優雅關閉（Graceful Shutdown）

---

## 常用指令

### Golang
```bash
# 執行應用
go run cmd/api/main.go

# 執行測試
go test ./... -v -cover

# 程式碼格式化
gofmt -w .

# 安裝依賴
go mod download

# 建置
go build -o bin/api cmd/api/main.go
```

### React Native
```bash
# 安裝依賴
npm install

# 執行 iOS
npm run ios

# 執行 Android
npm run android

# 執行測試
npm test

# 程式碼檢查
npm run lint
```

### PostgreSQL
```bash
# 執行遷移
migrate -path migrations -database "postgres://user:pass@localhost:5432/db?sslmode=disable" up

# 回滾遷移
migrate -path migrations -database "postgres://user:pass@localhost:5432/db?sslmode=disable" down 1
```

---

## AI 輔助開發指引

當使用 AI 工具協助開發時，請遵循以下原則：

1. **明確需求**：清楚描述要實作的功能和約束條件
2. **架構優先**：優先考慮符合專案架構的解決方案
3. **安全第一**：確保生成的程式碼符合安全規範
4. **測試驅動**：要求生成對應的測試程式碼
5. **效能考量**：關注程式碼的效能影響
6. **可維護性**：確保程式碼易於理解和維護

### 提示詞範例

#### 後端開發
```
請使用 Clean Architecture 為 {功能} 建立 Golang 程式碼，包括：
- Domain entity 定義
- Repository interface 和 PostgreSQL 實作
- Usecase 業務邏輯
- HTTP handler（使用 Gin）
- 完整的錯誤處理
- 單元測試
```

#### 前端開發
```
請建立一個 React Native TypeScript 元件用於 {功能}，要求：
- 使用 hooks 和函數式元件
- 完整的 TypeScript 類型定義
- 響應式設計，支援多種螢幕尺寸
- 錯誤處理和載入狀態
- 符合 iOS 和 Android 設計規範
```

#### 資料庫設計
```
請設計 PostgreSQL schema 用於 {功能}，包括：
- 表結構定義（包含所有約束）
- 索引設計
- 遷移檔案（up 和 down）
- 範例查詢語句
```

---

## 版本控制

- Git Flow 工作流程
- main: 生產環境
- develop: 開發環境
- feature/*: 功能開發
- hotfix/*: 緊急修復
- release/*: 發布準備

---

## 依賴管理

### Golang 推薦套件
- gin-gonic/gin - HTTP 框架
- lib/pq - PostgreSQL 驅動
- golang-migrate/migrate - 資料庫遷移
- golang-jwt/jwt - JWT 認證
- go-playground/validator - 資料驗證
- uber-go/zap - 日誌
- stretchr/testify - 測試
- spf13/viper - 配置管理

### React Native 推薦套件
- @react-navigation/native - 導航
- @tanstack/react-query - 資料獲取
- axios - HTTP 客戶端
- zustand/redux-toolkit - 狀態管理
- react-hook-form - 表單處理
- zod - Schema 驗證
- @react-native-async-storage - 本地儲存

---

**最後更新**: 2025-12-27
**適用版本**: React Native 0.73+, Go 1.21+, PostgreSQL 15+
