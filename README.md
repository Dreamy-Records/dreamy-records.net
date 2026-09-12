# Dreamy Records Website

Dreamy Records公式サイト（`https://dreamy-records.net`）のAstroプロジェクトです。

サイトは静的HTMLとしてビルドされます。ニュースはMarkdown、メンバーはTypeScriptのデータ、その他のページはAstroファイルを編集して更新します。

## 使用技術

- Astro 5
- TypeScript
- GSAP（ページ・メニュー・スライドショーなどのアニメーション）
- Font Awesome（SNS・UIアイコン）
- Astro Content Collections（ニュース記事）
- `@astrojs/rss`（RSS生成）
- Prettier（コード整形）

## セットアップ

Node.jsのLTS版を推奨します。

```bash
npm install
```

## 開発・確認・ビルド

### 開発サーバー

```bash
npm run dev
```

通常は次のURLで確認できます。

```text
http://localhost:4321/
```

### 本番ビルド

```bash
npm run build
```

ビルド結果は`dist/`に生成されます。

### ビルド結果の確認

```bash
npm run preview
```

`dist/index.html`をダブルクリックして`file://`で直接開くと、`/assets/`から始まるCSS・JavaScript・画像を読み込めないため、デザインが崩れます。必ず`npm run preview`などのWebサーバー経由で確認してください。

### コード整形

```bash
npm run format
```

整形されているかだけ確認する場合：

```bash
npm run format:check
```

## 自動デプロイ

`.github/workflows/deploy.yml`が`staging`および`main`へのpushを監視します。

GitHub ActionsではNode.js 24 LTSを使用します。現在のAstro 5とlockfileが要求するNode.js条件を満たし、2026年時点で保守中のLTS系統です。

| ブランチ  | `DEPLOY_ENV` | `site` URL                        | デプロイ先                  |
| --------- | ------------ | --------------------------------- | --------------------------- |
| `staging` | `staging`    | `https://test.dreamy-records.net` | Cloudflare Pages            |
| `main`    | `production` | `https://dreamy-records.net`      | 本番サーバー（SSH + rsync） |

両環境とも`base: '/'`、`output: 'static'`で、ビルド出力は`dist/`です。`DEPLOY_ENV`未指定時はproductionの`site` URLを使用するため、従来どおり`npm run dev`でローカル開発できます。

### staging：Cloudflare Pages

`staging`へのpush時に次を実行します。

```text
npm ci
DEPLOY_ENV=staging npm run build
Wranglerでdist/をCloudflare PagesへDirect Upload
```

GitHubリポジトリに次を登録してください。

Repository secrets：

- `CLOUDFLARE_API_TOKEN`：Cloudflare PagesへデプロイできるAPI Token
- `CLOUDFLARE_ACCOUNT_ID`：CloudflareアカウントID

Repository variables：

- `CLOUDFLARE_PAGES_PROJECT`：作成したPagesプロジェクト名

Cloudflare API Tokenには対象アカウントの`Cloudflare Pages: Edit`を含む、必要最小限の権限を付与してください。

Cloudflare側では以下を設定します。

1. Direct Upload方式のPagesプロジェクトを作成する
2. プロジェクトのproduction branchを`staging`にする
3. Custom domainsで`test.dreamy-records.net`を追加する
4. `test`のDNSレコードがCloudflare Pagesへ向くことを確認する
5. CloudflareのGit連携は設定しない、または無効化し、GitHub Actionsとの二重デプロイを避ける

### production：SSH + rsync

`main`へのpush時に次を実行します。

```text
npm ci
DEPLOY_ENV=production npm run build
SSHホスト鍵を検証
rsyncでdist/の中身を本番公開ディレクトリへ追加・更新
```

GitHub Repository secrets：

- `SSH_HOST`：本番サーバーのホスト名
- `SSH_USER`：デプロイ専用SSHユーザー
- `SSH_PORT`：SSHポート番号
- `SSH_PRIVATE_KEY`：GitHub Actions専用秘密鍵
- `SSH_KNOWN_HOSTS`：検証済みの本番サーバーホスト鍵
- `PRODUCTION_PATH`：本番サイトの実際の公開ディレクトリ（絶対パス）

