// pages/api/auth.js
export default function handler(req, res) {
    if (req.method === 'POST') {
      // 處理登錄邏輯
      const { email, password } = req.body;
      // 這裡可以添加驗證邏輯
      res.status(200).json({ message: 'Login successful' });
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }