import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { storageManager, getOrCreateDeviceId, THREE_DAYS_MS, getRetentionSettings, saveRetentionSettings } from './storage.js';

// Multilingual Dictionary (Arabic & English)
const TRANSLATIONS = {
  ar: {
    appTitle: 'مخزن المستندات',
    badgeStorage: 'سوبر بيز',
    appSubtitle: 'مخزن المستندات والتأمين السحابي الذكي',
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
    clientSectionDesc: 'المستندات المحفوظة بأمان في السيرفر السحابي.',
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
    footerCopy: 'مخزن المستندات © 2026 - نظام الرفع السريع لشركات التأمين والخدمات',
    footerTtl: 'صلاحية المستندات: 3 أيام (72 ساعة)',
    footerSqlLink: 'كود إعداد Supabase SQL ⚡',
    qrModalTitle: 'باركود استقبال العملاء (QR Code)',
    qrStandService: 'خدمة العملاء الذكية',
    qrStandTitle: 'امسح الباركود لرفع مستنداتك وأوراق التأمين',
    qrStandSubtitle: 'لا حاجة لتسجيل الدخول • مباشر وآمن من هاتفك',
    qrStep1: 'وجّه كاميرا هاتفك نحو الباركود وافتح الرابط',
    qrStep2: 'التقط صورة للوثيقة أو ارفع ملفات الـ PDF',
    qrStep3: 'تصلنا المستندات فوراً وتُحفظ بأمان وسرية في النظام',
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
    uploadSuccess: 'تم رفع المستندات بنجاح وحفظها بأمان!',
    copied: 'تم النسخ بنجاح! ✓',
    expiredText: 'منتهي الصلاحية',
    // Date & Session Grouping
    today: 'اليوم',
    yesterday: 'أمس',
    dateGroupFilesCount: 'مستندات',
    btnDownloadAll: 'تحميل كل ملفات العميل',
    btnDownloadZip: 'تحميل الكل (ملف ZIP)',
    btnDownloadSeparate: 'تنزيل منفصل',
    btnDownloadSingle: 'تحميل الملف',
    latestClientBadge: 'أحدث عميل ⚡',
    btnPrint: 'طباعة',
    btnPrintFile: 'طباعة هذا المستند',
    btnPrintAll: 'طباعة كل الملفات',
    clientSessionLabel: 'جلسة رفع للعميل',
    // PIN Modal
    pinModalTitle: 'التحقق من رقم الحماية 🔒',
    pinModalDesc: 'هذا القسم محمي برقم حماية. أدخل الرمز للمتابعة إلى إعدادات Supabase:',
    pinPlaceholder: 'أدخل رقم الحماية...',
    btnSubmitPin: 'تأكيد ودخول',
    btnCancelPin: 'إلغاء',
    pinIncorrect: 'رقم الحماية غير صحيح! حاول مرة أخرى'
  },
  en: {
    appTitle: 'DocCloud',
    badgeStorage: 'Supabase',
    appSubtitle: 'Smart Cloud Document & Insurance Vault',
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
    clientSectionDesc: 'Documents securely stored in the cloud vault.',
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
    footerCopy: 'DocCloud © 2026 - Fast Document Dispatch System',
    footerTtl: 'Document Retention: 3 Days (72 Hours)',
    footerSqlLink: 'Supabase SQL Setup Code ⚡',
    qrModalTitle: 'Customer Reception QR Code',
    qrStandService: 'Smart Customer Service',
    qrStandTitle: 'Scan QR Code to Upload Insurance & Documents',
    qrStandSubtitle: 'No login required • Instant & secure from your smartphone',
    qrStep1: 'Point your phone camera at the QR code and tap link',
    qrStep2: 'Snap a photo of your document or upload PDF',
    qrStep3: 'Documents are received instantly and securely stored in the system',
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
    uploadSuccess: 'Documents uploaded successfully and saved securely!',
    copied: 'Copied to clipboard! ✓',
    expiredText: 'Expired',
    // Date & Session Grouping
    today: 'Today',
    yesterday: 'Yesterday',
    dateGroupFilesCount: 'documents',
    btnDownloadAll: 'Download All Files',
    btnDownloadZip: 'Download All (ZIP)',
    btnDownloadSeparate: 'Download Separately',
    btnDownloadSingle: 'Download File',
    latestClientBadge: 'Latest Client ⚡',
    btnPrint: 'Print',
    btnPrintFile: 'Print Document',
    btnPrintAll: 'Print All Documents',
    clientSessionLabel: 'Client Upload Session',
    // PIN Modal
    pinModalTitle: 'Security PIN Verification 🔒',
    pinModalDesc: 'This section is protected. Enter PIN code to access Supabase settings:',
    pinPlaceholder: 'Enter PIN...',
    btnSubmitPin: 'Confirm & Enter',
    btnCancelPin: 'Cancel',
    pinIncorrect: 'Incorrect PIN! Please try again.'
  }
};

