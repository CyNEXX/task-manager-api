const express = require('express');
const User = require('../models/user');
const auth = require('../middleware/auth.js');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account');


const isIDValid = (str) => { return str.match(/^[0-9a-fA-F]{24}$/) };

// Gets user's info
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});


// Gets user's avatar photo
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (e) {
        console.log(e); res.status(404).send();
    }
});


// Creates a new user
router.post('/users', async (req, res) => {
    try {

        if (!User.isValidOperation(Object.keys(req.body))) {
            return res.status(400).send({ error: 'Invalid new fields!' });
        };

        const user = new User(req.body);
        const token = await user.generateAuthToken();

        sendWelcomeEmail(user.email, user.name);

        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send({ error: e.toString() });
    }
});


// Logins and generates auth
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (e) {
        res.status(400).send({ error: e.message });
    }
});


// Logs out from current device
router.post('/users/logout', auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send('Successfully logged out.');

    } catch (e) {
        res.status(500).send({ error: e.toString() });
        console.log(e);
    }
});


// Logout from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Successfully logged out of all devices.');

    } catch (e) {
        res.status(500).send({ error: e.toString() });
        console.log(e);
    }
});


// Upload user's avatar
const avatarUpload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Accepts jpg, jpeg or png files.'));
        }
        cb(undefined, true);
    }
});


// Saves users' avatar photo as buffer to db
router.post('/users/me/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
    const newBuffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = newBuffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});


// Updates user data
router.patch('/users/me', auth, async (req, res) => {

    try {
        if (!isIDValid((req.user._id).toString())) {
            return res.status(400).send({ error: 'Invalid Object ID!' })
        }

        if (!User.isValidOperation(Object.keys(req.body))) {
            return res.status(400).send({ error: 'Invalid updates!' });
        }

        const user = req.user;
        const updates = Object.keys(req.body);

        updates.forEach(update => user[update] = req.body[update]);
        await user.save();
        res.send(user);

    } catch (e) {
        console.log(e);
        res.status(400).send(e);
    }
});


// Deletes user
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user);
    } catch (e) {
        console.log('>>>>', e);
        res.status(500).send({ error: e.message });
    }
});


// Deletes user's avatar
router.delete('/users/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send({ error: e.message });
    }
});


module.exports = router;