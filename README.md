# 蒼穹ファンタジア (Azure Fantasia)

グランブルーファンタジーにインスパイアされた、ブラウザ向けターン制RPGです。

- **ホスティング**: Cloudflare Pages
- **アカウント / セーブデータ**: Firebase Authentication + Cloud Firestore
- **Firebase 未設定時**: ゲストプレイ + `localStorage` でデモ可能

## 主な機能

- メール / パスワード認証（Firebase）とゲストプレイ
- パーティ編成（最大4人）
- 属性相性付きターン制バトル（攻撃 / アビリティ / 奥義）
- クエスト進行と報酬（ルピー・結晶・EXP）
- ガチャ召喚（N〜SSR）

## セットアップ

```bash
npm install
cp .env.example .env
npm run dev
```

### Firebase（本番同期）

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で **Email/Password** と **Anonymous** を有効化
3. Firestore データベースを作成
4. Web アプリを追加し、`.env` に設定を記入:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. セキュリティルールをデプロイ:

```bash
npx -y firebase-tools@latest login
npx -y firebase-tools@latest use <YOUR_PROJECT_ID>
npx -y firebase-tools@latest deploy --only firestore:rules
```

### Cloudflare Workers（自動デプロイ）

公開 URL: **https://gbf.elion-dev08.workers.dev/**

`master` / `main` への push で [`.github/workflows/deploy-cloudflare-pages.yml`](.github/workflows/deploy-cloudflare-pages.yml) がビルドし、Worker 名 `gbf` へ `wrangler deploy` します。

#### GitHub Secrets

| Secret | 内容 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | [API Token](https://dash.cloudflare.com/profile/api-tokens)（Edit Cloudflare Workers） |
| `CLOUDFLARE_ACCOUNT_ID` | ダッシュボードの Account ID |
| `VITE_FIREBASE_*` | （任意）Firebase Web 設定 |

Secrets 未設定の場合はビルドのみ成功し、デプロイはスキップされます。

#### 手動デプロイ

```bash
npm run deploy
```

## スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | ローカル開発 |
| `npm run build` | 本番ビルド |
| `npm run deploy` | ビルドして Cloudflare Worker `gbf` へデプロイ |

## ライセンス / 免責

本作はファン制作のオリジナル作品です。グランブルーファンタジーおよび関連商標の公式タイトルではありません。
