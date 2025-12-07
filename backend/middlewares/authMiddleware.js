// backend/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

// 보호가 필요한 라우트에서 쓰는 미들웨어
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  // Authorization: Bearer <token>
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '인증 토큰이 없습니다.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // payload: { id, username, iat, exp }
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    next();
  } catch (err) {
    console.error('JWT verify error:', err);
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};
