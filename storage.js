import { createClient } from '@supabase/supabase-js';

// Configuration keys in localStorage
const STORAGE_KEYS = {
  DEVICE_ID: 'cloud_doc_device_id',
  SUPABASE_URL: 'cloud_doc_supabase_url',
  SUPABASE_ANON: 'cloud_doc_supabase_anon',
  SUPABASE_BUCKET: 'cloud_doc_supabase_bucket',
  LOCAL_FILES: 'cloud_doc_local_files_v1',
  RETENTION_SETTINGS: 'cloud_doc_retention_days'
};

// Default Retention in days per type
export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = {
  default: 3,
  image: 3,
  pdf: 3
};

// Get Retention configuration
export function getRetentionSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETENTION_SETTINGS);
    return raw ? { ...DEFAULT_RETENTION_DAYS, ...JSON.parse(raw) } : { ...DEFAULT_RETENTION_DAYS };
  } catch {
    return { ...DEFAULT_RETENTION_DAYS };
  }
}

// Save Retention configuration
export function saveRetentionSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.RETENTION_SETTINGS, JSON.stringify(settings));
}

// Calculate TTL duration in milliseconds for a file based on its mimeType
export function getTtlMsForMime(mimeType) {
  const settings = getRetentionSettings();
  let days = settings.default || 3;
  if (mimeType.startsWith('image/')) {
    days = settings.image || days;
  } else if (mimeType.includes('pdf')) {
    days = settings.pdf || days;
  }
  return days * 24 * 60 * 60 * 1000;
}

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
    const mimeType = file.type || 'application/octet-stream';
    const ttlMs = getTtlMsForMime(mimeType);
    const expiresAt = now + ttlMs;
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
              mime_type: mimeType,
              storage_path: storagePath,
              public_url: publicUrl,
              created_at: new Date(now).toISOString(),
              expires_at: new Date(expiresAt).toISOString()
            }
          ])
          .select()
          .single();

        if (dbError) {
          console.warn('تنبيه: تعذر التسجيل في جدول Supabase DB:', dbError.message);
        }

        onProgress(100);

        const savedRecord = {
          id: fileId,
          sessionId,
          deviceId,
          clientName,
          fileName: file.name,
          fileSize: file.size,
          mimeType,
          url: publicUrl,
          createdAt: now,
          expiresAt
        };

        this.saveLocalRecord(savedRecord);
        return savedRecord;
      } catch (err) {
        console.error('Supabase upload error, fallback to local demo:', err);
        return await this.uploadLocalDemo(file, clientName, onProgress);
      }
    } else {
      return await this.uploadLocalDemo(file, clientName, onProgress);
    }
  }

  // Upload to local storage with Blob URL
  async uploadLocalDemo(file, clientName, onProgress) {
    onProgress(30);
    const deviceId = getOrCreateDeviceId();
    const sessionId = this.getSessionId();
    const now = Date.now();
    const mimeType = file.type || 'application/octet-stream';
    const ttlMs = getTtlMsForMime(mimeType);
    const expiresAt = now + ttlMs;
    const fileId = 'file_' + Math.random().toString(36).substring(2, 9) + '_' + now;

    const dataUrl = await this.fileToDataUrl(file);
    onProgress(85);

    const record = {
      id: fileId,
      sessionId,
      deviceId,
      clientName: clientName || '',
      fileName: file.name,
      fileSize: file.size,
      mimeType,
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

  // Retrieve files from Supabase or LocalStorage, filtering out expired files
  async getAllActiveFiles() {
    const now = Date.now();

    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        const { data, error } = await this.supabaseClient
          .from('uploaded_files')
          .select('*')
          .gte('expires_at', new Date(now).toISOString())
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
            expiresAt: item.expires_at ? new Date(item.expires_at).getTime() : new Date(item.created_at).getTime() + getTtlMsForMime(item.mime_type)
          }));
        }
      } catch (err) {
        console.warn('تعذر جلب الملفات من Supabase، الاعتماد على التخزين المحلي:', err);
      }
    }

    const local = this.getLocalRecords();
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

  // Clean all expired files
  async purgeExpiredFiles() {
    const now = Date.now();
    const local = this.getLocalRecords();
    const valid = local.filter((f) => f.expiresAt > now);
    const purgedCount = local.length - valid.length;
    localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(valid));

    if (this.isSupabaseConfigured && this.supabaseClient) {
      try {
        await this.supabaseClient
          .from('uploaded_files')
          .delete()
          .lt('expires_at', new Date(now).toISOString());
      } catch (err) {
        console.warn('Supabase purge error:', err);
      }
    }

    return purgedCount;
  }

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
    const updated = [record, ...records.filter((r) => r.id !== record.id)];
    try {
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(updated));
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(updated.slice(0, 20)));
    }
  }

  getSessionId() {
    let sid = sessionStorage.getItem('cloud_doc_session_id');
    if (!sid) {
      const urlParams = new URLSearchParams(window.location.search);
      sid = urlParams.get('session');
      if (!sid) {
        sid = 'SES-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      }
      sessionStorage.setItem('cloud_doc_session_id', sid);
    }
    return sid;
  }

  seedDemoDataIfEmpty() {
    const existing = this.getLocalRecords();
    if (existing.length === 0) {
      const now = Date.now();
      const mockFiles = [
        {
          id: 'demo_1',
          sessionId: 'SES-A891',
          deviceId: 'DEV-C94K-92A',
          clientName: 'أحمد محمود',
          fileName: 'وثيقة_التأمين_الطبي_2026.pdf',
          fileSize: 1420500,
          mimeType: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          createdAt: now - 1000 * 60 * 60 * 18,
          expiresAt: now - 1000 * 60 * 60 * 18 + (3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'demo_2',
          sessionId: 'SES-B312',
          deviceId: 'DEV-889M-11X',
          clientName: 'خالد السعيد',
          fileName: 'صورة_رخصة_القيادة_والتأمين.jpg',
          fileSize: 2150400,
          mimeType: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
          createdAt: now - 1000 * 60 * 60 * 42,
          expiresAt: now - 1000 * 60 * 60 * 42 + (3 * 24 * 60 * 60 * 1000)
        }
      ];
      localStorage.setItem(STORAGE_KEYS.LOCAL_FILES, JSON.stringify(mockFiles));
    }
  }
}

export const storageManager = new CloudStorageManager();
