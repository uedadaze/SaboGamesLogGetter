// メモ
// <div class="container">の下に<div class="column">が2列あり、その中に投稿(<div class="post">)がある。id="post-*****"という形で識別可能。その中身が以下の通り。
// - <img class="icon">: アイコン。
// - <div class="post-content-area">: アイコン以外の中身。
//   - <strong>: 発言者名部分。
//   - <em>: 日付部分。
//   - <div class="post-body">: 発言本体。

(function () {
    'use strict';

    // 定数定義
    const SIDEBAR_WIDTH = '640px';
    const MAX_SIDEBAR_LOGS = 20;

    // 1. スタイルの挿入
    const css = `
        /* サイドバー本体 */
        #saboten-log-getter-sidebar {
            position: fixed;
            top: 0;
            right: 0;
            width: ${SIDEBAR_WIDTH};
            height: 100vh;
            background: rgba(15, 22, 30, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-left: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
            z-index: 9999;
            box-sizing: border-box;
            padding: 20px;
            color: #e0f7ff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        /* サイドバー非表示状態 */
        #saboten-log-getter-sidebar.collapsed {
            transform: translateX(100%);
        }

        /* ヘッダーデザイン */
        .saboten-sidebar-header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }

        .saboten-sidebar-title {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
            text-align: center;
        }

        /* 開閉トグルボタン */
        #saboten-sidebar-toggle {
            position: fixed;
            top: 20px;
            right: ${SIDEBAR_WIDTH};
            width: 40px;
            height: 40px;
            background: rgba(15, 22, 30, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-right: none;
            border-radius: 8px 0 0 8px;
            color: #FFD700;
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            box-shadow: -3px 0 10px rgba(0, 0, 0, 0.3);
            transition: right 0.3s cubic-bezier(0.25, 1, 0.5, 1), background 0.2s, color 0.2s;
        }

        #saboten-sidebar-toggle:hover {
            background: rgba(25, 35, 48, 0.95);
            color: #ffffff;
            box-shadow: -3px 0 15px rgba(255, 215, 0, 0.3);
        }

        #saboten-sidebar-toggle.collapsed {
            right: 0;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px 0 0 8px;
        }

        /* コンテンツ領域 */
        .saboten-sidebar-content {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        /* 既存のbodyのマージン遷移 */
        body {
            transition: margin-right 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* ログ追加ボタン（元のページスタイルに負けないよう詳細度と!importantを強化） */
        .post-actions button.saboten-add-log-btn,
        button.saboten-add-log-btn {
            background-color: #1b5e20 !important;
            background-image: none !important;
            color: #ffffff !important;
            padding: 6px 12px !important;
            border: 1px solid #144a18 !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 0.85em !important;
            transition: background-color 0.2s, transform 0.1s !important;
            font-weight: bold !important;
            margin-left: 5px !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
        }

        .post-actions button.saboten-add-log-btn:hover,
        button.saboten-add-log-btn:hover {
            background-color: #0d3c13 !important;
            background-image: none !important;
            color: #ffffff !important;
        }

        .post-actions button.saboten-add-log-btn:active,
        button.saboten-add-log-btn:active {
            transform: scale(0.95) !important;
        }

        /* 上部ボタングループ（2分割横並び配置） */
        .saboten-btn-row {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            width: 100%;
        }

        /* 一括追加ボタン（幅を半分にして横並び対応） */
        .saboten-add-all-btn {
            flex: 1;
            background: linear-gradient(135deg, #17a2b8, #117a8b);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
            margin-bottom: 0;
            box-shadow: 0 4px 10px rgba(17, 122, 139, 0.3);
            text-align: center;
        }

        .saboten-add-all-btn:hover {
            background: linear-gradient(135deg, #138496, #0f6c7c);
            box-shadow: 0 4px 15px rgba(17, 122, 139, 0.5);
        }

        .saboten-add-all-btn:active {
            transform: scale(0.98);
        }

        /* 全削除ボタン */
        .saboten-delete-all-btn {
            flex: 1;
            background: linear-gradient(135deg, #dc3545, #bd2130);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
            margin-bottom: 0;
            box-shadow: 0 4px 10px rgba(220, 53, 69, 0.3);
            text-align: center;
        }

        .saboten-delete-all-btn:hover {
            background: linear-gradient(135deg, #c82333, #a71d2a);
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.5);
        }

        .saboten-delete-all-btn:active {
            transform: scale(0.98);
        }

        /* サイドバー内のログ要素の枠 */
        .saboten-sidebar-log-wrapper {
            position: relative;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 6px;
            padding: 10px; /* ★カード内余白（上下左右） */
            padding-right: 34px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: border-color 0.2s, background-color 0.2s;
        }

        .saboten-sidebar-log-wrapper:hover {
            border-color: rgba(255, 215, 0, 0.3);
            background-color: rgba(255, 255, 255, 0.12);
        }

        /* サイドバー内ログ用にpostの余白などを調整 */
        .saboten-sidebar-log-wrapper .post {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex;
            gap: 10px;
            color: #e0f7ff;
            word-wrap: break-word;
        }

        .saboten-sidebar-log-wrapper .post img.icon {
            width: 48px;
            height: 48px;
            object-fit: cover;
            flex-shrink: 0;
            border-radius: 4px;
        }

        .saboten-sidebar-log-wrapper .post-content-area {
            flex-grow: 1;
        }

        .saboten-sidebar-log-wrapper .post strong {
            color: #FFD700;
            font-size: 1.0em;
            margin-right: 10px;
        }

        .saboten-sidebar-log-wrapper .post strong a {
            color: #FFD700;
            text-decoration: none;
        }

        .saboten-sidebar-log-wrapper .post em {
            color: #aaaaaa;
            font-size: 0.8em;
            font-style: normal;
        }

        /* ★ログ本文の行間・余白設定 */
        .saboten-sidebar-log-wrapper .post-body {
            margin-top: 2px; /* ★発言者名・日付との上部余白 */
            font-size: 0.9em;
            line-height: 1.35; /* ★本文テキストの行間（お好みに合わせて調整可能） */
            word-break: break-word;
            overflow-wrap: break-word;
        }

        /* サイドバーログの削除ボタン */
        .saboten-log-delete-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 22px;
            height: 22px;
            background: rgba(255, 255, 255, 0.15);
            border: none;
            border-radius: 50%;
            color: #aaaaaa;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s, color 0.2s;
        }

        .saboten-log-delete-btn:hover {
            background-color: rgba(220, 53, 69, 0.8);
            color: white;
        }

        /* 整理モード移行ボタン */
        .saboten-to-organizer-btn {
            width: 100%;
            background: linear-gradient(135deg, #6f42c1, #5a32a3);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
            margin-bottom: 15px;
            box-shadow: 0 4px 10px rgba(111, 66, 193, 0.3);
        }

        .saboten-to-organizer-btn:hover {
            background: linear-gradient(135deg, #5e35b1, #4a2891);
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.5);
        }

        .saboten-to-organizer-btn:active {
            transform: scale(0.98);
        }

        /* 20件超え案内通知ボックス */
        .saboten-over-limit-notice {
            display: none;
            background: rgba(255, 193, 7, 0.12);
            border: 1px solid rgba(255, 193, 7, 0.35);
            border-radius: 6px;
            padding: 8px 10px;
            margin-top: -5px;
            margin-bottom: 15px;
            font-size: 0.8rem;
            color: #ffe082;
            line-height: 1.4;
            text-align: center;
            box-sizing: border-box;
        }

        .saboten-over-limit-notice strong {
            color: #ffd54f;
            font-size: 0.85rem;
        }

        /* 整理画面オーバーレイ */
        #saboten-organizer-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(18, 20, 24, 0.98);
            color: #e0f7ff;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        #saboten-organizer-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        /* 上部エリア (比率 1) */
        .saboten-org-header {
            flex: 0 0 80px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            background: #11151c;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            box-sizing: border-box;
        }

        .saboten-org-title {
            margin: 0;
            font-size: 1.4rem;
            font-weight: 700;
            background: linear-gradient(45deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .saboten-org-actions {
            display: flex;
            gap: 15px;
        }

        .saboten-org-btn {
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.2s;
            border: none;
        }

        .saboten-org-btn-primary {
            background: #28a745;
            color: white;
        }
        .saboten-org-btn-primary:hover {
            background: #218838;
        }

        .saboten-org-btn-secondary {
            background: #6c757d;
            color: white;
        }
        .saboten-org-btn-secondary:hover {
            background: #5a6268;
        }

        /* 下部エリア (比率 4) */
        .saboten-org-body {
            flex: 1;
            display: flex;
            overflow: hidden;
            box-sizing: border-box;
        }

        /* 左右分割パネル */
        .saboten-org-panel {
            width: 50%;
            height: 100%;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
        }

        .saboten-org-panel-left {
            border-right: 1px solid rgba(255, 255, 255, 0.1);
        }

        .saboten-org-panel-right {
            background: #14181f;
        }

        .saboten-org-panel-header {
            padding: 15px 25px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-weight: bold;
            font-size: 1.1rem;
            color: #87cefa;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
        }

        /* 整理画面 操作パネル（右側上部） */
        .saboten-org-control-panel {
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 25px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            box-sizing: border-box;
        }

        .saboten-org-control-row {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            box-sizing: border-box;
        }

        /* ログ選択プルダウン */
        .saboten-org-select {
            flex: 1;
            background: #1e2630;
            color: #e0f7ff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.9rem;
            outline: none;
            cursor: pointer;
            transition: border-color 0.2s;
        }

        .saboten-org-select:focus {
            border-color: #87cefa;
        }

        /* 新規ログ作成ボタン */
        .saboten-org-btn-new-proj {
            background: linear-gradient(135deg, #17a2b8, #117a8b);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            white-space: nowrap;
            transition: background 0.2s, transform 0.1s;
        }

        .saboten-org-btn-new-proj:hover {
            background: linear-gradient(135deg, #138496, #0f6c7c);
        }

        .saboten-org-btn-new-proj:active {
            transform: scale(0.98);
        }

        /* ログ削除ボタン */
        .saboten-org-btn-delete-proj {
            background: linear-gradient(135deg, #dc3545, #c82333);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            white-space: nowrap;
            transition: background 0.2s, transform 0.1s;
        }

        .saboten-org-btn-delete-proj:hover {
            background: linear-gradient(135deg, #c82333, #bd2130);
        }

        .saboten-org-btn-delete-proj:active {
            transform: scale(0.98);
        }

        /* 整理画面 左パネル上部のツールバー */
        .saboten-org-left-toolbar {
            background: rgba(255, 255, 255, 0.04);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            padding: 12px 25px;
            box-sizing: border-box;
        }

        /* IDが小さいものから全て出力に追加ボタン */
        .saboten-org-btn-add-all-left {
            background: linear-gradient(135deg, #28a745, #218838);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 9px 15px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            width: 100%;
            box-sizing: border-box;
            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
            transition: background 0.2s, transform 0.1s;
        }

        .saboten-org-btn-add-all-left:hover {
            background: linear-gradient(135deg, #218838, #1e7e34);
        }

        .saboten-org-btn-add-all-left:active {
            transform: scale(0.98);
        }

        /* ログ名称入力欄 */
        .saboten-org-input {
            flex: 1;
            background: #1e2630;
            color: #e0f7ff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s;
        }

        .saboten-org-input:focus {
            border-color: #87cefa;
        }

        /* 名称保存ボタン */
        .saboten-org-btn-save-name {
            background: rgba(255, 255, 255, 0.15);
            color: #e0f7ff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 6px;
            padding: 8px 12px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            white-space: nowrap;
            transition: background 0.2s, color 0.2s;
        }

        .saboten-org-btn-save-name:hover {
            background: rgba(255, 255, 255, 0.25);
            color: white;
        }

        /* 操作パネル内のHTMLダウンロードボタン */
        .saboten-org-btn-download-panel {
            background: linear-gradient(135deg, #28a745, #218838);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.85rem;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
            transition: background 0.2s, transform 0.1s;
        }

        .saboten-org-btn-download-panel:hover {
            background: linear-gradient(135deg, #218838, #1e7e34);
        }

        .saboten-org-btn-download-panel:active {
            transform: scale(0.98);
        }

        .saboten-org-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 25px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-sizing: border-box;
        }

        /* 整理画面内でのログ項目のカードラッパー */
        .saboten-org-item-card {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 15px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
        }

        /* 整理画面内のpost要素表示のクリーンアップ */
        .saboten-org-item-card .post {
            background: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            display: flex;
            gap: 15px;
            color: #e0f7ff;
            word-wrap: break-word;
        }

        .saboten-org-item-card .post img.icon {
            width: 48px;
            height: 48px;
            object-fit: cover;
            flex-shrink: 0;
            border-radius: 4px;
        }

        .saboten-org-item-card .post-content-area {
            flex-grow: 1;
        }

        .saboten-org-item-card .post strong {
            color: #FFD700;
            font-size: 1.0em;
            margin-right: 10px;
        }

        .saboten-org-item-card .post strong a {
            color: #FFD700;
            text-decoration: none;
        }

        .saboten-org-item-card .post em {
            color: #aaaaaa;
            font-size: 0.8em;
            font-style: normal;
        }

        .saboten-org-item-card .post-body {
            margin-top: 2px;
            font-size: 0.9em;
            line-height: 1.35;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        /* 操作ボタン */
        .saboten-org-action-btn {
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
            font-size: 0.85rem;
            color: white;
            text-align: center;
            box-sizing: border-box;
        }

        .saboten-org-btn-move {
            background: #1b5e20;
        }
        .saboten-org-btn-move:hover {
            background: #0d3c13;
        }

        .saboten-org-btn-delete {
            background: #c62828;
        }
        .saboten-org-btn-delete:hover {
            background: #b71c1c;
        }

        /* 整理画面カード内のボタングループ */
        .saboten-org-card-btn-group {
            display: flex;
            gap: 8px;
            width: 100%;
            box-sizing: border-box;
        }

        .saboten-org-btn-order {
            flex: 1;
            background: rgba(255, 255, 255, 0.12);
            color: #e0f7ff;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 8px 6px;
            font-size: 0.8rem;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            text-align: center;
            white-space: nowrap;
        }

        .saboten-org-btn-order:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.25);
            color: white;
            border-color: #87cefa;
        }

        .saboten-org-btn-order:disabled {
            opacity: 0.35;
            cursor: not-allowed;
            border-color: rgba(255, 255, 255, 0.1);
        }

        .saboten-org-card-btn-group .saboten-org-btn-delete {
            flex: 1.2;
            width: auto;
        }

        /* 返信先（.reply-to）リンク解除後のスタイル */
        .reply-to {
            margin: 2px 0 4px 0;
            font-size: 0.85em;
        }

        .reply-to span.reply-to-text {
            color: #87cefa;
            font-size: 0.85em;
            text-decoration: none;
            display: inline-block;
            margin-right: 6px;
        }

        /* 返信先引用プレビュー枠 */
        .saboten-reply-quote {
            background: rgba(0, 0, 0, 0.4);
            border-left: 3px solid #87cefa;
            border-radius: 4px;
            padding: 5px 8px;
            margin: 4px 0 6px 0;
            font-size: 0.68em;
            color: #cccccc;
            box-sizing: border-box;
        }

        .saboten-reply-quote-header {
            margin-bottom: 2px;
            display: flex;
            gap: 6px;
            align-items: baseline;
            flex-wrap: wrap;
        }

        .saboten-reply-quote-header strong {
            color: #FFD700 !important;
            font-size: 0.95em;
            margin-right: 0 !important;
        }

        .saboten-reply-quote-header em {
            color: #aaaaaa !important;
            font-size: 0.85em;
            font-style: normal;
        }

        .saboten-reply-quote-body {
            color: #e0e0e0;
            line-height: 1.35;
            word-break: break-word;
            white-space: pre-wrap;
        }

        /* 整理画面の「さらに読み込む」ボタン */
        .saboten-org-load-more-btn {
            width: 100%;
            background: rgba(255, 255, 255, 0.08);
            border: 1px dashed rgba(255, 255, 255, 0.25);
            color: #87cefa;
            border-radius: 6px;
            padding: 12px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.95rem;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
            text-align: center;
            box-sizing: border-box;
        }

        .saboten-org-load-more-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border-color: #87cefa;
        }

        /* 一括処理中オーバーレイ（右フレーム内のみを覆う） */
        .saboten-batch-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 22, 30, 0.92);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            pointer-events: auto;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            box-sizing: border-box;
            padding: 20px;
        }

        .saboten-batch-overlay.active {
            opacity: 1;
        }

        .saboten-batch-overlay-card {
            background: #1a222d;
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 24px 20px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 85%;
            max-width: 320px;
            box-sizing: border-box;
        }

        .saboten-batch-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-top-color: #17a2b8;
            border-radius: 50%;
            animation: saboten-spin 0.8s linear infinite;
        }

        @keyframes saboten-spin {
            to { transform: rotate(360deg); }
        }

        .saboten-batch-title {
            font-size: 1.3rem;
            font-weight: bold;
            color: #e0f7ff;
        }

        .saboten-batch-status {
            font-size: 1.0rem;
            color: #87cefa;
        }

        .saboten-batch-sub {
            font-size: 0.8rem;
            color: #aaaaaa;
        }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // 2. DOMの作成
    // サイドバー
    const sidebar = document.createElement('div');
    sidebar.id = 'saboten-log-getter-sidebar';

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'saboten-sidebar-header';
    const title = document.createElement('h3');
    title.className = 'saboten-sidebar-title';
    title.textContent = 'SabotennGamesLogGetter';
    header.appendChild(title);
    sidebar.appendChild(header);

    // コンテンツ領域
    const content = document.createElement('div');
    content.className = 'saboten-sidebar-content';

    // 上部ボタングループコンテナ（横並び2分割）
    const btnRow = document.createElement('div');
    btnRow.className = 'saboten-btn-row';

    // 「全投稿を一括追加」ボタンの作成
    const addAllBtn = document.createElement('button');
    addAllBtn.type = 'button';
    addAllBtn.className = 'saboten-add-all-btn';
    addAllBtn.textContent = 'ページ内の全投稿をID順に追加';
    addAllBtn.addEventListener('click', async () => {
        // サイドバー外の全投稿を取得
        const posts = Array.from(document.querySelectorAll('.container .post'));
        if (posts.length === 0) {
            alert('ページ内に投稿が見つかりませんでした。');
            return;
        }

        // ボタンの状態変更
        const originalText = addAllBtn.textContent;
        addAllBtn.textContent = '一括追加中...';
        addAllBtn.disabled = true;

        // IDの数値順にソート (昇順: 古い順)
        posts.sort((a, b) => {
            const idA = parseInt(a.id.replace('post-', ''), 10) || 0;
            const idB = parseInt(b.id.replace('post-', ''), 10) || 0;
            return idA - idB;
        });

        // 一括処理用オーバーレイ（黒い半透明スクリーン）を作成・表示
        const overlay = document.createElement('div');
        overlay.className = 'saboten-batch-overlay';

        const card = document.createElement('div');
        card.className = 'saboten-batch-overlay-card';

        const spinner = document.createElement('div');
        spinner.className = 'saboten-batch-spinner';

        const title = document.createElement('div');
        title.className = 'saboten-batch-title';
        title.textContent = '処理中...';

        const status = document.createElement('div');
        status.className = 'saboten-batch-status';
        status.textContent = `準備中 (全 ${posts.length} 件)...`;

        const sub = document.createElement('div');
        sub.className = 'saboten-batch-sub';
        sub.textContent = '各投稿に自動スクロールして画面キャプチャ・保存を行っています。しばらく時間がかかります。この画面は開いたままにしてお待ちください。';

        card.appendChild(spinner);
        card.appendChild(title);
        card.appendChild(status);
        card.appendChild(sub);
        overlay.appendChild(card);
        sidebar.appendChild(overlay);

        // フェードイン
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });

        // 順次スクロールしてサイドバーに追加
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            const numericId = post.id ? post.id.replace('post-', '') : '';
            status.textContent = `処理中 (${i + 1} / ${posts.length} 件) [ID: ${numericId}]`;

            // 投稿の上端までスクロール
            post.scrollIntoView({ behavior: 'auto', block: 'start' });
            // 描画安定化のための短い待機
            await new Promise(r => setTimeout(r, 120));

            try {
                await addLogToSidebar(post);
            } catch (err) {
                console.error('[SabotennLogGetter] Failed to add log in batch:', err);
            }
        }

        // オーバーレイの削除
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.remove();
        }, 200);

        // 20件超え通知の更新
        await updateOverLimitNotice();

        addAllBtn.textContent = '一括追加完了';
        setTimeout(() => {
            addAllBtn.textContent = originalText;
            addAllBtn.disabled = false;
        }, 1500);
    });

    // 「取得したログを全て削除」ボタンの作成
    const deleteAllBtn = document.createElement('button');
    deleteAllBtn.type = 'button';
    deleteAllBtn.className = 'saboten-delete-all-btn';
    deleteAllBtn.textContent = '取得したログを全て削除';
    deleteAllBtn.addEventListener('click', async () => {
        const hasLogs = content.querySelectorAll('.saboten-sidebar-log-wrapper').length > 0;
        if (!hasLogs) {
            alert('削除対象のログが存在しません。');
            return;
        }

        const ok = confirm('保存されているすべてのログを削除しますか？\nこの操作は取り消せません。');
        if (!ok) return;

        try {
            const db = await openDB();
            await clearAllLogs(db);

            // サイドバー内のすべてのログラッパー要素を削除
            const logWrappers = content.querySelectorAll('.saboten-sidebar-log-wrapper');
            logWrappers.forEach(wrapper => wrapper.remove());

            // プレースホルダーを再表示
            updatePlaceholderVisibility();
            await updateOverLimitNotice();

            const originalText = deleteAllBtn.textContent;
            deleteAllBtn.textContent = '全削除完了';
            setTimeout(() => {
                deleteAllBtn.textContent = originalText;
            }, 1500);
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to clear all logs from IndexedDB:', err);
            alert('ログの削除中にエラーが発生しました。');
        }
    });

    btnRow.appendChild(addAllBtn);
    btnRow.appendChild(deleteAllBtn);
    content.appendChild(btnRow);

    // 「ログ整理＆HTML出力モードへ移行する」ボタンの作成と挿入
    const toOrganizerBtn = document.createElement('button');
    toOrganizerBtn.type = 'button';
    toOrganizerBtn.className = 'saboten-to-organizer-btn';
    toOrganizerBtn.textContent = 'ログ整理＆HTML出力モードへ移行する';
    toOrganizerBtn.addEventListener('click', () => {
        openOrganizer();
    });
    content.appendChild(toOrganizerBtn);

    // 20件超え案内通知ボックス
    const overLimitNotice = document.createElement('div');
    overLimitNotice.className = 'saboten-over-limit-notice';
    content.appendChild(overLimitNotice);

    // 仮プレースホルダー
    const placeholder = document.createElement('p');
    placeholder.style.fontSize = '0.9rem';
    placeholder.style.color = '#87cefa';
    placeholder.style.textAlign = 'center';
    placeholder.style.margin = '20px 0';
    placeholder.textContent = 'Log getter panel is ready.';
    content.appendChild(placeholder);
    sidebar.appendChild(content);

    // トグルボタン
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'saboten-sidebar-toggle';
    toggleBtn.innerHTML = '&#10095;'; // 「❯」の矢印
    toggleBtn.title = 'サイドバーを閉じる';

    // bodyの余白調整用関数
    function adjustBodyMargin(collapsed) {
        if (collapsed) {
            document.body.style.marginRight = '0';
        } else {
            document.body.style.marginRight = SIDEBAR_WIDTH;
        }
    }

    const STORAGE_KEY_COLLAPSED = 'saboten_sidebar_collapsed';

    // サイドバーの開閉状態をUIに適用し、必要に応じてlocalStorageへ保存する関数
    function applySidebarState(collapsed, save = true) {
        isCollapsed = collapsed;
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            toggleBtn.classList.add('collapsed');
            toggleBtn.innerHTML = '&#10094;'; // 「❮」の矢印
            toggleBtn.title = 'サイドバーを開く';
            adjustBodyMargin(true);
        } else {
            sidebar.classList.remove('collapsed');
            toggleBtn.classList.remove('collapsed');
            toggleBtn.innerHTML = '&#10095;'; // 「❯」の矢印
            toggleBtn.title = 'サイドバーを閉じる';
            adjustBodyMargin(false);
        }
        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY_COLLAPSED, isCollapsed ? 'true' : 'false');
            } catch (e) {
                console.warn('[SabotennLogGetter] Failed to save sidebar state to localStorage:', e);
            }
        }
    }

    // localStorageから保存された開閉状態を読み込む（未保存の場合は開いた状態: false）
    let savedCollapsedState = false;
    try {
        const saved = localStorage.getItem(STORAGE_KEY_COLLAPSED);
        if (saved !== null) {
            savedCollapsedState = (saved === 'true');
        }
    } catch (e) {
        savedCollapsedState = false;
    }
    let isCollapsed = savedCollapsedState;

    // トグル動作の登録
    toggleBtn.addEventListener('click', () => {
        applySidebarState(!isCollapsed, true);
    });

    // 3. IndexedDB ユーティリティ
    const dbName = 'SabotennGamesLogGetterDB';
    const storeName = 'logs';
    const projectsStoreName = 'projects';
    const appStateStoreName = 'app_state';
    const dbVersion = 2;

    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(projectsStoreName)) {
                    db.createObjectStore(projectsStoreName, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(appStateStoreName)) {
                    db.createObjectStore(appStateStoreName, { keyPath: 'key' });
                }
            };
        });
    }

    function saveLog(db, logData) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(logData);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    function deleteLog(db, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    function getAllLogs(db) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    function clearAllLogs(db) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.clear();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    function getLog(db, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    // ログプロジェクト（編集状況）のIndexedDB保存
    async function saveProjectsToDB(db, projects, activeProjectId) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([projectsStoreName, appStateStoreName], 'readwrite');
            const projStore = tx.objectStore(projectsStoreName);
            const stateStore = tx.objectStore(appStateStoreName);

            projStore.clear();
            projects.forEach(p => {
                projStore.put({
                    id: p.id,
                    name: p.name,
                    items: Array.isArray(p.items) ? p.items : []
                });
            });

            stateStore.put({ key: 'activeProjectId', value: activeProjectId });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // ログプロジェクト（編集状況）のIndexedDB読み込み
    async function loadProjectsFromDB(db) {
        return new Promise((resolve, reject) => {
            if (!db.objectStoreNames.contains(projectsStoreName) || !db.objectStoreNames.contains(appStateStoreName)) {
                resolve(null);
                return;
            }
            const tx = db.transaction([projectsStoreName, appStateStoreName], 'readonly');
            const projStore = tx.objectStore(projectsStoreName);
            const stateStore = tx.objectStore(appStateStoreName);

            const projReq = projStore.getAll();
            const stateReq = stateStore.get('activeProjectId');

            tx.oncomplete = () => {
                const rawProjects = projReq.result || [];
                const activeId = stateReq.result ? stateReq.result.value : null;

                if (rawProjects.length === 0) {
                    resolve(null);
                    return;
                }

                const projects = rawProjects.map(p => {
                    let items = [];
                    if (Array.isArray(p.items)) {
                        items = p.items;
                    } else if (Array.isArray(p.selectedIds)) {
                        // 旧形式（selectedIds）の場合はIDリストのみ保持
                        items = p.selectedIds.map(id => ({ id, html: '' }));
                    }
                    return {
                        id: p.id,
                        name: p.name,
                        items: items
                    };
                });

                resolve({ projects, activeProjectId: activeId || projects[0].id });
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    // 4. 画像データの Base64 変換 (chrome.tabs.captureVisibleTab を用いた画面キャプチャとクロップ)
    const MIN_CAPTURE_INTERVAL = 800; // クォータ制限（最大2回/秒）回避のための最小呼び出し間隔(ms)
    let lastCaptureTimestamp = 0;

    // クォータ制限エラー時の自動待機＆リトライ付きキャプチャ実行関数
    async function requestTabCaptureWithRetry(maxRetries = 3) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            // 前回のキャプチャ呼び出しからの経過時間を確認し、800ms未満なら差分待機
            const now = Date.now();
            const elapsed = now - lastCaptureTimestamp;
            if (elapsed < MIN_CAPTURE_INTERVAL) {
                await new Promise(r => setTimeout(r, MIN_CAPTURE_INTERVAL - elapsed));
            }
            lastCaptureTimestamp = Date.now();

            const result = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'captureVisibleTab' }, (response) => {
                    if (chrome.runtime.lastError) {
                        resolve({ dataUrl: null, error: chrome.runtime.lastError.message });
                    } else if (!response || !response.dataUrl) {
                        resolve({ dataUrl: null, error: response?.error || 'No dataUrl' });
                    } else {
                        resolve({ dataUrl: response.dataUrl, error: null });
                    }
                });
            });

            if (result.dataUrl) {
                return result.dataUrl;
            }

            console.warn(`[SabotennLogGetter] Capture attempt ${attempt + 1} failed: ${result.error}. Retrying after delay...`);
            if (attempt < maxRetries) {
                // クォータ超過時は1.2秒待機してからリトライ
                await new Promise(r => setTimeout(r, 1200));
            }
        }
        return null;
    }

    async function convertImageWithTabCapture(imgEl) {
        if (!imgEl) return '';
        const currentSrc = imgEl.src || imgEl.getAttribute('src');
        if (!currentSrc) return '';
        if (currentSrc.startsWith('data:')) return currentSrc;

        // chrome 拡張機能 API が利用可能かチェック
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
            console.warn('[SabotennLogGetter] chrome.runtime.sendMessage is not available. Falling back to original URL.');
            return currentSrc;
        }

        // 要素の絶対座標（ビューポートに対する位置）を取得
        const rect = imgEl.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cropData = {
            x: rect.left * dpr,
            y: rect.top * dpr,
            width: rect.width * dpr,
            height: rect.height * dpr
        };

        // レートリミット＆リトライ付きでタブキャプチャを実行
        const dataUrl = await requestTabCaptureWithRetry();
        if (!dataUrl) {
            console.warn('[SabotennLogGetter] No capture data received. Falling back to original URL.');
            return currentSrc;
        }

        return new Promise((resolve) => {
            // キャプチャされた画面全体画像から、対象画像をCanvasで切り抜き（クロップ）
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = cropData.width;
                    canvas.height = cropData.height;
                    const ctx = canvas.getContext('2d');

                    // 画像を切り抜いてCanvasに描画
                    ctx.drawImage(
                        img,
                        cropData.x,
                        cropData.y,
                        cropData.width,
                        cropData.height,
                        0,
                        0,
                        cropData.width,
                        cropData.height
                    );

                    resolve(canvas.toDataURL('image/png'));
                } catch (err) {
                    console.error('[SabotennLogGetter] Canvas cropping error:', err);
                    resolve(currentSrc);
                }
            };
            img.onerror = (err) => {
                console.error('[SabotennLogGetter] Image load error during cropping:', err);
                resolve(currentSrc);
            };
            img.src = dataUrl;
        });
    }

    // 5. ログ追加・復元の制御

    // 単一のログをサイドバーに追加し、必要に応じてIndexedDBに保存する共通関数
    async function addLogToSidebar(postEl, isFromRestore = false, savedHtml = null) {
        if (!postEl) return { status: 'error' };

        // 重複チェック
        // 1. サイドバー上に既に表示されているか
        if (content.querySelector(`.saboten-sidebar-log-wrapper[data-post-id="${postEl.id}"]`)) {
            return { status: 'already_exists' };
        }

        // 2. 復元時以外で、IndexedDB内に既に存在するか
        if (!isFromRestore) {
            try {
                const db = await openDB();
                const existing = await getLog(db, postEl.id);
                if (existing) {
                    return { status: 'already_exists' };
                }
            } catch (err) {
                console.error('[SabotennLogGetter] Failed to check existing log in DB:', err);
            }
        }

        let finalHtml = savedHtml;

        if (!finalHtml) {
            // 新規追加の場合: 画像をBase64に変換した上でHTMLを作成

            // 1. post要素を複製
            const clonedPost = postEl.cloneNode(true);

            // 2. コピー先からアクションボタン部分を削除
            const actions = clonedPost.querySelector('.post-actions');
            if (actions) {
                actions.remove();
            }

            // ※ 3. id属性は削除せず保持する

            // <em> 日付部分の後にID情報を追記する
            const em = clonedPost.querySelector('em');
            if (em && postEl.id) {
                const numericId = postEl.id.replace('post-', '');
                em.textContent += ` (ID: ${numericId})`;
            }

            // 元のDOM上の画像要素を chrome.tabs.captureVisibleTab でキャプチャする (非同期)
            // 1. アイコン画像のキャプチャ
            const originalIconImg = postEl.querySelector('img.icon');
            const iconImg = clonedPost.querySelector('img.icon');
            if (originalIconImg && iconImg) {
                const base64Src = await convertImageWithTabCapture(originalIconImg);
                iconImg.src = base64Src;
            }

            // 3. 本文（post-body）内の全画像のキャプチャ
            const originalBodyImgs = Array.from(postEl.querySelectorAll('.post-body img'));
            const clonedBodyImgs = Array.from(clonedPost.querySelectorAll('.post-body img'));
            for (let i = 0; i < originalBodyImgs.length && i < clonedBodyImgs.length; i++) {
                const origImg = originalBodyImgs[i];
                const cloneImg = clonedBodyImgs[i];
                if (origImg && cloneImg) {
                    const base64Src = await convertImageWithTabCapture(origImg);
                    cloneImg.src = base64Src;
                }
            }

            // 4. 返信先（.reply-to）のリンク解除および引用プレビュー枠の生成
            const replyToParagraphs = Array.from(clonedPost.querySelectorAll('.reply-to, p.reply-to'));
            for (const replyP of replyToParagraphs) {
                const replyLinks = Array.from(replyP.querySelectorAll('a[data-anchor], a'));
                const quotesToInsert = [];

                for (const a of replyLinks) {
                    const anchorAttr = a.getAttribute('data-anchor') || '';
                    const rawAnchor = anchorAttr.replace(/^#/, '').trim();
                    const targetId = rawAnchor.startsWith('post-') ? rawAnchor : ('post-' + rawAnchor);

                    // リンクを外してプレーンな span に置換
                    const span = document.createElement('span');
                    span.className = 'reply-to-text';
                    span.textContent = a.textContent;
                    a.replaceWith(span);

                    // 返信先投稿がDBに存在するかチェック
                    if (targetId && targetId !== 'post-') {
                        try {
                            const db = await openDB();
                            const targetLog = await getLog(db, targetId);
                            if (targetLog && targetLog.html) {
                                // ターゲットのHTMLから名前・日時・本文冒頭20文字をパース
                                const parserDoc = document.createElement('div');
                                parserDoc.innerHTML = targetLog.html;

                                const authorEl = parserDoc.querySelector('strong');
                                const author = authorEl ? authorEl.textContent.trim() : '';

                                const dateEl = parserDoc.querySelector('em');
                                const dateStr = dateEl ? dateEl.textContent.trim() : '';

                                const bodyEl = parserDoc.querySelector('.post-body');
                                let bodySnippet = '';
                                if (bodyEl) {
                                    // 内部のreply-toやquoteを除いた純粋なテキストを取得
                                    const bodyClone = bodyEl.cloneNode(true);
                                    bodyClone.querySelectorAll('.reply-to, .saboten-reply-quote').forEach(el => el.remove());
                                    const fullText = (bodyClone.innerText || bodyClone.textContent || '').trim();
                                    bodySnippet = fullText.length > 25 ? fullText.substring(0, 25) + '…' : fullText;
                                }

                                if (author || bodySnippet) {
                                    const quoteBox = document.createElement('div');
                                    quoteBox.className = 'saboten-reply-quote';

                                    const headerDiv = document.createElement('div');
                                    headerDiv.className = 'saboten-reply-quote-header';
                                    if (author) {
                                        const st = document.createElement('strong');
                                        st.textContent = author;
                                        headerDiv.appendChild(st);
                                    }
                                    if (dateStr) {
                                        const emEl = document.createElement('em');
                                        emEl.textContent = dateStr;
                                        headerDiv.appendChild(emEl);
                                    }

                                    const bodyDiv = document.createElement('div');
                                    bodyDiv.className = 'saboten-reply-quote-body';
                                    bodyDiv.textContent = bodySnippet;

                                    quoteBox.appendChild(headerDiv);
                                    quoteBox.appendChild(bodyDiv);
                                    quotesToInsert.push(quoteBox);
                                }
                            }
                        } catch (err) {
                            console.error('[SabotennLogGetter] Failed to fetch reply-to target log:', err);
                        }
                    }
                }

                // 生成した引用ボックスを replyP の直後に順番に挿入
                let insertRef = replyP;
                for (const quoteEl of quotesToInsert) {
                    insertRef.insertAdjacentElement('afterend', quoteEl);
                    insertRef = quoteEl;
                }
            }

            finalHtml = clonedPost.innerHTML;

            // 5. IndexedDBへの保存 (新規追加時のみ)
            if (!isFromRestore) {
                try {
                    const db = await openDB();
                    await saveLog(db, {
                        id: postEl.id,
                        html: finalHtml,
                        addedAt: Date.now()
                    });
                } catch (err) {
                    console.error('[SabotennLogGetter] Failed to save log to IndexedDB:', err);
                }
            }
        }

        // 4. ラッパー（外枠）を作成し、削除ボタンを取り付ける
        const logWrapper = document.createElement('div');
        logWrapper.className = 'saboten-sidebar-log-wrapper';
        logWrapper.setAttribute('data-post-id', postEl.id);

        // クローンされた内容を再現するダミーの post 要素を作成
        const postContainer = document.createElement('div');
        postContainer.className = 'post';
        postContainer.id = postEl.id; // IDは保持する
        postContainer.innerHTML = finalHtml;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'saboten-log-delete-btn';
        deleteBtn.innerHTML = '&times;'; // ×マーク
        deleteBtn.title = 'このログを削除';

        deleteBtn.addEventListener('click', async () => {
            logWrapper.remove();
            updatePlaceholderVisibility();

            // IndexedDBから削除
            try {
                const db = await openDB();
                await deleteLog(db, postEl.id);
                await updateOverLimitNotice();
            } catch (err) {
                console.error('[SabotennLogGetter] Failed to delete log from IndexedDB:', err);
            }
        });

        logWrapper.appendChild(postContainer);
        logWrapper.appendChild(deleteBtn);

        // 5. サイドバーのコンテンツ領域に追加（新着順: 新規追加時は先頭に挿入、復元時は末尾に追加）
        if (!isFromRestore) {
            const firstLog = content.querySelector('.saboten-sidebar-log-wrapper');
            if (firstLog) {
                content.insertBefore(logWrapper, firstLog);
            } else {
                content.appendChild(logWrapper);
            }
        } else {
            content.appendChild(logWrapper);
        }

        // サイドバーの表示件数を最新20件に制限
        const currentLogs = content.querySelectorAll('.saboten-sidebar-log-wrapper');
        if (currentLogs.length > MAX_SIDEBAR_LOGS) {
            for (let i = MAX_SIDEBAR_LOGS; i < currentLogs.length; i++) {
                currentLogs[i].remove();
            }
        }

        // プレースホルダーの状態更新
        updatePlaceholderVisibility();

        return { status: 'added' };
    }

    // 単一の投稿に「ログ追加」ボタンを挿入する関数
    function injectLogButton(postEl) {
        const actionsEl = postEl.querySelector('.post-actions');
        if (!actionsEl) return;

        // 既にボタンが追加されている場合はスキップ
        if (actionsEl.querySelector('.saboten-add-log-btn')) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'saboten-add-log-btn';
        btn.textContent = 'ログ追加';

        // ボタン列の最後（返信ボタンの右）に追加
        actionsEl.appendChild(btn);
    }

    // 既存のすべての投稿にボタンを追加
    function initLogButtons() {
        const posts = document.querySelectorAll('.post');
        posts.forEach(post => {
            // サイドバー内のpostには追加しないよう除外
            if (post.closest('#saboten-log-getter-sidebar')) return;
            injectLogButton(post);
        });
    }

    // 新しい投稿が動的に追加されたかを監視する MutationObserver
    function observeNewPosts() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;

                    // サイドバー内の追加要素は無視する
                    if (node.closest && node.closest('#saboten-log-getter-sidebar')) return;

                    // 追加された要素自体が .post の場合
                    if (node.classList.contains('post')) {
                        injectLogButton(node);
                    } else {
                        // 子要素に .post が含まれる場合
                        const posts = node.querySelectorAll('.post');
                        posts.forEach(post => {
                            injectLogButton(post);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // プレースホルダーの表示/非表示を更新する関数
    function updatePlaceholderVisibility() {
        const hasLogs = content.querySelectorAll('.saboten-sidebar-log-wrapper').length > 0;
        if (hasLogs) {
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
        }
    }

    // 20件超え案内通知の更新関数
    async function updateOverLimitNotice() {
        if (!overLimitNotice) return;
        try {
            const db = await openDB();
            const logs = await getAllLogs(db);
            const totalCount = logs.length;
            if (totalCount > MAX_SIDEBAR_LOGS) {
                overLimitNotice.style.display = 'block';
                overLimitNotice.innerHTML = `※保存ログが <strong>全${totalCount}件</strong> あります。<br>（サイドバーには最新20件を表示中。古いログの確認や出力は上のボタンから移行してください）`;
            } else {
                overLimitNotice.style.display = 'none';
            }
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to update over limit notice:', err);
        }
    }

    // IndexedDBからログを読み込んでサイドバーに復元する関数
    async function restoreLogsFromDB() {
        try {
            const db = await openDB();
            const logs = await getAllLogs(db);

            // 保存日時 (addedAt) で降順ソート（新しい順）
            logs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

            // 最新20件のみサイドバーに表示
            const recentLogs = logs.slice(0, MAX_SIDEBAR_LOGS);

            for (const log of recentLogs) {
                // 復元用のダミー post 要素を作成
                const dummyPost = document.createElement('div');
                dummyPost.id = log.id;

                await addLogToSidebar(dummyPost, true, log.html);
            }
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to restore logs from IndexedDB:', err);
        }
    }

    // 6. イベント登録
    // ログ追加ボタンのクリック検知（イベント委譲）
    document.body.addEventListener('click', async (e) => {
        if (!e.target.classList.contains('saboten-add-log-btn')) return;

        const postEl = e.target.closest('.post');
        if (!postEl) return;

        const originalText = e.target.textContent;
        e.target.textContent = '追加中...';
        e.target.disabled = true;

        // 投稿の上端まで自動スクロール
        postEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        // 描画安定化のための短い待機
        await new Promise(r => setTimeout(r, 120));

        try {
            const result = await addLogToSidebar(postEl);
            await updateOverLimitNotice();

            if (result && result.status === 'already_exists') {
                e.target.textContent = '既に追加されています';
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.disabled = false;
                }, 1500);
            } else {
                e.target.textContent = '追加完了';
                setTimeout(() => {
                    e.target.textContent = originalText;
                    e.target.disabled = false;
                }, 1000);
            }
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to add log:', err);
            e.target.textContent = '失敗';
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.disabled = false;
            }, 1000);
        }
    });

    // 7. ログ整理＆HTML出力モード関連のロジック
    let organizerOverlay = null;
    let allSavedLogs = [];
    let originalSidebarState = false; // 整理画面を開く前のサイドバーの開閉状態
    let organizerLeftDisplayLimit = 20; // 左側パネルの表示件数リミット

    // 複数ログプロジェクト管理
    let logProjects = [
        { id: 'proj_1', name: 'ログ1', items: [] }
    ];
    let currentProjectId = 'proj_1';

    // 現在アクティブなプロジェクトを取得するヘルパー関数
    function getCurrentProject() {
        let proj = logProjects.find(p => p.id === currentProjectId);
        if (!proj) {
            if (logProjects.length === 0) {
                logProjects.push({ id: 'proj_1', name: 'ログ1', items: [] });
            }
            proj = logProjects[0];
            currentProjectId = proj.id;
        }
        return proj;
    }

    // 現在のプロジェクト一覧とアクティブIDをIndexedDBに保存する関数
    async function saveCurrentProjectsToDB() {
        try {
            const db = await openDB();
            await saveProjectsToDB(db, logProjects, currentProjectId);
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to save projects to IndexedDB:', err);
        }
    }

    // 整理画面（オーバーレイ）のDOMを作成
    function createOrganizerOverlay() {
        if (organizerOverlay) return;

        organizerOverlay = document.createElement('div');
        organizerOverlay.id = 'saboten-organizer-overlay';

        // 上部ヘッダー (比率 1)
        const orgHeader = document.createElement('div');
        orgHeader.className = 'saboten-org-header';

        const orgTitle = document.createElement('h2');
        orgTitle.className = 'saboten-org-title';
        orgTitle.textContent = 'SabotennGamesLogGetter - ログ整理＆HTML出力';
        orgHeader.appendChild(orgTitle);

        const orgActions = document.createElement('div');
        orgActions.className = 'saboten-org-actions';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'saboten-org-btn saboten-org-btn-secondary';
        closeBtn.textContent = '閉じる（ログ収集に戻る）';
        closeBtn.addEventListener('click', closeOrganizer);
        orgActions.appendChild(closeBtn);

        orgHeader.appendChild(orgActions);
        organizerOverlay.appendChild(orgHeader);

        // 下部ボディ (比率 4)
        const orgBody = document.createElement('div');
        orgBody.className = 'saboten-org-body';

        // 下部左側パネル (収集済みログ一覧)
        const leftPanel = document.createElement('div');
        leftPanel.className = 'saboten-org-panel saboten-org-panel-left';

        const leftHeader = document.createElement('div');
        leftHeader.className = 'saboten-org-panel-header';
        leftHeader.innerHTML = '<span>収集済みログ一覧</span>';
        leftPanel.appendChild(leftHeader);

        // 左パネル上部のツールバー（全追加ボタン）
        const leftToolbar = document.createElement('div');
        leftToolbar.className = 'saboten-org-left-toolbar';

        const addAllLeftBtn = document.createElement('button');
        addAllLeftBtn.type = 'button';
        addAllLeftBtn.className = 'saboten-org-btn-add-all-left';
        addAllLeftBtn.textContent = 'IDが小さいものから全て出力に追加';
        addAllLeftBtn.addEventListener('click', async () => {
            const currentProj = getCurrentProject();
            const existingIdSet = new Set(currentProj.items.map(it => it.id));
            const availableLogs = allSavedLogs.filter(log => !existingIdSet.has(log.id));
            if (availableLogs.length === 0) {
                alert('追加可能な収集済みログがありません。');
                return;
            }

            const ok = confirm(`収集済みのログ（全${availableLogs.length}件）を、IDが小さい順（古い順）に現在のログ「${currentProj.name}」の出力対象に追加しますか？`);
            if (!ok) return;

            // IDが小さい順（数値昇順）にソートして追加
            const sorted = [...availableLogs].sort((a, b) => {
                const numA = parseInt((a.id || '').replace('post-', ''), 10) || (a.addedAt || 0);
                const numB = parseInt((b.id || '').replace('post-', ''), 10) || (b.addedAt || 0);
                return numA - numB;
            });

            sorted.forEach(log => {
                if (!existingIdSet.has(log.id)) {
                    currentProj.items.push({
                        id: log.id,
                        html: log.html,
                        addedAt: log.addedAt || Date.now()
                    });
                    existingIdSet.add(log.id);
                }
            });
            await saveCurrentProjectsToDB();
            renderOrganizerPanels();
        });

        leftToolbar.appendChild(addAllLeftBtn);
        leftPanel.appendChild(leftToolbar);

        const leftContent = document.createElement('div');
        leftContent.className = 'saboten-org-panel-content';
        leftContent.id = 'saboten-org-left-content';
        leftPanel.appendChild(leftContent);

        // 下部右側パネル (保存・出力対象項目)
        const rightPanel = document.createElement('div');
        rightPanel.className = 'saboten-org-panel saboten-org-panel-right';

        const rightHeader = document.createElement('div');
        rightHeader.className = 'saboten-org-panel-header';
        rightHeader.innerHTML = '<span>出力対象項目（保存項目）</span>';
        rightPanel.appendChild(rightHeader);

        // 右パネル上部の操作パネル
        const controlPanel = document.createElement('div');
        controlPanel.className = 'saboten-org-control-panel';

        // 上段：プルダウン ＋ 新規ログ作成ボタン ＋ 現在のログを削除ボタン
        const row1 = document.createElement('div');
        row1.className = 'saboten-org-control-row';

        const projSelect = document.createElement('select');
        projSelect.id = 'saboten-org-project-select';
        projSelect.className = 'saboten-org-select';
        projSelect.addEventListener('change', async () => {
            currentProjectId = projSelect.value;
            await saveCurrentProjectsToDB();
            renderOrganizerPanels();
        });

        const newProjBtn = document.createElement('button');
        newProjBtn.type = 'button';
        newProjBtn.className = 'saboten-org-btn-new-proj';
        newProjBtn.textContent = '新規ログ作成';
        newProjBtn.addEventListener('click', async () => {
            const newId = 'proj_' + Date.now();
            logProjects.push({
                id: newId,
                name: '新規ログ',
                items: []
            });
            currentProjectId = newId;
            await saveCurrentProjectsToDB();
            renderOrganizerPanels();
        });

        const deleteProjBtn = document.createElement('button');
        deleteProjBtn.type = 'button';
        deleteProjBtn.className = 'saboten-org-btn-delete-proj';
        deleteProjBtn.textContent = 'このログを削除';
        deleteProjBtn.addEventListener('click', async () => {
            const currentProj = getCurrentProject();
            const ok = confirm(`現在選択中のログ「${currentProj.name}」（全${currentProj.items.length}件）の編集データを削除しますか？\n\n※収集済みのログ本体（IndexedDBおよびサイドバー）は削除されません。`);
            if (!ok) return;

            logProjects = logProjects.filter(p => p.id !== currentProj.id);
            if (logProjects.length === 0) {
                logProjects = [{ id: 'proj_' + Date.now(), name: 'ログ1', items: [] }];
            }
            currentProjectId = logProjects[0].id;
            await saveCurrentProjectsToDB();
            renderOrganizerPanels();
        });

        row1.appendChild(projSelect);
        row1.appendChild(newProjBtn);
        row1.appendChild(deleteProjBtn);

        // 下段：名称入力欄 ＋ 名前を保存ボタン ＋ HTMLとしてダウンロードボタン
        const row2 = document.createElement('div');
        row2.className = 'saboten-org-control-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'saboten-org-project-name-input';
        nameInput.className = 'saboten-org-input';
        nameInput.placeholder = 'ログ名称';

        const saveNameBtn = document.createElement('button');
        saveNameBtn.type = 'button';
        saveNameBtn.className = 'saboten-org-btn-save-name';
        saveNameBtn.textContent = '名前を保存';
        saveNameBtn.addEventListener('click', async () => {
            const currentProj = getCurrentProject();
            const newName = nameInput.value.trim();
            if (newName) {
                currentProj.name = newName;
                await saveCurrentProjectsToDB();
                renderOrganizerPanels();
                saveNameBtn.textContent = '保存完了';
                setTimeout(() => {
                    saveNameBtn.textContent = '名前を保存';
                }, 1000);
            }
        });

        const downloadBtn = document.createElement('button');
        downloadBtn.type = 'button';
        downloadBtn.className = 'saboten-org-btn-download-panel';
        downloadBtn.textContent = 'HTMLとしてダウンロード';
        downloadBtn.addEventListener('click', exportToHTML);

        row2.appendChild(nameInput);
        row2.appendChild(saveNameBtn);
        row2.appendChild(downloadBtn);

        controlPanel.appendChild(row1);
        controlPanel.appendChild(row2);
        rightPanel.appendChild(controlPanel);

        const rightContent = document.createElement('div');
        rightContent.className = 'saboten-org-panel-content';
        rightContent.id = 'saboten-org-right-content';
        rightPanel.appendChild(rightContent);

        orgBody.appendChild(leftPanel);
        orgBody.appendChild(rightPanel);
        organizerOverlay.appendChild(orgBody);

        document.body.appendChild(organizerOverlay);
    }

    // 整理画面を開く
    async function openOrganizer() {
        createOrganizerOverlay();

        // 現在のサイドバーの状態を記録して閉じる（一時的なので保存フラグはfalse）
        originalSidebarState = isCollapsed;
        if (!isCollapsed) {
            applySidebarState(true, false);
        }

        // トグルボタンを隠す (整理画面の裏に隠れるが、念のため非表示にする)
        toggleBtn.style.display = 'none';

        // 表示リミットを初期値（20件）にリセット
        organizerLeftDisplayLimit = 20;

        // IndexedDBから最新のログデータとプロジェクト状態を読み込む
        try {
            const db = await openDB();
            allSavedLogs = await getAllLogs(db);
            // 新着順（降順: 新しいものが上）にソート
            allSavedLogs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));

            // プロジェクト状態の復元
            const savedState = await loadProjectsFromDB(db);
            if (savedState && savedState.projects && savedState.projects.length > 0) {
                // 旧形式データのHTML補完マイグレーション
                const logMap = new Map(allSavedLogs.map(l => [l.id, l]));
                logProjects = savedState.projects.map(p => {
                    const validItems = (p.items || []).map(it => {
                        if (!it.html && logMap.has(it.id)) {
                            return { id: it.id, html: logMap.get(it.id).html, addedAt: it.addedAt || logMap.get(it.id).addedAt };
                        }
                        return it;
                    });
                    return {
                        id: p.id,
                        name: p.name,
                        items: validItems
                    };
                });
                currentProjectId = savedState.activeProjectId;
            } else if (!logProjects || logProjects.length === 0) {
                logProjects = [{ id: 'proj_1', name: 'ログ1', items: [] }];
                currentProjectId = 'proj_1';
            }
        } catch (err) {
            console.error('[SabotennLogGetter] Failed to load logs/projects for organizer:', err);
            allSavedLogs = [];
        }

        // 整理画面を表示
        organizerOverlay.classList.add('active');

        // パネルを描画
        renderOrganizerPanels();
    }

    // 整理画面を閉じる
    function closeOrganizer() {
        if (!organizerOverlay) return;
        organizerOverlay.classList.remove('active');

        // トグルボタンを表示に戻す
        toggleBtn.style.display = 'flex';

        // サイドバーを元の開閉状態に戻す（一時的な復元なので保存フラグはfalse）
        applySidebarState(originalSidebarState, false);
    }

    // パネルのレンダリング
    function renderOrganizerPanels() {
        const leftContent = document.getElementById('saboten-org-left-content');
        const rightContent = document.getElementById('saboten-org-right-content');
        const projSelect = document.getElementById('saboten-org-project-select');
        const nameInput = document.getElementById('saboten-org-project-name-input');

        if (!leftContent || !rightContent) return;

        const currentProj = getCurrentProject();
        const existingIdSet = new Set(currentProj.items.map(it => it.id));

        // 1. 操作パネルのUI同期
        if (projSelect) {
            projSelect.innerHTML = '';
            logProjects.forEach(proj => {
                const opt = document.createElement('option');
                opt.value = proj.id;
                opt.textContent = `${proj.name} (${proj.items.length}件)`;
                if (proj.id === currentProj.id) {
                    opt.selected = true;
                }
                projSelect.appendChild(opt);
            });
        }

        if (nameInput) {
            nameInput.value = currentProj.name;
        }

        leftContent.innerHTML = '';
        rightContent.innerHTML = '';

        // 2. 未選択ログ（左側候補: 現在のプロジェクトに含まれていないもの）の抽出
        const availableLogs = allSavedLogs.filter(log => !existingIdSet.has(log.id));
        const logsToDisplay = availableLogs.slice(0, organizerLeftDisplayLimit);

        // 左側パネルの描画
        logsToDisplay.forEach(log => {
            const card = document.createElement('div');
            card.className = 'saboten-org-item-card';

            const postContainer = document.createElement('div');
            postContainer.className = 'post';
            postContainer.innerHTML = log.html;

            const moveBtn = document.createElement('button');
            moveBtn.type = 'button';
            moveBtn.className = 'saboten-org-action-btn saboten-org-btn-move';
            moveBtn.textContent = '保存項目に移行';
            moveBtn.addEventListener('click', async () => {
                if (!currentProj.items.some(it => it.id === log.id)) {
                    currentProj.items.push({
                        id: log.id,
                        html: log.html,
                        addedAt: log.addedAt || Date.now()
                    });
                }
                await saveCurrentProjectsToDB();
                renderOrganizerPanels();
            });

            card.appendChild(postContainer);
            card.appendChild(moveBtn);
            leftContent.appendChild(card);
        });

        // 20件以上ある場合、「さらに20件を読み込む」ボタンを追加
        if (availableLogs.length > organizerLeftDisplayLimit) {
            const remainingCount = availableLogs.length - organizerLeftDisplayLimit;
            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.type = 'button';
            loadMoreBtn.className = 'saboten-org-load-more-btn';
            loadMoreBtn.textContent = `さらに20件を読み込む (残り ${remainingCount} 件)`;
            loadMoreBtn.addEventListener('click', () => {
                organizerLeftDisplayLimit += 20;
                renderOrganizerPanels();
            });
            leftContent.appendChild(loadMoreBtn);
        }

        // 3. 選択済みログ（右側保存項目: プロジェクト独立データから描画）
        currentProj.items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'saboten-org-item-card';

            const postContainer = document.createElement('div');
            postContainer.className = 'post';
            postContainer.innerHTML = item.html;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'saboten-org-card-btn-group';

            // 「上に1つ移動」ボタン
            const moveUpBtn = document.createElement('button');
            moveUpBtn.type = 'button';
            moveUpBtn.className = 'saboten-org-btn-order';
            moveUpBtn.textContent = '▲ 上に1つ移動';
            moveUpBtn.disabled = (index === 0);
            moveUpBtn.addEventListener('click', async () => {
                if (index > 0) {
                    const temp = currentProj.items[index];
                    currentProj.items[index] = currentProj.items[index - 1];
                    currentProj.items[index - 1] = temp;
                    await saveCurrentProjectsToDB();
                    renderOrganizerPanels();
                }
            });

            // 「下に1つ移動」ボタン
            const moveDownBtn = document.createElement('button');
            moveDownBtn.type = 'button';
            moveDownBtn.className = 'saboten-org-btn-order';
            moveDownBtn.textContent = '▼ 下に1つ移動';
            moveDownBtn.disabled = (index === currentProj.items.length - 1);
            moveDownBtn.addEventListener('click', async () => {
                if (index < currentProj.items.length - 1) {
                    const temp = currentProj.items[index];
                    currentProj.items[index] = currentProj.items[index + 1];
                    currentProj.items[index + 1] = temp;
                    await saveCurrentProjectsToDB();
                    renderOrganizerPanels();
                }
            });

            // 「この項目を削除」ボタン
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'saboten-org-action-btn saboten-org-btn-delete';
            deleteBtn.textContent = 'この項目を削除';
            deleteBtn.addEventListener('click', async () => {
                currentProj.items.splice(index, 1);
                await saveCurrentProjectsToDB();
                renderOrganizerPanels();
            });

            btnGroup.appendChild(moveUpBtn);
            btnGroup.appendChild(moveDownBtn);
            btnGroup.appendChild(deleteBtn);

            card.appendChild(postContainer);
            card.appendChild(btnGroup);
            rightContent.appendChild(card);
        });

        // パネルヘッダーのカウント更新
        const leftHeader = document.querySelector('.saboten-org-panel-left .saboten-org-panel-header span');
        const rightHeader = document.querySelector('.saboten-org-panel-right .saboten-org-panel-header span');
        if (leftHeader) {
            leftHeader.textContent = `収集済みログ一覧 (${logsToDisplay.length} / ${availableLogs.length} 件)`;
        }
        if (rightHeader) {
            rightHeader.textContent = `出力対象項目（${currentProj.name}） (${currentProj.items.length} 件)`;
        }
    }

    // HTMLとして出力
    function exportToHTML() {
        const currentProj = getCurrentProject();

        if (currentProj.items.length === 0) {
            alert(`出力対象項目（${currentProj.name}）が空です。左側から項目を選択してください。`);
            return;
        }

        // プロジェクト内の独立した items データをそのまま使用
        const exportLogs = currentProj.items;

        // チャットを再現するための埋め込みCSS
        const embeddedStyles = `
            body {
                background: radial-gradient(circle at center, rgb(211, 207, 200) 0%, rgb(95, 83, 76) 100%);
                background-attachment: fixed;
                min-height: 100vh;
                color: #e0f7ff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 40px 20px;
                display: flex;
                justify-content: center;
                box-sizing: border-box;
            }
            .log-title {
                color: #87cefa;
                font-size: 1.5em;
                font-weight: bold;
                text-align: center;
                margin: 0 0 10px 0;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                letter-spacing: 0.05em;
                word-break: break-word;
            }
            .log-container {
                width: 100%;
                max-width: 800px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                gap: 20px;
                box-sizing: border-box;
            }
            .post {
                display: flex;
                gap: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                word-wrap: break-word;
                color: #e0f7ff;
            }
            .post img.icon {
                width: 48px;
                height: 48px;
                object-fit: cover;
                flex-shrink: 0;
                border-radius: 4px;
            }
            .post-content-area {
                flex-grow: 1;
            }
            .post strong {
                color: #FFD700;
                font-size: 1.0em;
                margin-right: 10px;
            }
            .post strong a {
                color: #FFD700;
                text-decoration: none;
            }
            .post em {
                color: #aaaaaa;
                font-size: 0.8em;
                font-style: normal;
            }
            .post-body {
                margin-top: 2px;
                font-size: 0.95em;
                line-height: 1.35;
                word-break: break-word;
                overflow-wrap: break-word;
                color: #e0f7ff;
            }
            .post-body img {
                max-width: 100%;
            }
            .reply-to {
                margin: 2px 0 4px 0;
                font-size: 0.85em;
            }
            .reply-to span.reply-to-text {
                color: #87cefa;
                font-size: 0.85em;
                text-decoration: none;
                display: inline-block;
                margin-right: 6px;
            }
            .saboten-reply-quote {
                background: rgba(0, 0, 0, 0.4);
                border-left: 3px solid #87cefa;
                border-radius: 4px;
                padding: 5px 8px;
                margin: 4px 0 6px 0;
                font-size: 0.68em;
                color: #cccccc;
                box-sizing: border-box;
            }
            .saboten-reply-quote-header {
                margin-bottom: 2px;
                display: flex;
                gap: 6px;
                align-items: baseline;
                flex-wrap: wrap;
            }
            .saboten-reply-quote-header strong {
                color: #FFD700 !important;
                font-size: 0.95em;
                margin-right: 0 !important;
            }
            .saboten-reply-quote-header em {
                color: #aaaaaa !important;
                font-size: 0.85em;
                font-style: normal;
            }
            .saboten-reply-quote-body {
                color: #e0e0e0;
                line-height: 1.35;
                word-break: break-word;
                white-space: pre-wrap;
            }
        `;

        // 特殊文字エスケープヘルパー
        const escapedProjName = currentProj.name
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // 各ログ項目から不要なボタン等を除外したピュアなHTMLを結合
        let logsHtml = '';
        exportLogs.forEach(log => {
            const tempDiv = document.createElement('div');
            tempDiv.className = 'post';
            tempDiv.id = log.id;
            tempDiv.innerHTML = log.html;
            logsHtml += tempDiv.outerHTML + '\n';
        });

        const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>SabotennGames ログ出力結果 - ${escapedProjName}</title>
    <style>
        ${embeddedStyles}
    </style>
</head>
<body>
    <div class="log-container">
        <h1 class="log-title">${escapedProjName}</h1>
        ${logsHtml}
    </div>
</body>
</html>`;

        // Blobの作成とダウンロード実行
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        // ファイル名に現在の日時とログ名を付与
        const now = new Date();
        const dateString = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        // ファイル名に使用できない記号を除去
        const safeProjName = currentProj.name.replace(/[\\/:*?"<>|]/g, '_');
        link.href = url;
        link.setAttribute('download', `sabotenn_logs_${safeProjName}_${dateString}.html`);

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // ダウンロード完了後の削除確認ダイアログ
        setTimeout(async () => {
            const targetIds = currentProj.items.map(it => it.id);
            const count = targetIds.length;

            // 1. 収集済みログ一覧（本体）からの削除確認
            const okDeleteLogs = confirm(`「${currentProj.name}」としてダウンロードしたログ（全${count}件）を、収集済みログ一覧から削除しますか？\n\n※OKを押すと、IndexedDBおよびサイドバーから該当ログが削除されます。`);

            if (okDeleteLogs) {
                try {
                    const db = await openDB();
                    // IndexedDBから削除
                    for (const id of targetIds) {
                        await deleteLog(db, id);
                    }
                    // サイドバーDOMから削除
                    targetIds.forEach(id => {
                        const el = content.querySelector(`.saboten-sidebar-log-wrapper[data-post-id="${id}"]`);
                        if (el) el.remove();
                    });
                    updatePlaceholderVisibility();
                    await updateOverLimitNotice();

                    // 最新ログを再読み込み
                    allSavedLogs = await getAllLogs(db);
                    allSavedLogs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
                } catch (err) {
                    console.error('[SabotennLogGetter] Failed to delete exported logs:', err);
                    alert('ログの削除中にエラーが発生しました。');
                }
            }

            // 2. 当該ログの編集データ（プロジェクト枠）の削除確認
            const okDeleteProj = confirm(`現在編集中のログ「${currentProj.name}」の編集データ（プロジェクト枠）も削除しますか？\n\n※OKを押すと、プルダウンの選択肢からこのログが削除されます。`);

            if (okDeleteProj) {
                logProjects = logProjects.filter(p => p.id !== currentProj.id);
                if (logProjects.length === 0) {
                    logProjects = [{ id: 'proj_' + Date.now(), name: 'ログ1', items: [] }];
                }
                currentProjectId = logProjects[0].id;
            }

            // 状態をIndexedDBに保存して再描画
            await saveCurrentProjectsToDB();
            renderOrganizerPanels();
        }, 300);
    }

    // ドキュメントに追加
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);

    // 初期化実行
    async function init() {
        initLogButtons();
        observeNewPosts();
        applySidebarState(isCollapsed, false);
        await restoreLogsFromDB();
        await updateOverLimitNotice();
    }
    init();
})();
