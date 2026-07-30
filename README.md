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

### Cloudflare Pages（自動デプロイ）

このリポジトリでは次の **どちらか（または両方）** でデプロイできます。

#### A. Cloudflare ダッシュボードの Git 連携（推奨・既存）

Workers & Pages でリポジトリを接続済みなら、push のたびに `pages build and deployment` が走ります。追加の GitHub Secret は不要です。

#### B. GitHub Actions + Wrangler

[`.github/workflows/deploy-cloudflare-pages.yml`](.github/workflows/deploy-cloudflare-pages.yml) がビルドし、Secrets があるときだけ `wrangler pages deploy` します。  
**Secrets 未設定の場合はビルドのみ成功し、デプロイはスキップ**します（赤い失敗にはなりません）。

##### 1. API トークンを作成

1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. テンプレート **Edit Cloudflare Workers** を使うか、次の権限を付与:
   - Account → Cloudflare Pages → Edit
   - Account → Account Settings → Read
3. Account リソースで対象アカウントを選択

##### 2. GitHub Secrets を設定

リポジトリ → **Settings** → **Secrets and variables** → **Actions**:

| Secret | 内容 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | 上記 API トークン（**必須・Bの場合**） |
| `CLOUDFLARE_ACCOUNT_ID` | ダッシュボードの Account ID（**必須・Bの場合**） |
| `VITE_FIREBASE_*` | （任意）Firebase Web 設定 |

##### 3. Pages プロジェクト名

Wrangler 側のプロジェクト名は `azure-fantasia` です。

```bash
npm run build
npx wrangler pages deploy dist --project-name=azure-fantasia
```

## スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | ローカル開発 |
| `npm run build` | 本番ビルド |
| `npm run pages:deploy` | Cloudflare Pages へデプロイ |

## ライセンス / 免責

本作はファン制作のオリジナル作品です。グランブルーファンタジーおよび関連商標の公式タイトルではありません。
