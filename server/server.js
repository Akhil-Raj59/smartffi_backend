import app from "./app.js";
import connectDB from "./config/dbConnection.js";
const port = process.env.PORT || 5000;
app.listen(port, async () => {
   await connectDB();
  console.log(`Server is running on port ${port}`);
});