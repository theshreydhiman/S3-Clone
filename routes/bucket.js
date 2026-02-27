import express from "express";
import { addBuckets, listBuckets, deleteBucket, updateBucketName, findBucketById } from "../controller/bucket.js"
import { auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /bucket/add:
 *   post:
 *     summary: Add Bucket
 *     description: Add a new bucket
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bucketName:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Successfully added bucket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bucketName:
 *                   type: string
 *                   description: Name of the created bucket
 *                 owner:
 *                   type: string
 *                   description: ID of the owner user
 *                 files:
 *                   type: array
 *                   description: Array of files associated with the bucket (initially empty)
 *                 _id:
 *                   type: string
 *                   description: ID of the created bucket
 *                 __v:
 *                   type: number
 *                   description: Version key (internal use)
 *       '400':
 *         description: Bad request
 */
router.post("/add", auth, addBuckets);

/**
 * @swagger
 * /bucket/list/{page}/{pageSize}:
 *   get:
 *     summary: List Buckets
 *     description: Retrieve a list of buckets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: page
 *         required: true
 *         description: Page number
 *         schema:
 *           type: integer
 *       - in: path
 *         name: pageSize
 *         required: true
 *         description: Number of buckets per page
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successfully retrieved list of buckets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID of the bucket
 *                   bucketName:
 *                     type: string
 *                     description: Name of the bucket
 *       '500':
 *         description: Internal server error
 */
router.get("/list/:page/:pageSize", auth, listBuckets);

/**
 * @swagger
 * /bucket/{bucketId}:
 *   get:
 *     summary: Find Bucket by ID
 *     description: Retrieve a bucket by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved bucket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID of the bucket
 *                 bucketName:
 *                   type: string
 *                   description: Name of the bucket
 *                 files:
 *                   type: array
 *                   description: Array of files in the bucket
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID of the file
 *                       filename:
 *                         type: string
 *                         description: Name of the file
 *       '404':
 *         description: Bucket not found
 *       '500':
 *         description: Internal server error
 */
router.get("/:bucketId", auth, findBucketById);

/**
 * @swagger
 * /bucket/delete/{bucketId}:
 *   delete:
 *     summary: Delete Bucket
 *     description: Delete a bucket and its associated files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket to delete
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully deleted bucket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message indicating the success of the deletion operation
 *                   example: Bucket deleted successfully
 *       '409':
 *         description: Bucket does not exist
 *       '500':
 *         description: Internal server error
 */
router.delete("/delete/:bucketId", auth, deleteBucket);

/**
 * @swagger
 * /bucket/update/{bucketId}:
 *   put:
 *     summary: Update Bucket Name
 *     description: Update the name of a bucket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bucketId
 *         required: true
 *         description: ID of the bucket to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bucketName:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Successfully deleted bucket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Message indicating the success of the update operation
 *                   example: Bucket name updated successfully
 *       '406':
 *         description: Bucket not found or permission denied
 *       '500':
 *         description: Internal server error
 */
router.put("/update/:bucketId", auth, updateBucketName);

export default router;