
import fs from 'fs-extra'; 
import path from 'path'; 
import Buckets from '../models/bucket.js'; 
import Files from '../models/file.js';
import { fileURLToPath } from 'url'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow only alphanumeric, dash, underscore, and dot characters in names
// used as filesystem paths to prevent directory traversal attacks.
const isSafeName = (name) => /^[a-zA-Z0-9._-]+$/.test(name);

// Create a new bucket
export const addBuckets = async (req, res) => {
    try {
        if (!req.body.bucketName || !isSafeName(req.body.bucketName)) {
            return res.status(400).json({ error: 'Invalid bucket name. Only alphanumeric characters, dashes, underscores, and dots are allowed.' });
        }

        // Check if a bucket with the same name already exists for the user
        const isBucket = await Buckets.findOne({ bucketName: req.body.bucketName, owner: req.user._id });

        if (isBucket) {
            return res.status(409).json({ warning: 'Bucket with the name already exists' });
        }

        // Create a new bucket object
        const bucket = new Buckets({
            bucketName: req.body.bucketName,
            owner: req.user._id
        });

        // Save the bucket to the database
        await bucket.save();

        // Create a new folder for the bucket
        const bucketFolderPath = path.join('uploads', bucket.bucketName.toString());
        await fs.ensureDir(bucketFolderPath); 

        res.status(201).send(bucket);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Error creating bucket' });
    }
};

// List all buckets
export const listBuckets = async (req, res) => {
    try {
        const page = parseInt(req.params.page) || 1; 
        const pageSize = parseInt(req.params.pageSize) || 10; 

        // Calculate the number of documents to skip based on the page number and page size
        const skip = (page - 1) * pageSize;

        // Fetch buckets for the current page, limiting the results to pageSize and skipping skip number of documents
        const buckets = await Buckets.find({ owner: req.user._id }, { bucketName: 1, _id: 1 })
                                    .skip(skip)
                                    .limit(pageSize);

        if (!buckets || buckets.length === 0) {
            return res.status(200).json({ message: 'No buckets found' });
        }

        res.status(200).send(buckets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error listing buckets' });
    }
}

// Find a bucket by ID
export const findBucketById = async (req, res) => {
    try {
        const { bucketId } = req.params;

        // Find the bucket by ID and owner
        const bucket = await Buckets.findById(bucketId, { bucketName: 1, _id: 1 }).populate({
            path: 'files',
            model: 'Files',
            select: 'filename',
        });

        // If bucket is not found, return 404 Not Found error
        if (!bucket) {
            return res.status(404).json({ error: 'Bucket not found' });
        }

        // If bucket is found, return it
        res.status(200).json(bucket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error finding bucket' });
    }
};

// Update a bucket name
export const updateBucketName = async (req, res) => {
    try {
        const { bucketId } = req.params;
        const { bucketName } = req.body;

        if (!bucketName || !isSafeName(bucketName)) {
            return res.status(400).json({ error: 'Invalid bucket name. Only alphanumeric characters, dashes, underscores, and dots are allowed.' });
        }

        // Find the bucket by ID and owner
        const bucket = await Buckets.findOne({ _id: bucketId, owner: req.user._id });
        if (!bucket) {
            return res.status(406).json({ error: 'Bucket not found or you do not have permission to update it' });
        }

        // Check if a bucket with the same name already exists for the user
        const isBucket = await Buckets.findOne({ bucketName: bucketName, owner: req.user._id });

        if (isBucket) {
            return res.status(409).json({ warning: 'Bucket with the name already exists' });
        }

        // Rename the corresponding folder in the file system
        const oldFolderPath = path.join(__dirname, '..', 'uploads', bucket.bucketName);
        const newFolderPath = path.join(__dirname, '..', 'uploads', bucketName);
        await fs.rename(oldFolderPath, newFolderPath);

        // Update the bucket name in the database
        await Buckets.updateOne({ _id: bucketId }, { bucketName });

        res.status(200).json({ message: 'Bucket name updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating bucket' });
    }
};

// Delete a bucket
export const deleteBucket = async (req, res) => {
    try {
        const bucket = await Buckets.findOne({ _id: req.params.bucketId, owner: req.user._id });

        if (!bucket) {
            return res.status(409).json({ warning: 'Bucket does not exist or you do not have permission to delete it' });
        }

        // Delete all associated files from the database
        await Files.deleteMany({ _id: { $in: bucket.files } });

        // Delete the bucket folder
        const bucketFolderPath = path.join(__dirname, '..', 'uploads', bucket.bucketName);
        await fs.rm(bucketFolderPath, { recursive: true });

        // Delete the bucket from the database
        await Buckets.deleteOne({ _id: req.params.bucketId, owner: req.user._id });

        res.status(200).json({ message: 'Bucket deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting bucket' });
    }
}
