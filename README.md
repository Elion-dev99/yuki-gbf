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

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name=azure-fantasia
```

または Git 連携:

| 項目 | 値 |
|------|-----|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Pages の Environment Variables に `VITE_FIREBASE_*` を設定してください。

## スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | ローカル開発 |
| `npm run build` | 本番ビルド |
| `npm run pages:deploy` | Cloudflare Pages へデプロイ |

## ライセンス / 免責

本作はファン制作のオリジナル作品です。グランブルーファンタジーおよび関連商標の公式タイトルではありません。
