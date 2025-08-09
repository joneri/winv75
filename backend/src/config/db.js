import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/winv75'
    await mongoose.connect(uri)
    console.log(`MongoDB Connected (${uri})...`)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
};

export default connectDB;