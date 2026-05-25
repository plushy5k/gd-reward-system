import { v4 as uuidv4 } from 'uuid';

export default function handler(req, res) {
  const code = uuidv4().slice(0, 8).toUpperCase();

  res.status(200).json({
    code: code
  });
}