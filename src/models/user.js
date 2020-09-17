const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('../models/task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) { throw new Error('E-mail is invalid') }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be grater than 0...');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) { throw new Error('Password must not include \'' + 'password' + '\''); }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

userSchema.statics.isValidOperation = function (updates) {
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    return updates.every((update) => { console.log('>', update); return allowedUpdates.includes(update) });
}

userSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}


userSchema.methods.generateAuthToken = async function () {
    try {
        const user = this;
        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

        user.tokens = user.tokens.concat({ token });
        await user.save();

        return token;
    } catch (e) {
        if (e.code === 11000) { throw new Error('E-mail alrady in use'); }
    }
}

/* userSchema.statics.getPassPhrase = () => {
    try {
        if (!passPhrase) {
            throw new Error('No passPhrase found')
        }
        return passPhrase;
    } catch (e) {
        console.log(e);
        throw new Error(e.message);
    }
} */

userSchema.statics.findByCredentials = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) { throw new Error('Unable to login'); }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { throw new Error('Unable to login'); }
        return user;
    } catch (e) {
        console.log('++', e);
        throw new Error(e.message);
    }
}

//Hash the plain passowrd before saving
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
});


// Deletes user tasks when a user is removed
userSchema.pre('remove', async function (next) {
    const user = this;
    await Task.deleteMany({ owner: user._id })
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;