const mongoose = require('mongoose');

// Define the schema for User Google Link
const schema = new mongoose.Schema({
    externalUserId: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    metadata: { 
        type: Object, 
        default: {} 
    },
    /**
     * i.g Geored, Styx
     */
    appId: { 
        type: String, 
        required: true 
    },
    /**
     * i.g Google, Gitlab
     */
    providerId:{
        type: String,
        required: true
    }
}, {
    timestamps: true // Optional: Add timestamps for createdAt and updatedAt
});

// Create a compound index for unique combination of appId, externalUserId and email
schema.index({ providerId:1,appId: 1, externalUserId: 1, email: 1 }, { unique: true });

// Create a compound index for appId and email for improved search performance
schema.index({ providerId:1,appId: 1, email: 1 }); // Index for appId and email

// Export the model
module.exports = mongoose.model('UserLink', schema);

async function getUserLinkByEmail(providerId,appId,email) {
    try {
        // Search for the UserGoogleLink document by the provided email
        const doc = await mongoose.model('UserLink').findOne({ providerId,appId,email });
        // Return the found document or null if not found
        return doc || null; // Return null if no document found
    } catch (error) {
        // Handle any errors that may occur during the query
        console.error('Error retrieving user by Google email:', error);
        throw error; // Rethrow the error for further handling, if necessary
    }
}

async function linkExternalUser(providerId,appId,externalUserId, email, metadata = {}) {
    try {
        // Check if a link already exists for the provided combination
        let document = await mongoose.model('UserLink').findOne({
            providerId,
            appId,
            externalUserId,
            email
        });

        if (document) {
            // If an existing link is found, you can return it or handle the situation as needed
            return { message: 'User already linked', document };
        }

        // Create a new UserGoogleLink document
        document = new mongoose.model('UserLink')({
            providerId,
            externalUserId,
            email,
            metadata,
            appId
        });

        // Save the new link to the database
        await document.save();

        // Return the saved document
        return { message: 'User linked successfully', document };
    } catch (error) {
        // Handle any errors that may occur during the database operations
        console.error('Error linking external user:', error);
        throw error; // Rethrow the error for further handling, if necessary
    }
}


global.getUserLinkByEmail = getUserLinkByEmail
global.linkExternalUser = linkExternalUser
