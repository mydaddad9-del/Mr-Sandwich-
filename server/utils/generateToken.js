const jwt = require('jsonwebtoken');

// Fallback ensures the server never crashes with "secretOrPrivateKey must have a value"
const JWT_SECRET = process.env.JWT_SECRET || 'baba_roti_cafe_super_secret_jwt_key_2024';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