`PRODUCTION_PATH`は契約サーバーの管理画面またはサーバー上で確認した、`dreamy-records.net`のドキュメントルートを設定してください。サーバー固有の値なので、このリポジトリでは推測・固定していません。安全のためWorkflowは相対パスと`/`を拒否します。

実行される同期コマンドは次の構成です。

```bash
rsync -avz \
  -e "ssh -i $DEPLOY_KEY_PATH -p $SSH_PORT -o IdentitiesOnly=yes -o UserKnownHostsFile=$KNOWN_HOSTS_PATH -o StrictHostKeyChecking=yes" \
  dist/ \
  "$SSH_USER@$SSH_HOST:$PRODUCTION_PATH/"
```

`dist/`の末尾に`/`があるため、`dist`ディレクトリそのものではなく中身を同期します。`--delete`は使用していません。したがって、`dist/`に存在しない本番サーバー上の`sp/`、`sp/vote/`などは削除されません。同名ファイルは新しいビルド結果で更新されます。

### デプロイ専用SSH鍵

普段使っている個人鍵とは別に、GitHub Actions専用鍵を作成してください。秘密鍵を`SSH_PRIVATE_KEY`へ登録し、公開鍵を本番サーバー上のデプロイユーザーの`~/.ssh/authorized_keys`へ追加します。デプロイユーザーには本番公開ディレクトリへ必要な範囲だけ書き込み権限を付与してください。

`SSH_KNOWN_HOSTS`には、信頼できる経路で確認した本番サーバーのホスト鍵を登録してください。たとえば管理者がサーバー上で確認した公開鍵フィンガープリントと照合したうえで、次の出力をSecretへ保存します。

```bash
ssh-keyscan -p SSH_PORT SSH_HOST
```

`ssh-keyscan`の出力を未検証のまま信用しないでください。Workflowは`StrictHostKeyChecking=yes`を使用し、ホスト鍵検証を無効化しません。

### ブランチ運用

通常の変更は`staging`で作業し、テスト環境で確認後に`main`へマージします。

```bash
git switch staging
git pull origin staging
# 編集・確認
git add .
git commit -m "変更内容"
git push origin staging
```

テスト完了後：

```bash
git switch main
git pull origin main
git merge staging
git push origin main
git switch staging
```

GitHub Environmentのproductionにrequired reviewersを設定すると、本番デプロイ前に承認を必須化できます。その場合はWorkflowのproduction jobにも`environment: production`を追加してください。

## 主なディレクトリ

```text
public/
  assets/                 画像などの公開ファイル
  assets/news/            ニュース記事の画像
  assets/members/         メンバー画像
  _redirects              対応ホスティング向け301リダイレクト
scripts/
  migrate-wordpress.mjs   WordPress記事移行スクリプト
src/
  content/news/           Markdownニュース記事
  data/members.ts         メンバーデータ
  data/legacyRedirects.ts 旧URLと新URLの対応一覧
  layouts/SiteLayout.astro 共通ヘッダー・メニュー・OGP・アニメーション
  pages/                  各ページ
  styles/global.css       サイト全体のスタイル
dist/                     ビルド出力（直接編集しない）
```

`dist/`は`npm run build`のたびに再生成されます。修正は必ず`src/`または`public/`で行ってください。

## ページ一覧と編集場所

| URL                | 編集ファイル                     | 内容                                       |
| ------------------ | -------------------------------- | ------------------------------------------ |
| `/`                | `src/pages/index.astro`          | トップページ・スライドショー・OUT NOW・SNS |
| `/about/`          | `src/pages/about.astro`          | サークル紹介                               |
| `/news/`           | `src/pages/news.astro`           | ニュース一覧                               |
| `/news/{slug}/`    | `src/pages/news/[...slug].astro` | ニュース記事共通レイアウト                 |
| `/members/`        | `src/pages/members.astro`        | メンバー一覧                               |
| `/members/{slug}/` | `src/pages/members/[slug].astro` | メンバー詳細共通レイアウト                 |
| `/discography/`    | `src/pages/discography.astro`    | ディスコグラフィー                         |
| `/events/`         | `src/pages/events.astro`         | イベント一覧                               |
| `/shop/`           | `src/pages/shop.astro`           | 取扱ショップ                               |
| `/contact/`        | `src/pages/contact.astro`        | 連絡先                                     |
| `/rss.xml`         | `src/pages/rss.xml.js`           | 自動生成RSS                                |
| `/404.html`        | `src/pages/404.astro`            | 404エラーページ                            |
| `/500.html`        | `src/pages/500.astro`            | 500エラーページ                            |

