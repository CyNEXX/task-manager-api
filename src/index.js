const express = require('express');
require('./db/mongoose');

const { Mongoose } = require('mongoose');
const usersRouter = require('./routers/userRouter.js');
const tasksRouter = require('./routers/taskRouter.js');

const isInMaintenance = false;

const app = express();
const port = process.env.PORT;

app.use(express.json());

app.use((req, res, next) => {
    if (isInMaintenance === true) {
        res.status(503).send({ error: 'Site currently down for maintenance. Come back soon.' });
    } else {
        next();
    }
});

app.use(usersRouter);
app.use(tasksRouter);

app.get('*', (req, res) => {
    res.status(404).send({ error: 'No such resource' });
});

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});