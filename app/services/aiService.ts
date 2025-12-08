// services/aiService.ts
import axios from 'axios';

// تأكد من تغيير هذا الرابط إلى IP حاسوبك
const API_URL = 'http://10.249.162.13:8000';

const aiApi = axios.create({
  baseURL: API_URL,
  timeout: 30000, // زيادة المهلة لتحميل الملفات الكبيرة
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// دالة لتحويل الملف إلى FormData
export const analyzeMedicalFile = async (fileUri: string, fileName: string, fileType: string) => {
  try {
    console.log('Uploading file:', fileName);
    
    // إنشاء FormData
    const formData = new FormData();
    
    // إضافة الملف
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileName,
    } as any);

    // إرسال الطلب
    const response = await aiApi.post('/predict/breast/file', formData);
    
    return response.data;
  } catch (error: any) {
    console.error('API Error Details:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to analyze file');
  }
};

// دالة لإرسال البيانات مباشرة (بدون ملف)
export const analyzeDataDirectly = async (features: number[]) => {
  try {
    const response = await axios.post(`${API_URL}/predict/breast`, {
      features,
    });
    return response.data;
  } catch (error: any) {
    console.error('Direct API Error:', error);
    throw new Error(error.response?.data?.detail || 'Failed to analyze data');
  }
};

export default aiApi;