## ニュース記事

### 記事の追加

`src/content/news/`にMarkdownファイルを追加します。ファイル名が記事URLのslugになります。

例：

```text
src/content/news/new-release.md
```

生成URL：

```text
https://dreamy-records.net/news/new-release/
```

### Markdownテンプレート

```markdown
---
title: '新作のお知らせ'
date: 2026-08-22
category: 'RELEASE'
description: '新作についてのお知らせです。'
image: '/assets/news/new-release-ogp.jpg'
showImage: false
---

ここから記事本文です。

## 見出し

本文をMarkdownで記述できます。
```

### frontmatter仕様

| 項目          | 必須 | 型     | 説明                                                                      |
| ------------- | ---- | ------ | ------------------------------------------------------------------------- |
| `title`       | 必須 | 文字列 | 記事タイトル、ページタイトル、OGPタイトル、RSSタイトル                    |
| `date`        | 必須 | 日付   | `YYYY-MM-DD`形式。ニュース一覧・RSSの並び順に使用                         |
| `category`    | 必須 | 文字列 | `NEWS`、`RELEASE`、`EVENT`など                                            |
| `description` | 必須 | 文字列 | OGP、meta description、RSS概要に使用。記事画面には表示しない              |
| `image`       | 任意 | 文字列 | ニュース一覧用画像ではなく、記事のOGP画像および任意の本文上部アイキャッチ |
| `showImage`   | 任意 | 真偽値 | `image`を記事本文上部に表示するか。初期値は`false`                        |

スキーマは`src/content.config.ts`で定義しています。

### アイキャッチの表示・非表示

現在の標準設定では、記事本文上部のアイキャッチは非表示です。

記事内に表示する場合：

```yaml
image: '/assets/news/example.jpg'
showImage: true
```

記事内に表示しない場合：

```yaml
image: '/assets/news/example.jpg'
showImage: false
```

`showImage`を省略した場合も`false`です。

`showImage`は記事画面内の表示だけを制御します。`image`が設定されていれば、`showImage: false`でもOGP画像として使用されます。

### OGP画像

OGP画像の優先順位：

1. 記事の`image`
2. 共通OGP画像`/assets/news/19-Dreamy-Records-header-1.png`

そのため、`image`がない記事でも共通OGP画像が出力されます。X向けの`twitter:image`も同じ画像です。

ローカル開発中は`localhost`の画像URL、本番ビルドでは`https://dreamy-records.net`の画像URLが生成されます。OGP確認ツールで古い結果が出る場合はキャッシュを削除してください。公開前は本番URLからローカル画像を取得できない点にも注意してください。

### 記事本文の画像

画像を`public/assets/news/`へ配置し、ルート相対URLで指定します。

```markdown
![画像の説明](/assets/news/example.jpg)
```

`public`という文字はURLに含めません。

### HTML・埋め込み

Markdown本文にはHTMLを直接記述できます。YouTube、SoundCloud、Spotifyなどの公式iframeコードもそのまま貼り付けられます。

```html
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  title="YouTube video"
  allowfullscreen
>
</iframe>
```

iframe、video、audio、object、embedはスマホで横にはみ出さないよう共通CSSが適用されます。YouTubeとVimeoは16:9で表示されます。

外部サービスの埋め込みコードに専用JavaScriptが必要な場合は、そのサービスの公式コードを使用してください。

### 記事のシェア機能

すべての記事下部に次のボタンが自動表示されます。

- Xでシェア
- タイトルとURLをコピー
- その他のシェア（端末の標準共有シート）

Xシェアには`#ドリレコ`が自動で追加されます。Web Share APIに対応していないブラウザでは、「その他のシェア」はタイトルとURLのコピーに切り替わります。

## RSS

RSS URL：

```text
https://dreamy-records.net/rss.xml
```

