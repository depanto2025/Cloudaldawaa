import { createClient } from '@supabase/supabase-js';

// Configuration keys in localStorage
const STORAGE_KEYS = {
  DEVICE_ID: 'cloud_doc_device_id',
  SUPABASE_URL: 'cloud_doc_supabase_url',
  SUPABASE_ANON: 'cloud_doc_supabase_anon',
  SUPABASE_BUCKET: 'cloud_doc_supabase_bucket',
  LOCAL_FILES: 'cloud_doc_local_files_v1'
};

// 3 Days in milliseconds (72 hours)
export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

// Device ID management (Anonymous device identifier without login)
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestampPart = Date.now().toString(36).slice(-3).toUpperCase();
    deviceId = `DEV-${randomHex}-${timestampPart}`;
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// Supabase Client Manager
class CloudStorageManager {
  constructor() {
    this.supabaseClient = null;
    this.bucketName = 'client-documents';
    this.isSupabaseConfigured = false;
    this.initSupabase();
  }

  initSupabase() {
    const defaultUrl = 'https://vykjaggcgaajxjjwfddp.supabase.co';
    const defaultAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5a2phZ2djZ2FhanhqandmZGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjM3MzEsImV4cCI6MjEwNzM5OTczMX0._AU7G4KewmTB23BTbSnx24Oj7CYzsBAzHW2SU-rwzHs';
    const defaultBucket = 'client-documents';

    const url = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || defaultUrl;
    const anonKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON) || defaultAnon;
    const bucket = localStorage.getItem(STORAGE_KEYS.SUPABASE_BUCKET) || defaultBucket;
    this.bucketName = bucket;