let isAdminMode = false;
let currentLang = 'ar';
let currentTheme = localStorage.getItem('cloud_doc_theme') || 'dark';

// DOM Element Selectors
const DOM = {
  // Navigation, Theme & Language
  btnToggleTheme: document.getElementById('btn-toggle-theme'),
  themeIcon: document.getElementById('theme-icon'),
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
  btnPrintPreview: document.getElementById('btn-print-preview'),

  // PIN Verification Modal
  modalPin: document.getElementById('modal-pin'),
  btnClosePin: document.getElementById('btn-close-pin'),
  formPin: document.getElementById('form-pin'),
  inputPinCode: document.getElementById('input-pin-code'),
  pinErrorMsg: document.getElementById('pin-error-msg'),
  btnSubmitPin: document.getElementById('btn-submit-pin'),
  btnCancelPin: document.getElementById('btn-cancel-pin'),

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
let currentPreviewFile = null;

// Helper: Translate text
function t(key) {
  return TRANSLATIONS[currentLang][key] || key;
}

// Apply Language
function applyLanguage(lang) {
  currentLang = lang;
  if (isAdminMode) {
    localStorage.setItem('cloud_doc_admin_lang', lang);
  } else {
    localStorage.setItem('cloud_doc_client_lang', lang);
  }

  const html = document.documentElement;
  if (lang === 'en') {
    html.setAttribute('lang', 'en');
    html.setAttribute('dir', 'ltr');
    DOM.langCurrentLabel.textContent = 'العربية';
    document.title = 'DocCloud | Smart Vault';
  } else {
    html.setAttribute('lang', 'ar');
    html.setAttribute('dir', 'rtl');
    DOM.langCurrentLabel.textContent = 'English';
    document.title = 'مخزن المستندات | DocCloud';
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

// Apply Theme (light / dark)
function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('cloud_doc_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  if (DOM.themeIcon) {
    DOM.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  if (DOM.btnToggleTheme) {
    DOM.btnToggleTheme.title = theme === 'dark'
      ? (currentLang === 'ar' ? 'التحويل للوضع الفاتح' : 'Switch to Light Mode')
      : (currentLang === 'ar' ? 'التحويل للوضع الداكن' : 'Switch to Dark Mode');
  }
}

// Toggle Theme
function toggleTheme() {
  const next = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
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
    // ADMIN MODE: Default language is English, unless user switched it
    isAdminMode = true;
    document.body.classList.remove('mode-client');
    document.body.classList.add('mode-admin');
    switchView('dashboard');
    currentLang = localStorage.getItem('cloud_doc_admin_lang') || 'en';
  } else {
    // CLIENT MODE (Default): Pure client upload, default language is Arabic
    isAdminMode = false;
    document.body.classList.remove('mode-admin');
    document.body.classList.add('mode-client');
    switchView('client');
    currentLang = localStorage.getItem('cloud_doc_client_lang') || 'ar';
  }

  // Apply default language & theme
  applyLanguage(currentLang);
  applyTheme(currentTheme);

  // Update Status Banner
  updateStorageStatusBanner();

  // Load Client and Admin Data
  await refreshClientFiles();
  await refreshAdminDashboard();

  // Setup QR Stand Data
  setupQrCode();

  // Attach Event Listeners
  attachEventListeners();

  // Setup Realtime Live Updates & Audio Alerts
  setupRealtimeLiveSync();
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
  const typeBadge = isImage ? t('imageType') : t('pdfType');

  const previewHtml = isImage
    ? `<img src="${file.url}" alt="${file.fileName}" loading="lazy" />`
    : `<div class="pdf-thumb-icon">📄</div>`;

  // Sanitized client file card: completely clean of 3-day countdowns
  card.innerHTML = `
    <div class="file-card-preview" title="${t('btnPreview')}">
      ${previewHtml}
    </div>
    <div class="file-meta-row">
      <div class="file-name-text" dir="auto">${file.fileName}</div>
      <div class="file-size-tag">${formatFileSize(file.fileSize)}</div>
    </div>
    <div class="file-meta-row">
      <span class="badge-tag">${typeBadge}</span>
      <span class="file-date-tag">${formatDateTime(file.createdAt)}</span>
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

// Web Audio API soft melodic chime for live client document notifications
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    
    // Note 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Note 2: A5 (880Hz) slightly delayed for a pleasant two-tone chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.15, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // AudioContext may require user interaction on some policies, fail silently
  }
}

let lastFilesSignature = '';

function computeFilesSignature(files) {
  if (!files || files.length === 0) return '0_0';
  const latest = Math.max(...files.map(f => f.createdAt || 0));
  return `${files.length}_${latest}_${files[0]?.id || ''}`;
}

function updateAdminMetrics() {
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
}

// Live Realtime Synchronization (BroadcastChannel, Supabase Realtime, and smart polling fallback)
function setupRealtimeLiveSync() {
  // 1. Subscribe to storageManager events (BroadcastChannel + Supabase Realtime)
  storageManager.onFileChange(async (change) => {
    await refreshAdminDashboard();
    await refreshClientFiles();

    if (change?.type === 'FILE_UPLOADED' || (change?.type === 'SUPABASE_CHANGE' && change?.payload?.eventType === 'INSERT')) {
      playNotificationChime();
      showToast(
        currentLang === 'ar'
          ? 'تم استلام مستندات جديدة من عميل الآن! ⚡'
          : 'New document received from client! ⚡',
        'success'
      );
    }
  });

  // 2. Fallback smart poll every 3.5 seconds to guarantee live updates even if WebSockets are blocked
  setInterval(async () => {
    if (document.hidden) return;

    try {
      const activeFiles = await storageManager.getAllActiveFiles();
      const newSig = computeFilesSignature(activeFiles);

      if (lastFilesSignature && newSig !== lastFilesSignature) {
        const isNewUpload = activeFiles.length > allAdminFiles.length ||
          (activeFiles[0] && (!allAdminFiles[0] || activeFiles[0].createdAt > allAdminFiles[0].createdAt));

        allAdminFiles = activeFiles;
        lastFilesSignature = newSig;

        DOM.badgeTotalFilesNav.textContent = allAdminFiles.length;
        updateAdminMetrics();
        renderAdminFilesTable();

        if (isNewUpload) {
          playNotificationChime();
          showToast(
            currentLang === 'ar'
              ? 'تم استلام مستندات جديدة من عميل الآن! ⚡'
              : 'New document received from client! ⚡',
            'success'
          );
        }
      } else {
        lastFilesSignature = newSig;
      }
    } catch (err) {
      console.warn('Live sync poll warning:', err);
    }
  }, 3500);
}

// ==========================================================================
// Admin Dashboard Operations
// ==========================================================================
async function refreshAdminDashboard() {
  allAdminFiles = await storageManager.getAllActiveFiles();
  DOM.badgeTotalFilesNav.textContent = allAdminFiles.length;
  lastFilesSignature = computeFilesSignature(allAdminFiles);

  updateAdminMetrics();
  renderAdminFilesTable();
}

// Helper: Get direct download URL with attachment header from Supabase
function getDirectDownloadUrl(file) {
  if (!file || !file.url) return '';
  if (file.url.includes('supabase.co')) {
    const cleanUrl = file.url.replace(/[?&]download=[^&]*/g, '');
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}download=${encodeURIComponent(file.fileName)}`;
  }
  return file.url;
}

// Helper: Download a single file using direct browser download with native attachment headers
function downloadSingleFile(file, triggerBtn) {
  if (triggerBtn && triggerBtn.disabled) return;

  const downloadUrl = getDirectDownloadUrl(file);

  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.classList.add('is-downloading');
    const originalHtml = triggerBtn.innerHTML;
    triggerBtn.innerHTML = `
      <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
    `;

    setTimeout(() => {
      triggerBtn.classList.remove('is-downloading');
      triggerBtn.classList.add('is-success');
      triggerBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      setTimeout(() => {
        triggerBtn.classList.remove('is-success');
        triggerBtn.innerHTML = originalHtml;
        triggerBtn.disabled = false;
      }, 1500);
    }, 800);
  }

  // Trigger native browser download directly via anchor
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = file.fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Helper: Download via isolated hidden iframe (prevents Chrome top-level navigation cancels)
function downloadViaIframe(url) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  iframe.style.border = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 45000);
}

