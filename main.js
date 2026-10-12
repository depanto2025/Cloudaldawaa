import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { storageManager, getOrCreateDeviceId, THREE_DAYS_MS, getRetentionSettings, saveRetentionSettings } from './storage.js';

// Multilingual Dictionary (Arabic & English)
const TRANSLATIONS = {
  ar: {
    appTitle: 'سحاب دوكس',
    badgeStorage: 'سوبر بيز',
    appSubtitle: 'نظام رفع المستندات والتأمين الذكي والمؤقت',
    tabClient: 'واجهة العميل',
    tabDashboard: 'الداشبورد (الإدارة)',
    btnClientBarcode: 'باركود العميل',
    retentionTitle: 'التحكم في فترة حفظ الملفات حسب النوع:',
    retentionDesc: 'حدد عدد أيام بقاء الصور والـ PDF قبل الحذف التلقائي من السيرفر',
    labelDaysImages: 'مدة الصور (أيام):',
    labelDaysPdf: 'مدة الـ PDF (أيام):',
    btnSaveRetention: 'تطبيق المدة',
    retentionSaved: 'تم تحديث فترات الحفظ بنجاح!',
    dropTitle: 'اسحب وأفلت الملفات هنا، أو اضغط للاختيار',
    dropSubtitle: 'ندعم صور التأمين والبطاقات (JPG, PNG) والمستندات (PDF)',
    btnBrowseFiles: 'اختيار ملفات من الجهاز',
    btnTriggerCamera: 'تصوير مباشر بالكاميرا',
    uploading: 'جاري رفع الملفات...',
    clientSectionTitle: 'المستندات التي قمت برفعها',
    clientSectionDesc: 'هذه الملفات محفوظة حالياً في السيرفر وتُحذف تلقائياً بعد 3 أيام من تاريخ رفعها.',
    emptyClientTitle: 'لم تقم برفع أي ملفات حتى الآن',
    emptyClientDesc: 'قم بسحب ملفات التأمين أو الهوية أو الضغط على زر الاختيار أعلاه لرفعها فوراً.',
    statTotalFilesLabel: 'إجمالي الملفات (آخر 3 أيام)',
    statTotalFilesHint: 'الملفات النشطة المرفوعة',
    statDevicesLabel: 'الأجهزة والعملاء المتصلين',
    statDevicesHint: 'معرّفات أجهزة فريدة بدون لوجن',
    statSizeLabel: 'إجمالي حجم البيانات',
    statSizeHint: 'مساحة التخزين المستهلكة',
    statExpiringLabel: 'تنتهي خلال 24 ساعة',
    statExpiringHint: 'سيتم حذفها تلقائياً قريباً',
    searchPlaceholder: 'بحث باسم الملف، اسم العميل، أو معرف الجهاز...',
    filterAllTypes: 'جميع أنواع الملفات',
    filterImagesOnly: 'الصور فقط (JPG, PNG)',
    filterPdfOnly: 'المستندات (PDF)',
    sortNewest: 'الأحدث رفعاً',
    sortOldest: 'الأقدم رفعاً',
    sortExpiry: 'الأقرب للحذف التلقائي',
    btnRefresh: 'تحديث',
    btnCleanExpired: 'حذف المنتهية (+3 أيام)',
    tableHeaderTitle: 'سجل المستندات المرفوعة',
    ttlNotice: 'النظام يحذف أي ملف يمر عليه 3 أيام (72 ساعة) تلقائياً',
    thPreview: 'معاينة الملف',
    thFileName: 'اسم المستند والنوع',
    thDevice: 'معرّف الجهاز والعميل',
    thUploadTime: 'تاريخ ووقت الرفع',
    thRemaining: 'الوقت المتبقي للحذف',
    thFileSize: 'حجم الملف',
    thActions: 'الإجراءات',
    adminEmptyTitle: 'لا توجد ملفات مرفوعة حالياً مطابقة للبحث',
    adminEmptyDesc: 'عندما يقوم العملاء بمسح الباركود ورفع المستندات، ستظهر جميعها هنا مع العداد التنازلي.',
    footerCopy: 'سحاب دوكس © 2026 - نظام الرفع السريع لشركات التأمين والخدمات',
    footerTtl: 'صلاحية المستندات: 3 أيام (72 ساعة)',
    footerSqlLink: 'كود إعداد Supabase SQL ⚡',
    qrModalTitle: 'باركود استقبال العملاء (QR Code)',
    qrStandService: 'خدمة العملاء الذكية',
    qrStandTitle: 'امسح الباركود لرفع مستنداتك وأوراق التأمين',
    qrStandSubtitle: 'لا حاجة لتسجيل الدخول • مباشر وآمن من هاتفك',
    qrStep1: 'وجّه كاميرا هاتفك نحو الباركود وافتح الرابط',
    qrStep2: 'التقط صورة للوثيقة أو ارفع ملفات الـ PDF',
    qrStep3: 'تصلنا المستندات فوراً وتُحفظ بأمان لمدة 3 أيام',
    btnPrintStand: 'طباعة ستاند الاستقبال',
    btnDownloadQr: 'تحميل الـ QR كصورة',
    btnCopyUrl: 'نسخ رابط العميل',
    previewTitle: 'معاينة الملف',
    btnDownloadFile: 'تحميل الملف إلى جهازك',
    settingsModalTitle: 'إعدادات ربط Supabase والتخزين السحابي',
    tabApiKeys: 'مفاتيح الربط (API Keys)',
    tabSqlCode: 'كود SQL الجاهز (3 أيام TTL)',
    settingsDesc: 'التطبيق يعمل حالياً بوضع التخزين المؤقت المحلي. لربطه بقاعدة بيانات Supabase الخاصة بك وحفظ الملفات في Supabase Storage، ضع بيانات مشروعك هنا:',
    sqlDesc: 'انسخ هذا الكود وضعه في SQL Editor داخل لوحة تحكم Supabase الخاصة بك لإنشاء الجدول، التخزين، والحذف الآلي بعد 3 أيام:',
    btnSaveConfig: 'حفظ وتفعيل الربط',
    btnResetDemo: 'الرجوع لوضع التجربة المحلي',
    btnCopyCode: 'نسخ الكود',
    btnPreview: 'معاينة',
    btnDelete: 'حذف',
    imageType: 'صورة',
    pdfType: 'مستند PDF',
    unnamedClient: 'بدون اسم',
    deleteConfirm: 'هل أنت متأكد من حذف المستند: ',
    deleteSuccess: 'تم حذف المستند بنجاح',
    uploadSuccess: 'تم رفع المستندات بنجاح وحفظها لمدة 72 ساعة!',
    copied: 'تم النسخ بنجاح! ✓',
    expiredText: 'منتهي الصلاحية'
  },
  en: {
    appTitle: 'Cloud Docs',
    badgeStorage: 'Supabase',
    appSubtitle: 'Smart Temporary Document & Insurance Upload Portal',
    tabClient: 'Client Portal',
    tabDashboard: 'Admin Dashboard',
    btnClientBarcode: 'Client QR Code',
    retentionTitle: 'File Retention Period by Type:',
    retentionDesc: 'Define how many days images and PDFs stay before automatic purge',
    labelDaysImages: 'Images Duration (Days):',
    labelDaysPdf: 'PDF Duration (Days):',
    btnSaveRetention: 'Apply Duration',
    retentionSaved: 'Retention periods updated successfully!',
    dropTitle: 'Drag & drop files here, or click to browse',
    dropSubtitle: 'Supports insurance cards, photos (JPG, PNG) and documents (PDF)',
    btnBrowseFiles: 'Browse Files from Device',
    btnTriggerCamera: 'Take Live Photo (Camera)',
    uploading: 'Uploading files...',
    clientSectionTitle: 'Documents You Have Uploaded',
    clientSectionDesc: 'These files are securely saved on the server and will be automatically purged after 3 days.',
    emptyClientTitle: 'No documents uploaded yet',
    emptyClientDesc: 'Drag insurance papers, IDs, or tap the browse button above to upload immediately.',
    statTotalFilesLabel: 'Total Files (Last 3 Days)',
    statTotalFilesHint: 'Active uploaded documents',
    statDevicesLabel: 'Connected Devices & Clients',
    statDevicesHint: 'Unique device fingerprints (no login)',
    statSizeLabel: 'Total Storage Consumed',
    statSizeHint: 'Cloud space occupied',
    statExpiringLabel: 'Expiring within 24 Hours',
    statExpiringHint: 'Scheduled for automatic purge soon',
    searchPlaceholder: 'Search by file name, client name, or device ID...',
    filterAllTypes: 'All File Types',
    filterImagesOnly: 'Images Only (JPG, PNG)',
    filterPdfOnly: 'Documents Only (PDF)',
    sortNewest: 'Newest First',
    sortOldest: 'Oldest First',
    sortExpiry: 'Closest to Expiry',
    btnRefresh: 'Refresh',
    btnCleanExpired: 'Purge Expired (+3 Days)',
    tableHeaderTitle: 'Uploaded Documents Registry',
    ttlNotice: 'Files older than 3 days (72 hours) are auto-deleted',
    thPreview: 'Preview',
    thFileName: 'Document Name & Type',
    thDevice: 'Device & Client ID',
    thUploadTime: 'Upload Date & Time',
    thRemaining: 'Time until Auto-Deletion',
    thFileSize: 'File Size',
    thActions: 'Actions',
    adminEmptyTitle: 'No uploaded documents matching your filter',
    adminEmptyDesc: 'Once customers scan the QR code and submit documents, they will appear here with live countdowns.',
    footerCopy: 'Cloud Docs © 2026 - Fast Document Dispatch System',
    footerTtl: 'Document Retention: 3 Days (72 Hours)',
    footerSqlLink: 'Supabase SQL Setup Code ⚡',
    qrModalTitle: 'Customer Reception QR Code',
    qrStandService: 'Smart Customer Service',
    qrStandTitle: 'Scan QR Code to Upload Insurance & Documents',
    qrStandSubtitle: 'No login required • Instant & secure from your smartphone',
    qrStep1: 'Point your phone camera at the QR code and tap link',
    qrStep2: 'Snap a photo of your document or upload PDF',
    qrStep3: 'Files arrive instantly and are securely retained for 3 days',
    btnPrintStand: 'Print Reception Stand Card',
    btnDownloadQr: 'Download QR Image',
    btnCopyUrl: 'Copy Client Link',
    previewTitle: 'File Preview',
    btnDownloadFile: 'Download to Device',
    settingsModalTitle: 'Supabase Cloud Storage Settings',
    tabApiKeys: 'API Credentials',
    tabSqlCode: 'SQL Schema (3-Day TTL)',
    settingsDesc: 'Currently in local mock storage mode. To link your Supabase project and store files in Supabase Storage, enter your project details here:',
    sqlDesc: 'Copy this code into Supabase SQL Editor to create table, storage bucket, and automated 3-day cleanup:',
    btnSaveConfig: 'Save & Connect Supabase',
    btnResetDemo: 'Reset to Local Demo',
    btnCopyCode: 'Copy SQL',
    btnPreview: 'Preview',
    btnDelete: 'Delete',
    imageType: 'Image',
    pdfType: 'PDF Document',
    unnamedClient: 'No Name Specified',
    deleteConfirm: 'Are you sure you want to delete file: ',
    deleteSuccess: 'File deleted successfully',
    uploadSuccess: 'Documents uploaded successfully and stored for 72 hours!',
    copied: 'Copied to clipboard! ✓',
    expiredText: 'Expired'
  }
};

