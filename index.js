"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const promises_1 = require("fs/promises");
const serviceAccount = require('./cheerioassignment-firebase-adminsdk.json');
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
});
const PORT = 3000;
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
const addToken = async (token) => {
    try {
        const data = await (0, promises_1.readFile)('tokens.txt', 'utf8');
        const tokensArray = data.split('\n').filter(t => t.trim() !== '');
        if (!tokensArray.includes(token)) {
            await (0, promises_1.appendFile)('tokens.txt', token + '\n');
            console.log('Token added to file');
        }
        else {
            console.log('Token already exists in the file');
        }
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            await (0, promises_1.appendFile)('tokens.txt', token + '\n');
            console.log('Token added to file (file did not exist)');
        }
        else {
            console.error('Error:', err);
        }
    }
};
const getToken = async () => {
    try {
        const data = await (0, promises_1.readFile)('tokens.txt', 'utf8');
        const tokensArray = data.split('\n').filter(token => token.trim() !== '');
        console.log('Tokens array:', tokensArray);
        return tokensArray;
    }
    catch (err) {
        console.error('Error reading file:', err);
        return [];
    }
};
app.post('/save', async (req, res) => {
    try {
        const { token } = req.body;
        await addToken(token);
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
});
app.post('/send', async (req, res) => {
    try {
        const { title, body } = req.body;
        const message = {};
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast({
            tokens: await getToken(),
            notification: {
                title,
                body,
            }
        });
        res.status(200).json({ success: true, response });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