`src/content/news/`の全記事から、ビルド時に`dist/rss.xml`が自動生成されます。RSSファイルを手動編集する必要はありません。

RSSに含まれる情報：

- タイトル
- 公開日
- description
- 記事URL
- カテゴリー

Markdown記事の追加・更新・削除は、次回の`npm run build`でRSSに反映されます。各ページの`<head>`にはRSS自動検出リンクも出力されます。

## WordPress記事の移行

旧WordPress（`dreamy-records.net`）の記事を再取得する場合：

```bash
npm run migrate:wordpress
```

この処理は次を行います。

- WordPress REST APIから記事とカテゴリーを取得
- HTML本文をMarkdownへ変換
- アイキャッチと本文画像を`public/assets/news/`へ保存
- 新しい記事を`src/content/news/`へ作成
- iframeを保持
- script、style、button、formなど不要なWordPress要素を除去
- 旧URLから`/news/{slug}/`への転送一覧を生成

同じslugのMarkdownがすでに存在する場合は上書きせず、そのファイルを保持します。既存記事をWordPressの内容で強制更新する処理ではありません。

このコマンドにはインターネット接続が必要です。

## 旧WordPress URLの転送

転送に関係するファイル：

- `src/data/legacyRedirects.ts`：旧URLと新URLの対応データ
- `src/pages/[...legacy].astro`：旧URL用の静的転送ページ
- `public/_redirects`：対応ホスティング向けの301転送設定
- `scripts/migrate-wordpress.mjs`：上記の対応一覧を自動生成

WordPress移行コマンドは、旧カテゴリー形式URLと旧日付形式URLの両方を新しいニュースURLへ割り当てます。

`legacyRedirects.ts`と`public/_redirects`は移行コマンドで再生成されるため、手動変更は次回実行時に上書きされる可能性があります。

実際にHTTP 301として処理されるかはホスティング環境の`_redirects`対応状況によります。Astro側でも旧URLごとの転送HTMLを生成しています。

## メンバーの追加・編集

メンバー情報は`src/data/members.ts`で管理します。

```ts
{
  slug: 'example',
  name: '表示名',
  nameEn: 'EXAMPLE',
  role: '役職',
  icon: '/assets/members/example.jpg',
  bio: [
    '紹介文の1段落目です。',
    '紹介文の2段落目です。',
  ],
  socials: [
    { label: 'X / TWITTER', href: 'https://x.com/example' },
  ],
}
```

### メンバー項目

- `slug`：プロフィールURLに使用。重複不可
- `name`：日本語表示名
- `nameEn`：英語表示名。背景テキストにも使用
- `role`：役職
- `icon`：任意。省略時は英語名の先頭文字を表示
- `bio`：段落ごとの配列。改行したい位置で文字列を分ける
- `socials`：SNSリンク配列。空配列の場合は「公開中のSNSはありません。」と表示

画像は`public/assets/members/`へ保存します。メンバー写真はカラー表示です。モバイルのメンバー一覧では`VIEW PROFILE`を非表示にしています。

メンバー詳細では、アイコンと名前のグリッチ演出、英語名の中抜き背景テキスト、前後メンバーへの移動が自動生成されます。

## ディスコグラフィーの編集

`src/pages/discography.astro`上部の`releases`配列を編集します。

```ts
{
  code: 'DMERCD–000',
  year: '2026',
  title: '作品タイトル',
  image: '/assets/jacket.jpg',
  link: 'https://example.com/',
}
```

配列の順番がカバーフローの順番になります。

操作仕様：

- 左右矢印で作品移動
- キーボード左右キーで作品移動
- マウスドラッグ・スマホスワイプで作品移動
- 離れたジャケットを押すと、その作品を中央へ移動
- PCは中央ジャケット下の`VIEW RELEASE`ボタンでリンクへ移動
- スマホは中央ジャケットを押すとリンクへ移動
- PCで中央ジャケットへカーソルを近づけると傾きアニメーション

## トップページの編集

`src/pages/index.astro`で編集します。

### スライド画像

`slides`配列へ画像URLを追加・並べ替えします。

```ts
const slides = ['/assets/image-1.jpg', '/assets/image-2.jpg'];
```

