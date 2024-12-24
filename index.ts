import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import { appendFile, readFile } from 'fs/promises';

const serviceAccount = require('./cheerioassignment-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const PORT = 3000;

const app = express();
app.use(bodyParser.json());

interface NotificationRequest {
  token: string;
  title: string;
  body: string;
}

// Functions to store FCM_TOKENS
const addToken = async (token: string): Promise<void> => {
  try {
    const data = await readFile('tokens.txt', 'utf8');
    const tokensArray = data.split('\n').filter(t => t.trim() !== '');

    if (!tokensArray.includes(token)) {
      await appendFile('tokens.txt', token + '\n');
      console.log('Token added to file');
    } else {
      console.log('Token already exists in the file');
    }
  } catch (err: any) {
      console.error('Error:', err);
  }
};

const getToken = async (): Promise<string[]> => {
  try {
    const data = await readFile('tokens.txt', 'utf8');
    const tokensArray = data.split('\n').filter(token => token.trim() !== '');
    console.log('Tokens array:', tokensArray);
    return tokensArray;
  } catch (err: any) {
    console.error('Error reading file:', err);
    return [];
  }
};

//API Routes
app.post('/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    await addToken(token);
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body }: NotificationRequest = req.body;

    const response = await admin.messaging().sendEachForMulticast({
      tokens: await getToken(),
      notification: {
        title,
        body,
      }
    });

    res.status(200).json({ success: true, response });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
