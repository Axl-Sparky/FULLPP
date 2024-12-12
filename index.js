const express = require('express');
const fs = require('fs');
const pino = require('pino');
const NodeCache = require('node-cache');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const { upload } = require('./mega');
const { Mutex } = require('async-mutex');
const config = require('./config');
const path = require('path');

var app = express();
var port = 3000;
var session;
const msgRetryCounterCache = new NodeCache();
const mutex = new Mutex();
app.use(express.static(path.join(__dirname, 'static')));

async function connector(Num, res) {
    var sessionDir = './session';
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir);
    }
    var { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    session = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
        },
        printQRInTerminal: false,
        logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
        browser: Browsers.macOS("Safari"), //check docs for more custom options
        markOnlineOnConnect: true, //true or false yoour choice
        msgRetryCounterCache
    });

    if (!session.authState.creds.registered) {
        await delay(1500);
        Num = Num.replace(/[^0-9]/g, '');
        var code = await session.requestPairingCode(Num);
        if (!res.headersSent) {
            res.send({ code: code?.match(/.{1,4}/g)?.join('-') });
        }
    }

    session.ev.on('creds.update', async () => {
        await saveCreds();
    });

    session.ev.on('connection.update', async (update) => {
        var { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('Connected successfully');
            await delay(5000);
            var myr = await session.sendMessage(session.user.id, { text: `${config.MESSAGE}` });
            var pth = './session/creds.json';
            try {
                var url = await upload(pth);
                var sID;
                if (url.includes("https://mega.nz/file/")) {
                    sID = config.PREFIX + url.split("https://mega.nz/file/")[1];
                } else {
                    sID = '*Error Got*\n_contact site owner for help_\nhttps://wa.me/919539412641?text=Error+Web+Pair';
                }
              //edit this you can add ur own image in config or not ur choice
             // await session.sendMessage(session.user.id, { image: { url: `${config.IMAGE}` }, caption: sID }, { quoted: myr });
            await session.sendMessage(session.user.id, { text: sID }, { quoted : myr });

                var xyz = {
    audio: {
      url: 'https://files.catbox.moe/6np3qi.mp4'
    },
    mimetype: 'audio/mp4',
    ptt: true,
    fileName: "kindi.mp3",
    contextInfo: {
      
      externalAdReply: {
        title: '𝘖𝘊𝘛𝘈-𝘗𝘈𝘐𝘙',
        body: '𝘔𝘢𝘥𝘦 𝘸𝘪𝘵𝘩 💗',
        thumbnailUrl: 'https://files.catbox.moe/qlqcfw.jpeg',
        sourceUrl: 'https://wa.me/919539412641?text=_From+Pair💎_',
        mediaType: 1,
        renderLargerThumbnail: true,
        mediaUrl: 'https://files.catbox.moe/qlqcfw.jpeg'
      }
    }
  }

await session.sendMessage(session.user.id, xyz)
                
 await session.groupAcceptInvite("EjgS7jDeksLGIbG0Cm0RtW")

                
            } catch (error) {
                console.error('Error:', error);
            } finally {
                //await delay(500);
                if (fs.existsSync(path.join(__dirname, './session'))) {
                    fs.rmdirSync(path.join(__dirname, './session'), { recursive: true });
                }
            }
        } else if (connection === 'close') {
            var reason = lastDisconnect?.error?.output?.statusCode;
            reconn(reason);
        }
    });
}

function reconn(reason) {
    if ([DisconnectReason.connectionLost, DisconnectReason.connectionClosed, DisconnectReason.restartRequired].includes(reason)) {
        console.log('Connection lost, reconnecting...');
        connector();
    } else {
        console.log(`Disconnected! reason: ${reason}`);
        session.end();
    }
}

app.get('/pair', async (req, res) => {
    var Num = req.query.code;
    if (!Num) {
        return res.status(418).json({ message: 'Phone number is required' });
    }
  
  //you can remove mutex if you dont want to queue the requests
    var release = await mutex.acquire();
    try {
        await connector(Num, res);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "fekd up"});
    } finally {
        release();
    }
});

app.listen(port, () => {
    console.log(`Running on PORT:${port}`);
});
