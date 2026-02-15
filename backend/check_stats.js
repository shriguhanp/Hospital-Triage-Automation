import mongoose from 'mongoose';
import 'dotenv/config';

const checkData = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/prescripto`);
        console.log("✅ Connected to database: prescripto");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("\n--- Collections and Counts ---");
        for (let col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

checkData();
