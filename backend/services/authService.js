// backend/services/authService.js
import User from '../models/user.js';

/**
 * 사용자 회원가입 (username, password)
 */
export const registerUser = async (username, password) => { // 'email' -> 'username'
  // [수정]
  const existingUser = await User.findOne({ username }); // 'email' -> 'username'
  if (existingUser) {
    throw new Error('이미 사용 중인 아이디입니다.'); // '이메일' -> '아이디'
  }

  const user = new User({
    username, // 'email' -> 'username'
    password, 
  });
  await user.save();
  
  return { 
    user: { 
      id: user._id, 
      username: user.username // [수정] 'email' -> 'username'
    } 
  };
};

/**
 * 사용자 로그인 (username, password)
 */
export const loginUser = async (username, password) => { // 'email' -> 'username'
  // [수정]
  const user = await User.findOne({ username }); // 'email' -> 'username'
  if (!user) {
    throw new Error('아이디 또는 비밀번호가 유효하지 않습니다.'); // '이메일' -> '아이디'
  }

  const isMatch = (user.password === password); 
  if (!isMatch) {
    throw new Error('아이디 또는 비밀번호가 유효하지 않습니다.'); // '이메일' -> '아이디'
  }
  
  return { 
    user: { 
      id: user._id, 
      username: user.username // [수정] 'email' -> 'username'
    } 
  };
};