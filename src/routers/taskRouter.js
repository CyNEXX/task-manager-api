const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const isIDValid = (str) => { return str.match(/^[0-9a-fA-F]{24}$/) }
const auth = require('../middleware/auth.js');


// Gets all completed tasks for a user
// GET /tasks?completed=true
// GET /tasks?limit=10?skip=10
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {}
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        res.send(req.user.tasks);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

// Gets a specific task for as specific user
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        if (!isIDValid(req.params.id)) { return res.status(400).send({ error: 'Invalid Object ID!' }) }
        const _id = req.params.id;
        const task = await Task.findOne({ _id, owner: req.user._id });

        if (!task) { return res.status(404).send(); }

        res.send(task);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

// Creates a task
router.post('/tasks', auth, async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            owner: req.user._id
        });
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        console.log(e);
        res.status(400).send();
    }
});

// Updates a task
router.patch('/tasks/:id', auth, async (req, res) => {
    try {

        if (!isIDValid(req.params.id)) { return res.status(400).send({ error: 'Invalid Object ID!' }) }
        const updates = Object.keys(req.body);


        if (!Task.isValidOperation(updates)) {
            return res.status(400).send({ error: 'Invalid updates!' });
        }

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send({ error: 'No such task exists.' });
        }

        updates.forEach(update => task[update] = req.body[update]);
        await task.save();
        res.send(task);

    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});

// Deletes a task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        if (!isIDValid(req.params.id)) { return res.status(400).send({ error: 'Invalid Object ID!' }) }
        /* const task = await Task.findByIdAndDelete(req.params.id); */
        const _id = req.params.id;
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send({ error: 'Nu such task exists.' });
        }
        res.send(task);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

module.exports = router;