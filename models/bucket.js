
import mongoose from 'mongoose';

// Schema for Bucket
const bucketSchema = new mongoose.Schema({
    bucketName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Files' }]
});

const Buckets = mongoose.model('Buckets', bucketSchema);
export default Buckets;
