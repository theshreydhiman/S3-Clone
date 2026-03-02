
import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library for JWT operations
import mongoose from 'mongoose'; // Import mongoose for MongoDB operations

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
});

// Generate authentication token
userSchema.methods.generateAuthToken = async function(exp) {
    const user = this;
    const token = jwt.sign({ _id: user._id.toString(), email: user.email }, process.env.secret_key, { expiresIn: exp });
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

// Find user by credentials
userSchema.statics.findByCred = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Unable to login');
    }
    // Add password verification logic here
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
