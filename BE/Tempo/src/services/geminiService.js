/**
 * Gemini Pro AI Service for Tempo
 * Strictly follows STANDARDS.md - Functional, Concise, No Emojis
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const getApiKey = () => process.env.GEMINI_API_KEY || '';

const getModel = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
};

/**
 * AI DJ: Generate smart search terms and mood keywords based on user input
 */
const generateSmartDJPlaylist = async (promptText) => {
  const model = getModel();
  const systemInstruction = `
Ban la he thong AI Music DJ cho ung dung am nhac Tempo.
Nhiem vu: Nhan mot yeu cau tam trang/ngu canh cua nguoi dung va tra ve danh sach cac tu khoa tim kiem bai hat/ca si phu hop nhat (ca V-Pop va Quoc te).

Yeu cau bat buoc:
1. Tra ve ket qua duoi dinh dang JSON thuan tuy (khong bao gom markdown backticks, khong co text thua).
2. Tuyet doi khong dung emoji trong bat ky truong nao.
3. Cau truc JSON:
{
  "playlistTitle": "Ten playlist ngan gon, tinh te",
  "moodDescription": "Mo ta ngan 1-2 cau ve cam xuc am nhac",
  "keywords": ["ten bai hat hoac ca si 1", "ten bai hat hoac ca si 2", "ten bai hat hoac ca si 3", "ten bai hat hoac ca si 4", "ten bai hat hoac ca si 5"],
  "genres": ["The loai 1", "The loai 2"]
}
`;

  const result = await model.generateContent([
    { text: systemInstruction },
    { text: `Yeu cau nguoi dung: ${promptText}` }
  ]);

  const rawText = result.response.text().trim();
  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
};

/**
 * Song Story: Explain the context, lyric meaning and story of a song
 */
const getSongStory = async (title, artist) => {
  const model = getModel();
  const prompt = `
Phan tich ngan gon ve y nghia loi bai hat, hoan canh sang tac va thong diep cua bai hat:
- Ten bai hat: "${title}"
- Nghe si / Ca si: "${artist}"

Yeu cau:
1. Trinh bay ngan gon, sau sac trong 3 doan van nho (khoang 150 - 200 tu).
2. Tuyet doi khong su dung emoji.
3. Van phong tinh te, truong thanh, tap trung vao cam xuc va am nhac.
`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

module.exports = {
  generateSmartDJPlaylist,
  getSongStory,
};
