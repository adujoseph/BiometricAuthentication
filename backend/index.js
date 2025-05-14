// index.js (Entry point for the backend)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite DB
const dbPath = path.join(__dirname, 'biometric-auth.db');
const db = new sqlite3.Database(dbPath);

// Initialize user table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    publicKey TEXT
  )`);
});

// Seed sample user
const seedUser = () => {
  db.get("SELECT * FROM users WHERE id = ?", ['3334323333'], (err, row) => {
    if (!row) {
      db.run("INSERT INTO users (id, publicKey) VALUES (?, ?)", ['3334323333', null]);
      console.log('✅ Seeded user 3334323333');
    }
  });
};
seedUser();

// Register public key for user
app.post('/api/register', (req, res) => {
  const { userId, publicKey } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.publicKey) return res.status(400).json({ message: 'Public key already registered' });

    db.run("UPDATE users SET publicKey = ? WHERE id = ?", [publicKey, userId], (err) => {
      if (err) return res.status(500).json({ message: 'Failed to store key' });
      res.json({ message: 'Public key registered successfully' });
    });
  });
});

// Check if public key exists for user
app.get('/api/check-public-key', (req, res) => {
  const { userId } = req.query;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user) return res.json({ exists: false });
    return res.json({ exists: !!user.publicKey });
  });
});

// Verify signed payload
app.post('/api/verify', (req, res) => {
  const { userId, payload, signature } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err || !user || !user.publicKey) {
      return res.status(400).json({ message: 'Invalid user or key missing' });
    }

    try {
      const verifier = crypto.createVerify('SHA256');
      verifier.update(payload);
      verifier.end();

      const isValid = verifier.verify(user.publicKey, Buffer.from(signature, 'base64'));

      if (isValid) {
        return res.json({ message: '✅ Biometric authentication successful' });
      } else {
        return res.status(401).json({ message: '❌ Signature verification failed' });
      }
    } catch (err) {
      return res.status(500).json({ message: 'Verification error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Biometric auth backend running at http://localhost:${PORT}`);
});