let currentLang = localStorage.getItem('cloud_doc_lang') || 'ar';

// DOM Element Selectors
const DOM = {
  // Navigation & Language
  btnToggleLang: document.getElementById('btn-toggle-lang'),
  langCurrentLabel: document.getElementById('lang-current-label'),
  tabClient: document.getElementById('tab-client'),
  tabDashboard: document.getElementById('tab-dashboard'),
  badgeTotalFilesNav: document.getElementById('badge-total-files-nav'),
  viewClient: document.getElementById('view-client'),
  viewDashboard: document.getElementById('view-dashboard'),
  
  // Storage Banner
  storageStatusBar: document.getElementById('storage-status-bar'),
  storageStatusText: document.getElementById('storage-status-text'),
  btnQuickConfig: document.getElementById('btn-quick-config'),
  
  // Client Portal
  clientDeviceId: document.getElementById('client-device-id'),
  inputClientName: document.getElementById('input-client-name'),
  dropArea: document.getElementById('drop-area'),
  fileInputMultiple: document.getElementById('file-input-multiple'),
  fileInputCamera: document.getElementById('file-input-camera'),
  btnBrowseFiles: document.getElementById('btn-browse-files'),
  btnTriggerCamera: document.getElementById('btn-trigger-camera'),
  uploadProgressContainer: document.getElementById('upload-progress-container'),
  progressFilename: document.getElementById('progress-filename'),
  progressPercent: document.getElementById('progress-percent'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  clientFilesCount: document.getElementById('client-files-count'),
  clientFilesList: document.getElementById('client-files-list'),

  // Admin Dashboard
  statTotalFiles: document.getElementById('stat-total-files'),
  statTotalDevices: document.getElementById('stat-total-devices'),
  statTotalSize: document.getElementById('stat-total-size'),
  statExpiringSoon: document.getElementById('stat-expiring-soon'),
  adminSearchInput: document.getElementById('admin-search-input'),
  adminFilterType: document.getElementById('admin-filter-type'),
  adminSortBy: document.getElementById('admin-sort-by'),
  btnRefreshDashboard: document.getElementById('btn-refresh-dashboard'),
  btnCleanExpired: document.getElementById('btn-clean-expired'),
  adminTableBody: document.getElementById('admin-table-body'),
  adminEmptyState: document.getElementById('admin-empty-state'),
  filteredFilesCount: document.getElementById('filtered-files-count'),
  inputRetentionImage: document.getElementById('input-retention-image'),
  inputRetentionPdf: document.getElementById('input-retention-pdf'),
  btnSaveRetention: document.getElementById('btn-save-retention'),

  // Modals & Triggers
  btnShowQr: document.getElementById('btn-show-qr'),
  modalQr: document.getElementById('modal-qr'),
  btnCloseQrModal: document.getElementById('btn-close-qr-modal'),
  qrCanvasContainer: document.getElementById('qr-code-canvas-container'),
  qrTargetUrlLabel: document.getElementById('qr-target-url-label'),
  btnPrintQr: document.getElementById('btn-print-qr'),
  btnDownloadQr: document.getElementById('btn-download-qr'),
  btnCopyUrl: document.getElementById('btn-copy-url'),
  copyUrlBtnText: document.getElementById('copy-url-btn-text'),

  // Preview Modal
  modalPreview: document.getElementById('modal-preview'),
  btnClosePreview: document.getElementById('btn-close-preview'),
  previewFilename: document.getElementById('preview-filename'),
  previewFilemeta: document.getElementById('preview-filemeta'),
  previewContentBox: document.getElementById('preview-content-box'),
  btnDownloadPreview: document.getElementById('btn-download-preview'),

  // Settings Modal
  btnSettings: document.getElementById('btn-settings'),
  btnShowSchemaLink: document.getElementById('btn-show-schema-link'),
  modalSettings: document.getElementById('modal-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  tabSubKeys: document.getElementById('tab-sub-keys'),
  tabSubSql: document.getElementById('tab-sub-sql'),
  panelSubKeys: document.getElementById('panel-sub-keys'),
  panelSubSql: document.getElementById('panel-sub-sql'),
  inputSupabaseUrl: document.getElementById('input-supabase-url'),
  inputSupabaseAnon: document.getElementById('input-supabase-anon'),
  inputSupabaseBucket: document.getElementById('input-supabase-bucket'),
  btnSaveSupabaseConfig: document.getElementById('btn-save-supabase-config'),
  btnResetToDemo: document.getElementById('btn-reset-to-demo'),
  btnCopySql: document.getElementById('btn-copy-sql'),
  sqlSchemaCode: document.getElementById('sql-schema-code'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// Global State
let currentClientFiles = [];
let allAdminFiles = [];
let qrDataUrl = '';

// Helper: Translate text
function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

// Apply Language
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('cloud_doc_lang', lang);

  const html = document.documentElement;
  if (lang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    DOM.langCurrentLabel.textContent = 'العربية';
  } else {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    DOM.langCurrentLabel.textContent = 'English';
  }

  // Translate all [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (TRANSLATIONS[lang][key]) {
      el.textContent = TRANSLATIONS[lang][key];
    }
  });

  // Translate placeholders [data-i18n-placeholder]
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (TRANSLATIONS[lang][key]) {
      el.placeholder = TRANSLATIONS[lang][key];
    }
  });

  // Re-render dynamic components
  refreshClientFiles();
  refreshAdminDashboard();
}