// Helper: Download all files of a session bundled together in a single ZIP file (100% reliable)
async function downloadSessionAsZip(files, clientLabel, triggerBtn) {
  if (!files || files.length === 0) return;
  if (triggerBtn && triggerBtn.disabled) return;

  const label = clientLabel || (currentLang === 'ar' ? 'العميل' : 'Client');
  
  let originalHtml = '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.classList.add('is-downloading');
    originalHtml = triggerBtn.innerHTML;
  }

  showToast(
    currentLang === 'ar'
      ? `جاري تجهيز ${files.length} ملفات وضغطها في ملف ZIP...`
      : `Bundling ${files.length} files into ZIP archive...`,
    'info'
  );

  try {
    const zip = new JSZip();
    const usedNames = new Set();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (triggerBtn) {
        triggerBtn.innerHTML = `
          <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
          <span>${currentLang === 'ar' ? `جاري ضم الملفات (${i + 1}/${files.length})...` : `Adding (${i + 1}/${files.length})...`}</span>
        `;
      }

      // Fetch file data
      const response = await fetch(file.url);
      if (!response.ok) throw new Error(`Failed to fetch ${file.fileName}`);
      const blob = await response.blob();

      // Ensure unique filename inside zip
      let name = file.fileName || `file_${i + 1}`;
      if (usedNames.has(name)) {
        const dotIndex = name.lastIndexOf('.');
        const ext = dotIndex > -1 ? name.slice(dotIndex) : '';
        const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;
        let counter = 1;
        while (usedNames.has(`${base}_(${counter})${ext}`)) {
          counter++;
        }
        name = `${base}_(${counter})${ext}`;
      }
      usedNames.add(name);

      zip.file(name, blob);
    }

    if (triggerBtn) {
      triggerBtn.innerHTML = `
        <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        <span>${currentLang === 'ar' ? 'جاري إنشاء ملف الـ ZIP...' : 'Generating ZIP...'}</span>
      `;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const cleanLabel = (clientLabel || 'Client').replace(/[^\w\u0600-\u06FF\s-]/g, '').trim();
    const zipFileName = `${cleanLabel || 'client'}_documents_${Date.now().toString().slice(-4)}.zip`;

    const blobUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

    if (triggerBtn) {
      triggerBtn.classList.remove('is-downloading');
      triggerBtn.classList.add('is-success');
      triggerBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>${currentLang === 'ar' ? 'تم تنزيل الـ ZIP بنجاح ✓' : 'ZIP Downloaded ✓'}</span>
      `;
      setTimeout(() => {
        triggerBtn.classList.remove('is-success');
        triggerBtn.innerHTML = originalHtml;
        triggerBtn.disabled = false;
      }, 2500);
    }
  } catch (err) {
    console.error('ZIP generation failed, fallback to separate download:', err);
    showToast(currentLang === 'ar' ? 'تعذر الضغط، سيتم التنزيل منفصلاً...' : 'Fallback to separate download...', 'warning');
    if (triggerBtn) {
      triggerBtn.classList.remove('is-downloading');
      triggerBtn.innerHTML = originalHtml;
      triggerBtn.disabled = false;
    }
    await downloadSessionFilesSeparately(files, clientLabel, triggerBtn);
  }
}

// Helper: Download all files for a specific client session separately via isolated iframes
async function downloadSessionFilesSeparately(files, clientLabel, triggerBtn) {
  if (!files || files.length === 0) return;
  if (triggerBtn && triggerBtn.disabled) return;

  const label = clientLabel || (currentLang === 'ar' ? 'العميل' : 'Client');
  
  let originalHtml = '';
  if (triggerBtn) {
    triggerBtn.disabled = true;
    triggerBtn.classList.add('is-downloading');
    originalHtml = triggerBtn.innerHTML;
  }

  showToast(
    currentLang === 'ar'
      ? `جاري تنزيل ${files.length} ملفات منفصلة لـ (${label})... إذا ظهر تنبيه المتصفح اضغط السماح (Allow).`
      : `Downloading ${files.length} separate files for (${label})... Please allow automatic downloads if prompted.`,
    'info'
  );

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (triggerBtn) {
      const progressText = currentLang === 'ar'
        ? `جاري التنزيل (${i + 1}/${files.length})...`
        : `Downloading (${i + 1}/${files.length})...`;
      triggerBtn.innerHTML = `
        <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        <span>${progressText}</span>
      `;
    }

    const downloadUrl = getDirectDownloadUrl(file);
    downloadViaIframe(downloadUrl);

    if (i < files.length - 1) {
      await new Promise(r => setTimeout(r, 1200));
    }
  }

  if (triggerBtn) {
    triggerBtn.classList.remove('is-downloading');
    triggerBtn.classList.add('is-success');
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${currentLang === 'ar' ? 'تم بدء التنزيل ✓' : 'Downloads Started ✓'}</span>
    `;

    setTimeout(() => {
      triggerBtn.classList.remove('is-success');
      triggerBtn.innerHTML = originalHtml;
      triggerBtn.disabled = false;
    }, 2000);
  }
}

