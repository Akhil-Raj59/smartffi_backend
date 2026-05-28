import { v2 } from 'cloudinary';
import Razorpay from 'razorpay';

import app from './app.js';
import connectToDB from './config/dbConnection.js';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const PORT = process.env.PORT || 5000;


app.listen(PORT, async () => {
  await connectToDB();
  console.log(`App is running at http://localhost:${PORT}`);
});