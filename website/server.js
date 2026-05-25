const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const adapter = new JSONFile('./bot/db.json');

const db = new Low(adapter, {
  users: [],
  codes: []
});

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, 'public')
  )
);

app.get('/generate', async (req, res) => {

  await db.read();

  const code = uuidv4()
    .slice(0, 8)
    .toUpperCase();

  db.data.codes.push({
    code: code,
    used: false,
    createdAt: Date.now()
  });

  await db.write();

  res.json({
    code: code
  });

});

app.listen(3000, () => {
  console.log('Site lancé sur port 3000');
});