// Backward compatibility alias:
const downloadSessionFiles = downloadSessionAsZip;

// Helper: Print a single file in a clean printable tab with automatic print dialog
function printSingleFile(file) {
  if (!file || !file.url) return;
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType?.includes('pdf');

  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert(currentLang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لفتح شاشة الطباعة' : 'Please allow popups to enable printing');
    return;
  }

  const clientInfo = file.clientName ? `👤 ${file.clientName}` : (currentLang === 'ar' ? 'بدون اسم' : 'No Name');
  const dateStr = formatDateTime(file.createdAt);

  if (isImage) {
    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>${file.fileName} - Print</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif;
            background: #ffffff;
            color: #0F172A;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 10px;
            margin-bottom: 16px;
            font-size: 13px;
          }
          .print-brand { font-weight: 800; color: #EA580C; font-size: 15px; }
          .print-meta { color: #64748B; font-size: 12px; }
          .img-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
          }
          img {
            max-width: 100%;
            max-height: 85vh;
            object-fit: contain;
            border: 1px solid #CBD5E1;
            border-radius: 6px;
          }
          @media print {
            body { padding: 0; }
            img { border: none; max-height: 92vh; }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div>
            <span class="print-brand">مخزن المستندات | DocCloud</span>
            <span style="margin: 0 8px; color:#CBD5E1;">|</span>
            <strong>${file.fileName}</strong>
          </div>
          <div class="print-meta">${clientInfo} • ${file.deviceId} • ${dateStr}</div>
        </div>
        <div class="img-container">
          <img src="${file.url}" alt="${file.fileName}" onload="setTimeout(() => { window.focus(); window.print(); }, 400);" />
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
  } else if (isPdf) {
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${file.fileName} - Print</title>
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #fff; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <iframe src="${file.url}" onload="setTimeout(() => { try { this.contentWindow.focus(); this.contentWindow.print(); } catch(e) { window.print(); } }, 600);"></iframe>
      </body>
      </html>
    `);
    printWin.document.close();
  } else {
    printWin.location.href = file.url;
  }
}

// Helper: Print all files of a client session in a unified printable multi-page sheet
function printSessionFiles(files, clientLabel) {
  if (!files || files.length === 0) return;

  const printWin = window.open('', '_blank');
  if (!printWin) {
    alert(currentLang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لفتح شاشة الطباعة' : 'Please allow popups to enable printing');
    return;
  }

  const label = clientLabel || (currentLang === 'ar' ? 'العميل' : 'Client');
  const sample = files[0];
  const dateStr = formatDateTime(sample.createdAt);
  const deviceStr = sample.deviceId || '';

  const pagesHtml = files.map((file, idx) => {
    const isImage = file.mimeType?.startsWith('image/');
    return `
      <div class="doc-page">
        <div class="page-header">
          <div class="page-title">
            <span class="brand-name">DocCloud</span>
            <span style="margin:0 6px; color:#cbd5e1;">•</span>
            <strong>${file.fileName}</strong>
            <span class="badge-num">${idx + 1} / ${files.length}</span>
          </div>
          <div class="page-meta">${label} • ${deviceStr} • ${dateStr}</div>
        </div>
        <div class="doc-body">
          ${isImage ? `
            <img class="print-img" src="${file.url}" alt="${file.fileName}" />
          ` : `
            <div class="pdf-box">
              <iframe src="${file.url}" style="width:100%; height:82vh; border:1px solid #ccc; border-radius:6px;"></iframe>
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  printWin.document.write(`
    <!DOCTYPE html>
    <html dir="${currentLang === 'ar' ? 'rtl' : 'ltr'}">
    <head>
      <meta charset="UTF-8">
      <title>طباعة مستندات - ${label}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", sans-serif;
          background: #ffffff;
          color: #0F172A;
        }
        .doc-page {
          margin-bottom: 24px;
          page-break-after: always;
          display: flex;
          flex-direction: column;
        }
        .doc-page:last-child { page-break-after: auto; margin-bottom: 0; }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 8px;
          margin-bottom: 14px;
          font-size: 13px;
        }
        .brand-name { font-weight: 800; color: #EA580C; }
        .badge-num {
          background: #EFF6FF;
          color: #1D4ED8;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          margin-inline-start: 8px;
        }
        .page-meta { color: #64748B; font-size: 12px; }
        .doc-body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
        }
        .print-img {
          max-width: 100%;
          max-height: 84vh;
          object-fit: contain;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
        }
        .pdf-box { width: 100%; height: 82vh; }
        @media print {
          body { padding: 0; }
          .doc-page { margin-bottom: 0; }
          .print-img { border: none; max-height: 90vh; }
        }
      </style>
      <script>
        let loaded = 0;
        const total = ${files.length};
        function checkReady() {
          loaded++;
          if (loaded >= total) {
            setTimeout(() => { window.focus(); window.print(); }, 500);
          }
        }
      </script>
    </head>
    <body>
      ${pagesHtml}
      <script>
        const imgs = document.querySelectorAll('.print-img');
        if (imgs.length === 0) {
          setTimeout(() => { window.focus(); window.print(); }, 800);
        } else {
          imgs.forEach(img => {
            if (img.complete) checkReady();
            else {
              img.onload = checkReady;
              img.onerror = checkReady;
            }
          });
        }
      </script>
    </body>
    </html>
  `);
  printWin.document.close();
}

// Helper: Extract Date Key (YYYY-MM-DD)
function getDateKey(timestamp) {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Format Date Group Title (اليوم / أمس / التاريخ الكامل)
function formatDateGroupTitle(dateKey, sampleTimestamp) {
  const now = new Date();
  const todayKey = getDateKey(now.getTime());
  const yesterdayKey = getDateKey(now.getTime() - 24 * 60 * 60 * 1000);
  const date = new Date(sampleTimestamp);
  const locale = currentLang === 'ar' ? 'ar-EG' : 'en-US';

  const fullDateStr = date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (dateKey === todayKey) {
    return `${t('today')} • ${fullDateStr}`;
  }
  if (dateKey === yesterdayKey) {
    return `${t('yesterday')} • ${fullDateStr}`;
  }
  return fullDateStr;
}

// Helper: Format Time for Session Header (e.g. 10:16 PM)
function formatSessionTime(timestamp) {
  const date = new Date(timestamp);
  const locale = currentLang === 'ar' ? 'ar-EG' : 'en-US';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Helper: Format Session File Breakdown Summary
function formatSessionSummary(files) {
  const count = files.length;
  const imagesCount = files.filter(f => f.mimeType.startsWith('image/')).length;
  const pdfCount = files.filter(f => f.mimeType.includes('pdf')).length;
  const otherCount = count - (imagesCount + pdfCount);

  if (currentLang === 'ar') {
    const parts = [];
    if (imagesCount > 0) parts.push(`${imagesCount} صورة`);
    if (pdfCount > 0) parts.push(`${pdfCount} PDF`);
    if (otherCount > 0) parts.push(`${otherCount} ملف آخر`);

    const totalLabel = count === 1 ? 'مستند واحد' : count === 2 ? 'مستندان' : `${count} مستندات`;
    if (parts.length === 1 && (imagesCount === count || pdfCount === count)) {
      return `${totalLabel} (${parts[0]})`;
    }
    return `${totalLabel} (${parts.join(' + ')})`;
  } else {
    const parts = [];
    if (imagesCount > 0) parts.push(`${imagesCount} Image${imagesCount > 1 ? 's' : ''}`);
    if (pdfCount > 0) parts.push(`${pdfCount} PDF${pdfCount > 1 ? 's' : ''}`);
    if (otherCount > 0) parts.push(`${otherCount} Other`);

    const totalLabel = count === 1 ? '1 Document' : `${count} Documents`;
    if (parts.length === 1 && (imagesCount === count || pdfCount === count)) {
      return `${totalLabel} (${parts[0]})`;
    }
    return `${totalLabel} (${parts.join(' + ')})`;
  }
}

// Helper: Cluster files within a date into client visits/sessions
function clusterIntoClientSessions(filesInDate) {
  const sessions = [];
  const CLUSTER_WINDOW_MS = 25 * 60 * 1000; // 25-minute window for same customer visit

  filesInDate.forEach((file) => {
    const matchingSession = sessions.find((s) => {
      const isSameDevice = s.deviceId === file.deviceId;
      const isSameClientName = (!s.clientName && !file.clientName) || (s.clientName === file.clientName);

      if (s.sessionId && file.sessionId && s.sessionId === file.sessionId && isSameDevice) {
        return true;
      }

      const timeDiff = Math.abs(s.latestTimestamp - file.createdAt);
      return isSameDevice && isSameClientName && timeDiff <= CLUSTER_WINDOW_MS;
    });

    if (matchingSession) {
      matchingSession.files.push(file);
      if (file.createdAt > matchingSession.latestTimestamp) {
        matchingSession.latestTimestamp = file.createdAt;
      }
      if (file.createdAt < matchingSession.earliestTimestamp) {
        matchingSession.earliestTimestamp = file.createdAt;
      }
    } else {
      sessions.push({
        id: `sess_${file.deviceId}_${file.createdAt}`,
        sessionId: file.sessionId || '',
        deviceId: file.deviceId,
        clientName: file.clientName || '',
        latestTimestamp: file.createdAt,
        earliestTimestamp: file.createdAt,
        files: [file]
      });
    }
  });

  return sessions;
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

  // 1. Group into Date buckets
  const dateGroups = [];
  const dateMap = new Map();

  filtered.forEach((file) => {
    const dateKey = getDateKey(file.createdAt);
    if (!dateMap.has(dateKey)) {
      const group = {
        dateKey,
        sampleTimestamp: file.createdAt,
        files: []
      };
      dateMap.set(dateKey, group);
      dateGroups.push(group);
    }
    dateMap.get(dateKey).files.push(file);
  });

  // Identify the latest client session across all files for distinct graduated light green highlight
  let latestOverallSessionId = null;
  let maxSessionTimestamp = -1;
  dateGroups.forEach((group) => {
    const groupSessions = clusterIntoClientSessions(group.files);
    groupSessions.forEach((s) => {
      if (s.latestTimestamp > maxSessionTimestamp) {
        maxSessionTimestamp = s.latestTimestamp;
        latestOverallSessionId = s.id;
      }
    });
  });

  // 2. Iterate each Date Group
  dateGroups.forEach((group) => {
    // Render Date Group Divider Row
    const dateTr = document.createElement('tr');
    dateTr.className = 'tr-date-group';
    dateTr.innerHTML = `
      <td colspan="7">
        <div class="date-group-bar">
          <div class="date-group-title">
            <svg class="date-calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span class="date-group-text">${formatDateGroupTitle(group.dateKey, group.sampleTimestamp)}</span>
          </div>
          <span class="date-group-badge">${group.files.length} ${t('dateGroupFilesCount')}</span>
        </div>
      </td>
    `;
    DOM.adminTableBody.appendChild(dateTr);

    // 3. Cluster files in this date into Client Sessions
    const sessions = clusterIntoClientSessions(group.files);

    sessions.forEach((session) => {
      const isLatestClient = session.id === latestOverallSessionId;

      // Render Client Session Header Row
      const sessionTr = document.createElement('tr');
      sessionTr.className = `tr-client-session ${isLatestClient ? 'is-latest-client' : ''}`;

      const clientDisplayName = session.clientName ? session.clientName : t('unnamedClient');

      sessionTr.innerHTML = `
        <td colspan="7">
          <div class="client-session-bar">
            <div class="session-left-group">
              <div class="session-client-badge">
                <svg class="session-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span class="session-client-name" dir="auto">${clientDisplayName}</span>
                <span class="device-chip">${session.deviceId}</span>
              </div>

              ${isLatestClient ? `
                <div class="latest-client-chip" title="${currentLang === 'ar' ? 'أحدث عميل رفع مستندات' : 'Most Recent Client'}">
                  <span class="pulse-indicator"></span>
                  <span>${t('latestClientBadge')}</span>
                </div>
              ` : ''}

              <div class="session-time-chip">
                <svg class="session-clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${formatSessionTime(session.latestTimestamp)}</span>
              </div>

              <div class="session-summary-chip">
                <svg class="session-folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>${formatSessionSummary(session.files)}</span>
              </div>
            </div>

            <div class="session-actions-group">
              ${session.files.length === 1 ? `
                <button class="btn btn-session-download-single" title="${t('btnDownloadSingle')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>${t('btnDownloadSingle')} (1)</span>
                </button>
                <button class="btn btn-session-print" title="${t('btnPrintFile')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>${t('btnPrint')}</span>
                </button>
              ` : `
                <button class="btn btn-session-download-zip" title="${t('btnDownloadZip')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <span>${t('btnDownloadZip')} (${session.files.length})</span>
                </button>
                <button class="btn btn-session-download-separate" title="${t('btnDownloadSeparate')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  <span>${t('btnDownloadSeparate')}</span>
                </button>
                <button class="btn btn-session-print" title="${t('btnPrintAll')}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  <span>${t('btnPrintAll')} (${session.files.length})</span>
                </button>
              `}
            </div>
          </div>
        </td>
      `;

      // Download and print events for session
      if (session.files.length === 1) {
        const singleBtn = sessionTr.querySelector('.btn-session-download-single');
        if (singleBtn) {
          singleBtn.addEventListener('click', (e) => {
            downloadSingleFile(session.files[0], e.currentTarget);
          });
        }
      } else {
        const zipBtn = sessionTr.querySelector('.btn-session-download-zip');
        if (zipBtn) {
          zipBtn.addEventListener('click', (e) => {
            downloadSessionAsZip(session.files, clientDisplayName, e.currentTarget);
          });
        }
        const sepBtn = sessionTr.querySelector('.btn-session-download-separate');
        if (sepBtn) {
          sepBtn.addEventListener('click', (e) => {
            downloadSessionFilesSeparately(session.files, clientDisplayName, e.currentTarget);
          });
        }
      }

      const sessionPrintBtn = sessionTr.querySelector('.btn-session-print');
      if (sessionPrintBtn) {
        sessionPrintBtn.addEventListener('click', () => {
          printSessionFiles(session.files, clientDisplayName);
        });
      }

      DOM.adminTableBody.appendChild(sessionTr);

      // 4. Render files belonging to this session
      session.files.forEach((file) => {
        const fileTr = document.createElement('tr');
        fileTr.className = `tr-session-member ${isLatestClient ? 'is-latest-client-member' : ''}`;

        const isImage = file.mimeType.startsWith('image/');
        const expiry = formatRemainingTime(file.expiresAt);

        const thumbHtml = isImage
          ? `<div class="table-thumb-cell" title="${t('btnPreview')}"><img src="${file.url}" alt="${file.fileName}" /></div>`
          : `<div class="table-thumb-cell" title="${t('btnPreview')}"><span style="font-size:1.8rem">📄</span></div>`;

        fileTr.innerHTML = `
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
            <div class="row-actions-wrap">
              <button class="btn-action-icon btn-action-preview" title="${t('btnPreview')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button class="btn-action-icon btn-action-print" title="${t('btnPrintFile')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
              </button>
              <a href="${getDirectDownloadUrl(file)}" download="${file.fileName}" class="btn-action-icon btn-action-download" title="${t('btnDownloadFile')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </a>
              <button class="btn-action-icon btn-action-delete" title="${t('btnDelete')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </td>
        `;

        // Row Events
        fileTr.querySelector('.table-thumb-cell').addEventListener('click', () => openPreviewModal(file));
        fileTr.querySelector('.btn-action-preview').addEventListener('click', () => openPreviewModal(file));
        fileTr.querySelector('.btn-action-print').addEventListener('click', () => printSingleFile(file));
        fileTr.querySelector('.btn-action-download').addEventListener('click', (e) => {
          const btn = e.currentTarget;
          if (btn.classList.contains('is-downloading')) {
            e.preventDefault();
            return;
          }
          btn.classList.add('is-downloading');
          const originalHtml = btn.innerHTML;
          btn.innerHTML = `
            <svg class="spin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
          `;
          setTimeout(() => {
            btn.classList.remove('is-downloading');
            btn.classList.add('is-success');
            btn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            `;
            setTimeout(() => {
              btn.classList.remove('is-success');
              btn.innerHTML = originalHtml;
            }, 1500);
          }, 1000);
        });
        fileTr.querySelector('.btn-action-delete').addEventListener('click', async () => {
          if (confirm(`${t('deleteConfirm')}${file.fileName}?`)) {
            await storageManager.deleteFile(file.id);
            showToast(t('deleteSuccess'), 'success');
            await refreshAdminDashboard();
            await refreshClientFiles();
          }
        });

        DOM.adminTableBody.appendChild(fileTr);
      });
    });
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
  currentPreviewFile = file;
  DOM.previewFilename.textContent = file.fileName;
  DOM.previewFilemeta.textContent = `${formatFileSize(file.fileSize)} • ${file.mimeType}`;
  DOM.btnDownloadPreview.href = getDirectDownloadUrl(file);
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
  // Theme Switcher (Light / Dark)
  if (DOM.btnToggleTheme) {
    DOM.btnToggleTheme.addEventListener('click', toggleTheme);
  }

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
  if (DOM.btnPrintPreview) {
    DOM.btnPrintPreview.addEventListener('click', () => {
      if (currentPreviewFile) {
        printSingleFile(currentPreviewFile);
      }
    });
  }

  // Settings Modal
  const openSettings = () => {
    const conf = storageManager.getSupabaseConfig();
    DOM.inputSupabaseUrl.value = conf.url;
    DOM.inputSupabaseAnon.value = conf.anonKey;
    DOM.inputSupabaseBucket.value = conf.bucket;
    DOM.modalSettings.classList.remove('hidden');
  };

  // Security PIN (2026) Verification for Supabase Settings
  const SECURITY_PIN = '2026';
  let pendingPinAction = null;

  const promptPinForSettings = (onSuccess) => {
    DOM.inputPinCode.value = '';
    DOM.inputPinCode.classList.remove('input-error');
    DOM.pinErrorMsg.classList.add('hidden');
    DOM.modalPin.classList.remove('hidden');
    pendingPinAction = onSuccess;
    setTimeout(() => DOM.inputPinCode.focus(), 100);
  };

  const handlePinSubmit = () => {
    const entered = DOM.inputPinCode.value.trim();
    if (entered === SECURITY_PIN) {
      DOM.modalPin.classList.add('hidden');
      DOM.inputPinCode.value = '';
      DOM.inputPinCode.classList.remove('input-error');
      DOM.pinErrorMsg.classList.add('hidden');
      if (typeof pendingPinAction === 'function') {
        pendingPinAction();
        pendingPinAction = null;
      }
    } else {
      DOM.inputPinCode.classList.add('input-error');
      DOM.pinErrorMsg.classList.remove('hidden');
      DOM.inputPinCode.focus();
      DOM.inputPinCode.select();
    }
  };

  const closePinModal = () => {
    DOM.modalPin.classList.add('hidden');
    DOM.inputPinCode.value = '';
    DOM.inputPinCode.classList.remove('input-error');
    DOM.pinErrorMsg.classList.add('hidden');
    pendingPinAction = null;
  };

  // Protected settings triggers (Requires PIN 2026)
  DOM.btnSettings.addEventListener('click', () => promptPinForSettings(openSettings));
  DOM.btnQuickConfig.addEventListener('click', () => promptPinForSettings(openSettings));
  DOM.btnShowSchemaLink.addEventListener('click', (e) => {
    e.preventDefault();
    promptPinForSettings(() => {
      openSettings();
      DOM.tabSubSql.click();
    });
  });

  // PIN Modal Event Listeners
  DOM.btnSubmitPin.addEventListener('click', handlePinSubmit);
  DOM.inputPinCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePinSubmit();
    }
  });
  DOM.btnCancelPin.addEventListener('click', closePinModal);
  DOM.btnClosePin.addEventListener('click', closePinModal);

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
    if (e.target === DOM.modalPin) closePinModal();
    if (e.target === DOM.modalSettings) DOM.modalSettings.classList.add('hidden');
  });
}

// Start Application
window.addEventListener('DOMContentLoaded', initApp);

// Register Service Worker for PWA Installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

// PWA Install prompt listener
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});
