const mongoose = require('mongoose');
/* const bcrypt = require('bcryptjs'); */



const taskSchema = new mongoose.Schema({
    completed: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

taskSchema.statics.isValidOperation = function (updates) {
    const allowedUpdates = ['description', 'completed'];
    return updates.every((update) => allowedUpdates.includes(update));
}

taskSchema.methods.toJSON = function () {
    const taskObject = this.toObject();
    delete taskObject.owner;
    return taskObject;
}

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;