    if (url && anonKey && url.startsWith('http')) {
      try {
        this.supabaseClient = createClient(url, anonKey);
        this.isSupabaseConfigured = true;
      } catch (err) {
        console.error('فشل تهيئة عميل Supabase:', err);
        this.supabaseClient = null;
        this.isSupabaseConfigured = false;
      }
    } else {
      this.supabaseClient = null;
      this.isSupabaseConfigured = false;
    }
  }

  saveSupabaseConfig(url, anonKey, bucket) {
    localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_ANON, anonKey.trim());
    localStorage.setItem(STORAGE_KEYS.SUPABASE_BUCKET, (bucket || 'client-documents').trim());
    this.initSupabase();
  }

  resetToDemo() {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_ANON);
    this.initSupabase();
  }

  getSupabaseConfig() {
    const defaultUrl = 'https://vykjaggcgaajxjjwfddp.supabase.co';
    const defaultAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5a2phZ2djZ2FhanhqandmZGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MjM3MzEsImV4cCI6MjEwNzM5OTczMX0._AU7G4KewmTB23BTbSnx24Oj7CYzsBAzHW2SU-rwzHs';
    return {
      url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || defaultUrl,
      anonKey: localStorage.getItem(STORAGE_KEYS.SUPABASE_ANON) || defaultAnon,
      bucket: localStorage.getItem(STORAGE_KEYS.SUPABASE_BUCKET) || 'client-documents',
      isConfigured: this.isSupabaseConfigured
    };
  }

  // Upload file (Supabase or LocalStorage Mock)
  async uploadFile(file, clientName = '', onProgress = () => {}) {
    const deviceId = getOrCreateDeviceId();
    const sessionId = this.getSessionId();
    const now = Date.now();
    const expiresAt = now + THREE_DAYS_MS;
    const fileId = 'file_' + Math.random().toString(36).substring(2, 9) + '_' + now;

    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        onProgress(20);
        const fileExt = file.name.split('.').pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
        const storagePath = `${deviceId}/${safeName}`;

        // 1. Upload to Supabase Storage
        const { error: storageError } = await this.supabaseClient.storage
          .from(this.bucketName)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (storageError) {
          throw new Error('خطأ في التخزين السحابي: ' + storageError.message);
        }

        onProgress(60);

        // Get public URL
        const { data: urlData } = this.supabaseClient.storage
          .from(this.bucketName)
          .getPublicUrl(storagePath);

        const publicUrl = urlData?.publicUrl || '';

        // 2. Insert record in DB
        const { data: record, error: dbError } = await this.supabaseClient
          .from('uploaded_files')
          .insert([
            {
              id: fileId,
              session_id: sessionId,
              device_id: deviceId,
              client_name: clientName || null,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
              storage_path: storagePath,
              public_url: publicUrl,
              created_at: new Date(now).toISOString(),
              expires_at: new Date(expiresAt).toISOString()
            }
          ])
          .select()
          .single();

        if (dbError) {
          console.warn('تنبيه: تم رفع الملف للتخزين ولكن تعذر التسجيل في الجدول، سيتم الحفظ محلياً أيضاً:', dbError.message);
        }

        onProgress(100);

        const savedRecord = {
          id: fileId,
          sessionId,
          deviceId,
          clientName,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          url: publicUrl,
          createdAt: now,
          expiresAt
        };

        // Cache locally for fallback and quick offline display
        this.saveLocalRecord(savedRecord);
        return savedRecord;
      } catch (err) {
        console.error('Supabase upload error, falling back to local demo:', err);
        // Fallback to local mode
        return await this.uploadLocalDemo(file, clientName, onProgress);
      }
    } else {
      // Local Demo Mode
      return await this.uploadLocalDemo(file, clientName, onProgress);
    }
  }

  // Upload to local storage with Blob URL and Base64 preview
  async uploadLocalDemo(file, clientName, onProgress) {
    onProgress(30);
    const deviceId = getOrCreateDeviceId();
    const sessionId = this.getSessionId();
    const now = Date.now();
    const expiresAt = now + THREE_DAYS_MS;
    const fileId = 'file_' + Math.random().toString(36).substring(2, 9) + '_' + now;

    // Convert small files to data URL, or create object URL
    const dataUrl = await this.fileToDataUrl(file);
    onProgress(85);

    const record = {
      id: fileId,
      sessionId,
      deviceId,
      clientName: clientName || 'عميل تجريبي',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      url: dataUrl,
      createdAt: now,
      expiresAt
    };

    this.saveLocalRecord(record);
    onProgress(100);
    return record;
  }

  fileToDataUrl(file) {
    return new Promise((resolve) => {
      // For large files (> 3MB in demo), use object URL to prevent localStorage quota issues
      if (file.size > 3 * 1024 * 1024) {
        resolve(URL.createObjectURL(file));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
  }

  // Retrieve files from Supabase or LocalStorage, filtering out files older than 3 days
  async getAllActiveFiles() {
    const now = Date.now();

    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        const threeDaysAgoIso = new Date(now - THREE_DAYS_MS).toISOString();
        const { data, error } = await this.supabaseClient
          .from('uploaded_files')
          .select('*')
          .gte('created_at', threeDaysAgoIso)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item) => ({
            id: item.id,
            sessionId: item.session_id,
            deviceId: item.device_id,
            clientName: item.client_name || '',
            fileName: item.file_name,
            fileSize: item.file_size,
            mimeType: item.mime_type,
            url: item.public_url || '',
            createdAt: new Date(item.created_at).getTime(),
            expiresAt: item.expires_at ? new Date(item.expires_at).getTime() : new Date(item.created_at).getTime() + THREE_DAYS_MS
          }));
        }
      } catch (err) {
        console.warn('تعذر جلب الملفات من Supabase، الاعتماد على التخزين المحلي:', err);
      }
    }

    // Local Storage filter
    const local = this.getLocalRecords();
    // Clean expired files (older than 3 days)
    const validFiles = local.filter((item) => item.expiresAt > now);
    if (validFiles.length !== local.length) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(validFiles));
    }
    return validFiles.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Get files uploaded by current device in this session
  async getClientFiles() {
    const all = await this.getAllActiveFiles();
    const deviceId = getOrCreateDeviceId();
    const sessionId = this.getSessionId();
    return all.filter((file) => file.deviceId === deviceId || file.sessionId === sessionId);
  }

  // Delete a specific file
  async deleteFile(fileId) {
    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        await this.supabaseClient
          .from('uploaded_files')
          .delete()
          .eq('id', fileId);
      } catch (err) {
        console.warn('Supabase delete error:', err);
      }
    }

    const local = this.getLocalRecords();
    const filtered = local.filter((f) => f.id !== fileId);
    localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(filtered));
  }

  // Clean all expired files (+3 days)
  async purgeExpiredFiles() {
    const now = Date.now();
    const local = this.getLocalRecords();
    const valid = local.filter((f) => f.expiresAt > now);
    const purgedCount = local.length - valid.length;
    localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(valid));

    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        const threeDaysAgoIso = new Date(now - THREE_DAYS_MS).toISOString();
        await this.supabaseClient
          .from('uploaded_files')
          .delete()
          .lt('created_at', threeDaysAgoIso);
      } catch (err) {
        console.warn('Supabase purge error:', err);
      }
    }

    return purgedCount;
  }

  // Local record helpers
  getLocalRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOCAL_FILES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveLocalRecord(record) {
    const records = this.getLocalRecords();
    // remove duplicate if exists
    const updated = [record, ...records.filter((r) => r.id !== record.id)];
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage quota reached, keeping last 20 files only', e);
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(updated.slice(0, 20)));
    }
  }

  // Session ID management
  getSessionId() {
    let sid = sessionStorage.getItem('cloud_doc_session_id');
    if (!sid) {
      // Check URL query param first (if user scanned a QR with session code)
      const urlParams = new URLSearchParams(window.location.search);
      sid = urlParams.get('session');
      if (!sid) {
        sid = 'SES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      }
      sessionStorage.setItem('cloud_doc_session_id', sid);
    }
    return sid;
  }

  // Seed realistic demo files if empty so the user can immediately experience the 3-day countdown and dashboard
  seedDemoDataIfEmpty() {
    const existing = this.getLocalRecords();
    if (existing.length === 0) {
      const now = Date.now();
      const mockFiles = [
        {
          id: 'demo_1',
          sessionId: 'SES-A891',
          deviceId: 'DEV-C94K-92A',
          clientName: 'أحمد محمود - تأمين بوبا الطبي',
          fileName: 'وثيقة_التأمين_الطبي_2026.pdf',
          fileSize: 1420500,
          mimeType: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          createdAt: now - 1000 * 60 * 60 * 18, // 18 hours ago
          expiresAt: now - 1000 * 60 * 60 * 18 + THREE_DAYS_MS
        },
        {
          id: 'demo_2',
          sessionId: 'SES-B312',
          deviceId: 'DEV-889M-11X',
          clientName: 'خالد السعيد - استمارة المركبة',
          fileName: 'صورة_رخصة_القيادة_والتأمين.jpg',
          fileSize: 2150400,
          mimeType: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
          createdAt: now - 1000 * 60 * 60 * 42, // 42 hours ago (expiring soon)
          expiresAt: now - 1000 * 60 * 60 * 42 + THREE_DAYS_MS
        },
        {
          id: 'demo_3',
          sessionId: 'SES-F774',
          deviceId: 'DEV-K29P-55Q',
          clientName: 'مريم إبراهيم - تقرير حادث نجم',
          fileName: 'تقرير_الحادث_والكروكي.pdf',
          fileSize: 3100000,
          mimeType: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          createdAt: now - 1000 * 60 * 25, // 25 mins ago
          expiresAt: now - 1000 * 60 * 25 + THREE_DAYS_MS
        }
      ];
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(mockFiles));
    }
  }
}

export const storageManager = new CloudStorageManager();
