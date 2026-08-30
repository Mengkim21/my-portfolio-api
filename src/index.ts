import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tagRoutes from './routes/tagRoutes';
import { login } from './controllers/authController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/tags', tagRoutes);
app.post('/api/auth/login', login);

app.get('/', (req, res) => {
  res.send('Portfolio API is running...');
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});