// Toggle Language
function toggleLanguage() {
  const next = currentLang === 'ar' ? 'en' : 'ar';
  applyLanguage(next);
}

// Helper: Show Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('dir', 'auto');
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Format Bytes to Human Readable
function formatFileSize(bytes) {
  if (bytes === 0) return currentLang === 'ar' ? '0 بايت' : '0 Bytes';
  const k = 1024;
  const sizes = currentLang === 'ar'
    ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    : ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper: Format Arabic/English Date & Time
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const locale = currentLang === 'ar' ? 'ar-EG' : 'en-US';
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper: Format Remaining Time for 3-Day Expiry
function formatRemainingTime(expiresAt) {
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { text: t('expiredText'), isUrgent: true, isExpired: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (currentLang === 'ar') {
    if (days > 0) {
      return {
        text: `متبقي ${days} يوم و ${remainingHours} س`,
        isUrgent: days < 1,
        isExpired: false
      };
    } else {
      return {
        text: `متبقي ${remainingHours} ساعة فقط`,
        isUrgent: true,
        isExpired: false
      };
    }
  } else {
    if (days > 0) {
      return {
        text: `${days}d ${remainingHours}h remaining`,
        isUrgent: days < 1,
        isExpired: false
      };
    } else {
      return {
        text: `${remainingHours}h remaining`,
        isUrgent: true,
        isExpired: false
      };
    }
  }
}

// ==========================================================================
// Initialization
// ==========================================================================
async function initApp() {
  // Seed demo data if local storage is blank
  storageManager.seedDemoDataIfEmpty();

  // Display Device ID (if present in DOM)
  const deviceId = getOrCreateDeviceId();
  if (DOM.clientDeviceId) {
    DOM.clientDeviceId.textContent = deviceId;
  }

  // Populate retention inputs
  const retention = getRetentionSettings();
  if (DOM.inputRetentionImage) {
    DOM.inputRetentionImage.value = retention.image || 3;
  }
  if (DOM.inputRetentionPdf) {
    DOM.inputRetentionPdf.value = retention.pdf || 3;
  }

  // Check URL parameters for navigation mode (?mode=admin vs ?mode=client)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  if (mode === 'admin') {
    // ADMIN MODE: Show admin tools and dashboard
    document.body.classList.remove('mode-client');
    document.body.classList.add('mode-admin');
    switchView('dashboard');
  } else {
    // CLIENT MODE (Default): Pure client upload, completely free of admin UI
    document.body.classList.remove('mode-admin');
    document.body.classList.add('mode-client');
    switchView('client');
  }

  // Apply default language
  applyLanguage(currentLang);

  // Update Status Banner
  updateStorageStatusBanner();

  // Load Client and Admin Data
  await refreshClientFiles();
  await refreshAdminDashboard();

  // Setup QR Stand Data
  setupQrCode();

  // Attach Event Listeners
  attachEventListeners();
}

// Switch between Views
function switchView(target) {
  if (target === 'client') {
    DOM.tabClient.classList.add('active');
    DOM.tabClient.setAttribute('aria-selected', 'true');
    DOM.tabDashboard.classList.remove('active');
    DOM.tabDashboard.setAttribute('aria-selected', 'false');
    DOM.viewClient.classList.add('active');
    DOM.viewDashboard.classList.remove('active');
  } else {
    DOM.tabDashboard.classList.add('active');
    DOM.tabDashboard.setAttribute('aria-selected', 'true');
    DOM.tabClient.classList.remove('active');
    DOM.tabClient.setAttribute('aria-selected', 'false');
    DOM.viewDashboard.classList.add('active');
    DOM.viewClient.classList.remove('active');
    refreshAdminDashboard();
  }
}

// Update Storage Status Banner
function updateStorageStatusBanner() {
  const config = storageManager.getSupabaseConfig();
  if (config.isConfigured) {
    DOM.storageStatusBar.className = 'status-banner supabase-mode admin-only';
    DOM.storageStatusText.innerHTML = currentLang === 'ar'
      ? `<strong>سحابي نشط:</strong> متصل بـ Supabase بنجاح (Bucket: ${config.bucket})`
      : `<strong>Supabase Connected:</strong> Live storage bucket: ${config.bucket}`;
    DOM.btnQuickConfig.textContent = currentLang === 'ar' ? 'تعديل الإعدادات ⚙️' : 'Config ⚙️';
  } else {
    DOM.storageStatusBar.className = 'status-banner local-mode admin-only';
    DOM.storageStatusText.innerHTML = currentLang === 'ar'
      ? `<strong>وضع التخزين:</strong> تخزين مؤقت محلي (جاهز للربط الفوري مع Supabase)`
      : `<strong>Storage Mode:</strong> Local mock (Ready to connect with Supabase)`;
    DOM.btnQuickConfig.textContent = currentLang === 'ar' ? 'إعداد مفاتيح Supabase ⚡' : 'Setup Supabase ⚡';
  }
}

// ==========================================================================
// Client Portal Operations
// ==========================================================================
async function refreshClientFiles() {
  currentClientFiles = await storageManager.getClientFiles();
  const countWord = currentLang === 'ar' ? 'مستندات' : 'files';
  DOM.clientFilesCount.textContent = `${currentClientFiles.length} ${countWord}`;
  
  if (currentClientFiles.length === 0) {
    DOM.clientFilesList.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
        <h4>${t('emptyClientTitle')}</h4>
        <p>${t('emptyClientDesc')}</p>
      </div>
    `;
    return;
  }

  DOM.clientFilesList.innerHTML = '';
  currentClientFiles.forEach((file) => {
    const card = renderClientFileCard(file);
    DOM.clientFilesList.appendChild(card);
  });
}

function renderClientFileCard(file) {
  const card = document.createElement('div');
  card.className = 'file-card';
  const isImage = file.mimeType.startsWith('image/');
  const expiry = formatRemainingTime(file.expiresAt);
  const typeBadge = isImage ? t('imageType') : t('pdfType');

  const previewHtml = isImage
    ? `<img src="${file.url}" alt="${file.fileName}" loading="lazy" />`
    : `<div class="pdf-thumb-icon">📄</div>`;

  card.innerHTML = `
    <div class="file-card-preview" title="${t('btnPreview')}">
      ${previewHtml}
    </div>
    <div class="file-meta-row">
      <div class="file-name-text" dir="auto">${file.fileName}</div>
      <div class="file-size-tag">${formatFileSize(file.fileSize)}</div>
    </div>
    <div class="file-meta-row">
      <span class="file-expiry-badge ${expiry.isUrgent ? 'expiring-soon' : ''}">
        ⏱️ ${expiry.text}
      </span>
      <span class="badge-tag">${typeBadge}</span>
    </div>
    <div class="file-actions">
      <button class="btn btn-outline btn-preview" data-id="${file.id}">${t('btnPreview')}</button>
      <button class="btn btn-danger-outline btn-delete" data-id="${file.id}">${t('btnDelete')}</button>
    </div>
  `;

  // Attach card event listeners
  card.querySelector('.file-card-preview').addEventListener('click', () => openPreviewModal(file));
  card.querySelector('.btn-preview').addEventListener('click', () => openPreviewModal(file));
  card.querySelector('.btn-delete').addEventListener('click', async () => {
    if (confirm(`${t('deleteConfirm')}${file.fileName}?`)) {
      await storageManager.deleteFile(file.id);
      showToast(t('deleteSuccess'), 'success');
      await refreshClientFiles();
      await refreshAdminDashboard();
    }
  });

  return card;
}

// Handle Multiple Files Upload
async function handleFilesUpload(filesList) {
  if (!filesList || filesList.length === 0) return;

  const files = Array.from(filesList);
  const clientName = DOM.inputClientName ? DOM.inputClientName.value.trim() : '';

  DOM.uploadProgressContainer.classList.remove('hidden');
  DOM.progressPercent.textContent = '0%';
  DOM.progressBarFill.style.width = '0%';

  let uploadedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    DOM.progressFilename.textContent = `${t('uploading')} (${i + 1}/${files.length}): ${file.name}`;
    
    try {
      await storageManager.uploadFile(file, clientName, (percent) => {
        const overallPercent = Math.round(((i + percent / 100) / files.length) * 100);
        DOM.progressPercent.textContent = `${overallPercent}%`;
        DOM.progressBarFill.style.width = `${overallPercent}%`;
      });
      uploadedCount++;
    } catch (err) {
      console.error('فشل رفع الملف:', err);
      showToast(`${file.name}: ${err.message}`, 'error');
    }
  }

  // Complete Animation
  DOM.progressPercent.textContent = '100%';
  DOM.progressBarFill.style.width = '100%';
  
  // Confetti celebration!
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 }
  });

  showToast(t('uploadSuccess'), 'success');

  setTimeout(() => {
    DOM.uploadProgressContainer.classList.add('hidden');
    DOM.progressBarFill.style.width = '0%';
  }, 1200);

  // Refresh client & admin views
  await refreshClientFiles();
  await refreshAdminDashboard();
}

// ==========================================================================
// Admin Dashboard Operations
// ==========================================================================
async function refreshAdminDashboard() {
  allAdminFiles = await storageManager.getAllActiveFiles();
  DOM.badgeTotalFilesNav.textContent = allAdminFiles.length;

  // Calculate Metrics
  const totalFiles = allAdminFiles.length;
  const uniqueDevices = new Set(allAdminFiles.map(f => f.deviceId)).size;
  const totalBytes = allAdminFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  
  const now = Date.now();
  const expiringSoonCount = allAdminFiles.filter(f => {
    const diff = f.expiresAt - now;
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }).length;

  DOM.statTotalFiles.textContent = totalFiles;
  DOM.statTotalDevices.textContent = uniqueDevices;
  DOM.statTotalSize.textContent = formatFileSize(totalBytes);
  DOM.statExpiringSoon.textContent = expiringSoonCount;

  renderAdminFilesTable();
}

function renderAdminFilesTable() {
  const searchTerm = DOM.adminSearchInput.value.trim().toLowerCase();
  const filterType = DOM.adminFilterType.value;
  const sortBy = DOM.adminSortBy.value;

  // Filter
  let filtered = allAdminFiles.filter((file) => {
    const matchSearch =
      file.fileName.toLowerCase().includes(searchTerm) ||
      (file.clientName && file.clientName.toLowerCase().includes(searchTerm)) ||
      file.deviceId.toLowerCase().includes(searchTerm);

    let matchType = true;
    if (filterType === 'image') {
      matchType = file.mimeType.startsWith('image/');
    } else if (filterType === 'pdf') {
      matchType = file.mimeType.includes('pdf');
    }

    return matchSearch && matchType;
  });

  // Sort
  if (sortBy === 'newest') {
    filtered.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sortBy === 'expiry') {
    filtered.sort((a, b) => a.expiresAt - b.expiresAt);
  }

  const resultWord = currentLang === 'ar' ? 'نتائج' : 'results';
  DOM.filteredFilesCount.textContent = `${filtered.length} ${resultWord}`;

  if (filtered.length === 0) {
    DOM.adminTableBody.innerHTML = '';
    DOM.adminEmptyState.classList.remove('hidden');
    return;
  }

  DOM.adminEmptyState.classList.add('hidden');
  DOM.adminTableBody.innerHTML = '';

  filtered.forEach((file) => {
    const tr = document.createElement('tr');
    const isImage = file.mimeType.startsWith('image/');
    const expiry = formatRemainingTime(file.expiresAt);

    const thumbHtml = isImage
      ? `<div class="table-thumb-cell" title="${t('btnPreview')}"><img src="${file.url}" alt="${file.fileName}" /></div>`
      : `<div class="table-thumb-cell" title="${t('btnPreview')}"><span style="font-size:1.8rem">📄</span></div>`;

    tr.innerHTML = `
      <td>${thumbHtml}</td>
      <td>
        <div class="table-file-info">
          <span class="table-filename" title="${file.fileName}" dir="auto">${file.fileName}</span>
          <span class="table-filetype">${file.mimeType}</span>
        </div>
      </td>
      <td>
        <div class="table-device-tag">
          <span class="device-chip">${file.deviceId}</span>
          ${file.clientName ? `<span class="client-name-tag" dir="auto">👤 ${file.clientName}</span>` : `<span class="client-name-tag" style="color:var(--text-dim)">${t('unnamedClient')}</span>`}
        </div>
      </td>
      <td>
        <span class="table-time-text">${formatDateTime(file.createdAt)}</span>
      </td>
      <td>
        <span class="file-expiry-badge ${expiry.isUrgent ? 'expiring-soon' : ''}">
          ${expiry.text}
        </span>
      </td>
      <td>
        <span class="file-size-tag">${formatFileSize(file.fileSize)}</span>
      </td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-outline btn-row-preview" title="${t('btnPreview')}">👁️</button>
          <a href="${file.url}" download="${file.fileName}" class="btn btn-primary" title="${t('btnDownloadFile')}">⬇️</a>
          <button class="btn btn-danger-outline btn-row-delete" title="${t('btnDelete')}">🗑️</button>
        </div>
      </td>
    `;

    // Row Events
    tr.querySelector('.table-thumb-cell').addEventListener('click', () => openPreviewModal(file));
    tr.querySelector('.btn-row-preview').addEventListener('click', () => openPreviewModal(file));
    tr.querySelector('.btn-row-delete').addEventListener('click', async () => {
      if (confirm(`${t('deleteConfirm')}${file.fileName}?`)) {
        await storageManager.deleteFile(file.id);
        showToast(t('deleteSuccess'), 'success');
        await refreshAdminDashboard();
        await refreshClientFiles();
      }
    });

    DOM.adminTableBody.appendChild(tr);
  });
}

// ==========================================================================
// QR Code Generator & Stand Modal
// ==========================================================================
async function setupQrCode() {
  const currentOrigin = window.location.origin;
  const currentPath = window.location.pathname;
  // QR points specifically to the clean client portal
  const targetUrl = `${currentOrigin}${currentPath}`;

  DOM.qrTargetUrlLabel.textContent = targetUrl;

  try {
    qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 260,
      margin: 1,
      color: {
        dark: '#0B192C',
        light: '#FFFFFF'
      }
    });

    DOM.qrCanvasContainer.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" width="220" height="220" />`;
  } catch (err) {
    console.error('فشل إنشاء كود QR:', err);
  }
}

// ==========================================================================
// File Preview Modal (Lightbox / PDF)
// ==========================================================================
function openPreviewModal(file) {
  DOM.previewFilename.textContent = file.fileName;
  DOM.previewFilemeta.textContent = `${formatFileSize(file.fileSize)} • ${file.mimeType}`;
  DOM.btnDownloadPreview.href = file.url;
  DOM.btnDownloadPreview.download = file.fileName;

  if (file.mimeType.startsWith('image/')) {
    DOM.previewContentBox.innerHTML = `
      <img src="${file.url}" alt="${file.fileName}" style="max-height:65vh; max-width:100%; border-radius:8px;" />
    `;
  } else if (file.mimeType.includes('pdf')) {
    DOM.previewContentBox.innerHTML = `
      <iframe src="${file.url}" style="width:100%; height:65vh; border-radius:8px;" title="${file.fileName}"></iframe>
    `;
  } else {
    DOM.previewContentBox.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <div style="font-size:3rem; margin-bottom:12px;">📁</div>
        <p>نوع الملف لا يدعم المعاينة المباشرة في المتصفح.</p>
        <p>يمكنك تحميل الملف لمعاينته على جهازك.</p>
      </div>
    `;
  }

  DOM.modalPreview.classList.remove('hidden');
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function attachEventListeners() {
  // Language Switcher
  DOM.btnToggleLang.addEventListener('click', toggleLanguage);

  // Navigation Tabs (For Admin Mode)
  DOM.tabClient.addEventListener('click', () => switchView('client'));
  DOM.tabDashboard.addEventListener('click', () => switchView('dashboard'));

  // Drag & Drop File Zone
  DOM.dropArea.addEventListener('click', (e) => {
    if (e.target.closest('#btn-browse-files') || e.target.closest('#btn-trigger-camera')) return;
    DOM.fileInputMultiple.click();
  });

  DOM.btnBrowseFiles.addEventListener('click', () => DOM.fileInputMultiple.click());
  DOM.btnTriggerCamera.addEventListener('click', () => DOM.fileInputCamera.click());

  DOM.fileInputMultiple.addEventListener('change', (e) => {
    handleFilesUpload(e.target.files);
    e.target.value = '';
  });

  DOM.fileInputCamera.addEventListener('change', (e) => {
    handleFilesUpload(e.target.files);
    e.target.value = '';
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    DOM.dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropArea.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    DOM.dropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropArea.classList.remove('dragover');
    });
  });

  DOM.dropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFilesUpload(files);
  });

  // Admin Controls
  DOM.adminSearchInput.addEventListener('input', renderAdminFilesTable);
  DOM.adminFilterType.addEventListener('change', renderAdminFilesTable);
  DOM.adminSortBy.addEventListener('change', renderAdminFilesTable);
  DOM.btnRefreshDashboard.addEventListener('click', async () => {
    await refreshAdminDashboard();
    showToast(t('btnRefresh'), 'info');
  });

  DOM.btnCleanExpired.addEventListener('click', async () => {
    const count = await storageManager.purgeExpiredFiles();
    showToast(`تم حذف ${count} ملفات منتهية (+3 أيام)`, 'success');
    await refreshAdminDashboard();
    await refreshClientFiles();
  });

  // Save Retention Days per File Type
  if (DOM.btnSaveRetention) {
    DOM.btnSaveRetention.addEventListener('click', () => {
      const imgDays = parseInt(DOM.inputRetentionImage.value) || 3;
      const pdfDays = parseInt(DOM.inputRetentionPdf.value) || 3;
      saveRetentionSettings({
        default: 3,
        image: imgDays,
        pdf: pdfDays
      });
      showToast(t('retentionSaved'), 'success');
    });
  }

  // QR Modal
  DOM.btnShowQr.addEventListener('click', () => DOM.modalQr.classList.remove('hidden'));
  DOM.btnCloseQrModal.addEventListener('click', () => DOM.modalQr.classList.add('hidden'));
  DOM.btnPrintQr.addEventListener('click', () => window.print());

  DOM.btnDownloadQr.addEventListener('click', () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'barcode-upload-client.png';
    a.click();
    showToast('تم تحميل صورة الباركود', 'success');
  });

  DOM.btnCopyUrl.addEventListener('click', () => {
    const url = DOM.qrTargetUrlLabel.textContent;
    navigator.clipboard.writeText(url).then(() => {
      DOM.copyUrlBtnText.textContent = t('copied');
      setTimeout(() => (DOM.copyUrlBtnText.textContent = t('btnCopyUrl')), 2000);
      showToast(t('copied'), 'success');
    });
  });

  // Preview Modal Close
  DOM.btnClosePreview.addEventListener('click', () => DOM.modalPreview.classList.add('hidden'));

  // Settings Modal
  const openSettings = () => {
    const conf = storageManager.getSupabaseConfig();
    DOM.inputSupabaseUrl.value = conf.url;
    DOM.inputSupabaseAnon.value = conf.anonKey;
    DOM.inputSupabaseBucket.value = conf.bucket;
    DOM.modalSettings.classList.remove('hidden');
  };

  DOM.btnSettings.addEventListener('click', openSettings);
  DOM.btnQuickConfig.addEventListener('click', openSettings);
  DOM.btnShowSchemaLink.addEventListener('click', (e) => {
    e.preventDefault();
    openSettings();
    DOM.tabSubSql.click();
  });

  DOM.btnCloseSettings.addEventListener('click', () => DOM.modalSettings.classList.add('hidden'));

  DOM.tabSubKeys.addEventListener('click', () => {
    DOM.tabSubKeys.classList.add('active');
    DOM.tabSubSql.classList.remove('active');
    DOM.panelSubKeys.classList.add('active');
    DOM.panelSubSql.classList.remove('active');
  });

  DOM.tabSubSql.addEventListener('click', () => {
    DOM.tabSubSql.classList.add('active');
    DOM.tabSubKeys.classList.remove('active');
    DOM.panelSubSql.classList.add('active');
    DOM.panelSubKeys.classList.remove('active');
  });

  DOM.btnSaveSupabaseConfig.addEventListener('click', () => {
    const url = DOM.inputSupabaseUrl.value;
    const anon = DOM.inputSupabaseAnon.value;
    const bucket = DOM.inputSupabaseBucket.value;

    if (!url || !anon) {
      alert('يرجى كتابة كل من رابط المشروع والمفتاح العام لـ Supabase');
      return;
    }

    storageManager.saveSupabaseConfig(url, anon, bucket);
    updateStorageStatusBanner();
    DOM.modalSettings.classList.add('hidden');
    showToast('تم تفعيل إعدادات Supabase بنجاح!', 'success');
  });

  DOM.btnResetToDemo.addEventListener('click', () => {
    storageManager.resetToDemo();
    updateStorageStatusBanner();
    DOM.inputSupabaseUrl.value = '';
    DOM.inputSupabaseAnon.value = '';
    DOM.modalSettings.classList.add('hidden');
    showToast('تمت العودة إلى وضع التخزين المحلي التجريبي', 'info');
  });

  DOM.btnCopySql.addEventListener('click', () => {
    const code = DOM.sqlSchemaCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
      DOM.btnCopySql.textContent = 'تم النسخ ✓';
      setTimeout(() => (DOM.btnCopySql.textContent = t('btnCopyCode')), 2000);
      showToast('تم نسخ كود SQL لـ Supabase', 'success');
    });
  });

  // Close modals on clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === DOM.modalQr) DOM.modalQr.classList.add('hidden');
    if (e.target === DOM.modalPreview) DOM.modalPreview.classList.add('hidden');
    if (e.target === DOM.modalSettings) DOM.modalSettings.classList.add('hidden');
  });
}

// Start Application
window.addEventListener('DOMContentLoaded', initApp);