スライドは左右に切り替わり、表示中にズームアウトします。切り替え間隔は現在5.2秒です。

同じファイルで以下も変更できます。

- `LATEST RELEASE`
- `OUT NOW`の作品名
- `LISTEN / BUY`のリンク
- 紹介文
- SNSリンク

SNSアイコンはFont Awesomeを使用しています。

## イベントの編集

`src/pages/events.astro`の`event-row`を編集します。

日付は表示上`月/日`形式で、ゼロ埋めしません。

```astro
<time datetime="2026-01-02"><b>1/2</b></time>
```

開催前イベント：

```astro
<article class="event-row event-reveal">
  ...
  <span class="event-status event-upcoming">NEXT</span>
</article>
```

終了済みイベントは`event-finished`を付けると取り消し線が表示されます。

```astro
<article class="event-row event-reveal event-finished">
  ...
  <span class="event-status">FINISHED</span>
</article>
```

表示順は`event-row`を記述した順です。

## CONTACTの編集

`src/pages/contact.astro`でフォーム項目、メールアドレス、説明文を編集します。

フォームはSSGFormへPOST送信します。送信先は`form`タグの`action`で指定しています。

```astro
<form action="https://ssgform.com/s/1CVLISU20KLI" method="post"></form>
```

入力項目を追加する場合は、SSGFormへ項目名が伝わるように必ず`name`属性を指定してください。送信後の転送先、許可ホスト、CAPTCHAなどはSSGFormの管理画面で設定します。

現在のメールアドレス：

```text
contact@dreamy-records.net
```

メールアドレスはモバイルでも改行されないスタイルになっています。

## SHOPの編集

`src/pages/shop.astro`の`shops`配列で、取扱ショップの名前、説明、URL、ロゴを編集します。

ロゴ画像は`public/assets/`に配置し、`logo`へ`/assets/ファイル名`を指定してください。`logo`を省略するとショップ名がテキストで表示されます。

## ABOUTの編集

`src/pages/about.astro`でサークル紹介、画像、活動方針を編集します。

## 共通レイアウト・メニュー

`src/layouts/SiteLayout.astro`で管理しています。

- PC：左上にメニューを横並び表示
- モバイル：右上のハンバーガーメニュー
- ハンバーガーメニューは開閉時にGSAPアニメーション
- ブラウザの「戻る」で復帰した場合はフェード表示
- `prefers-reduced-motion: reduce`では大きなアニメーションを抑制
- 同じページで共通アニメーションが二重初期化されないよう制御

メニュー項目を変更する場合は、PC用の`.desktop-nav`とモバイル用の`.global-menu nav`の両方を変更してください。

## SEO・OGP

共通metaタグは`src/layouts/SiteLayout.astro`で出力します。

- title
- meta description
- `og:title`
- `og:description`
- `og:type`
- `og:url`
- `og:image`
- X Card
- RSS自動検出

本番サイトURLは`astro.config.mjs`の`site`で設定しています。

```js
site: 'https://dreamy-records.net';
```

ドメインを変更する場合はここも変更してください。

## エラーページ

- `src/pages/404.astro` → `dist/404.html`
- `src/pages/500.astro` → `dist/500.html`

404は一般的な静的ホスティングで自動使用されます。500はホスティングまたはWebサーバー側でエラーページとして指定してください。

## 公開時の基本手順

1. `src/`または`public/`を編集
2. `npm run format:check`
3. `npm run build`
4. `npm run preview`で確認
5. `dist/`の内容をWebサーバーへアップロード
6. リンク、画像、OGP、RSS、404、旧URL転送を本番環境で確認

## 注意事項

- `dist/`を直接編集しないでください。
- 画像URLは原則`/assets/...`のルート相対URLを使用します。
- Markdownのファイル名を変更すると記事URLも変わります。必要なら旧URL転送も追加してください。
- `description`は記事本文には表示されませんが、OGPとRSSで使用するため必ず設定してください。
- `showImage`とOGP画像は別の仕様です。`showImage: false`でも`image`はOGPに使用されます。
- RSSはビルド時に生成されます。`dist/rss.xml`を手動編集しないでください。
- `_redirects`の対応状況は公開先のホスティング仕様を確認してください。
