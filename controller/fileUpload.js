
import multer from 'multer'; 
import Buckets from '../models/bucket.js'; 
import Files from '../models/file.js'; 

// Allow only alphanumeric, dash, underscore, dot, and space characters in names
// used as filesystem paths to prevent directory traversal attacks.
const isSafeName = (name) => /^[a-zA-Z0-9._- ]+$/.test(name);

// Define file size and type limits
const maxSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        try {
            if (!isSafeName(file.originalname)) {
                return cb(new Error('Invalid file name. Avoid path separators and special characters.'));
            }

            if (file.size > maxSize) {
                return cb(new Error('File size exceeds the limit of 10MB'));
            }

            if (!allowedTypes.includes(file.mimetype)) {
                return cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
            }

            // Find the bucket associated with the upload
            const bucket = await Buckets.findOne({ _id: req.params.bucketId, owner: req.user._id });
            
            // If bucket doesn't exist for the authenticated user, throw an error
            if (!bucket) {
                throw new Error('Bucket not found for the authenticated user');
            }

            // Check if the upload is for creating a new file or updating an existing one
            if (!req.params?.fileId) {
                // If creating a new file, check if a file with the same name already exists in the bucket
                const files = await Files.findOne({ filename: file.originalname, owner: req.user._id, bucket: bucket._id  });
                if (files) {
                    throw new Error('File already exists in the bucket. Please patch if you want to change!');
                }
            } else {
                // If updating an existing file, perform additional checks
                let files = await Files.findOne({ _id: req.params.fileId, owner: req.user._id, bucket: req.params.bucketId });
                
                if (!files) throw new Error('File not found');

                files = await Files.findOne({ filename: file.originalname, owner: req.user._id, bucket: req.params.bucketId }).populate('bucket', 'bucketName _id');
                
                if(files && files._id != req.params.fileId) throw new Error('Same file already exists under different id!');
                if(files && files.bucket._id != req.params.bucketId) throw new Error('File does not exist in the given bucket!');
            }

            // Set destination folder based on bucket name
            cb(null, `uploads/${bucket.bucketName}/`);
        } catch (error) {
            cb({ message: 'Error uploading file', error });
        }
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});

// Create multer instance with the configured storage
export const upload = multer({ storage: storage, limits: { fileSize: maxSize } });
